'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

// This is the shape of a job posting object used throughout the app
export type AppJobPosting = {
  id: string;
  userProfileId: string;
  jobTitle: string;
  companyName: string;
  description: string;
  jobPostingText: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  expiresAt?: Date | null;
  location?: string;
};

// The initial set of jobs for the demo
const initialJobs: AppJobPosting[] = [
  { 
    id: '1', 
    userProfileId: 'mock-user', 
    jobTitle: 'Senior Frontend Developer', 
    companyName: 'Acme Inc.', 
    location: 'Remote',
    description: 'Lead our frontend team.', 
    jobPostingText: 'Full job text here for Senior Frontend Developer at Acme Inc. We are looking for an experienced developer to lead our frontend team. You will be responsible for building and maintaining our web applications, mentoring junior developers, and working with the design team to create beautiful user experiences.', 
    status: 'active', 
    createdAt: new Date(), 
    expiresAt: new Date(new Date().setDate(new Date().getDate() + 30)) 
  },
  { 
    id: '2', 
    userProfileId: 'mock-user', 
    jobTitle: 'Backend Engineer', 
    companyName: 'Innovate LLC', 
    location: 'New York, NY',
    description: 'Work on our core API.', 
    jobPostingText: 'Full job text here for Backend Engineer at Innovate LLC. We are looking for a skilled backend engineer to join our team. You will be responsible for designing, developing, and maintaining our core API. You should have experience with Node.js, Express, and databases like PostgreSQL or MongoDB.', 
    status: 'inactive', 
    createdAt: new Date(new Date().setDate(new Date().getDate() - 10)), 
    expiresAt: null 
  },
];


// Define the shape of the context
interface JobContextType {
  jobs: AppJobPosting[];
  addJob: (newJob: AppJobPosting) => void;
  updateJob: (jobId: string, updates: Partial<AppJobPosting>) => void;
  deleteJob: (jobId: string) => void;
}

// Create the context
const JobContext = createContext<JobContextType | undefined>(undefined);

// Create the provider component
export const JobProvider = ({ children }: { children: ReactNode }) => {
  const [jobs, setJobs] = useState<AppJobPosting[]>(initialJobs);

  const addJob = useCallback((newJob: AppJobPosting) => {
    setJobs(prevJobs => [newJob, ...prevJobs]);
  }, []);
  
  const updateJob = useCallback((jobId: string, updates: Partial<AppJobPosting>) => {
    setJobs(prevJobs => prevJobs.map(job => (job.id === jobId ? { ...job, ...updates } : job)));
  }, []);

  const deleteJob = useCallback((jobId: string) => {
    setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
  }, []);

  return (
    <JobContext.Provider value={{ jobs, addJob, updateJob, deleteJob }}>
      {children}
    </JobContext.Provider>
  );
};

// Create a custom hook to use the context
export const useJobs = () => {
  const context = useContext(JobContext);
  if (context === undefined) {
    throw new Error('useJobs must be used within a JobProvider');
  }
  return context;
};
