export type JobStatus = 'applied' | 'screening' | 'interview' | 'offer' | 'rejected';

export interface Job {
    id: string;
    title: string;
    company: string;
    location: string;
    salary: string;
    status: JobStatus;
    notes: string;
    date: string;
    jobNature: string;
    jobType: string;
    jobLink: string;
    email: string;
    comments: string;
}

export interface JobPortal {
    id: string;
    name: string;
    url: string;
    category: string;
}
