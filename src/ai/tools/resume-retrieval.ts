'use server';
/**
 * @fileOverview A tool for retrieving all resumes from the database.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { initializeServerFirebase } from '@/firebase/server';
import { collection, getDocs } from 'firebase/firestore';

const GetAllResumesOutputSchema = z.array(z.string().describe("The text content of a single resume."));

export const getAllResumesTool = ai.defineTool(
  {
    name: 'getAllResumes',
    description: 'Returns all resumes currently stored in the database.',
    inputSchema: z.object({}),
    outputSchema: GetAllResumesOutputSchema,
  },
  async () => {
    console.log('Fetching all resumes from Firestore...');
    try {
      const { firestore } = initializeServerFirebase();
      const resumesCol = collection(firestore, 'resumes');
      const resumeSnapshot = await getDocs(resumesCol);
      const resumeList = resumeSnapshot.docs.map(doc => doc.data().resumeText as string);
      console.log(`Found ${resumeList.length} resumes.`);
      // If no resumes are found, return a default sample resume to ensure ranking can proceed.
      if (resumeList.length === 0) {
        console.log("No resumes found in Firestore, returning a default sample resume.");
        return [
          `
            Name: John Doe (Sample)
            Summary: A highly motivated software engineer with 5+ years of experience in full-stack development, specializing in React and Node.js.
            Experience: Led a team to develop a new e-commerce platform, increasing sales by 20%.
            Skills: JavaScript, React, Node.js, TypeScript, SQL, Docker, GraphQL, Next.js
          `
        ];
      }
      return resumeList;
    } catch (e) {
      console.error("Error fetching resumes from Firestore:", e);
      // Return a default resume on error to allow the demo to continue.
      return [
        `
          Name: Error Fallback (Sample)
          Summary: Could not fetch resumes from database.
          Experience: N/A
          Skills: N/A
        `
      ];
    }
  }
);
