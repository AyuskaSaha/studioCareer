
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

const ShortcomingSchema = z.object({
  skill: z.string().describe('The missing or weak skill.'),
  impact: z.string().describe('The potential impact of this shortcoming on job performance.'),
  mitigation: z
    .string()
    .describe('Suggestions on how the company can mitigate this shortcoming (training, mentoring, etc.).'),
  severity: z.enum(['critical', 'high', 'moderate', 'low']).describe('The severity level of the shortcoming'),
});

const RankedResumeSchema = z.object({
    resume: z.string().describe('The resume that was ranked.'),
    rank: z.number().describe('The rank of the resume (1 being the best).'),
    reason: z.string().describe('The reason for the resume ranking.'),
    shortcomings: z.array(ShortcomingSchema).describe('An array of identified shortcomings in the resume.'),
    overallAssessment: z.string().describe('An overall assessment of the candidate, considering their strengths and weaknesses.'),
});

const RankResumesOutputSchema = z.array(RankedResumeSchema).describe('An array of ranked resumes with reasons and gap analysis.');

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
Then, for each retrieved resume, perform two actions:
1.  Rank the resume from best to worst based on how well they match the job description.
2.  Perform a detailed gap analysis (shortcoming analysis) for each resume against the job description. For each identified shortcoming, you must specify the skill, its impact, a mitigation strategy, and a severity ('critical', 'high', 'moderate', or 'low'). Also include an 'overallAssessment'.

Job Description: {{{jobDescription}}}

Return ONLY the top 10 resumes.
Output the results as a JSON array. Each element in the array must contain the resume text, its rank, the reason for the rank, and the detailed gap analysis results ('shortcomings' and 'overallAssessment').
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


    
