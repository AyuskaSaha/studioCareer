'use server';

/**
 * @fileOverview Provides AI-powered insights and suggestions for a resume.
 *
 * - analyzeResume - Analyzes a resume and provides insights and suggestions. Can optionally be provided a job description for more specific feedback.
 * - AnalyzeResumeInput - The input type for the analyzeResume function.
 * - AnalyzeResumeOutput - The return type for the analyzeResume function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeResumeInputSchema = z.object({
  resumeText: z.string().describe('The text content of the resume.'),
  jobDescription: z.string().optional().describe('The job description for which the resume is being analyzed (optional).'),
  companyDetails: z.string().optional().describe('Details about the company (optional).'),
});

export type AnalyzeResumeInput = z.infer<typeof AnalyzeResumeInputSchema>;

const SectionAnalysisSchema = z.object({
    section: z.string().describe('The name of the resume section being analyzed (e.g., "Summary", "Experience", "Skills").'),
    score: z.number().min(0).max(100).describe('The score for this specific section, from 0 to 100.'),
    reasoning: z.string().describe('The reasoning behind the score for this section.'),
    suggestions: z.string().describe('Actionable suggestions to improve this section.'),
});

const AnalyzeResumeOutputSchema = z.object({
  overallScore: z.number().min(0).max(100).describe('An estimated overall Applicant Tracking System (ATS) score for the resume (0-100).'),
  overallSummary: z.string().describe('A brief, overall summary of the resume\'s strengths and weaknesses.'),
  sectionAnalyses: z.array(SectionAnalysisSchema).describe('A point-wise breakdown of each section of the resume with scores, reasoning, and suggestions.'),
});


export type AnalyzeResumeOutput = z.infer<typeof AnalyzeResumeOutputSchema>;

export async function analyzeResume(input: AnalyzeResumeInput): Promise<AnalyzeResumeOutput> {
  return analyzeResumeFlow(input);
}

const analyzeResumePrompt = ai.definePrompt({
  name: 'analyzeResumePrompt',
  input: {schema: AnalyzeResumeInputSchema},
  output: {schema: AnalyzeResumeOutputSchema},
  prompt: `You are a resume expert specializing in providing detailed, scorable insights for job seekers.

You will analyze the resume and provide actionable suggestions to improve its chances of getting past Applicant Tracking Systems (ATS) and impressing recruiters.

Your analysis MUST be structured as follows:
1.  **Overall Score**: An overall ATS score for the entire resume (0-100).
2.  **Overall Summary**: A brief, high-level summary of the candidate's profile.
3.  **Section-by-Section Analysis**: A point-wise breakdown of the key resume sections (e.g., Summary, Experience, Skills, Education). For EACH section, you must provide:
    - A `section` name.
    - A `score` for that section (0-100).
    - Clear `reasoning` for why you gave that score.
    - Concrete, actionable `suggestions` on how to improve the section and its score.

{{#if jobDescription}}
Tailor your entire analysis to the specific requirements of this job description:
{{jobDescription}}
{{/if}}

{{#if companyDetails}}
Also consider these company details in your analysis:
{{companyDetails}}
{{/if}}

Analyze this resume:
---
{{resumeText}}
---
`,
});

const analyzeResumeFlow = ai.defineFlow(
  {
    name: 'analyzeResumeFlow',
    inputSchema: AnalyzeResumeInputSchema,
    outputSchema: AnalyzeResumeOutputSchema,
  },
  async input => {
    const {output} = await analyzeResumePrompt(input);
    return output!;
  }
);
