
"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Wand2, Save, Users, Code, Trash2, CalendarIcon, FileText, Check, X, ChevronsUpDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { generateJobPosting, type JobPostingInput } from '@/ai/flows/ai-job-posting-generator';
import { rankResumes, type RankResumesOutput } from '@/ai/flows/top-resume-ranking';
import { type AnalyzeResumeShortcomingsOutput } from '@/ai/flows/resume-shortcoming-analysis';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { useJobs, type AppJobPosting } from '@/app/job-context';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const demoRankedResumes: RankResumesOutput = [
  {
    rank: 1,
    resume: `
Name: Elena Rodriguez
Summary: Senior Frontend Engineer with 8+ years of experience crafting beautiful, high-performance user interfaces for SaaS platforms. Expert in React, TypeScript, and Next.js. Passionate about design systems and component-driven development.
Experience: Led the migration of a monolithic frontend to a micro-frontend architecture at ScaleUp Inc., improving deployment frequency by 300%.
Skills: React, TypeScript, Next.js, GraphQL, Web Performance, Design Systems, CI/CD
`,
    reason: `Elena is ranked #1 due to her extensive experience with our core tech stack (React, Next.js, TypeScript) and proven leadership in a similar migration project, which aligns perfectly with the role's key responsibilities.`,
    overallAssessment: "An outstanding candidate whose skills and experience are a near-perfect match. The primary gap is a lack of direct experience with our secondary backend language, which is minor and can be learned quickly.",
    shortcomings: [
      { skill: "Python Experience", impact: "Minor delay in contributing to secondary backend services.", mitigation: "Provide a 2-week bootcamp on our Python services and pair with a senior backend engineer for the first month.", severity: "low" }
    ]
  },
  {
    rank: 2,
    resume: `
Name: Ben Carter
Summary: A proactive Full-Stack Developer with a strong focus on backend systems using Node.js and GraphQL. Skilled in building scalable APIs and working in agile environments.
Experience: Developed a real-time data processing pipeline at Innovate LLC, reducing latency by 40%.
Skills: Node.js, GraphQL, TypeScript, PostgreSQL, Docker, AWS, Microservices
`,
    reason: `Ranked #2 for his deep backend expertise, especially with GraphQL and microservices. While his frontend skills are less pronounced than Elena's, his backend proficiency is a huge asset.`,
    overallAssessment: "A very strong backend candidate. His frontend skills, while present, are not as senior-level as the role requires. This is a moderate gap that will require some ramp-up time.",
    shortcomings: [
      { skill: "Advanced React Patterns", impact: "May require more guidance on complex frontend state management and component architecture.", mitigation: "Enroll in an advanced React workshop and assign a frontend mentor.", severity: "moderate" },
      { skill: "CSS-in-JS", impact: "Will need to learn our styling system (styled-components).", mitigation: "Code reviews focused on styling best practices.", severity: "low" }
    ]
  },
  {
    rank: 3,
    resume: `
Name: Saniya Khan
Summary: A detail-oriented Software Engineer with 5 years of experience, specializing in React and data visualization libraries like D3.js. Enjoys translating complex data into intuitive user interfaces.
Experience: Created an interactive analytics dashboard for a major fintech client, which was praised for its usability and performance.
Skills: JavaScript, React, D3.js, Redux, CSS-in-JS, SQL
`,
    reason: `Saniya's strong React skills and unique experience in data visualization make her a strong candidate. She is ranked #3 as her experience is slightly less senior than the top candidates.`,
    overallAssessment: "A solid mid-level engineer with a valuable specialization in data visualization. The main gap is her lack of cloud deployment experience, which is a key part of the role.",
    shortcomings: [
        { skill: "Cloud Deployment (AWS/GCP)", impact: "Cannot independently deploy or manage services in our cloud environment initially.", mitigation: "Pair with a DevOps engineer for initial deployments and provide access to cloud certification courses.", severity: "high" }
    ]
  },
  {
    rank: 4,
    resume: `
Name: David Chen
Summary: Recent computer science graduate with a passion for web development and cloud technologies. Completed internships focusing on React and Python (Django). Eager to learn and contribute to a fast-paced team.
Experience: Intern at Connectly, assisted in building new UI features and writing unit tests.
Skills: React, JavaScript, Python, Django, HTML/CSS, Git
`,
    reason: `David is a promising junior candidate with relevant internship experience in React. Ranked #4 due to his junior status, but shows great potential and eagerness to grow.`,
    overallAssessment: "A high-potential junior candidate. Lacks professional production experience, which is the most critical gap. He will require significant mentorship.",
    shortcomings: [
        { skill: "Production Environment Experience", impact: "Will need extensive mentoring on production best practices, CI/CD, and on-call responsibilities.", mitigation: "Assign a dedicated senior engineer as a mentor for the first 6 months. Start with low-risk tasks.", severity: "critical" },
        { skill: "System Design", impact: "Unable to lead architectural discussions or design new features independently.", mitigation: "Include in all system design meetings as an observer and provide targeted reading material.", severity: "high" }
    ]
  },
  {
    rank: 5,
    resume: `
Name: Maria Garcia
Summary: UX/UI Engineer who bridges the gap between design and development. Proficient in creating pixel-perfect interfaces from Figma mockups using React and styled-components.
Experience: Worked closely with the design team at PixelPerfect Co. to build and maintain their component library.
Skills: React, Storybook, Figma, styled-components, Accessibility (A11y)
`,
    reason: `Maria's unique blend of design and engineering skills is very valuable. She is ranked #5 because the role is more engineering-focused, but her expertise in component libraries is a significant plus.`,
    overallAssessment: "Excellent frontend specialist with a design eye. Her backend skills are non-existent, making her a less-than-ideal fit for a full-stack role but perfect for a frontend-focused team.",
    shortcomings: [
        { skill: "Backend Development (Node.js, Databases)", impact: "Completely unable to contribute to API development or database management.", mitigation: "This is a fundamental skill gap. If hired, the role expectations must be adjusted to be purely frontend-focused.", severity: "critical" }
    ]
  },
  {
    rank: 6,
    resume: `
Name: Kevin Lee
Summary: Mobile Developer with experience in React Native, transitioning to web development. Strong understanding of the React ecosystem and state management.
Experience: Built a cross-platform mobile app for a startup, reaching 50k downloads.
Skills: React Native, React, Redux, JavaScript, Firebase
`,
    reason: `Kevin's strong React background is transferable, but his primary experience is in mobile. He's ranked #6 as he would have a learning curve transitioning to web-specific technologies like Next.js.`,
    overallAssessment: "Strong React developer, but in a mobile context. The gaps are in web-specific performance optimization and browser APIs, which will require a focused learning effort.",
    shortcomings: [
        { skill: "Next.js & SSR", impact: "Will need to learn Server-Side Rendering concepts and the Next.js framework, potentially slowing initial feature delivery.", mitigation: "Provide a Next.js course and pair with an experienced web developer.", severity: "moderate" },
        { skill: "Web Performance Optimization", impact: "May not be familiar with web-specific performance metrics (e.g., Core Web Vitals) or optimization techniques (e.g., code splitting for web).", mitigation: "Training sessions on web performance and tooling.", severity: "moderate" }
    ]
  },
  {
    rank: 7,
    resume: `
Name: Olivia Martinez
Summary: Backend Engineer with expertise in Java and Spring Boot. Has some exposure to frontend development and is looking to transition into a full-stack role.
Experience: Maintained and scaled critical backend services for a large enterprise application.
Skills: Java, Spring Boot, SQL, REST APIs, Maven
`,
    reason: `Olivia has a very strong backend foundation but in a different tech stack (Java). Ranked #7 due to the significant ramp-up time required for our Node.js and React environment.`,
    overallAssessment: "A very experienced software engineer, but in a completely different ecosystem. The technology gap is the most critical issue and would require a significant investment in training.",
    shortcomings: [
        { skill: "JavaScript/TypeScript & Node.js", impact: "Core technology stack mismatch. Will have a steep learning curve and lower initial productivity.", mitigation: "A 3-6 month dedicated training plan and mentorship program. Not suitable for a role requiring immediate impact.", severity: "critical" },
        { skill: "React Frontend Framework", impact: "Cannot contribute to the frontend codebase without significant training.", mitigation: "Same as the backend skill gap; requires extensive training.", severity: "critical" }
    ]
  },
  {
    rank: 8,
    resume: `
Name: James Wilson
Summary: A Quality Assurance Engineer with a knack for automation using Cypress and Selenium. Has scripting experience with JavaScript and Python.
Experience: Implemented an end-to-end automated testing suite, reducing manual testing time by 60%.
Skills: Cypress, Selenium, JavaScript, Python, Jira, CI/CD
`,
    reason: `James has valuable automation skills and JavaScript knowledge, but lacks direct software development experience. Ranked #8 as this is a development role, not a QA role.`,
    overallAssessment: "A strong QA Automation Engineer, but not a software developer. The role and skills are fundamentally different. He lacks experience in building features and application architecture.",
    shortcomings: [
        { skill: "Software Application Architecture", impact: "Not experienced in designing or building software from the ground up.", mitigation: "This represents a career change, not a skill gap. Would need to be hired for a junior/apprentice developer role.", severity: "critical" },
        { skill: "Feature Development", impact: "Lacks experience in the full lifecycle of feature development, from requirements to deployment.", mitigation: "Same as above; requires a role transition.", severity: "high" }
    ]
  },
  {
    rank: 9,
    resume: `
Name: Fatima Al-Jamil
Summary: Project Manager with a technical background. Understands software development lifecycles and agile methodologies, but has not been hands-on coding for several years.
Experience: Successfully managed the delivery of three major software projects, on time and under budget.
Skills: Agile, Scrum, JIRA, Project Planning, Stakeholder Management
`,
    reason: `While Fatima has excellent project management skills, she does not meet the hands-on coding requirements for this role. She is ranked #9 for this reason.`,
    overallAssessment: "An excellent project manager, but not a fit for an individual contributor engineering role. The lack of recent hands-on coding is a critical gap.",
    shortcomings: [
        { skill: "Current Hands-On Coding", impact: "Unable to contribute to the codebase directly.", mitigation: "Not a fit for this role. Would be a great fit for a Project or Program Manager position.", severity: "critical" }
    ]
  },
  {
    rank: 10,
    resume: `
Name: Tom Nguyen
Summary: Wordpress Developer with extensive experience in PHP and customizing themes and plugins. Basic knowledge of JavaScript and jQuery.
Experience: Built and maintained dozens of websites for small to medium-sized businesses.
Skills: PHP, WordPress, MySQL, jQuery, HTML, CSS
`,
    reason: `Tom's experience is in a completely different technology stack (PHP/WordPress) from what is required for the role. He is ranked #10 as his skills are not a direct match.`,
    overallAssessment: "Experienced web developer, but in a technology stack that has very little overlap with our needs. The transition would be difficult and long.",
    shortcomings: [
        { skill: "Modern JavaScript Frameworks (React)", impact: "Core skill gap. Would need to learn React from the ground up.", mitigation: "Extensive training would be required, making him a high-risk hire for a non-junior role.", severity: "critical" },
        { skill: "API-driven Development", impact: "Experience is primarily in a monolithic CMS (WordPress), not in building/consuming APIs for a SPA.", mitigation: "Would require a fundamental shift in development mindset.", severity: "high" }
    ]
  }
];


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
    
    if(!isRefinement) {
      setGeneratedPosting('');
    }

    try {
      const userId = 'anonymous-user'; 
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

    try {
        const newPosting: AppJobPosting = {
            id: `job-${Date.now()}`, // Simple unique ID for demo
            userProfileId: userId,
            jobTitle: formData.jobTitle || 'Untitled Job',
            companyName: formData.companyName || 'Untitled Company',
            location: formData.location || 'Remote',
            description: generatedPosting.split('\n')[0], // Use first line as short desc
            jobPostingText: generatedPosting,
            status: 'active',
            createdAt: new Date(),
            expiresAt: null,
        };
        
        onJobSaved(newPosting);
        
        toast({
          title: "Job Posting Saved!",
          description: "Your new job posting has been created.",
        });

    } catch (error) {
        console.error("Error creating job posting: ", error);
        toast({
            variant: "destructive",
            title: "Save Failed",
            description: "Could not create the job posting.",
        });
    } finally {
        setSaving(false);
    }
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
          <Label htmlFor="description">Company &amp; Role Description</Label>
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

function ShortcomingAnalysis({ analysis }: { analysis: Pick<AnalyzeResumeShortcomingsOutput, 'shortcomings' | 'overallAssessment'> }) {

  const getSeverityBadge = (severity: 'critical' | 'high' | 'moderate' | 'low') => {
    switch(severity) {
      case 'critical': return <Badge variant="destructive">Critical</Badge>;
      case 'high': return <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-500/80">High</Badge>;
      case 'moderate': return <Badge variant="secondary" className="bg-yellow-400 text-black hover:bg-yellow-400/80">Moderate</Badge>;
      case 'low': return <Badge variant="secondary" className="bg-green-400 text-black hover:bg-green-400/80">Low</Badge>;
      default: return <Badge variant="outline">{severity}</Badge>;
    }
  }

  return (
    <div className="mt-4 rounded-md border bg-card/50 p-4">
      <div className="space-y-4">
        <h4 className="font-semibold">Gap Analysis</h4>
        <div className="space-y-2">
          <h5 className="font-medium text-sm">Overall Assessment</h5>
          <p className="text-sm text-muted-foreground">{analysis.overallAssessment}</p>
        </div>
          {analysis.shortcomings.length > 0 && (
            <div className="space-y-2">
            <h5 className="font-medium text-sm">Identified Shortcomings</h5>
              <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
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
    </div>
  )
}

function ResumeRanker({ jobPostings, onJobDelete, onJobUpdate }: { jobPostings: AppJobPosting[]; onJobDelete: (jobId: string) => void; onJobUpdate: (jobId: string, updates: Partial<Pick<AppJobPosting, 'status' | 'expiresAt'>>) => void; }) {
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<AppJobPosting | null>(null);
  const [rankedResumes, setRankedResumes] = useState<RankResumesOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<Record<number, 'Accepted' | 'Rejected'>>({});
  const rankingImage = PlaceHolderImages.find(img => img.id === 'resume-ranking');
  const { toast } = useToast();

  const handleRank = async (job: AppJobPosting) => {
    if (job.status === 'inactive') return;
    setSelectedJob(job);
    setLoading(true);
    setError(null);
    setRankedResumes(null);
    setDecisions({});
    try {
      const result = await rankResumes({ jobDescription: job.jobPostingText });
      setRankedResumes(result.length > 0 ? result : demoRankedResumes); // Fallback to demo data
    } catch (e: any) {
      console.error(e);
      // Fallback to demo data on error for a better demo experience
      setRankedResumes(demoRankedResumes);
      setError(e.message || "Failed to rank resumes. Showing demo data.");
    } finally {
        setLoading(false);
    }
  };

  const handleDecision = (rank: number, candidateName: string, decision: 'Accepted' | 'Rejected') => {
    setDecisions(prev => ({ ...prev, [rank]: decision }));
    toast({
      title: `Candidate ${decision}`,
      description: `${candidateName} has been ${decision.toLowerCase()}.`,
    });
  };

  const handleDelete = (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    onJobDelete(jobId);
  }

  const handleStatusChange = (jobId: string, newStatus: boolean) => {
    onJobUpdate(jobId, { status: newStatus ? 'active' : 'inactive' });
  };
  
  const handleDateChange = (jobId: string, date: Date | undefined) => {
      onJobUpdate(jobId, { expiresAt: date || undefined });
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
                      <CardDescription className="mt-1 line-clamp-2">{job.description}</CardDescription>
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
                          Deactivate
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
              {rankedResumes.map(item => {
                const candidateName = item.resume.match(/Name: (.*)/)?.[1] || 'Unknown Candidate';
                const decision = decisions[item.rank];
                return (
                  <Collapsible key={item.rank} asChild>
                    <Card className={cn("p-4 transition-all",
                      decision === 'Accepted' && 'border-2 border-green-500',
                      decision === 'Rejected' && 'border-2 border-destructive'
                    )}>
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg flex-shrink-0">{item.rank}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold">Reasoning for Rank</h4>
                          <p className="text-sm text-muted-foreground mb-2">{item.reason}</p>
                          
                          <div className="p-4 border rounded-md bg-muted/20">
                            <h5 className="font-medium mb-2">Resume Snippet</h5>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">{item.resume}</p>
                          </div>
    
                          <CollapsibleContent className="collapsible-content">
                            <ShortcomingAnalysis analysis={{ shortcomings: item.shortcomings, overallAssessment: item.overallAssessment }} />
                          </CollapsibleContent>
    
                          <div className="flex flex-wrap gap-2 mt-4">
                              <CollapsibleTrigger asChild>
                                  <Button variant="outline" size="sm">
                                      <ChevronsUpDown className="mr-2 h-4 w-4" />
                                      Show Gap Analysis
                                  </Button>
                              </CollapsibleTrigger>
                            {!decision && (
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleDecision(item.rank, candidateName, 'Accepted')} className="bg-green-600 hover:bg-green-700">
                                  <Check className="mr-2 h-4 w-4" />
                                  Accept
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDecision(item.rank, candidateName, 'Rejected')}>
                                  <X className="mr-2 h-4 w-4" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Collapsible>
              )})}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PreviousPostings({ jobPostings, onDelete }: { jobPostings: AppJobPosting[], onDelete: (id: string) => void }) {

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Previous Job Postings</CardTitle>
        <CardDescription>View and manage your previously generated job postings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {jobPostings.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            <FileText className="mx-auto h-12 w-12" />
            <p className="mt-4">You haven't generated any job postings yet.</p>
          </div>
        )}
        {jobPostings.length > 0 && (
          <div className="space-y-4">
            {jobPostings.map((posting) => (
              <Card key={posting.id} className="p-4">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                       <h4 className="font-semibold text-lg">{posting.jobTitle}</h4>
                       <Badge variant={posting.status === 'active' ? 'default' : 'secondary'}>{posting.status}</Badge>
                    </div>
                     <p className="text-sm text-muted-foreground">
                        at {posting.companyName} &bull; Created on {format(new Date(posting.createdAt), "PPP")}
                    </p>
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
  const [activeTab, setActiveTab] = useState("generator");
  const { jobs, addJob, updateJob, deleteJob } = useJobs();
  const { toast } = useToast();

  const handleJobSaved = (newPosting: AppJobPosting) => {
    addJob(newPosting);
    toast({ title: "Job Saved", description: "Job posting saved and will appear in the lists."});
    setActiveTab('ranker');
  };

  const handleJobUpdate = (jobId: string, updates: Partial<AppJobPosting>) => {
      updateJob(jobId, updates);
      toast({ title: "Job Updated", description: "The job posting status has been updated." });
  }

  const handleJobDelete = (jobId: string) => {
    deleteJob(jobId);
    toast({ title: "Job Deleted", description: "The job posting has been permanently removed." });
  };
  
  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3">
          <TabsTrigger value="generator">Generator</TabsTrigger>
          <TabsTrigger value="ranker">Resume Ranker</TabsTrigger>
          <TabsTrigger value="previous">Previous Postings</TabsTrigger>
        </TabsList>
        <TabsContent value="generator" className="mt-4">
          <JobPostingGenerator onJobSaved={handleJobSaved} />
        </TabsContent>
        <TabsContent value="ranker" className="mt-4">
          <ResumeRanker 
            jobPostings={jobs}
            onJobDelete={handleJobDelete} 
            onJobUpdate={handleJobUpdate} 
          />
        </TabsContent>
        <TabsContent value="previous" className="mt-4">
          <PreviousPostings 
            jobPostings={jobs}
            onDelete={handleJobDelete}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
