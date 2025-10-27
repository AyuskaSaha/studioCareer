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

// Sample resumes for demo purposes
const sampleResumes = [
  `
    Name: Alice Anderson
    Summary: A highly motivated software engineer with 5+ years of experience in full-stack development, specializing in React and Node.js.
    Experience: Led a team to develop a new e-commerce platform, increasing sales by 20%.
    Skills: JavaScript, React, Node.js, TypeScript, SQL, Docker, GraphQL, Next.js
  `,
  `
    Name: Bob Brown
    Summary: Experienced project manager with a decade of experience in the tech industry, skilled in Agile methodologies.
    Experience: Managed the release of three major software products, consistently delivering on time and under budget.
    Skills: Project Management, Agile, Scrum, JIRA, Confluence, Risk Management
  `,
  `
    Name: Carol White
    Summary: Junior frontend developer passionate about creating beautiful and intuitive user interfaces.
    Experience: Interned at a startup, where I helped build their marketing website using React and Tailwind CSS.
    Skills: HTML, CSS, JavaScript, React, Tailwind CSS, Figma
  `,
  `
    Name: David Green
    Summary: Senior backend engineer with expertise in distributed systems and cloud architecture.
    Experience: Designed and implemented a microservices architecture on AWS, improving system scalability and reliability.
    Skills: Java, Python, Go, Microservices, AWS, Kubernetes, Terraform
  `,
  `
    Name: Emily Black
    Summary: Data Scientist with a knack for turning complex data into actionable insights.
    Experience: Developed a machine learning model to predict customer churn, which was 85% accurate.
    Skills: Python, R, SQL, Pandas, Scikit-learn, TensorFlow, Machine Learning
  `,
];


const RankResumesInputSchema = z.object({
  jobDescription: z.string().describe('The job description for which to rank the resumes.'),
  resumes: z.array(z.string()).describe('An array of resume texts to be ranked.'),
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

export async function rankResumes(input: { jobDescription: string }): Promise<RankResumesOutput> {
  const rankerInput = {
    jobDescription: input.jobDescription,
    resumes: sampleResumes,
  };
  return rankResumesFlow(rankerInput);
}

const rankResumesPrompt = ai.definePrompt({
  name: 'rankResumesPrompt',
  input: {schema: RankResumesInputSchema},
  output: {schema: RankResumesOutputSchema},
  prompt: `You are an expert resume ranker for employers. You will be given a job description and a list of resumes.
Your task is to rank the resumes from best to worst based on how well they match the job description.
Only return the top 3 resumes.

Job Description: {{{jobDescription}}}

Resumes:
{{#each resumes}}
---
{{{this}}}
---
{{/each}}

Output the results as a JSON array of the top 3 ranked resumes with reasons.
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
