'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Trash2, Edit, CalendarIcon, ChevronDown, Save, Database, LogOut } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { createPortal } from 'react-dom';
import toast, { Toaster } from 'react-hot-toast';
import ShareButton from '@/components/ShareButton';
import axios from 'axios';
import Swal from 'sweetalert2';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const ALLOWED_EMAIL = 'piyalsha007@gmail.com';

type JobStatus = 'applied' | 'screening' | 'interview' | 'offer' | 'rejected';

interface Job {
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

const demoJobs: Job[] = [
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface JobPortal {
    id: string;
    name: string;
    url: string;
    category: string;
}

export default function Dashboard() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'tracker' | 'portals'>('tracker');
    const [jobs, setJobs] = useState<Job[]>([]);
    const [portals, setPortals] = useState<JobPortal[]>([
        { id: '1', name: 'LinkedIn', url: 'https://www.linkedin.com/jobs', category: 'General' },
        { id: '2', name: 'Indeed', url: 'https://www.indeed.com', category: 'General' },
        { id: '3', name: 'Glassdoor', url: 'https://www.glassdoor.com', category: 'General' },
    ]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingJob, setEditingJob] = useState<Job | null>(null);
    const [editingCell, setEditingCell] = useState<{ jobId: string; field: keyof Job } | null>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const tableRef = useRef<HTMLDivElement>(null);

    // Auth check
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (!currentUser) {
                router.push('/');
            } else if (currentUser.email !== ALLOWED_EMAIL) {
                // Sign out unauthorized users
                await signOut(auth);
                toast.error('Unauthorized: Only piyalsha007@gmail.com is allowed');
                router.push('/');
            } else {
                setUser(currentUser);
            }
        });

        return () => unsubscribe();
    }, [router]);

    // Fetch jobs from API
    const fetchJobs = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/api/jobs`);
            setJobs(data.length > 0 ? data : demoJobs);
        } catch (error) {
            console.error('Failed to fetch jobs:', error);
            setJobs(demoJobs);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
        fetchPortals();
    }, []);

    const fetchPortals = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/api/portals`);
            if (data && data.length > 0) {
                setPortals(data);
            }
        } catch (error) {
            console.error('Failed to fetch portals:', error);
            // Keep default portals if API fails
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't scroll if user is editing a cell (input/select/textarea is focused)
            const activeElement = document.activeElement;
            const isEditing = activeElement?.tagName === 'INPUT' ||
                activeElement?.tagName === 'SELECT' ||
                activeElement?.tagName === 'TEXTAREA';

            if (!isEditing && tableRef.current && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
                const scrollAmount = 100;
                if (e.key === 'ArrowLeft') {
                    tableRef.current.scrollLeft -= scrollAmount;
                } else {
                    tableRef.current.scrollLeft += scrollAmount;
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);



    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newJob: Job = {
            id: editingJob?.id || Date.now().toString(),
            title: formData.get('title') as string,
            company: formData.get('company') as string,
            location: formData.get('location') as string,
            salary: formData.get('salary') as string,
            status: formData.get('status') as JobStatus,
            notes: formData.get('notes') as string,
            date: editingJob?.date || new Date().toISOString(),
            jobNature: formData.get('jobNature') as string,
            jobType: formData.get('jobType') as string,
            jobLink: formData.get('jobLink') as string,
            email: formData.get('email') as string,
            comments: formData.get('comments') as string,
        };

        if (editingJob) {
            setJobs(jobs.map(j => j.id === editingJob.id ? newJob : j));
        } else {
            setJobs([...jobs, newJob]);
        }

        setIsModalOpen(false);
        setEditingJob(null);
        e.currentTarget.reset();
    };

    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: 'Delete Job?',
            text: "This will remove the job from your tracker",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            setJobs(jobs.filter(j => j.id !== id));
            toast.success('🗑️ Deleted locally', {
                duration: 1500,
                position: 'bottom-right',
            });
        }
    };

    const handleEdit = (job: Job) => {
        setEditingJob(job);
        setIsModalOpen(true);
    };

    const handleCellUpdate = (jobId: string, field: keyof Job, value: string) => {
        const updatedJob = jobs.find(j => j.id === jobId);
        if (!updatedJob) return;

        const newJob = { ...updatedJob, [field]: value };
        setJobs(jobs.map(j => j.id === jobId ? newJob : j));
        setEditingCell(null);

        // Show local update toast
        toast.success('✏️ Updated locally', {
            duration: 1500,
            position: 'bottom-right',
        });
    };

    const handlePortalCellUpdate = (portalId: string, field: keyof JobPortal, value: string) => {
        const updatedPortal = portals.find(p => p.id === portalId);
        if (!updatedPortal) return;

        const newPortal = { ...updatedPortal, [field]: value };
        setPortals(portals.map(p => p.id === portalId ? newPortal : p));
        setEditingCell(null);

        toast.success('✏️ Updated locally', {
            duration: 1500,
            position: 'bottom-right',
        });
    };

    const EditablePortalCell = ({ portal, field, className }: { portal: JobPortal; field: keyof JobPortal; className: string }) => {
        const isEditing = editingCell?.jobId === portal.id && editingCell?.field === field;
        const value = portal[field] as string;

        if (isEditing) {
            return (
                <td className={className}>
                    <input
                        autoFocus
                        type="text"
                        defaultValue={value || ''}
                        onBlur={(e) => handlePortalCellUpdate(portal.id, field, e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handlePortalCellUpdate(portal.id, field, e.currentTarget.value);
                            if (e.key === 'Escape') setEditingCell(null);
                        }}
                        className="w-full px-2 py-1 border rounded"
                    />
                </td>
            );
        }

        return (
            <td className={className} onClick={() => setEditingCell({ jobId: portal.id, field: field as any })}>
                {field === 'url' && value ? (
                    <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block" onClick={(e) => e.stopPropagation()}>
                        {value}
                    </a>
                ) : (
                    value || '-'
                )}
            </td>
        );
    };

    const EditableCell = ({ job, field, className }: { job: Job; field: keyof Job; className: string }) => {
        const isEditing = editingCell?.jobId === job.id && editingCell?.field === field;
        const value = job[field] as string;
        const cellRef = useRef<HTMLTableCellElement>(null);
        const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });

        const getDropdownOptions = (field: keyof Job) => {
            switch (field) {
                case 'jobNature':
                    return ['Full time', 'Part time', 'Contract', 'Internship', 'Freelance'];
                case 'jobType':
                    return ['Onsite', 'Remote', 'Hybrid'];
                case 'status':
                    return ['applied', 'screening', 'interview', 'offer', 'rejected'];
                case 'email':
                    return ['Not Yet', 'Sent', 'No Response', 'Responded'];
                default:
                    return null;
            }
        };

        const getStatusColor = (field: keyof Job, value: string) => {
            if (field === 'status') {
                return statusColors[value as JobStatus];
            }
            if (field === 'jobNature') {
                return 'bg-green-100 text-green-800';
            }
            if (field === 'jobType') {
                return 'bg-blue-100 text-blue-800';
            }
            if (field === 'email') {
                if (value === 'Not Yet') return 'bg-red-100 text-red-800';
                if (value === 'Sent') return 'bg-yellow-100 text-yellow-800';
                if (value === 'No Response') return 'bg-red-100 text-red-800';
                if (value === 'Responded') return 'bg-green-100 text-green-800';
            }
            return '';
        };

        if (isEditing) {
            const dropdownOptions = getDropdownOptions(field);

            if (field === 'date') {
                useEffect(() => {
                    if (isEditing && cellRef.current) {
                        const rect = cellRef.current.getBoundingClientRect();
                        const calendarHeight = 350;
                        const calendarWidth = 300;

                        let top = rect.bottom + 5;
                        let left = rect.left;

                        // Adjust if calendar goes below viewport
                        if (top + calendarHeight > window.innerHeight) {
                            top = rect.top - calendarHeight - 5;
                        }

                        // Adjust if calendar goes beyond right edge
                        if (left + calendarWidth > window.innerWidth) {
                            left = window.innerWidth - calendarWidth - 20;
                        }

                        setCalendarPosition({ top, left });
                    }
                }, [isEditing]);

                return (
                    <>
                        <td ref={cellRef} className={className}>
                            <div className="text-sm text-gray-500">
                                {new Date(value).toLocaleDateString()}
                            </div>
                        </td>
                        {isEditing && typeof window !== 'undefined' && createPortal(
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setEditingCell(null)}
                                />
                                <div
                                    className="fixed z-50 bg-white border rounded-lg shadow-xl"
                                    style={{
                                        top: `${calendarPosition.top}px`,
                                        left: `${calendarPosition.left}px`
                                    }}
                                >
                                    <Calendar
                                        mode="single"
                                        selected={value ? new Date(value) : undefined}
                                        onSelect={(date) => {
                                            if (date) {
                                                handleCellUpdate(job.id, field, date.toISOString());
                                            }
                                        }}
                                    />
                                </div>
                            </>,
                            document.body
                        )}
                    </>
                );
            }

            if (dropdownOptions) {
                return (
                    <td className={className}>
                        <select
                            autoFocus
                            defaultValue={value}
                            onBlur={(e) => handleCellUpdate(job.id, field, e.target.value)}
                            onChange={(e) => handleCellUpdate(job.id, field, e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCellUpdate(job.id, field, e.currentTarget.value);
                                if (e.key === 'Escape') setEditingCell(null);
                            }}
                            className="w-full px-2 py-1 border rounded"
                        >
                            <option value="">-</option>
                            {dropdownOptions.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </td>
                );
            }

            return (
                <td className={className}>
                    <input
                        autoFocus
                        type="text"
                        defaultValue={value || ''}
                        onBlur={(e) => handleCellUpdate(job.id, field, e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCellUpdate(job.id, field, e.currentTarget.value);
                            if (e.key === 'Escape') setEditingCell(null);
                        }}
                        className="w-full px-2 py-1 border rounded"
                    />
                </td>
            );
        }

        const dropdownOptions = getDropdownOptions(field);
        const shouldShowBadge = dropdownOptions && value;
        const isLinkField = field === 'jobLink';

        return (
            <td
                className={`${className} ${isLinkField && isEditing ? 'w-96' : ''} transition-all duration-300 ease-in-out`}
                onClick={() => setEditingCell({ jobId: job.id, field })}
            >
                {shouldShowBadge ? (
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(field, value)} cursor-pointer`}>
                        {value}
                        <ChevronDown className="w-3 h-3" />
                    </span>
                ) : isLinkField && value ? (
                    <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block" onClick={(e) => e.stopPropagation()}>
                        {value}
                    </a>
                ) : field === 'date' ? (
                    new Date(value).toLocaleDateString()
                ) : (
                    value || '-'
                )}
            </td>
        );
    };

    const statusColors: Record<JobStatus, string> = {
        applied: 'bg-blue-100 text-blue-800',
        screening: 'bg-yellow-100 text-yellow-800',
        interview: 'bg-purple-100 text-purple-800',
        offer: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
    };

    return (
        <div className="h-screen bg-gray-50 p-8 overflow-hidden flex flex-col">
            <Toaster />

            {/* Tabs */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => setActiveTab('tracker')}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${activeTab === 'tracker'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                >
                    Job Tracker
                </button>
                <button
                    onClick={() => setActiveTab('portals')}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${activeTab === 'portals'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                >
                    Job Portals
                </button>
            </div>

            {activeTab === 'tracker' ? (
                <>
                    <div className="flex justify-end gap-3 mb-4">
                        <button
                            onClick={() => {
                                const newJob: Job = {
                                    id: Date.now().toString(),
                                    title: '',
                                    company: '',
                                    location: '',
                                    salary: '',
                                    status: 'applied',
                                    notes: '',
                                    date: new Date().toISOString(),
                                    jobNature: '',
                                    jobType: '',
                                    jobLink: '',
                                    email: '',
                                    comments: ''
                                };
                                setJobs([...jobs, newJob]);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" /> Add Job
                        </button>
                        <ShareButton />
                        <button
                            onClick={async () => {
                                await signOut(auth);
                                router.push('/');
                            }}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                        >
                            <LogOut className="w-5 h-5" /> Logout
                        </button>
                        <button
                            onClick={async () => {
                                try {
                                    // Remove _id field from jobs before syncing
                                    const jobsToSync = jobs.map(({ _id, ...job }: any) => job);

                                    const response = await fetch(`${API_URL}/api/jobs/sync`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(jobsToSync)
                                    });

                                    const data = await response.json();

                                    if (response.ok) {
                                        toast.success(`✅ ${data.message}`, {
                                            duration: 3000,
                                            position: 'bottom-right',
                                        });
                                    } else {
                                        toast.error(`❌ Error: ${data.error || 'Failed to save'}`, {
                                            duration: 3000,
                                            position: 'bottom-right',
                                        });
                                    }
                                } catch (error) {
                                    console.error('Failed to save to DB:', error);
                                    toast.error('❌ Failed to save. Make sure backend is running!', {
                                        duration: 3000,
                                        position: 'bottom-right',
                                    });
                                }
                            }}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                        >
                            <Database className="w-5 h-5" /> Save to DB
                        </button>
                        <button
                            onClick={() => {
                                const dataStr = JSON.stringify(jobs, null, 2);
                                const dataBlob = new Blob([dataStr], { type: 'application/json' });
                                const url = URL.createObjectURL(dataBlob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `job-tracker-${new Date().toISOString().split('T')[0]}.json`;
                                link.click();
                                URL.revokeObjectURL(url);
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                        >
                            <Save className="w-5 h-5" /> Save History
                        </button>
                    </div>
                    <div className="flex-1 overflow-hidden flex flex-col">
                        {jobs.length === 0 ? (
                            <div className="text-center py-16 text-gray-500 bg-white rounded-lg">
                                {jobs.length === 0 ? 'No jobs yet. Start tracking your applications!' : 'No jobs match your search.'}
                            </div>
                        ) : (
                            <div ref={tableRef} className="bg-white rounded-lg shadow-sm border-2 border-gray-400 overflow-auto flex-shrink-0 hide-scrollbar" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                                <table className="w-full border-collapse" style={{ minWidth: '1400px' }}>
                                    <thead className="bg-gray-700">
                                        <tr>
                                            <th className="px-4 py-4 text-center text-xs font-semibold text-white uppercase tracking-wider border-b-2 border-r border-gray-600 whitespace-nowrap">#</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider border-b-2 border-r border-gray-600 whitespace-nowrap">Date</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider border-b-2 border-r border-gray-600 whitespace-nowrap">Company</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider border-b-2 border-r border-gray-600 whitespace-nowrap">Position</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider border-b-2 border-r border-gray-600 whitespace-nowrap">Job Nature</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider border-b-2 border-r border-gray-600 whitespace-nowrap">Job Type</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider border-b-2 border-r border-gray-600 whitespace-nowrap">Company Location</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider border-b-2 border-r border-gray-600 whitespace-nowrap">Job Link</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider border-b-2 border-r border-gray-600 whitespace-nowrap">Job Status</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider border-b-2 border-r border-gray-600 whitespace-nowrap">Email</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider border-b-2 border-r border-gray-600 whitespace-nowrap">Comments</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider border-b-2 border-gray-600 whitespace-nowrap">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {jobs.map((job, index) => (
                                            <tr key={job.id} className="hover:bg-gray-100">
                                                <td className="px-4 py-4 text-center text-sm font-medium text-gray-700 border-b border-r border-gray-400 bg-gray-100">
                                                    {index + 1}
                                                </td>
                                                <EditableCell job={job} field="date" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b border-r border-gray-400 bg-gray-50" />
                                                <EditableCell job={job} field="company" className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-r border-gray-400" />
                                                <EditableCell job={job} field="title" className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-b border-r border-gray-400 bg-gray-50" />
                                                <EditableCell job={job} field="jobNature" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b border-r border-gray-400" />
                                                <EditableCell job={job} field="jobType" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b border-r border-gray-400 bg-gray-50" />
                                                <EditableCell job={job} field="location" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b border-r border-gray-400" />
                                                <EditableCell job={job} field="jobLink" className="px-6 py-4 whitespace-nowrap text-sm border-b border-r border-gray-400 bg-gray-50" />
                                                <EditableCell job={job} field="status" className="px-6 py-4 whitespace-nowrap border-b border-r border-gray-400" />
                                                <EditableCell job={job} field="email" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b border-r border-gray-400 bg-gray-50" />
                                                <EditableCell job={job} field="comments" className="px-6 py-4 text-sm text-gray-500 border-b border-r border-gray-400 max-w-xs truncate" />
                                                <td className="px-6 py-4 whitespace-nowrap text-sm border-b border-gray-400 bg-gray-50">
                                                    <button
                                                        onClick={() => handleDelete(job.id)}
                                                        className="text-red-600 hover:text-red-800"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}



                        {isModalOpen && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                                    <h2 className="text-2xl font-semibold mb-4">{editingJob ? 'Edit Job' : 'Add Job'}</h2>
                                    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
                                        <input
                                            name="company"
                                            defaultValue={editingJob?.company}
                                            placeholder="Company"
                                            required
                                            className="w-full px-4 py-2 border rounded-lg"
                                        />
                                        <input
                                            name="title"
                                            defaultValue={editingJob?.title}
                                            placeholder="Position"
                                            required
                                            className="w-full px-4 py-2 border rounded-lg"
                                        />
                                        <input
                                            name="jobNature"
                                            defaultValue={editingJob?.jobNature}
                                            placeholder="Job Nature (e.g., Full-time, Part-time)"
                                            className="w-full px-4 py-2 border rounded-lg"
                                        />
                                        <input
                                            name="jobType"
                                            defaultValue={editingJob?.jobType}
                                            placeholder="Job Type (e.g., Remote, Onsite, Hybrid)"
                                            className="w-full px-4 py-2 border rounded-lg"
                                        />
                                        <input
                                            name="location"
                                            defaultValue={editingJob?.location}
                                            placeholder="Company Location"
                                            className="w-full px-4 py-2 border rounded-lg"
                                        />
                                        <input
                                            name="jobLink"
                                            defaultValue={editingJob?.jobLink}
                                            placeholder="Job Link (URL)"
                                            type="url"
                                            className="w-full px-4 py-2 border rounded-lg"
                                        />
                                        <select
                                            name="status"
                                            defaultValue={editingJob?.status || 'applied'}
                                            required
                                            className="w-full px-4 py-2 border rounded-lg"
                                        >
                                            <option value="applied">Applied</option>
                                            <option value="screening">Screening</option>
                                            <option value="interview">Interview</option>
                                            <option value="offer">Offer</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                        <input
                                            name="email"
                                            defaultValue={editingJob?.email}
                                            placeholder="Contact Email"
                                            type="email"
                                            className="w-full px-4 py-2 border rounded-lg"
                                        />
                                        <textarea
                                            name="comments"
                                            defaultValue={editingJob?.comments}
                                            placeholder="Comments"
                                            rows={3}
                                            className="w-full px-4 py-2 border rounded-lg"
                                        />
                                        <input
                                            name="salary"
                                            defaultValue={editingJob?.salary}
                                            placeholder="Salary Range"
                                            className="w-full px-4 py-2 border rounded-lg"
                                        />
                                        <textarea
                                            name="notes"
                                            defaultValue={editingJob?.notes}
                                            placeholder="Notes"
                                            rows={3}
                                            className="w-full px-4 py-2 border rounded-lg"
                                        />
                                        <div className="flex gap-3">
                                            <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                                Save
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setIsModalOpen(false); setEditingJob(null); }}
                                                className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <>
                    <div className="flex justify-end gap-3 mb-4">
                        <button
                            onClick={() => {
                                const newPortal: JobPortal = {
                                    id: Date.now().toString(),
                                    name: '',
                                    url: '',
                                    category: ''
                                };
                                setPortals([...portals, newPortal]);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" /> Add Portal
                        </button>
                        <button
                            onClick={async () => {
                                try {
                                    const portalsToSync = portals.map(({ _id, ...portal }: any) => portal);
                                    const { data } = await axios.post(`${API_URL}/api/portals/sync`, portalsToSync);

                                    toast.success(`✅ ${data.message}`, {
                                        duration: 3000,
                                        position: 'bottom-right',
                                    });
                                } catch (error: any) {
                                    console.error('Failed to save portals:', error);
                                    toast.error(`❌ ${error.response?.data?.error || 'Failed to save. Make sure backend is running!'}`, {
                                        duration: 3000,
                                        position: 'bottom-right',
                                    });
                                }
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                        >
                            <Save className="w-5 h-5" /> Save Portals
                        </button>
                    </div>

                    <div className="flex-1 overflow-hidden flex flex-col">
                        {portals.length === 0 ? (
                            <div className="text-center py-16 text-gray-500 bg-white rounded-lg">
                                No portals yet. Add your favorite job search websites!
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow-sm border-2 border-gray-400 overflow-auto hide-scrollbar" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                                <table className="w-full border-collapse" style={{ minWidth: '800px' }}>
                                    <thead className="bg-gray-700">
                                        <tr>
                                            <th className="px-4 py-4 text-center text-xs font-semibold text-white uppercase tracking-wider border-b-2 border-r border-gray-600 whitespace-nowrap">#</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider border-b-2 border-r border-gray-600 whitespace-nowrap">Portal Name</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider border-b-2 border-r border-gray-600 whitespace-nowrap">URL</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider border-b-2 border-r border-gray-600 whitespace-nowrap">Category</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider border-b-2 border-gray-600 whitespace-nowrap">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {portals.map((portal, index) => (
                                            <tr key={portal.id} className="hover:bg-gray-100">
                                                <td className="px-4 py-4 text-center text-sm font-medium text-gray-700 border-b border-r border-gray-400 bg-gray-100">
                                                    {index + 1}
                                                </td>
                                                <EditablePortalCell portal={portal} field="name" className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-r border-gray-400" />
                                                <EditablePortalCell portal={portal} field="url" className="px-6 py-4 text-sm border-b border-r border-gray-400 bg-gray-50" />
                                                <EditablePortalCell portal={portal} field="category" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b border-r border-gray-400" />
                                                <td className="px-6 py-4 whitespace-nowrap text-sm border-b border-gray-400 bg-gray-50">
                                                    <button
                                                        onClick={async () => {
                                                            const result = await Swal.fire({
                                                                title: 'Delete Portal?',
                                                                text: "This will remove the portal from your list",
                                                                icon: 'warning',
                                                                showCancelButton: true,
                                                                confirmButtonColor: '#dc2626',
                                                                cancelButtonColor: '#6b7280',
                                                                confirmButtonText: 'Yes, delete it!',
                                                                cancelButtonText: 'Cancel'
                                                            });

                                                            if (result.isConfirmed) {
                                                                setPortals(portals.filter(p => p.id !== portal.id));
                                                                toast.success('🗑️ Deleted portal', {
                                                                    duration: 1500,
                                                                    position: 'bottom-right',
                                                                });
                                                            }
                                                        }}
                                                        className="text-red-600 hover:text-red-800"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
