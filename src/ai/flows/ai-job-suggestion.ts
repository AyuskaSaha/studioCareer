'use server';

/**
 * @fileOverview An AI job suggestion agent.
 *
 * - suggestJobs - A function that suggests jobs based on a user's skills and experience.
 * - SuggestJobsInput - The input type for the suggestJobs function.
 * - SuggestJobsOutput - The return type for the suggestJobs function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestJobsInputSchema = z.object({
  skills: z
    .string()
    .describe("A comma-separated list of the job seeker's skills."),
  experience: z
    .string()
    .describe(
      'A description of the job seeker\u2019s work experience and qualifications.'
    ),
  certificates: z
    .string()
    .describe(
      'A comma-separated list of the job seeker\u2019s certifications.'
    ),
});
export type SuggestJobsInput = z.infer<typeof SuggestJobsInputSchema>;

const SuggestedJobSchema = z.object({
  jobTitle: z.string().describe('The title of the suggested job.'),
  company: z.string().describe('The company offering the job.'),
  reason: z
    .string()
    .describe(
      'The AI\u2019s reasoning for suggesting this job to the user, based on their skills, experience, and certificates.'
    ),
});

const SuggestJobsOutputSchema = z.array(SuggestedJobSchema).describe('A list of suggested jobs with reasons.');
export type SuggestJobsOutput = z.infer<typeof SuggestJobsOutputSchema>;

export async function suggestJobs(input: SuggestJobsInput): Promise<SuggestJobsOutput> {
  return suggestJobsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestJobsPrompt',
  input: {schema: SuggestJobsInputSchema},
  output: {schema: SuggestJobsOutputSchema},
  prompt: `You are an AI job suggestion agent. A job seeker has provided the following information:

Skills: {{{skills}}}
Experience: {{{experience}}}
Certifications: {{{certificates}}}

Suggest jobs that are a good fit for their skills and experience, and explain why you think they're a good candidate for those jobs. Format each suggestion as a JSON object with 'jobTitle', 'company', and 'reason' fields.  Return a JSON array of these job suggestions. Limit suggestions to 3.

Ensure the suggestions are diverse and cover a range of potential roles.
`,
});

const suggestJobsFlow = ai.defineFlow(
  {
    name: 'suggestJobsFlow',
    inputSchema: SuggestJobsInputSchema,
    outputSchema: SuggestJobsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
