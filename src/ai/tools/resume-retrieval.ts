'use server';
/**
 * @fileOverview A tool for retrieving all resumes from the database.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { initializeServerFirebase } from '@/firebase/server';
import { collection, getDocs } from 'firebase/firestore';

const GetAllResumesOutputSchema = z.array(z.string().describe("The text content of a single resume."));

// A local copy of the demo data from the UI to use as a fallback.
const demoRankedResumesForTool = [
    {
      resume: `
Name: Elena Rodriguez
Summary: Senior Frontend Engineer with 8+ years of experience crafting beautiful, high-performance user interfaces for SaaS platforms. Expert in React, TypeScript, and Next.js. Passionate about design systems and component-driven development.
Experience: Led the migration of a monolithic frontend to a micro-frontend architecture at ScaleUp Inc., improving deployment frequency by 300%.
Skills: React, TypeScript, Next.js, GraphQL, Web Performance, Design Systems, CI/CD
`,
    },
    {
      resume: `
Name: Ben Carter
Summary: A proactive Full-Stack Developer with a strong focus on backend systems using Node.js and GraphQL. Skilled in building scalable APIs and working in agile environments.
Experience: Developed a real-time data processing pipeline at Innovate LLC, reducing latency by 40%.
Skills: Node.js, GraphQL, TypeScript, PostgreSQL, Docker, AWS, Microservices
`,
    },
    {
      resume: `
Name: Saniya Khan
Summary: A detail-oriented Software Engineer with 5 years of experience, specializing in React and data visualization libraries like D3.js. Enjoys translating complex data into intuitive user interfaces.
Experience: Created an interactive analytics dashboard for a major fintech client, which was praised for its usability and performance.
Skills: JavaScript, React, D3.js, Redux, CSS-in-JS, SQL
`,
    },
    {
      resume: `
Name: David Chen
Summary: Recent computer science graduate with a passion for web development and cloud technologies. Completed internships focusing on React and Python (Django). Eager to learn and contribute to a fast-paced team.
Experience: Intern at Connectly, assisted in building new UI features and writing unit tests.
Skills: React, JavaScript, Python, Django, HTML/CSS, Git
`,
    },
    {
      resume: `
Name: Maria Garcia
Summary: UX/UI Engineer who bridges the gap between design and development. Proficient in creating pixel-perfect interfaces from Figma mockups using React and styled-components.
Experience: Worked closely with the design team at PixelPerfect Co. to build and maintain their component library.
Skills: React, Storybook, Figma, styled-components, Accessibility (A11y)
`,
    },
    {
      resume: `
Name: Kevin Lee
Summary: Mobile Developer with experience in React Native, transitioning to web development. Strong understanding of the React ecosystem and state management.
Experience: Built a cross-platform mobile app for a startup, reaching 50k downloads.
Skills: React Native, React, Redux, JavaScript, Firebase
`,
    },
    {
      resume: `
Name: Olivia Martinez
Summary: Backend Engineer with expertise in Java and Spring Boot. Has some exposure to frontend development and is looking to transition into a full-stack role.
Experience: Maintained and scaled critical backend services for a large enterprise application.
Skills: Java, Spring Boot, SQL, REST APIs, Maven
`,
    },
    {
      resume: `
Name: James Wilson
Summary: A Quality Assurance Engineer with a knack for automation using Cypress and Selenium. Has scripting experience with JavaScript and Python.
Experience: Implemented an end-to-end automated testing suite, reducing manual testing time by 60%.
Skills: Cypress, Selenium, JavaScript, Python, Jira, CI/CD
`,
    },
    {
      resume: `
Name: Fatima Al-Jamil
Summary: Project Manager with a technical background. Understands software development lifecycles and agile methodologies, but has not been hands-on coding for several years.
Experience: Successfully managed the delivery of three major software projects, on time and under budget.
Skills: Agile, Scrum, JIRA, Project Planning, Stakeholder Management
`,
    },
    {
      resume: `
Name: Tom Nguyen
Summary: Wordpress Developer with extensive experience in PHP and customizing themes and plugins. Basic knowledge of JavaScript and jQuery.
Experience: Built and maintained dozens of websites for small to medium-sized businesses.
Skills: PHP, WordPress, MySQL, jQuery, HTML, CSS
`,
    }
  ];


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
        console.log("No resumes found in Firestore, returning all 10 default sample resumes.");
        // CRITICAL FIX: Return all 10 demo resume texts.
        return demoRankedResumesForTool.map(r => r.resume);
      }
      return resumeList;
    } catch (e) {
      console.error("Error fetching resumes from Firestore:", e);
      // Return a default resume on error to allow the demo to continue.
       console.log("Error fetching resumes, returning all 10 default sample resumes.");
       return demoRankedResumesForTool.map(r => r.resume);
    }
  }
);
