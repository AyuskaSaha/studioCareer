
"use client";

import { useState, useMemo, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Lightbulb, Search, Briefcase, User, Save, FileText, CheckCircle, XCircle, Circle, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

import { analyzeResume, type AnalyzeResumeOutput } from '@/ai/ai-resume-insights';
import { suggestJobs, type SuggestJobsOutput } from '@/ai/flows/ai-job-suggestion';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { doc, setDoc, collection, query, where, addDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useJobs, type AppJobPosting } from '@/app/job-context';
import { formatDistanceToNow } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

type ResumeData = {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
  };
  summary: string;
  experience: { role: string; company: string; dates: string; description: string; }[];
  education: { degree: string; school: string; dates: string; }[];
  skills: string[];
  certificates: string[];
};

const initialResumeData: ResumeData = {
  personalInfo: { name: 'John Doe', email: 'john.doe@email.com', phone: '123-456-7890', location: 'New York, NY' },
  summary: 'A highly motivated software engineer with 5+ years of experience in full-stack development, specializing in React and Node.js. Proven ability to lead projects and collaborate effectively in agile environments.',
  experience: [
    { role: 'Senior Software Engineer', company: 'Tech Corp', dates: '2020 - Present', description: 'Led a team to develop a new e-commerce platform, increasing sales by 20%. Modernized the tech stack to use Next.js and GraphQL.' },
    { role: 'Software Engineer', company: 'Innovate LLC', dates: '2018 - 2020', description: 'Worked on maintaining and improving legacy systems, reducing bug reports by 30% through proactive refactoring and testing.' },
  ],
  education: [
    { degree: 'B.S. in Computer Science', school: 'State University', dates: '2014 - 2018' },
  ],
  skills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'SQL', 'Docker', 'GraphQL', 'Next.js'],
  certificates: ['AWS Certified Developer - Associate']
};

const resumeToText = (data: ResumeData) => {
  return `
    Name: ${data.personalInfo.name}
    Email: ${data.personalInfo.email}
    Phone: ${data.personalInfo.phone}
    Location: ${data.personalInfo.location}

    Summary:
    ${data.summary}

    Experience:
    ${data.experience.map(exp => `- ${exp.role} at ${exp.company} (${exp.dates})\n  ${exp.description}`).join('\n\n')}

    Education:
    ${data.education.map(edu => `- ${edu.degree}, ${edu.school} (${edu.dates})`).join('\n')}

    Skills: ${data.skills.join(', ')}
    Certificates: ${data.certificates.join(', ')}
  `.trim();
};

function ResumePreview({ data }: { data: ResumeData }) {
  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="text-center border-b pb-4 mb-4">
          <h2 className="font-headline text-3xl font-bold">{data.personalInfo.name}</h2>
          <div className="text-sm text-muted-foreground flex justify-center items-center flex-wrap gap-x-4 gap-y-1 mt-1">
            <span>{data.personalInfo.location}</span>
            <span className="hidden sm:inline">&bull;</span>
            <span>{data.personalInfo.email}</span>
            <span className="hidden sm:inline">&bull;</span>
            <span>{data.personalInfo.phone}</span>
          </div>
        </div>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-headline text-lg font-semibold border-b mb-2">Summary</h3>
            <p className="text-sm">{data.summary}</p>
          </div>

          <div>
            <h3 className="font-headline text-lg font-semibold border-b mb-2">Experience</h3>
            {data.experience.map((exp, i) => (
              <div key={i} className="mb-4 last:mb-0">
                <h4 className="font-bold">{exp.role}</h4>
                <p className="text-sm font-medium">{exp.company} | {exp.dates}</p>
                <p className="text-sm text-muted-foreground">{exp.description}</p>
              </div>
            ))}
          </div>

          <div>
            <h3 className="font-headline text-lg font-semibold border-b mb-2">Education</h3>
            {data.education.map((edu, i) => (
              <div key={i} className="mb-2 last:mb-0">
                <h4 className="font-bold">{edu.degree}</h4>
                <p className="text-sm font-medium">{edu.school} | {edu.dates}</p>
              </div>
            ))}
          </div>

          <div>
            <h3 className="font-headline text-lg font-semibold border-b mb-2">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {data.skills.map((skill, i) => <Badge key={i} variant="secondary">{skill}</Badge>)}
            </div>
          </div>
          
           <div>
            <h3 className="font-headline text-lg font-semibold border-b mb-2">Certificates</h3>
            <div className="flex flex-wrap gap-2">
              {data.certificates.map((cert, i) => <Badge key={i} variant="outline">{cert}</Badge>)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SectionAnalysis({ analysis }: { analysis: AnalyzeResumeOutput['sectionAnalyses'][0] }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
     <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-muted/30">
        <CardHeader className="p-4">
            <CollapsibleTrigger className="flex justify-between items-center w-full">
                <CardTitle className="text-lg font-semibold">{analysis.section}</CardTitle>
                <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-primary">{analysis.score}/100</span>
                    {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
            </CollapsibleTrigger>
            <Progress value={analysis.score} className="w-full h-2 mt-2" />
        </CardHeader>
        <CollapsibleContent>
            <CardContent className="px-4 pb-4 space-y-3">
                <div>
                    <h4 className="font-semibold text-sm">Reasoning:</h4>
                    <p className="text-sm text-muted-foreground">{analysis.reasoning}</p>
                </div>
                <div>
                    <h4 className="font-semibold text-sm">Suggestions:</h4>
                    <p className="text-sm text-muted-foreground">{analysis.suggestions}</p>
                </div>
            </CardContent>
        </CollapsibleContent>
      </Card>
     </Collapsible>
  )
}


function ResumeAnalysisDisplay({ analysis }: { analysis: AnalyzeResumeOutput | null }) {
  if (!analysis) return null;

  return (
    <div className="pt-4 space-y-6">
      <Separator />
      <h3 className="font-headline text-xl font-semibold">AI Resume Analysis</h3>
      
      <div className="space-y-2">
        <Label className="font-semibold text-base">Overall ATS Score</Label>
        <div className="flex items-center gap-4">
          <Progress value={analysis.overallScore} className="w-full h-3" />
          <span className="font-bold text-2xl text-primary">{analysis.overallScore}%</span>
        </div>
         <p className="text-sm text-muted-foreground">{analysis.overallSummary}</p>
      </div>

      {analysis.sectionAnalyses && analysis.sectionAnalyses.length > 0 && (
         <div className="space-y-4">
            <Label className="font-semibold text-base">Section Breakdown</Label>
            {analysis.sectionAnalyses.map((section, index) => (
                <SectionAnalysis key={index} analysis={section} />
            ))}
        </div>
      )}
    </div>
  );
}



function ResumeBuilder() {
  const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzeResumeOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const handlePersonalInfoChange = (field: keyof ResumeData['personalInfo'], value: string) => {
    setResumeData(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, [field]: value }}));
  };

  const handleAnalyzeResume = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const resumeText = resumeToText(resumeData);
      const result = await analyzeResume({ resumeText });
      setAnalysis(result);
    } catch (e) {
      console.error(e);
      setError("Failed to analyze resume. Please try again.");
    }
    setLoading(false);
  };
  
  const handleSaveResume = async () => {
    if (!firestore) {
        toast({
            variant: "default",
            title: "Demo Mode",
            description: "Saving is disabled in demo mode. Your resume will be used for applying within this session.",
        });
        return;
    }
    
    const userId = 'anonymous-user'; 

    setSaving(true);
    setError(null);
    try {
      const resumeText = resumeToText(resumeData);
      const resumeId = `resume-for-${userId}`; 
      const docRef = doc(firestore, "resumes", resumeId);
      const resumePayload = {
        id: resumeId,
        userProfileId: userId,
        title: `${resumeData.personalInfo.name}'s Resume`,
        content: JSON.stringify(resumeData),
        resumeText: resumeText,
      };

      await setDoc(docRef, resumePayload, { merge: true });

      toast({
        title: "Resume Saved",
        description: "Your resume has been saved successfully.",
      });
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to save resume. Please try again.");
       toast({
        variant: "destructive",
        title: "Save Failed",
        description: e.message || "Could not save resume.",
      });
    }
    setSaving(false);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Resume Builder</CardTitle>
          <CardDescription>Fill in your details to build your resume and get AI-powered feedback.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center"><User className="mr-2 h-5 w-5"/> Personal Info</h3>
          <Input placeholder="Full Name" value={resumeData.personalInfo.name} onChange={e => handlePersonalInfoChange('name', e.target.value)} />
          <Input placeholder="Email" type="email" value={resumeData.personalInfo.email} onChange={e => handlePersonalInfoChange('email', e.target.value)} />
          <Input placeholder="Phone" type="tel" value={resumeData.personalInfo.phone} onChange={e => handlePersonalInfoChange('phone', e.target.value)} />
          <Input placeholder="Location" value={resumeData.personalInfo.location} onChange={e => handlePersonalInfoChange('location', e.target.value)} />

          <Separator/>
          
          <h3 className="font-semibold text-lg flex items-center"><Briefcase className="mr-2 h-5 w-5"/> Summary</h3>
          <Textarea placeholder="Professional Summary" className="min-h-[100px]" value={resumeData.summary} onChange={e => setResumeData(prev => ({...prev, summary: e.target.value}))} />
          
          <p className="text-sm text-muted-foreground pt-4">For simplicity, experience, education, and skills are pre-filled. You can see the result in the preview.</p>
          
          <Separator />

          <div className="pt-2 flex flex-wrap gap-2">
            <Button onClick={handleSaveResume} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Resume
            </Button>
            <Button onClick={handleAnalyzeResume} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Analyze Resume
            </Button>
          </div>
            {loading && <p className="text-sm text-muted-foreground animate-pulse mt-2">AI is thinking...</p>}
            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
            
            <ResumeAnalysisDisplay analysis={analysis} />

        </CardContent>
      </Card>
      <div className="lg:sticky top-24 h-auto lg:h-[calc(100vh-8rem)] overflow-y-auto">
        <ResumePreview data={resumeData} />
      </div>
    </div>
  );
}

function ResumeInsights() {
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzeResumeOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resumeText = resumeToText(initialResumeData);
  
  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const analysisResult = await analyzeResume({ resumeText, jobDescription });
      setAnalysis(analysisResult);
    } catch (e) {
      console.error(e);
      setError("Analysis failed. Please try again.");
    }
    setLoading(false);
  };
  
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline">AI Resume Insights</CardTitle>
        <CardDescription>Paste a job description to get an ATS score and improvement suggestions for the sample resume.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="job-desc-insights">Job Description</Label>
          <Textarea id="job-desc-insights" placeholder="Paste the job description here..." className="min-h-[150px]" value={jobDescription} onChange={e => setJobDescription(e.target.value)} />
        </div>
        <Button onClick={handleAnalyze} disabled={loading || !jobDescription}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Analyze Against Job Description
        </Button>
        {loading && <p className="text-sm text-muted-foreground animate-pulse">AI is analyzing...</p>}
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        <ResumeAnalysisDisplay analysis={analysis} />
      </CardContent>
    </Card>
  )
}

function JobSuggestions() {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestJobsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSuggest = async () => {
    setLoading(true);
    setError(null);
    setSuggestions(null);
    try {
      const result = await suggestJobs({ 
        skills: initialResumeData.skills.join(', '), 
        experience: resumeToText(initialResumeData),
        certificates: initialResumeData.certificates.join(', ')
      });
      setSuggestions(result);
    } catch (e) {
      console.error(e);
      setError("Could not get suggestions. Please try again later.");
    }
    setLoading(false);
  }
  
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline">AI Job Suggestions</CardTitle>
        <CardDescription>Let AI suggest relevant jobs based on the skills and experience in your resume.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleSuggest} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
          Find Jobs For Me
        </Button>
        {loading && <p className="text-sm text-muted-foreground animate-pulse">Searching for opportunities...</p>}
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        {suggestions && (
          <div className="pt-4 space-y-4">
            {suggestions.map((job, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle>{job.jobTitle}</CardTitle>
                  <CardDescription>{job.company}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground border-l-2 pl-2">"{job.reason}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function JobSearch({ onApply }: { onApply: (job: AppJobPosting) => void }) {
  const [queryText, setQueryText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AppJobPosting[] | null>(null);
  const { jobs } = useJobs();

  const handleSearch = () => {
    setIsLoading(true);
    // In a real app, this might be an API call. Here we filter the shared jobs list.
    setTimeout(() => {
      const lowercasedQuery = queryText.toLowerCase();
      const filteredJobs = jobs.filter(job => 
        job.status === 'active' && (
          job.jobTitle.toLowerCase().includes(lowercasedQuery) ||
          job.companyName.toLowerCase().includes(lowercasedQuery) ||
          job.jobPostingText.toLowerCase().includes(lowercasedQuery)
        )
      );
      setResults(filteredJobs);
      setIsLoading(false);
    }, 500);
  };
  
  const handleApply = (job: AppJobPosting) => {
    onApply(job);
  }

  return (
     <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline">Job Search</CardTitle>
        <CardDescription>Search for active job openings from our employer network.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input 
            placeholder="Search by job title, e.g., 'Senior Frontend Developer'"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={isLoading || !queryText}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Search
          </Button>
        </div>
        {isLoading && <p className="text-sm text-muted-foreground animate-pulse pt-4">Searching for jobs...</p>}
        
        {results && !isLoading && (
           <div className="pt-4 space-y-4">
            {results.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No jobs found for "{queryText}". Try another search.</p>
            ) : (
              results.map((job) => (
                <Card key={job.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold">{job.jobTitle}</h4>
                    <p className="text-sm text-muted-foreground">{job.companyName} - {job.location}</p>
                    <p className="text-sm text-muted-foreground mt-1">Posted {formatDistanceToNow(new Date(job.createdAt))} ago</p>
                    <p className="text-sm mt-2 line-clamp-2">{job.jobPostingText}</p>
                  </div>
                  <Button onClick={() => handleApply(job)}>Apply</Button>
                </Card>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const applicationStatuses = [
  'Submitted',
  'Reviewed',
  'Interview',
  'Offer',
  'Accepted',
] as const;

type ApplicationStatus = (typeof applicationStatuses)[number] | 'Rejected' | 'Internship';

type Application = {
  id: string;
  jobTitle: string;
  companyName: string;
  status: ApplicationStatus;
  statusText: string;
};

const initialApplications: Application[] = [
  { id: 'app1', jobTitle: 'Frontend Developer', companyName: 'Vercel', status: 'Interview', statusText: 'Scheduled for next week' },
  { id: 'app2', jobTitle: 'UX Designer', companyName: 'Figma', status: 'Accepted', statusText: 'Offer accepted! Start date confirmed.' },
  { id: 'app3', jobTitle: 'Backend Engineer', companyName: 'Supabase', status: 'Rejected', statusText: 'Rejected after initial screening.' },
  { id: 'app4', jobTitle: 'Data Analyst Intern', companyName: 'Notion', status: 'Internship', statusText: 'Internship in progress.' },
];

function ApplicationProgressBar({ status }: { status: ApplicationStatus }) {
  const currentIndex = applicationStatuses.indexOf(status as any);

  const isFinalPositiveState = status === 'Accepted' || status === 'Internship';
  const isRejected = status === 'Rejected';

  if (isRejected) {
    return (
      <div className="flex items-center gap-2 text-destructive">
        <XCircle className="h-5 w-5" />
        <span className="font-medium">Rejected</span>
      </div>
    );
  }
  
  if (isFinalPositiveState) {
     const Icon = status === 'Accepted' ? CheckCircle : Briefcase;
     const text = status === 'Accepted' ? 'Accepted' : 'Internship Ongoing';
     return (
        <div className="flex items-center gap-2 text-green-600">
          <Icon className="h-5 w-5" />
          <span className="font-medium">{text}</span>
        </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-3">
        {applicationStatuses.map((step, index) => {
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;
          
          return (
             <Tooltip key={step}>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'h-6 w-6 rounded-full flex items-center justify-center border-2',
                      isCompleted ? 'bg-primary border-primary text-primary-foreground' : 'bg-muted border-border',
                      isActive ? 'border-primary' : ''
                    )}
                  >
                    {isCompleted ? <CheckCircle className="h-4 w-4" /> : <Circle className="h-3 w-3 fill-muted" />}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{step}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -translate-y-1/2 -z-10" />
        <div 
          className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 -z-10 transition-all" 
          style={{ width: `calc(${currentIndex / (applicationStatuses.length - 1) * 100}% - 1.5rem)`}}
        />
      </div>
    </TooltipProvider>
  );
}


function ApplicationTracker({ applications, onWithdraw }: { applications: Application[], onWithdraw: (applicationId: string) => void }) {
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline">Application Tracker</CardTitle>
        <CardDescription>Keep track of all your job applications and their current status.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {applications.length > 0 ? (
          applications.map((app) => (
            <Card key={app.id} className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold">{app.jobTitle}</h4>
                  <p className="text-sm text-muted-foreground">{app.companyName}</p>
                </div>
                 <div className="w-full sm:w-auto">
                  <div className="relative w-full max-w-md">
                     <ApplicationProgressBar status={app.status} />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <p className="text-sm text-muted-foreground ">{app.statusText}</p>
                <Button variant="destructive" size="sm" onClick={() => onWithdraw(app.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Withdraw
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center text-muted-foreground py-12">
            <FileText className="mx-auto h-12 w-12" />
            <p className="mt-4">You haven't applied for any jobs yet.</p>
            <p className="text-sm">Start by searching for jobs in the "Job Search" tab.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


export default function JobSeekerPage() {
  const [applications, setApplications] = useState<Application[]>(initialApplications);
  const [activeTab, setActiveTab] = useState("builder");
  const { toast } = useToast();

  const handleApply = useCallback((job: AppJobPosting) => {
    // Check if an application for this job already exists
    if (applications.some(app => app.id === `app-${job.id}`)) {
      toast({
        variant: "default",
        title: "Already Applied",
        description: `You have already applied for the ${job.jobTitle} position.`,
      });
      return;
    }

    const newApplication: Application = {
      id: `app-${job.id}`,
      jobTitle: job.jobTitle,
      companyName: job.companyName,
      status: 'Submitted',
      statusText: `Application sent ${formatDistanceToNow(new Date())} ago.`,
    };

    setApplications(prev => [newApplication, ...prev]);
    toast({
      title: "Application Sent!",
      description: `Your application for ${job.jobTitle} has been submitted.`,
    });
    setActiveTab("tracker");
  }, [applications, toast]);

  const handleWithdraw = useCallback((applicationId: string) => {
    const withdrawnApp = applications.find(app => app.id === applicationId);
    setApplications(prev => prev.filter(app => app.id !== applicationId));
    toast({
      title: "Application Withdrawn",
      description: `You have withdrawn your application for ${withdrawnApp?.jobTitle}.`,
    });
  }, [applications, toast]);


  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5">
          <TabsTrigger value="builder">Resume Builder</TabsTrigger>
          <TabsTrigger value="insights">AI Resume Insights</TabsTrigger>
          <TabsTrigger value="suggestions">AI Job Suggestions</TabsTrigger>
          <TabsTrigger value="search">Job Search</TabsTrigger>
          <TabsTrigger value="tracker">Application Tracker</TabsTrigger>
        </TabsList>
        <TabsContent value="builder" className="mt-4">
          <ResumeBuilder />
        </TabsContent>
        <TabsContent value="insights" className="mt-4">
          <ResumeInsights />
        </TabsContent>
        <TabsContent value="suggestions" className="mt-4">
          <JobSuggestions />
        </TabsContent>
        <TabsContent value="search" className="mt-4">
          <JobSearch onApply={handleApply} />
        </TabsContent>
        <TabsContent value="tracker" className="mt-4">
          <ApplicationTracker applications={applications} onWithdraw={handleWithdraw} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

    
