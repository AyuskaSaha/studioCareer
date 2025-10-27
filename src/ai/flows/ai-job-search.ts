'use server';
/**
 * @fileOverview This file defines a Genkit flow for searching for job listings.
 *
 * - searchJobs - A function that takes a search query and returns a list of job listings.
 * - SearchJobsInput - The input type for the searchJobs function.
 * - SearchJobsOutput - The return type for the searchJobs function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SearchJobsInputSchema = z.object({
  query: z.string().describe('The search query for jobs, e.g., "React developer in New York".'),
});
export type SearchJobsInput = z.infer<typeof SearchJobsInputSchema>;

const JobListingSchema = z.object({
  title: z.string().describe('The job title.'),
  company: z.string().describe('The company offering the job.'),
  location: z.string().describe('The location of the job.'),
  description: z.string().describe('A brief description of the job.'),
  applyUrl: z.string().url().describe('The URL to apply for the job.'),
});

const SearchJobsOutputSchema = z.array(JobListingSchema).describe('A list of found job listings.');
export type SearchJobsOutput = z.infer<typeof SearchJobsOutputSchema>;

export async function searchJobs(input: SearchJobsInput): Promise<SearchJobsOutput> {
  return searchJobsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'jobSearchPrompt',
  input: {schema: SearchJobsInputSchema},
  output: {schema: SearchJobsOutputSchema},
  prompt: `You are a helpful job search assistant. Your task is to find and return a list of 5 job listings based on the user's query. For each job, provide a title, company, location, a brief description, and a fictional application URL.

Query: {{{query}}}

Return the results as a JSON array of job listings.`,
});

const searchJobsFlow = ai.defineFlow(
  {
    name: 'searchJobsFlow',
    inputSchema: SearchJobsInputSchema,
    outputSchema: SearchJobsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
