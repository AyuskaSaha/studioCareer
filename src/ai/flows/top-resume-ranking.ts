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

const RankResumesInputSchema = z.object({
  jobDescription: z.string().describe('The job description for which to rank the resumes.'),
  resumes: z.array(
    z.string().describe('An array of resumes in plain text format.')
  ).describe('The resumes to rank.'),
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
  prompt: `You are an expert resume ranker for employers. You will receive a job description and an array of resumes.

You will rank the resumes from 1 to 10 (1 being the best) based on how well they match the job description.  You must rank ALL resumes provided. Provide a reason for each ranking.

Job Description: {{{jobDescription}}}

Resumes:
{{#each resumes}}
- {{{this}}}
{{/each}}

Output the results as a JSON array of ranked resumes with reasons.
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
