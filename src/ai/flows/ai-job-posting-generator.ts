'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating job postings based on employer-provided keywords and details.
 *
 * - generateJobPosting - A function that takes employer input and returns a generated job posting.
 * - JobPostingInput - The input type for the generateJobPosting function.
 * - JobPostingOutput - The return type for the generateJobPosting function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const JobPostingInputSchema = z.object({
  keywords: z
    .string()
    .describe('Keywords related to the job, e.g., React, Javascript, Agile.'),
  details: z.string().describe('Details about the job, such as responsibilities, requirements, and company culture.'),
});

export type JobPostingInput = z.infer<typeof JobPostingInputSchema>;

const JobPostingOutputSchema = z.object({
  jobPosting: z.string().describe('The generated job posting text.'),
});

export type JobPostingOutput = z.infer<typeof JobPostingOutputSchema>;

export async function generateJobPosting(input: JobPostingInput): Promise<JobPostingOutput> {
  return generateJobPostingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'jobPostingPrompt',
  input: {schema: JobPostingInputSchema},
  output: {schema: JobPostingOutputSchema},
  prompt: `You are an expert job posting writer. Generate a compelling job posting based on the following keywords and details:

Keywords: {{{keywords}}}
Details: {{{details}}}

Job Posting:`,
});

const generateJobPostingFlow = ai.defineFlow(
  {
    name: 'generateJobPostingFlow',
    inputSchema: JobPostingInputSchema,
    outputSchema: JobPostingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
