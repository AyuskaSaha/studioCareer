"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, UserCheck, Search, FileText, Briefcase, Wand2, Save } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { generateJobPosting, type JobPostingInput } from '@/ai/flows/ai-job-posting-generator';
import { rankResumes, type RankResumesOutput } from '@/ai/flows/top-resume-ranking';
import { analyzeResumeShortcomings, type AnalyzeResumeShortcomingsOutput } from '@/ai/flows/resume-shortcoming-analysis';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where, Timestamp, addDoc, serverTimestamp } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';
import { addDocumentNonBlocking } from '@/firebase';

type JobPosting = {
  id: string;
  jobTitle: string;
  companyName: string;
  jobPostingText: string;
  createdAt: Timestamp;
  status: 'active' | 'inactive';
}

function JobPostingGenerator() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Omit<JobPostingInput, 'userProfileId'>>>({ jobType: 'Full-time' });
  const [generatedPosting, setGeneratedPosting] = useState<string>('');
  const [refinement, setRefinement] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const { user, auth, firestore } = useFirebase();
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
    return jobTitle && companyName && location && description && responsibilities && mustHaveSkills && user;
  };

  const handleGenerate = async (isRefinement = false) => {
    if (!canGenerate()) {
      setError("Please fill out all required fields and ensure you are logged in.");
      return;
    }
    setLoading(true);
    setError(null);
    if (!isRefinement) {
      setGeneratedPosting('');
    }

    try {
      const input: JobPostingInput = {
        ...formData as Omit<JobPostingInput, 'userProfileId' | 'refinement' | 'previousPosting'>,
        userProfileId: user!.uid,
        ...(isRefinement && { refinement, previousPosting: generatedPosting })
      };
      
      const stream = await generateJobPosting(input);
      for await (const chunk of stream) {
        setGeneratedPosting(prev => prev + chunk);
      }
    } catch (e) {
      console.error(e);
      setError(`Failed to ${isRefinement ? 'refine' : 'generate'} job posting. Please try again.`);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user || !firestore || !generatedPosting) {
      toast({ variant: 'destructive', title: 'Error', description: 'Cannot save posting. Make sure you are logged in and have generated a posting.'});
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const jobPostingsCol = collection(firestore, 'jobPostings');
      await addDoc(jobPostingsCol, {
        userProfileId: user.uid,
        jobTitle: formData.jobTitle,
        companyName: formData.companyName,
        location: formData.location,
        salaryRange: formData.salaryRange,
        jobType: formData.jobType,
        jobPostingText: generatedPosting,
        createdAt: serverTimestamp(),
        status: 'active'
      });
      toast({
        title: "Job Posting Saved!",
        description: "Your new job posting has been saved to your 'Previous Postings'.",
      });
    } catch (e) {
      console.error(e);
      setError("Failed to save job posting.");
      toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save the job posting. Please try again.' });
    }
    setSaving(false);
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">AI Job Posting Generator</CardTitle>
        <CardDescription>Fill in the details below, and let our AI craft the perfect job posting. You can then refine it with further instructions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!user && (
          <Alert>
            <Briefcase className="h-4 w-4" />
            <AlertTitle>Please Log In</AlertTitle>
            <AlertDescription>
              You need to be logged in to generate and save job postings.
              <Button variant="link" className="p-0 h-auto ml-1" onClick={() => auth && initiateAnonymousSignIn(auth)}>Log in anonymously</Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Form Section */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="jobTitle">Job Title</Label>
            <Input id="jobTitle" placeholder="e.g., Senior Frontend Developer" value={formData.jobTitle || ''} onChange={handleInputChange} disabled={!user || loading}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input id="companyName" placeholder="e.g., Acme Inc." value={formData.companyName || ''} onChange={handleInputChange} disabled={!user || loading}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" placeholder="e.g., San Francisco, CA or Remote" value={formData.location || ''} onChange={handleInputChange} disabled={!user || loading}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="salaryRange">Salary Range (Optional)</Label>
            <Input id="salaryRange" placeholder="e.g., $120,000 - $150,000" value={formData.salaryRange || ''} onChange={handleInputChange} disabled={!user || loading}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="jobType">Job Type</Label>
             <Select value={formData.jobType} onValueChange={handleSelectChange} disabled={!user || loading}>
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
          <Textarea id="description" placeholder="Describe your company's mission, culture, and the role's purpose." className="min-h-[100px]" value={formData.description || ''} onChange={handleInputChange} disabled={!user || loading}/>
        </div>
        <div className="space-y-2">
          <Label htmlFor="responsibilities">Responsibilities</Label>
          <Textarea id="responsibilities" placeholder="List the key responsibilities, e.g., - Develop and maintain web applications..." className="min-h-[120px]" value={formData.responsibilities || ''} onChange={handleInputChange} disabled={!user || loading}/>
        </div>
        <div className="space-y-2">
          <Label htmlFor="mustHaveSkills">Must-Have Skills</Label>
          <Input id="mustHaveSkills" placeholder="Comma-separated, e.g., React, TypeScript, CSS" value={formData.mustHaveSkills || ''} onChange={handleInputChange} disabled={!user || loading}/>
        </div>
        <div className="space-y-2">
          <Label htmlFor="niceToHaveSkills">Nice-to-Have Skills (Optional)</Label>
          <Input id="niceToHaveSkills" placeholder="Comma-separated, e.g., GraphQL, Docker, AWS" value={formData.niceToHaveSkills || ''} onChange={handleInputChange} disabled={!user || loading}/>
        </div>
        
        {/* Initial Generation Button */}
        {!generatedPosting && (
          <Button onClick={() => handleGenerate(false)} disabled={loading || !canGenerate()}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Generate Job Posting
          </Button>
        )}
        
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        
        {/* Generated Content and Refinement Section */}
        {(generatedPosting || loading) && (
          <div className="space-y-4 pt-4 border-t mt-4">
             <div className="space-y-2">
              <Label className="font-semibold text-lg">Generated Job Posting</Label>
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
              <Button onClick={handleSave} variant="outline" disabled={loading || saving}>
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

function ResumeRanker() {
  const [loading, setLoading] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [rankedResumes, setRankedResumes] = useState<RankResumesOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rankingImage = PlaceHolderImages.find(img => img.id === 'resume-ranking');

  const handleRank = async () => {
    setLoading(true);
    setError(null);
    setRankedResumes(null);
    try {
      if (!jobDescription.trim()) {
        throw new Error("Please provide a job description.");
      }
      const result = await rankResumes({ jobDescription });
      const sortedResumes = result.sort((a, b) => a.rank - b.rank);
      setRankedResumes(sortedResumes);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to rank resumes. Please check your inputs and try again.");
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Top Resume Ranker</CardTitle>
        <CardDescription>Paste a job description to automatically find and rank the top 10 candidates from our talent pool.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="job-desc-ranker">Job Description</Label>
          <Textarea id="job-desc-ranker" placeholder="Paste the full job description here to start the ranking process..." className="min-h-[200px]" value={jobDescription} onChange={e => setJobDescription(e.target.value)} />
        </div>

        <Button onClick={handleRank} disabled={loading || !jobDescription}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
          Find & Rank Top Candidates
        </Button>

        {loading && <p className="text-sm text-muted-foreground animate-pulse">Searching and ranking candidates, this may take a moment...</p>}
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        
        {!rankedResumes && !loading && !error && rankingImage && (
          <div className="pt-8 text-center">
             <div className="relative aspect-video max-w-lg mx-auto w-full overflow-hidden rounded-lg">
                <Image src={rankingImage.imageUrl} alt={rankingImage.description} fill className="object-cover" data-ai-hint={rankingImage.imageHint}/>
              </div>
            <p className="mt-4 text-muted-foreground">Your top candidates will appear here.</p>
          </div>
        )}

        {rankedResumes && (
          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-semibold font-headline">Top 10 Ranked Candidates</h3>
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

                      <ShortcomingAnalysis resume={item.resume} jobDescription={jobDescription} />
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

const demoPostings: JobPosting[] = [
    {
      id: 'demo-1',
      jobTitle: 'Senior Frontend Developer',
      companyName: 'Starlight Solutions',
      jobPostingText: `Posted on: ${new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString()}\n\nStarlight Solutions is looking for a Senior Frontend Developer to join our innovative team...`,
      createdAt: new Timestamp(Math.floor((Date.now() - 2 * 24 * 60 * 60 * 1000) / 1000), 0),
      status: 'active',
    },
    {
      id: 'demo-2',
      jobTitle: 'UX/UI Designer',
      companyName: 'Creative Minds Inc.',
      jobPostingText: `Posted on: ${new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toLocaleDateString()}\n\nCreative Minds Inc. is seeking a talented UX/UI Designer to create amazing user experiences...`,
      createdAt: new Timestamp(Math.floor((Date.now() - 10 * 24 * 60 * 60 * 1000) / 1000), 0),
      status: 'inactive',
    },
  ];

function PreviousPostings() {
  const { firestore, user } = useFirebase();
  const jobPostingsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'jobPostings'),
      where('userProfileId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: jobPostings, isLoading } = useCollection<JobPosting>(jobPostingsQuery);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    // Render nothing on the server to avoid hydration mismatch with demo data
    return <Card><CardHeader><CardTitle className="font-headline">Previous Job Postings</CardTitle><CardDescription>View and manage your previously generated job postings.</CardDescription></CardHeader><CardContent><Loader2 className="animate-spin" /></CardContent></Card>;
  }

  const allPostings = [...(jobPostings || []), ...demoPostings];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Previous Job Postings</CardTitle>
        <CardDescription>View and manage your previously generated job postings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && <Loader2 className="animate-spin" />}
        {!isLoading && allPostings.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            <FileText className="mx-auto h-12 w-12" />
            <p className="mt-4">You haven't generated any job postings yet.</p>
          </div>
        )}
        {!isLoading && allPostings.length > 0 && (
          <div className="space-y-4">
            {allPostings.map((posting) => (
              <Card key={posting.id} className="p-4">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                       <h4 className="font-semibold text-lg">{posting.jobTitle}</h4>
                       <Badge variant={posting.status === 'active' ? 'default' : 'secondary'}>{posting.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      at {posting.companyName} &bull; {formatDistanceToNow(posting.createdAt.toDate(), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                     <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(posting.jobPostingText)}>Copy Text</Button>
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
  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
      <Tabs defaultValue="ranker" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="ranker">Resume Ranker</TabsTrigger>
          <TabsTrigger value="generator">Job Posting Generator</TabsTrigger>
          <TabsTrigger value="previous">Previous Postings</TabsTrigger>
        </TabsList>
        <TabsContent value="ranker" className="mt-4">
          <ResumeRanker />
        </TabsContent>
        <TabsContent value="generator" className="mt-4">
          <JobPostingGenerator />
        </TabsContent>
        <TabsContent value="previous" className="mt-4">
          <PreviousPostings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
