'use server';
/**
 * @fileOverview A tool for retrieving all resumes from the database.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { initializeFirebase } from '@/firebase';
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
    const { firestore } = initializeFirebase();
    const resumesCol = collection(firestore, 'resumes');
    const resumeSnapshot = await getDocs(resumesCol);
    const resumeList = resumeSnapshot.docs.map(doc => doc.data().resumeText as string);
    console.log(`Found ${resumeList.length} resumes.`);
    return resumeList;
  }
);