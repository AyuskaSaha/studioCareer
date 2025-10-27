// This file uses server-side code.
'use server';

/**
 * @fileOverview Provides AI-powered insights and suggestions for a resume based on a job description.
 *
 * - analyzeResume - Analyzes a resume and provides insights and suggestions.
 * - AnalyzeResumeInput - The input type for the analyzeResume function.
 * - AnalyzeResumeOutput - The return type for the analyzeResume function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeResumeInputSchema = z.object({
  resumeText: z.string().describe('The text content of the resume.'),
  jobDescription: z.string().describe('The job description for which the resume is being analyzed.'),
  companyDetails: z.string().optional().describe('Details about the company (optional).'),
});

export type AnalyzeResumeInput = z.infer<typeof AnalyzeResumeInputSchema>;

const AnalyzeResumeOutputSchema = z.object({
  insights: z.string().describe('AI-generated insights and suggestions for improving the resume.'),
  atsScore: z.number().describe('An estimated Applicant Tracking System (ATS) score for the resume (0-100).'),
});

export type AnalyzeResumeOutput = z.infer<typeof AnalyzeResumeOutputSchema>;

export async function analyzeResume(input: AnalyzeResumeInput): Promise<AnalyzeResumeOutput> {
  return analyzeResumeFlow(input);
}

const analyzeResumePrompt = ai.definePrompt({
  name: 'analyzeResumePrompt',
  input: {schema: AnalyzeResumeInputSchema},
  output: {schema: AnalyzeResumeOutputSchema},
  prompt: `You are a resume expert specializing in providing insights for job seekers.

You will analyze the resume and provide actionable suggestions to improve its chances of getting past Applicant Tracking Systems (ATS) and impress recruiters, and determine an ATS score between 0 and 100.

Resume:
{{resumeText}}

Job Description:
{{jobDescription}}

Company Details (Optional):
{{#if companyDetails}}
{{companyDetails}}
{{else}}
Not provided.
{{/if}}
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
