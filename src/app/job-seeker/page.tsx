"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Lightbulb, Search, Briefcase, GraduationCap, User, Save } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

import { analyzeResume, type AnalyzeResumeOutput } from '@/ai/ai-resume-insights';
import { suggestJobs, type SuggestJobsOutput } from '@/ai/flows/ai-job-suggestion';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { doc, setDoc, collection, query, where, addDoc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';

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

function ResumeAnalysisDisplay({ analysis }: { analysis: AnalyzeResumeOutput | null }) {
  if (!analysis) return null;

  return (
    <div className="pt-4 space-y-4">
      <Separator />
      <h3 className="font-headline text-xl font-semibold">AI Resume Analysis</h3>
      {analysis.atsScore !== null && (
        <div className="space-y-2">
          <Label className="font-semibold">ATS Score</Label>
          <div className="flex items-center gap-4">
            <Progress value={analysis.atsScore} className="w-full" />
            <span className="font-bold text-lg text-primary">{analysis.atsScore}%</span>
          </div>
          <p className="text-sm text-muted-foreground">
            This score estimates how well your resume might perform in an Applicant Tracking System.
          </p>
        </div>
      )}
      {analysis.insights && (
        <div className="space-y-2">
          <Label className="font-semibold">AI Insights & Suggestions</Label>
          <div className="p-4 border rounded-md bg-muted/30 text-sm">
            <p className="whitespace-pre-wrap">{analysis.insights}</p>
          </div>
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
            variant: "destructive",
            title: "Demo Mode",
            description: "Saving is disabled in demo mode. Your resume will be used for applying within this session.",
        });
        return;
    }
    
    // In a real app, you would have user auth. For demo, we use a static ID.
    const userId = 'anonymous-user'; 

    setSaving(true);
    setError(null);
    try {
      const resumeText = resumeToText(resumeData);
      // For a multi-resume system, you'd generate a unique ID.
      // Here, we use a static ID for simplicity, creating one resume per demo session.
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

function JobSearch() {
  const [queryText, setQueryText] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const jobsQuery = useMemoFirebase(() => {
    if (!firestore || !submittedQuery) return null;
    return query(
      collection(firestore, 'jobPostings'),
      where('status', '==', 'active'),
      where('jobTitle', '>=', submittedQuery),
      where('jobTitle', '<=', submittedQuery + '\uf8ff')
    );
  }, [firestore, submittedQuery]);

  const { data: results, isLoading, error } = useCollection<{id: string; jobTitle: string; companyName: string; jobPostingText: string; location: string}>(jobsQuery);
  
  const handleSearch = () => {
    setSubmittedQuery(queryText);
  };
  
  const handleApply = async (jobId: string) => {
    if (!firestore) {
      toast({
        title: "Application Sent!",
        description: "Your resume has been submitted for this demo session.",
      });
      return;
    }
    
    const userId = 'anonymous-user';

    try {
      const applicationsCol = collection(firestore, 'applications');
      await addDoc(applicationsCol, {
        jobPostingId: jobId,
        userProfileId: userId,
        resumeId: `resume-for-${userId}`, // Matches the ID used in resume builder
        applicationDate: new Date(),
        status: 'submitted',
      });
      
      toast({
        title: "Application Sent!",
        description: "Your resume has been submitted. Employers can now see you in their ranking list.",
      });
    } catch(e) {
      console.error("Failed to submit application", e);
      toast({
        variant: 'destructive',
        title: "Application Failed",
        description: "Could not submit your application. Please try again.",
      });
    }
  }

  return (
     <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline">Job Search</CardTitle>
        <CardDescription>Search for job openings from our employer network.</CardDescription>
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
        {isLoading && <p className="text-sm text-muted-foreground animate-pulse">Searching for jobs...</p>}
        {error && <p className="text-sm text-destructive mt-2">Search failed. Please check your connection or try again.</p>}
        
        {submittedQuery && !isLoading && (
           <div className="pt-4 space-y-4">
            {results && results.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No jobs found for "{submittedQuery}". Try another search.</p>
            ) : (
              results?.map((job, i) => (
                <Card key={i} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold">{job.jobTitle}</h4>
                    <p className="text-sm text-muted-foreground">{job.companyName} - {job.location}</p>
                    <p className="text-sm mt-2 line-clamp-2">{job.jobPostingText}</p>
                  </div>
                  <Button onClick={() => handleApply(job.id)}>Apply</Button>
                </Card>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}


export default function JobSeekerPage() {
  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      <Tabs defaultValue="builder" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
          <TabsTrigger value="builder">Resume Builder</TabsTrigger>
          <TabsTrigger value="insights">AI Resume Insights</TabsTrigger>
          <TabsTrigger value="suggestions">AI Job Suggestions</TabsTrigger>
          <TabsTrigger value="search">Job Search</TabsTrigger>
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
          <JobSearch />
        </TabsContent>
      </Tabs>
    </div>
  );
}
