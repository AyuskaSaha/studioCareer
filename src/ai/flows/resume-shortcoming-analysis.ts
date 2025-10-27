'use server';

/**
 * @fileOverview Analyzes resumes to identify shortcomings and suggest how the company can address them.
 *
 * - analyzeResumeShortcomings - A function that analyzes a resume and provides insights on potential shortcomings.
 * - AnalyzeResumeShortcomingsInput - The input type for the analyzeResumeShortcomings function.
 * - AnalyzeResumeShortcomingsOutput - The return type for the analyzeResumeShortcomingsOutput function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeResumeShortcomingsInputSchema = z.object({
  resumeText: z.string().describe('The text content of the resume to analyze.'),
  jobDescription: z.string().describe('The job description for which the resume is being evaluated.'),
});

export type AnalyzeResumeShortcomingsInput = z.infer<typeof AnalyzeResumeShortcomingsInputSchema>;

const AnalyzeResumeShortcomingsOutputSchema = z.object({
  shortcomings: z.array(
    z.object({
      skill: z.string().describe('The missing or weak skill.'),
      impact: z.string().describe('The potential impact of this shortcoming on job performance.'),
      mitigation: z
        .string()
        .describe('Suggestions on how the company can mitigate this shortcoming (training, mentoring, etc.).'),
      severity: z.enum(['critical', 'high', 'moderate', 'low']).describe('The severity level of the shortcoming'),
    })
  ).describe('An array of identified shortcomings in the resume.'),
  overallAssessment: z
    .string()
    .describe('An overall assessment of the candidate, considering their strengths and weaknesses.'),
});

export type AnalyzeResumeShortcomingsOutput = z.infer<typeof AnalyzeResumeShortcomingsOutputSchema>;

export async function analyzeResumeShortcomings(input: AnalyzeResumeShortcomingsInput): Promise<AnalyzeResumeShortcomingsOutput> {
  return analyzeResumeShortcomingsFlow(input);
}

const analyzeResumeShortcomingsPrompt = ai.definePrompt({
  name: 'analyzeResumeShortcomingsPrompt',
  input: {schema: AnalyzeResumeShortcomingsInputSchema},
  output: {schema: AnalyzeResumeShortcomingsOutputSchema},
  prompt: `You are an AI resume analyst, tasked with identifying shortcomings in a candidate's resume and suggesting how the company can address them. Consider the job description carefully.

Job Description: {{{jobDescription}}}

Resume Text: {{{resumeText}}}

Analyze the resume and identify any missing skills, experiences, or qualifications that might hinder the candidate's performance in the role. For each shortcoming, assess its potential impact and suggest specific actions the company can take to mitigate it (e.g., training programs, mentoring, on-the-job learning).
Also add the severity of the shortcoming as critical, high, moderate, or low.

Ensure the output is structured according to the AnalyzeResumeShortcomingsOutputSchema, focusing on actionable insights for the employer.

Avoid generic or obvious recommendations. Focus on providing insightful and practical advice tailored to the specific job description and candidate profile.
`,
});

const analyzeResumeShortcomingsFlow = ai.defineFlow(
  {
    name: 'analyzeResumeShortcomingsFlow',
    inputSchema: AnalyzeResumeShortcomingsInputSchema,
    outputSchema: AnalyzeResumeShortcomingsOutputSchema,
  },
  async input => {
    const {output} = await analyzeResumeShortcomingsPrompt(input);
    return output!;
  }
);
