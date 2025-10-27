"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Lightbulb, Search, Briefcase, GraduationCap, User } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { analyzeResumeShortcomings, type AnalyzeResumeShortcomingsOutput } from '@/ai/flows/resume-shortcoming-analysis';
import { suggestJobs, type SuggestJobsOutput } from '@/ai/flows/ai-job-suggestion';
import { rankResumes } from '@/ai/flows/top-resume-ranking';

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

function ResumeBuilder() {
  const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData);

  const handlePersonalInfoChange = (field: keyof ResumeData['personalInfo'], value: string) => {
    setResumeData(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, [field]: value }}));
  };
  
  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Resume Builder</CardTitle>
          <CardDescription>Fill in your details to see a live preview of your resume.</CardDescription>
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
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeResumeShortcomingsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resumeText = resumeToText(initialResumeData);
  
  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setAtsScore(null);
    setAnalysis(null);
    try {
      const [rankResult, analysisResult] = await Promise.all([
        rankResumes({ jobDescription, resumes: [resumeText] }),
        analyzeResumeShortcomings({ resumeText, jobDescription })
      ]);

      if (rankResult && rankResult.length > 0) {
        const score = Math.max(0, (11 - rankResult[0].rank) * 10);
        setAtsScore(score);
      }
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
          Analyze My Resume
        </Button>
        {loading && <p className="text-sm text-muted-foreground animate-pulse">AI is analyzing...</p>}
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        {atsScore !== null && (
          <div className="pt-4 space-y-2">
            <h3 className="font-semibold text-lg">ATS Score</h3>
            <div className="flex items-center gap-4">
              <Progress value={atsScore} className="w-full"/>
              <span className="font-bold text-lg text-primary">{atsScore}%</span>
            </div>
            <p className="text-sm text-muted-foreground">This score estimates how well your resume matches the job description for an Applicant Tracking System.</p>
          </div>
        )}
        {analysis && (
          <div className="pt-4 space-y-4">
            <h3 className="font-semibold text-lg">AI Suggestions</h3>
            <div className="p-4 border rounded-md bg-muted/30">
              <h4 className="font-medium">Overall Assessment</h4>
              <p className="text-sm text-muted-foreground">{analysis.overallAssessment}</p>
            </div>
            {analysis.shortcomings.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium mt-2">Areas for Improvement</h4>
                {analysis.shortcomings.map((item, i) => (
                  <div key={i} className="p-4 border rounded-md">
                    <h4 className="font-semibold">{item.skill}</h4>
                    <p className="text-sm"><strong className="text-muted-foreground">Impact:</strong> {item.impact}</p>
                    <p className="text-sm"><strong className="text-muted-foreground">Suggestion:</strong> {item.mitigation}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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

const mockJobs = [
  { title: "Frontend Developer", company: "Web Solutions", location: "Remote" },
  { title: "Backend Engineer", company: "Data Systems", location: "San Francisco, CA" },
  { title: "Full Stack Developer", company: "Creative Apps", location: "New York, NY" },
];

function JobSearch() {
  return (
     <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline">Job Search</CardTitle>
        <CardDescription>Search for job openings. (This is a simplified mock-up).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input placeholder="Search by keywords..."/>
          <Button><Search className="mr-2 h-4 w-4"/> Search</Button>
        </div>
        <div className="pt-4 space-y-4">
          {mockJobs.map((job, i) => (
            <Card key={i} className="flex justify-between items-center p-4">
              <div>
                <h4 className="font-semibold">{job.title}</h4>
                <p className="text-sm text-muted-foreground">{job.company} - {job.location}</p>
              </div>
              <Button>Apply</Button>
            </Card>
          ))}
        </div>
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
