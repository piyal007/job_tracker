import { Job, JobStatus } from '@/types';

export const demoJobs: Job[] = [
    {
        id: '1',
        title: 'Frontend Developer',
        company: 'TechCorp',
        location: 'San Francisco, CA',
        salary: '$100k - $130k',
        status: 'interview',
        notes: 'Second round interview scheduled for next week',
        date: new Date('2024-01-15').toISOString(),
        jobNature: 'Full time',
        jobType: 'Remote',
        jobLink: 'https://example.com/job1',
        email: 'Sent',
        comments: 'Great company culture, flexible hours'
    },
    {
        id: '2',
        title: 'Senior React Developer',
        company: 'StartupXYZ',
        location: 'New York, NY',
        salary: '$120k - $150k',
        status: 'applied',
        notes: 'Applied through LinkedIn',
        date: new Date('2024-01-20').toISOString(),
        jobNature: 'Full time',
        jobType: 'Hybrid',
        jobLink: 'https://example.com/job2',
        email: 'Not Yet',
        comments: 'Exciting startup with good funding'
    },
    {
        id: '3',
        title: 'Full Stack Engineer',
        company: 'BigTech Inc',
        location: 'Seattle, WA',
        salary: '$140k - $180k',
        status: 'screening',
        notes: 'Phone screening completed, waiting for feedback',
        date: new Date('2024-01-10').toISOString(),
        jobNature: 'Full time',
        jobType: 'Onsite',
        jobLink: 'https://example.com/job3',
        email: 'Responded',
        comments: 'Large team, lots of growth opportunities'
    }
];

export const statusColors: Record<JobStatus, string> = {
    applied: 'bg-blue-100 text-blue-800',
    screening: 'bg-yellow-100 text-yellow-800',
    interview: 'bg-purple-100 text-purple-800',
    offer: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
};
