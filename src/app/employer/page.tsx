"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Wand2, Save, Users, Code, Trash2, CalendarIcon, FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { generateJobPosting, type JobPostingInput } from '@/ai/flows/ai-job-posting-generator';
import { rankResumes, type RankResumesOutput } from '@/ai/flows/top-resume-ranking';
import { analyzeResumeShortcomings, type AnalyzeResumeShortcomingsOutput } from '@/ai/flows/resume-shortcoming-analysis';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where, Timestamp, serverTimestamp, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';


type AppJobPosting = {
  id: string;
  userProfileId: string;
  jobTitle: string;
  companyName: string;
  description: string;
  jobPostingText: string;
  status: 'active' | 'inactive';
  expiresAt?: Date | null;
  createdAt: Timestamp;
};

type FirestoreJobPosting = {
  id: string;
  userProfileId: string;
  jobTitle: string;
  companyName: string;
  jobPostingText: string;
  createdAt: Timestamp;
  status: 'active' | 'inactive';
  expiresAt?: Timestamp;
}

function JobPostingGenerator({ onJobSaved }: { onJobSaved: (newPosting: AppJobPosting) => void }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Omit<JobPostingInput, 'userProfileId'>>>({ jobType: 'Full-time' });
  const [generatedPosting, setGeneratedPosting] = useState<string>('');
  const [refinement, setRefinement] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: JobPostingInput['jobType']) => {
    setFormData(prev => ({ ...prev, jobType: value }));
  };
  
  const canGenerate = () => {
    const { jobTitle, companyName, location, description, responsibilities, mustHaveSkills } = formData;
    return jobTitle && companyName && location && description && responsibilities && mustHaveSkills;
  };

  const handleGenerate = async (isRefinement = false) => {
    if (!canGenerate()) {
      setError("Please fill out all required fields.");
      return;
    }
    setLoading(true);
    setError(null);
    
    // Don't clear previous generation if refining
    if(!isRefinement) {
      setGeneratedPosting('');
    }

    try {
      const userId = 'anonymous-user'; // Hardcoded for demo
      const input: JobPostingInput = {
        ...formData as Omit<JobPostingInput, 'userProfileId' | 'refinement' | 'previousPosting'>,
        userProfileId: userId,
        ...(isRefinement && { refinement, previousPosting: generatedPosting })
      };
      
      const result = await generateJobPosting(input);
      setGeneratedPosting(result);

    } catch (e: any) {
      console.error(e);
      setError(e.message || `Failed to ${isRefinement ? 'refine' : 'generate'} job posting. Please try again.`);
      setGeneratedPosting('');
    } finally {
        setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!generatedPosting) {
      toast({ variant: 'destructive', title: 'Error', description: 'Cannot save an empty posting.'});
      return;
    }
    
    setSaving(true);
    const userId = 'anonymous-user';
    const newPosting: AppJobPosting = {
      id: `new-${Date.now()}`,
      userProfileId: userId,
      jobTitle: formData.jobTitle || 'Untitled Job',
      companyName: formData.companyName || 'Untitled Company',
      description: generatedPosting.split('\n')[0],
      jobPostingText: generatedPosting,
      status: 'active',
      createdAt: Timestamp.now(),
      expiresAt: null,
    };
    
    onJobSaved(newPosting);
    
    toast({
      title: "Job Posting Ready!",
      description: "Your new job is now available in the 'Resume Ranker' tab.",
    });
    setSaving(false);
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">AI Job Posting Generator</CardTitle>
        <CardDescription>Fill in the details below, and let our AI craft the perfect job posting. You can then refine it with further instructions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="jobTitle">Job Title</Label>
            <Input id="jobTitle" placeholder="e.g., Senior Frontend Developer" value={formData.jobTitle || ''} onChange={handleInputChange} disabled={loading}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input id="companyName" placeholder="e.g., Acme Inc." value={formData.companyName || ''} onChange={handleInputChange} disabled={loading}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" placeholder="e.g., San Francisco, CA or Remote" value={formData.location || ''} onChange={handleInputChange} disabled={loading}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="salaryRange">Salary Range (Optional)</Label>
            <Input id="salaryRange" placeholder="e.g., $120,000 - $150,000" value={formData.salaryRange || ''} onChange={handleInputChange} disabled={loading}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="jobType">Job Type</Label>
             <Select value={formData.jobType} onValueChange={handleSelectChange} disabled={loading}>
              <SelectTrigger id="jobType">
                <SelectValue placeholder="Select job type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Full-time">Full-time</SelectItem>
                <SelectItem value="Part-time">Part-time</SelectItem>
                <SelectItem value="Contract">Contract</SelectItem>
                <SelectItem value="Internship">Internship</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Company & Role Description</Label>
          <Textarea id="description" placeholder="Describe your company's mission, culture, and the role's purpose." className="min-h-[100px]" value={formData.description || ''} onChange={handleInputChange} disabled={loading}/>
        </div>
        <div className="space-y-2">
          <Label htmlFor="responsibilities">Responsibilities</Label>
          <Textarea id="responsibilities" placeholder="List the key responsibilities, e.g., - Develop and maintain web applications..." className="min-h-[120px]" value={formData.responsibilities || ''} onChange={handleInputChange} disabled={loading}/>
        </div>
        <div className="space-y-2">
          <Label htmlFor="mustHaveSkills">Must-Have Skills</Label>
          <Input id="mustHaveSkills" placeholder="Comma-separated, e.g., React, TypeScript, CSS" value={formData.mustHaveSkills || ''} onChange={handleInputChange} disabled={loading}/>
        </div>
        <div className="space-y-2">
          <Label htmlFor="niceToHaveSkills">Nice-to-Have Skills (Optional)</Label>
          <Input id="niceToHaveSkills" placeholder="Comma-separated, e.g., GraphQL, Docker, AWS" value={formData.niceToHaveSkills || ''} onChange={handleInputChange} disabled={loading}/>
        </div>
        
        {!generatedPosting && !loading && (
          <Button onClick={() => handleGenerate(false)} disabled={loading || !canGenerate()}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Job Posting
          </Button>
        )}
        
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        
        {(generatedPosting || loading) && (
          <div className="space-y-4 pt-4 border-t mt-4">
             <div className="space-y-2">
              <Label className="font-semibold text-lg">Generated Job Posting</Label>
               {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/>AI is generating...</div>}
              <Textarea readOnly value={generatedPosting} className="min-h-[400px] bg-muted/50 font-sans" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="refinement">Refine the Posting (Optional)</Label>
              <Textarea id="refinement" placeholder="e.g., 'Make the tone more casual' or 'Add a section about company benefits.'" className="min-h-[60px]" value={refinement} onChange={(e) => setRefinement(e.target.value)} disabled={loading} />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => handleGenerate(true)} disabled={loading || !refinement}>
                {loading && refinement ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Refine Posting
              </Button>
              <Button onClick={handleSave} variant="outline" disabled={loading || saving || !generatedPosting}>
                 {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Posting
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ShortcomingAnalysis({ resume, jobDescription }: { resume: string; jobDescription: string }) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzeResumeShortcomingsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const result = await analyzeResumeShortcomings({ resumeText: resume, jobDescription });
      setAnalysis(result);
    } catch (e) {
      console.error(e);
      setError("Failed to analyze shortcomings.");
    }
    setLoading(false);
  };
  
  const getSeverityBadge = (severity: 'critical' | 'high' | 'moderate' | 'low') => {
    switch(severity) {
      case 'critical': return <Badge variant="destructive">Critical</Badge>;
      case 'high': return <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-500/80">High</Badge>;
      case 'moderate': return <Badge variant="secondary" className="bg-yellow-400 text-black hover:bg-yellow-400/80">Moderate</Badge>;
      case 'low': return <Badge variant="secondary" className="bg-green-400 text-black hover:bg-green-400/80">Low</Badge>;
      default: return <Badge variant="outline">{severity}</Badge>;
    }
  }

  if (!isClient) {
    return null;
  }

  if (!analysis && !loading && !error) {
     return (
        <div className="mt-4">
          <Button variant="secondary" size="sm" onClick={handleAnalyze} disabled={loading}>
            Analyze Shortcomings
          </Button>
       </div>
     );
  }

  return (
    <div className="mt-4 rounded-md border bg-card/50 p-4">
      <h4 className="font-semibold mb-2">Gap Analysis</h4>
      {loading && <p className="text-sm text-muted-foreground mt-2 animate-pulse">Analyzing resume gaps...</p>}
      {error && <p className="text-sm text-destructive mt-2">{error}</p>}
      {analysis && (
        <div className="mt-2 space-y-4">
          <div className="space-y-2">
            <h5 className="font-medium text-sm">Overall Assessment</h5>
            <p className="text-sm text-muted-foreground">{analysis.overallAssessment}</p>
          </div>
           {analysis.shortcomings.length > 0 && (
             <div className="space-y-2">
              <h5 className="font-medium text-sm">Identified Shortcomings</h5>
               <Accordion type="single" collapsible className="w-full">
                {analysis.shortcomings.map((item, index) => (
                  <AccordionItem value={`item-${index}`} key={index}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-2 text-left">
                        {getSeverityBadge(item.severity)}
                        <span className="font-medium">{item.skill}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-2 text-sm">
                      <p><strong className="text-foreground/80">Impact:</strong> {item.impact}</p>
                      <p><strong className="text-foreground/80">Mitigation:</strong> {item.mitigation}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
           )}
        </div>
      )}
    </div>
  )
}

function ResumeRanker({ jobPostings, onJobDelete, onJobUpdate }: { jobPostings: AppJobPosting[]; onJobDelete: (jobId: string) => void; onJobUpdate: (jobId: string, updates: Partial<Pick<AppJobPosting, 'status' | 'expiresAt'>>) => void; }) {
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<AppJobPosting | null>(null);
  const [rankedResumes, setRankedResumes] = useState<RankResumesOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rankingImage = PlaceHolderImages.find(img => img.id === 'resume-ranking');

  const handleRank = async (job: AppJobPosting) => {
    if (job.status === 'inactive') return;
    setSelectedJob(job);
    setLoading(true);
    setError(null);
    setRankedResumes(null);
    try {
      const result = await rankResumes({ jobDescription: job.jobPostingText });
      const sortedResumes = result.sort((a, b) => a.rank - b.rank);
      setRankedResumes(sortedResumes);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to rank resumes. Please try again.");
    }
    setLoading(false);
  };

  const handleDelete = (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation(); // Prevent card's onClick from firing
    onJobDelete(jobId);
  }

  const handleStatusChange = (jobId: string, newStatus: boolean) => {
    onJobUpdate(jobId, { status: newStatus ? 'active' : 'inactive' });
  };
  
  const handleDateChange = (jobId: string, date: Date | undefined) => {
      onJobUpdate(jobId, { expiresAt: date });
  };
  
  const getIconForJob = (title: string) => {
    if (title.toLowerCase().includes('developer') || title.toLowerCase().includes('engineer')) {
      return <Code className="h-8 w-8" />;
    }
    if (title.toLowerCase().includes('manager')) {
      return <Users className="h-8 w-8" />;
    }
    return <Users className="h-8 w-8" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Top Resume Ranker</CardTitle>
        <CardDescription>Select a job posting to automatically find and rank the top candidates from our talent pool.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {!selectedJob ? (
           <div className="grid md:grid-cols-2 gap-4">
            {jobPostings.map(job => (
              <Card 
                key={job.id} 
                className={cn(
                  "cursor-pointer hover:shadow-md transition-all group relative",
                  job.status === 'active' ? 'hover:border-primary' : 'bg-muted/50 cursor-not-allowed'
                )}
                onClick={() => handleRank(job)}
              >
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className={cn("p-3 rounded-full", job.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-muted-foreground/10 text-muted-foreground')}>
                      {getIconForJob(job.jobTitle)}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{job.jobTitle}</CardTitle>
                      <CardDescription className="mt-1 line-clamp-3">{job.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className='flex items-center space-x-2'>
                        <Switch
                          id={`status-${job.id}`}
                          checked={job.status === 'active'}
                          onCheckedChange={(checked) => handleStatusChange(job.id, checked)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Label htmlFor={`status-${job.id}`} onClick={(e) => e.stopPropagation()}>
                          <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
                            {job.status === 'active' ? 'Active' : 'Inactive'}
                          </Badge>
                        </Label>
                      </div>
                       {job.status === 'active' && (
                        <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); handleStatusChange(job.id, false); }}>
                          Stop Accepting
                        </Button>
                      )}
                    </div>
                     <div className="flex items-center space-x-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-[240px] justify-start text-left font-normal",
                                !job.expiresAt && "text-muted-foreground"
                              )}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {job.expiresAt ? format(job.expiresAt, "PPP") : <span>Set expiration date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start" onClick={(e) => e.stopPropagation()}>
                            <Calendar
                              mode="single"
                              selected={job.expiresAt || undefined}
                              onSelect={(date) => handleDateChange(job.id, date)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                  </div>
                </CardContent>
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => handleDelete(e, job.id)}>
                  <Trash2 className="h-4 w-4"/>
                </Button>
              </Card>
            ))}
          </div>
        ) : (
          <div>
            <Button variant="outline" onClick={() => { setSelectedJob(null); setRankedResumes(null); }}>&larr; Back to Job Postings</Button>
          </div>
        )}

        {loading && <div className="flex items-center gap-2 pt-4"><Loader2 className="h-5 w-5 animate-spin" /> <p className="text-sm text-muted-foreground animate-pulse">Searching and ranking candidates, this may take a moment...</p></div>}
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        
        {!rankedResumes && !loading && !error && !selectedJob && rankingImage && (
          <div className="pt-8 text-center">
             <div className="relative aspect-video max-w-lg mx-auto w-full overflow-hidden rounded-lg">
                <Image src={rankingImage.imageUrl} alt={rankingImage.description} fill className="object-cover" data-ai-hint={rankingImage.imageHint}/>
              </div>
            <p className="mt-4 text-muted-foreground">Your top candidates will appear here.</p>
          </div>
        )}

        {rankedResumes && selectedJob && (
          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-semibold font-headline">Top Ranked Candidates for: <span className="text-primary">{selectedJob.jobTitle}</span></h3>
            <div className="space-y-4">
              {rankedResumes.map(item => (
                <Card key={item.rank} className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg flex-shrink-0">{item.rank}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold">Reasoning for Rank</h4>
                      <p className="text-sm text-muted-foreground mb-2">{item.reason}</p>
                      
                      <div className="p-4 border rounded-md bg-muted/20">
                        <h5 className="font-medium mb-2">Resume Snippet</h5>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap font-sans line-clamp-4">{item.resume}</p>
                      </div>

                      <ShortcomingAnalysis resume={item.resume} jobDescription={selectedJob.jobPostingText} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PostingTimeDetails({ posting }: { posting: AppJobPosting }) {
    const [createdAt, setCreatedAt] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    
    useEffect(() => {
        if(posting.createdAt) {
            setCreatedAt(formatDistanceToNow(posting.createdAt.toDate(), { addSuffix: true }))
        }
        if(posting.expiresAt) {
            setExpiresAt(` \u2022 Expires ${formatDistanceToNow(posting.expiresAt, { addSuffix: true })}`)
        } else {
            setExpiresAt('');
        }
    }, [posting.createdAt, posting.expiresAt]);
    
    return(
        <p className="text-sm text-muted-foreground">
            at {posting.companyName} &bull; {createdAt}
            {expiresAt && <span>{expiresAt}</span>}
        </p>
    )
}

function PreviousPostings({ jobPostings, isLoading, onUpdate, onDelete }: { jobPostings: AppJobPosting[], isLoading: boolean, onUpdate: (id: string, updates: any) => void, onDelete: (id: string) => void }) {

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Previous Job Postings</CardTitle>
        <CardDescription>View and manage your previously generated job postings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && <Loader2 className="animate-spin" />}
        {!isLoading && jobPostings.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            <FileText className="mx-auto h-12 w-12" />
            <p className="mt-4">You haven't generated any job postings yet.</p>
          </div>
        )}
        {!isLoading && jobPostings.length > 0 && (
          <div className="space-y-4">
            {jobPostings.map((posting) => (
              <Card key={posting.id} className="p-4">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                       <h4 className="font-semibold text-lg">{posting.jobTitle}</h4>
                       <Badge variant={posting.status === 'active' ? 'default' : 'secondary'}>{posting.status}</Badge>
                    </div>
                    <PostingTimeDetails posting={posting} />
                  </div>
                  <div className="flex items-center gap-2">
                     <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(posting.jobPostingText)}>Copy Text</Button>
                      <Button variant="destructive" size="icon" onClick={() => onDelete(posting.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


export default function EmployerPage() {
  const [activeTab, setActiveTab] = useState("ranker");
  const { firestore } = useFirebase();
  const demoUserId = 'anonymous-user';
  const { toast } = useToast();

  const [jobPostings, setJobPostings] = useState<AppJobPosting[]>([]);
  const [isClient, setIsClient] = useState(false);

  const jobPostingsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'jobPostings'),
      where('userProfileId', '==', demoUserId),
      orderBy('createdAt', 'desc')
    );
  }, [firestore]);

  const { data: firestorePostings, isLoading: isLoadingFirestore } = useCollection<FirestoreJobPosting>(jobPostingsQuery);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (firestorePostings) {
      const appPostings = firestorePostings.map(p => ({
        id: p.id,
        userProfileId: p.userProfileId,
        jobTitle: p.jobTitle,
        companyName: p.companyName,
        description: p.jobPostingText.split('\n')[0],
        jobPostingText: p.jobPostingText,
        status: p.status,
        expiresAt: p.expiresAt ? p.expiresAt.toDate() : null,
        createdAt: p.createdAt,
      }));
      setJobPostings(appPostings);
    }
  }, [firestorePostings]);


  useEffect(() => {
    if (!isClient) return;
    
    const interval = setInterval(() => {
      let changed = false;
      const now = new Date();
      const updatedPostings = jobPostings.map(p => {
        if (p.status === 'active' && p.expiresAt && now > p.expiresAt) {
          changed = true;
          handleJobUpdate(p.id, { status: 'inactive' });
          return { ...p, status: 'inactive' as const };
        }
        return p;
      });
      if (changed) {
        setJobPostings(updatedPostings);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [isClient, jobPostings]);


  const handleJobSaved = async (newPosting: AppJobPosting) => {
    setActiveTab('ranker');

    if (!firestore) {
      setJobPostings(prev => [newPosting, ...prev]);
      toast({ title: "Demo Mode", description: "Job posting saved in session. It won't persist."});
      return;
    }
    
    try {
      const { id, ...postingData } = newPosting;
      const jobPostingsCol = collection(firestore, 'jobPostings');
      const docData = {
        ...postingData,
        createdAt: serverTimestamp(),
      };
      await addDoc(jobPostingsCol, docData);
      toast({ title: "Job Saved", description: "The job has been saved to your account." });
    } catch (error) {
      console.error("Error saving job to Firestore:", error);
      toast({ variant: 'destructive', title: "Save Failed", description: "Could not save the job posting." });
    }
  };

  const handleJobDelete = async (jobId: string) => {
    if (!firestore || jobId.startsWith('new-')) {
      setJobPostings(prev => prev.filter(job => job.id !== jobId));
      toast({ title: "Job Removed", description: "The demo job posting has been removed from this session." });
      return;
    }
    
    try {
      const docRef = doc(firestore, "jobPostings", jobId);
      await deleteDoc(docRef);
      toast({ title: "Job Deleted", description: "The job posting has been permanently removed." });
    } catch (error) {
      console.error("Failed to delete from Firestore:", error);
      toast({ variant: 'destructive', title: "Delete Failed", description: "Could not delete the job from the database." });
    }
  };
  
  const handleJobUpdate = async (jobId: string, updates: Partial<Pick<AppJobPosting, 'status' | 'expiresAt'>>) => {
     if (!firestore || jobId.startsWith('new-')) {
      setJobPostings(prev => prev.map(job => job.id === jobId ? {...job, ...updates} : job));
      toast({ title: "Job Updated", description: "The demo job posting has been updated for this session." });
      return;
    }
    
     try {
        const docRef = doc(firestore, 'jobPostings', jobId);
        const firestoreUpdates: any = { ...updates };
        if (updates.expiresAt !== undefined) {
          firestoreUpdates.expiresAt = updates.expiresAt ? Timestamp.fromDate(updates.expiresAt) : null;
        }
        await updateDoc(docRef, firestoreUpdates);
        toast({ title: "Job Updated", description: "The job posting has been updated." });
      } catch (error) {
          console.error("Failed to update Firestore:", error);
          toast({ variant: 'destructive', title: "Update Failed", description: "Could not update the job in the database." });
      }
  };

  if (!isClient) {
    return null;
  }
  
  const isLoading = isLoadingFirestore;

  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ranker">Resume Ranker</TabsTrigger>
          <TabsTrigger value="generator">Job Posting Generator</TabsTrigger>
          <TabsTrigger value="previous">Previous Postings</TabsTrigger>
        </TabsList>
        <TabsContent value="ranker" className="mt-4">
          <ResumeRanker jobPostings={jobPostings} onJobDelete={handleJobDelete} onJobUpdate={handleJobUpdate}/>
        </TabsContent>
        <TabsContent value="generator" className="mt-4">
          <JobPostingGenerator onJobSaved={handleJobSaved} />
        </TabsContent>
        <TabsContent value="previous" className="mt-4">
          <PreviousPostings jobPostings={jobPostings} isLoading={isLoading} onUpdate={handleJobUpdate} onDelete={handleJobDelete}/>
        </TabsContent>
      </Tabs>
    </div>
  );
}
