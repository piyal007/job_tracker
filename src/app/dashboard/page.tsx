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
import { chatWithData } from '@/lib/gemini';
import ReactMarkdown from 'react-markdown';
import GoogleDocsImport from '@/components/GoogleDocsImport';

const ALLOWED_EMAIL = 'piyalsha007@gmail.com';

type JobStatus = 'applied' | 'No Response' | 'Short listed' | 'On Task' | 'interview' | 'On Follow Up' | 'On Second Follow Up' | 'screening' | 'offer' | 'rejected';

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
    const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
    const [bulkImportText, setBulkImportText] = useState('');
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [showAIChat, setShowAIChat] = useState(false);
    const [aiChatMessages, setAiChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string, action?: any}>>([]);
    const [aiChatInput, setAiChatInput] = useState('');
    const [pendingAction, setPendingAction] = useState<any>(null);
    const tableRef = useRef<HTMLDivElement>(null);
    const chatMessagesEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to latest message
    useEffect(() => {
        if (chatMessagesEndRef.current) {
            chatMessagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [aiChatMessages]);

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

    const handleAIChat = async () => {
        if (!aiChatInput.trim()) return;

        const userMessage = aiChatInput;
        setAiChatInput('');
        
        // Add user message to chat
        setAiChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsGenerating(true);

        try {
            const result = await chatWithData(userMessage, jobs, portals, aiChatMessages);
            
            if (result.success && result.data) {
                if (result.action) {
                    // AI wants to perform an action - show approval UI
                    const actionData = result.jobsToAdd || result.updateData || result.deleteData || result.bulkData;
                    setAiChatMessages(prev => [...prev, { 
                        role: 'assistant', 
                        content: result.data,
                        action: { type: result.action, data: actionData }
                    }]);
                    setPendingAction({ type: result.action, data: actionData });
                } else {
                    setAiChatMessages(prev => [...prev, { role: 'assistant', content: result.data }]);
                }
            } else {
                setAiChatMessages(prev => [...prev, { role: 'assistant', content: `Error: ${result.error}` }]);
            }
        } catch (error) {
            setAiChatMessages(prev => [...prev, { role: 'assistant', content: 'Failed to get response. Check your API key.' }]);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleApproveAction = () => {
        if (!pendingAction) return;

        switch (pendingAction.type) {
            case 'add_jobs':
                const newJobs = pendingAction.data.map((job: any) => ({
                    ...job,
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    date: new Date().toISOString(),
                    notes: job.notes || '',
                    jobLink: job.jobLink || '',
                    email: job.email || '',
                    comments: job.comments || ''
                }));
                setJobs([...jobs, ...newJobs]);
                toast.success(`✅ Added ${newJobs.length} job(s)!`);
                setAiChatMessages(prev => [...prev, { 
                    role: 'assistant', 
                    content: `Done! Added ${newJobs.length} job(s) to your tracker.` 
                }]);
                break;

            case 'update_job':
                const { id, updates } = pendingAction.data;
                setJobs(jobs.map(j => j.id === id ? { ...j, ...updates } : j));
                toast.success(`✅ Updated job!`);
                setAiChatMessages(prev => [...prev, { 
                    role: 'assistant', 
                    content: `Done! Updated the job.` 
                }]);
                break;

            case 'delete_jobs':
                const { ids } = pendingAction.data;
                setJobs(jobs.filter(j => !ids.includes(j.id)));
                toast.success(`✅ Deleted ${ids.length} job(s)!`);
                setAiChatMessages(prev => [...prev, { 
                    role: 'assistant', 
                    content: `Done! Deleted ${ids.length} job(s).` 
                }]);
                break;

            case 'bulk_update':
                const { filter, updates: bulkUpdates } = pendingAction.data;
                const updatedJobs = jobs.map(job => {
                    const matches = Object.entries(filter).every(([key, value]) => job[key as keyof Job] === value);
                    return matches ? { ...job, ...bulkUpdates } : job;
                });
                const changedCount = updatedJobs.filter((j, i) => j !== jobs[i]).length;
                setJobs(updatedJobs);
                toast.success(`✅ Updated ${changedCount} job(s)!`);
                setAiChatMessages(prev => [...prev, { 
                    role: 'assistant', 
                    content: `Done! Updated ${changedCount} job(s).` 
                }]);
                break;
        }

        setPendingAction(null);
    };

    const handleRejectAction = () => {
        setPendingAction(null);
        setAiChatMessages(prev => [...prev, { 
            role: 'assistant', 
            content: 'No problem! Let me know if you need anything else.' 
        }]);
    };

    const handleBulkImport = () => {
        try {
            const trimmedText = bulkImportText.trim();
            const newJobs: Job[] = [];

            // Parse JSON only
            const jsonData = JSON.parse(trimmedText);
            const jobsArray = Array.isArray(jsonData) ? jsonData : [jsonData];

            jobsArray.forEach((item: any) => {
                const newJob: Job = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    title: item.title || item.position || item.role || 'Position',
                    company: item.company || item.companyName || item.employer || '',
                    location: item.location || item.city || item.place || '',
                    salary: item.salary || item.compensation || item.pay || '',
                    status: (item.status?.toLowerCase() || 'applied') as JobStatus,
                    notes: item.notes || item.description || '',
                    date: item.date || new Date().toISOString(),
                    jobNature: item.jobNature || item.nature || item.employment || '',
                    jobType: item.jobType || item.type || item.workType || '',
                    jobLink: item.jobLink || item.link || item.url || '',
                    email: item.email || item.contact || '',
                    comments: item.comments || item.remarks || ''
                };
                newJobs.push(newJob);
            });

            if (newJobs.length > 0) {
                setJobs([...jobs, ...newJobs]);
                toast.success(`✅ Added ${newJobs.length} job${newJobs.length > 1 ? 's' : ''} successfully!`);
                setIsBulkImportOpen(false);
                setBulkImportText('');
            } else {
                toast.error('No valid jobs found in the JSON');
            }
        } catch (error) {
            toast.error('Invalid JSON format. Please paste valid JSON.');
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
            try {
                // Delete from MongoDB
                await axios.delete(`${API_URL}/api/jobs/${id}`);
                // Update local state
                setJobs(jobs.filter(j => j.id !== id));
                toast.success('🗑️ Deleted successfully');
            } catch (error) {
                console.error('Delete error:', error);
                toast.error('Failed to delete job');
            }
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
                    return ['applied', 'No Response', 'Short listed', 'On Task', 'interview', 'On Follow Up', 'On Second Follow Up', 'screening', 'offer', 'rejected'];
                case 'email':
                    return ['Not Yet', 'Done', 'Sent', 'No Response', 'Responded'];
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
                if (value === 'Done') return 'bg-green-100 text-green-800';
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
                className={`${className} transition-all duration-300 ease-in-out`}
                onClick={() => setEditingCell({ jobId: job.id, field })}
                style={{ maxWidth: isLinkField ? '250px' : field === 'comments' ? '300px' : '200px' }}
            >
                {shouldShowBadge ? (
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(field, value)} cursor-pointer`}>
                        {value}
                        <ChevronDown className="w-3 h-3" />
                    </span>
                ) : isLinkField && value ? (
                    <a 
                        href={value} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:underline block overflow-hidden text-ellipsis whitespace-nowrap" 
                        onClick={(e) => e.stopPropagation()}
                        title={value}
                    >
                        {value}
                    </a>
                ) : field === 'date' ? (
                    new Date(value).toLocaleDateString()
                ) : field === 'comments' || field === 'title' || field === 'company' ? (
                    <div className="overflow-hidden text-ellipsis whitespace-nowrap" title={value || ''}>
                        {value || '-'}
                    </div>
                ) : (
                    value || '-'
                )}
            </td>
        );
    };

    const statusColors: Record<JobStatus, string> = {
        applied: 'bg-blue-100 text-blue-800',
        'No Response': 'bg-red-100 text-red-800',
        'Short listed': 'bg-gray-100 text-gray-800',
        'On Task': 'bg-gray-100 text-gray-800',
        interview: 'bg-purple-100 text-purple-800',
        'On Follow Up': 'bg-green-100 text-green-800',
        'On Second Follow Up': 'bg-green-200 text-green-900',
        screening: 'bg-yellow-100 text-yellow-800',
        offer: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
    };

    return (
        <div className="h-screen bg-gray-50 overflow-hidden flex flex-col px-4 py-4">
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
                    Job Tracker ({jobs.length})
                </button>
                <button
                    onClick={() => setActiveTab('portals')}
                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${activeTab === 'portals'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                >
                    Job Portals ({portals.length})
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
                        <button
                            onClick={() => setIsBulkImportOpen(true)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                        >
                            <Database className="w-5 h-5" /> Bulk Import
                        </button>
                        <GoogleDocsImport onImport={(importedJobs) => {
                            const newJobs = importedJobs.map((job: any) => ({
                                ...job,
                                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                                date: job.date || new Date().toISOString(),
                                notes: job.notes || '',
                                jobLink: job.jobLink || '',
                                email: job.email || '',
                                comments: job.comments || ''
                            }));
                            setJobs([...jobs, ...newJobs]);
                        }} />
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
                            <div ref={tableRef} className="bg-white shadow-sm border-t-2 border-gray-400 overflow-auto flex-shrink-0 hide-scrollbar" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                                <table className="w-full border-collapse" style={{ minWidth: '1400px' }}>
                                    <thead className="bg-gray-700 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-4 py-4 text-center text-xs font-semibold text-white uppercase tracking-wider border-b-2 border-r border-gray-600 whitespace-nowrap" style={{ width: '50px' }}>#</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider border-b-2 border-r border-gray-600 whitespace-nowrap" style={{ width: '120px' }}>Date</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider border-b-2 border-r border-gray-600 whitespace-nowrap" style={{ width: '180px' }}>Company Name</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider border-b-2 border-r border-gray-600 whitespace-nowrap" style={{ width: '200px' }}>Position</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider border-b-2 border-r border-gray-600 whitespace-nowrap" style={{ width: '130px' }}>Job Nature</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider border-b-2 border-r border-gray-600 whitespace-nowrap" style={{ width: '120px' }}>Job Type</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider border-b-2 border-r border-gray-600 whitespace-nowrap" style={{ width: '150px' }}>Company Location</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider border-b-2 border-r border-gray-600 whitespace-nowrap" style={{ width: '250px' }}>Job Link</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider border-b-2 border-r border-gray-600 whitespace-nowrap" style={{ width: '140px' }}>Job Status</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider border-b-2 border-r border-gray-600 whitespace-nowrap" style={{ width: '130px' }}>Email</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider border-b-2 border-r border-gray-600 whitespace-nowrap" style={{ width: '300px' }}>Comments</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider border-b-2 border-gray-600 whitespace-nowrap" style={{ width: '100px' }}>Actions</th>
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
                            <div className="bg-white shadow-sm border-t-2 border-gray-400 overflow-auto hide-scrollbar" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                                <table className="w-full border-collapse" style={{ minWidth: '800px' }}>
                                    <thead className="bg-gray-700 sticky top-0 z-10">
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

            {/* Bulk Import Modal */}
            {isBulkImportOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
                        <h2 className="text-2xl font-semibold mb-4">Bulk Import Jobs</h2>
                        <p className="text-gray-600 mb-4 text-sm">
                            Paste JSON job data. Use the AI Assistant (bottom right) to generate jobs!
                        </p>

                        <div className="bg-gray-50 p-3 rounded-lg mb-4">
                            <p className="text-xs font-semibold text-gray-700 mb-2">Supported JSON fields:</p>
                            <code className="text-xs text-gray-600">
                                title/position/role, company/companyName, location/city, salary/compensation, 
                                status, jobType/type, jobNature/employment, jobLink/url, notes/description
                            </code>
                        </div>
                        <textarea
                            value={bulkImportText}
                            onChange={(e) => setBulkImportText(e.target.value)}
                            placeholder={'[\n  {\n    "company": "Google",\n    "title": "Software Engineer",\n    "location": "Mountain View, CA",\n    "jobType": "Remote",\n    "salary": "$150k-$200k",\n    "status": "applied"\n  },\n  {\n    "company": "Meta",\n    "position": "Frontend Developer",\n    "city": "Menlo Park, CA",\n    "type": "Hybrid"\n  }\n]'}
                            className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none font-mono text-sm"
                        />
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={handleBulkImport}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                            >
                                <Database className="w-5 h-5" /> Import Jobs
                            </button>
                            <button
                                onClick={() => {
                                    setIsBulkImportOpen(false);
                                    setBulkImportText('');
                                }}
                                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Chat Widget - Bottom Right */}
            <div className="fixed bottom-6 right-6 z-50">
                {!showAIChat ? (
                    <button
                        onClick={() => setShowAIChat(true)}
                        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all hover:scale-110"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                    </button>
                ) : (
                    <div className="bg-white rounded-lg shadow-2xl w-96 h-[500px] flex flex-col">
                        {/* Chat Header */}
                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold">AI Assistant</h3>
                                <p className="text-xs opacity-90">Ask about your job tracker data</p>
                            </div>
                            <button
                                onClick={() => setShowAIChat(false)}
                                className="hover:bg-white/20 rounded p-1"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-3">
                            {aiChatMessages.length === 0 ? (
                                <div className="text-center text-gray-500 mt-8">
                                    <p className="text-sm mb-4">👋 Hi! I can help you with:</p>
                                    <ul className="text-xs space-y-2 text-left max-w-xs mx-auto">
                                        <li>• Analyzing your applications</li>
                                        <li>• Suggesting follow-ups</li>
                                        <li>• Generating job lists</li>
                                        <li>• Statistics & insights</li>
                                    </ul>
                                </div>
                            ) : (
                                aiChatMessages.map((msg, idx) => (
                                    <div key={idx} className="space-y-2">
                                        <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] rounded-lg p-3 break-words ${
                                                msg.role === 'user' 
                                                    ? 'bg-blue-600 text-white' 
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                <div className="text-sm prose prose-sm max-w-none break-words overflow-hidden">
                                                    <ReactMarkdown
                                                        components={{
                                                            p: ({node, ...props}) => <p className="mb-2 break-words" {...props} />,
                                                            strong: ({node, ...props}) => <strong className="font-bold text-gray-900" {...props} />,
                                                            ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-2" {...props} />,
                                                            ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                                                            li: ({node, ...props}) => <li className="mb-1 break-words" {...props} />,
                                                            code: ({node, inline, ...props}: any) => 
                                                                inline ? 
                                                                    <code className="bg-gray-200 px-1 rounded text-xs break-all" {...props} /> : 
                                                                    <code className="block bg-gray-200 p-2 rounded text-xs overflow-x-auto whitespace-pre-wrap break-words" {...props} />
                                                        }}
                                                    >
                                                        {msg.content}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        </div>
                                        {msg.action && idx === aiChatMessages.length - 1 && pendingAction && (
                                            <div className="flex justify-start">
                                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 max-w-[80%]">
                                                    <p className="text-sm text-gray-700 mb-2">
                                                        🤖 {
                                                            msg.action.type === 'add_jobs' ? `I want to add ${Array.isArray(msg.action.data) ? msg.action.data.length : 1} job(s)` :
                                                            msg.action.type === 'update_job' ? 'I want to update a job' :
                                                            msg.action.type === 'delete_jobs' ? `I want to delete ${msg.action.data.ids?.length || 0} job(s)` :
                                                            msg.action.type === 'bulk_update' ? 'I want to update multiple jobs' :
                                                            'I want to perform an action'
                                                        }. Do you approve?
                                                    </p>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={handleApproveAction}
                                                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                                        >
                                                            ✓ Approve
                                                        </button>
                                                        <button
                                                            onClick={handleRejectAction}
                                                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                                                        >
                                                            ✗ Reject
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                            {isGenerating && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 rounded-lg p-3">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={chatMessagesEndRef} />
                        </div>

                        {/* Chat Input */}
                        <div className="p-4 border-t">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={aiChatInput}
                                    onChange={(e) => setAiChatInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && !isGenerating && handleAIChat()}
                                    placeholder="Ask me anything..."
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                                    disabled={isGenerating}
                                />
                                <button
                                    onClick={handleAIChat}
                                    disabled={isGenerating || !aiChatInput.trim()}
                                    className="bg-purple-600 text-white rounded-lg px-4 py-2 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
