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
import { addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

const JobPostingInputSchema = z.object({
  jobTitle: z.string().describe('The title of the job.'),
  companyName: z.string().describe('The name of the company.'),
  location: z.string().describe('The location of the job (e.g., "San Francisco, CA", "Remote").'),
  salaryRange: z.string().optional().describe('The salary range for the position.'),
  jobType: z.enum(['Full-time', 'Part-time', 'Contract', 'Internship']).describe('The type of employment.'),
  description: z.string().describe('A general description of the company and the role.'),
  responsibilities: z.string().describe('A list or description of the job responsibilities.'),
  mustHaveSkills: z.string().describe('A comma-separated list of essential skills.'),
  niceToHaveSkills: z.string().optional().describe('A comma-separated list of skills that are nice to have.'),
  userProfileId: z.string().describe('The ID of the user creating the job posting.'),
});

export type JobPostingInput = z.infer<typeof JobPostingInputSchema>;

const JobPostingOutputSchema = z.object({
  jobPostingText: z.string().describe('The generated job posting text, formatted professionally with a timestamp.'),
});

export type JobPostingOutput = z.infer<typeof JobPostingOutputSchema>;

export async function generateJobPosting(input: JobPostingInput): Promise<JobPostingOutput> {
  return generateJobPostingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'jobPostingPrompt',
  input: {schema: JobPostingInputSchema},
  output: {schema: JobPostingOutputSchema},
  prompt: `You are an expert job posting writer. Generate a compelling, professional, and well-structured job posting based on the following details. Include today's date at the top of the posting.

Job Title: {{{jobTitle}}}
Company Name: {{{companyName}}}
Location: {{{location}}}
Job Type: {{{jobType}}}
{{#if salaryRange}}
Salary Range: {{{salaryRange}}}
{{/if}}

Company & Role Description:
{{{description}}}

Responsibilities:
{{{responsibilities}}}

Qualifications:
- Must-Have Skills: {{{mustHaveSkills}}}
{{#if niceToHaveSkills}}
- Nice-to-Have Skills: {{{niceToHaveSkills}}}
{{/if}}

Structure the output clearly with sections for Description, Responsibilities, and Qualifications. Ensure the tone is engaging for potential candidates.
`,
});

const generateJobPostingFlow = ai.defineFlow(
  {
    name: 'generateJobPostingFlow',
    inputSchema: JobPostingInputSchema,
    outputSchema: JobPostingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);

    const {firestore} = initializeFirebase();
    const jobPostingsCol = collection(firestore, 'jobPostings');

    const jobPostingData = {
        userProfileId: input.userProfileId,
        jobTitle: input.jobTitle,
        companyName: input.companyName,
        location: input.location,
        salaryRange: input.salaryRange,
        jobType: input.jobType,
        jobPostingText: `Posted on: ${new Date().toLocaleDateString()}\n\n${output!.jobPostingText}`,
        createdAt: serverTimestamp(),
        status: 'active'
    };
    
    addDocumentNonBlocking(jobPostingsCol, jobPostingData);

    return { jobPostingText: jobPostingData.jobPostingText };
  }
);
