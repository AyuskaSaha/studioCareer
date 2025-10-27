'use server';

/**
 * @fileOverview Ranks resumes based on job description and provides reasons for the ranking.
 *
 * - rankResumes - Ranks resumes and provides reasons for the ranking.
 * - RankResumesInput - The input type for the rankResumes function.
 * - RankResumesOutput - The return type for the rankResumes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { getAllResumesTool } from '@/ai/tools/resume-retrieval';

const RankResumesInputSchema = z.object({
  jobDescription: z.string().describe('The job description for which to rank the resumes.'),
});
export type RankResumesInput = z.infer<typeof RankResumesInputSchema>;

const RankResumesOutputSchema = z.array(
  z.object({
    resume: z.string().describe('The resume that was ranked.'),
    rank: z.number().describe('The rank of the resume (1-10, 1 being the best).'),
    reason: z.string().describe('The reason for the resume ranking.'),
  })
).describe('An array of ranked resumes with reasons.');
export type RankResumesOutput = z.infer<typeof RankResumesOutputSchema>;

export async function rankResumes(input: RankResumesInput): Promise<RankResumesOutput> {
  return rankResumesFlow(input);
}

const rankResumesPrompt = ai.definePrompt({
  name: 'rankResumesPrompt',
  input: {schema: RankResumesInputSchema},
  output: {schema: RankResumesOutputSchema},
  tools: [getAllResumesTool],
  prompt: `You are an expert resume ranker for employers. You will be given a job description.
Your task is to use the getAllResumes tool to fetch all available candidate resumes.
Then, you will rank the top 10 resumes from best to worst based on how well they match the job description.

Job Description: {{{jobDescription}}}

Output the results as a JSON array of the top 10 ranked resumes with reasons.
`,
});

const rankResumesFlow = ai.defineFlow(
  {
    name: 'rankResumesFlow',
    inputSchema: RankResumesInputSchema,
    outputSchema: RankResumesOutputSchema,
  },
  async input => {
    const {output} = await rankResumesPrompt(input);
    return output!;
  }
);