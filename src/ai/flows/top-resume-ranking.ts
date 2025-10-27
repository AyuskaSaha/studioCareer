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
import { getAllResumesTool } from '../tools/resume-retrieval';


const RankResumesInputSchema = z.object({
  jobDescription: z.string().describe('The job description for which to rank the resumes.'),
});
export type RankResumesInput = z.infer<typeof RankResumesInputSchema>;

const RankResumesOutputSchema = z.array(
  z.object({
    resume: z.string().describe('The resume that was ranked.'),
    rank: z.number().describe('The rank of the resume (1 being the best).'),
    reason: z.string().describe('The reason for the resume ranking.'),
  })
).describe('An array of ranked resumes with reasons.');
export type RankResumesOutput = z.infer<typeof RankResumesOutputSchema>;

// This function is the entry point for the UI. It calls the Genkit flow.
export async function rankResumes(input: RankResumesInput): Promise<RankResumesOutput> {
  return rankResumesFlow(input);
}

const rankResumesPrompt = ai.definePrompt({
  name: 'rankResumesPrompt',
  input: {schema: RankResumesInputSchema},
  output: {schema: RankResumesOutputSchema},
  tools: [getAllResumesTool],
  prompt: `You are an expert resume ranker for employers. You will be given a job description.
Your task is to first use the 'getAllResumes' tool to retrieve all resumes from the database.
Then, rank the retrieved resumes from best to worst based on how well they match the job description.
Only return the top 3 resumes.

Job Description: {{{jobDescription}}}

Output the results as a JSON array of the top 3 ranked resumes with reasons for each ranking.
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

    // If the output is null or not an array, return an empty array to prevent errors.
    if (!output || !Array.isArray(output)) {
      return [];
    }

    // Ensure the output is sorted by rank, as the model may not always do it perfectly.
    const sortedOutput = output.sort((a, b) => a.rank - b.rank);
    return sortedOutput;
  }
);
