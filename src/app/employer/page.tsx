"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, UserCheck, Search } from 'lucide-react';

import { generateJobPosting, type JobPostingOutput } from '@/ai/flows/ai-job-posting-generator';
import { rankResumes, type RankResumesOutput } from '@/ai/flows/top-resume-ranking';
import { analyzeResumeShortcomings, type AnalyzeResumeShortcomingsOutput } from '@/ai/flows/resume-shortcoming-analysis';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { PlaceHolderImages } from '@/lib/placeholder-images';

function JobPostingGenerator() {
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState('');
  const [details, setDetails] = useState('');
  const [jobPosting, setJobPosting] = useState<JobPostingOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setJobPosting(null);
    try {
      const result = await generateJobPosting({ keywords, details });
      setJobPosting(result);
    } catch (e) {
      console.error(e);
      setError("Failed to generate job posting. Please try again.");
    }
    setLoading(false);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">AI Job Posting Generator</CardTitle>
        <CardDescription>Provide keywords and details, and let AI craft the perfect job posting.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="keywords">Keywords</Label>
          <Input id="keywords" placeholder="e.g., React, TypeScript, Node.js, Agile" value={keywords} onChange={e => setKeywords(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="details">Job Details</Label>
          <Textarea id="details" placeholder="Describe responsibilities, requirements, company culture, etc." className="min-h-[150px]" value={details} onChange={e => setDetails(e.target.value)} />
        </div>
        <Button onClick={handleGenerate} disabled={loading || !keywords || !details}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Generate Posting
        </Button>
        {loading && <p className="text-sm text-muted-foreground animate-pulse">AI is thinking...</p>}
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        {jobPosting && (
          <div className="space-y-2 pt-4">
            <Label className="font-semibold">Generated Job Posting</Label>
            <Textarea readOnly value={jobPosting.jobPosting} className="min-h-[300px] bg-muted/50 font-sans" />
            <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(jobPosting.jobPosting)}>Copy Text</Button>
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
    return null; // or a placeholder/spinner
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

export default function EmployerPage() {
  return (
    <div className="container mx-auto max-w-5xl py-8 px-4">
      <Tabs defaultValue="ranker" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ranker">Resume Ranker</TabsTrigger>
          <TabsTrigger value="generator">Job Posting Generator</TabsTrigger>
        </TabsList>
        <TabsContent value="ranker" className="mt-4">
          <ResumeRanker />
        </TabsContent>
        <TabsContent value="generator" className="mt-4">
          <JobPostingGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
}
