'use server';
/**
 * @fileOverview A tool for retrieving all resumes from the database.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { initializeServerFirebase } from '@/firebase/server';
import { collection, getDocs } from 'firebase/firestore';

const GetAllResumesOutputSchema = z.array(z.string().describe("The text content of a single resume."));

// NOTE: This tool is currently not used in the demo version of the resume ranker.
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
      return resumeList;
    } catch (e) {
      console.error("Error fetching resumes from Firestore:", e);
      // In a real-world scenario, you might want to handle this more gracefully.
      // For the demo, we can return an empty array or throw the error.
      return [];
    }
  }
);
