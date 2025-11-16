'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ExternalLink } from 'lucide-react';

interface Job {
    id: string;
    title: string;
    company: string;
    location: string;
    salary: string;
    status: string;
    date: string;
    jobNature: string;
    jobType: string;
    jobLink: string;
    email: string;
    comments: string;
}

interface JobPortal {
    id: string;
    name: string;
    url: string;
    category: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function SharedView() {
    const params = useParams();
    const userId = params.userId as string;
    const [jobs, setJobs] = useState<Job[]>([]);
    const [portals, setPortals] = useState<JobPortal[]>([]);
    const [activeTab, setActiveTab] = useState<'tracker' | 'portals'>('tracker');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [jobsRes, portalsRes] = await Promise.all([
                fetch(`${API_URL}/api/jobs`),
                fetch(`${API_URL}/api/portals`)
            ]);

            if (jobsRes.ok) {
                const jobsData = await jobsRes.json();
                setJobs(jobsData);
            }

            if (portalsRes.ok) {
                const portalsData = await portalsRes.json();
                setPortals(portalsData);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const statusColors: Record<string, string> = {
        applied: 'bg-blue-100 text-blue-800',
        screening: 'bg-yellow-100 text-yellow-800',
        interview: 'bg-purple-100 text-purple-800',
        offer: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading shared data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Shared Job Tracker</h1>
                    <p className="text-gray-600">📖 Read-only view</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setActiveTab('tracker')}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                            activeTab === 'tracker'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        Job Tracker ({jobs.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('portals')}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                            activeTab === 'portals'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                        }`}
                    >
                        Job Portals ({portals.length})
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'tracker' ? (
                    <div className="bg-white rounded-lg shadow-sm border-2 border-gray-300 overflow-auto">
                        <table className="w-full border-collapse" style={{ minWidth: '1200px' }}>
                            <thead className="bg-gray-700">
                                <tr>
                                    <th className="px-4 py-4 text-center text-xs font-semibold text-white uppercase">#</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Company</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Position</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Job Nature</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Job Type</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Location</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Status</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">Link</th>
                                </tr>
                            </thead>
                            <tbody>
                                {jobs.map((job, index) => (
                                    <tr key={job.id} className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-4 text-center text-sm font-medium text-gray-700">{index + 1}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{new Date(job.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{job.company}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{job.title}</td>
                                        <td className="px-6 py-4 text-sm">
                                            {job.jobNature && (
                                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                                    {job.jobNature}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {job.jobType && (
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                                    {job.jobType}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{job.location || '-'}</td>
                                        <td className="px-6 py-4 text-sm">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[job.status] || 'bg-gray-100 text-gray-800'}`}>
                                                {job.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {job.jobLink && (
                                                <a href={job.jobLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                                    <ExternalLink className="w-4 h-4" />
                                                    Link
                                                </a>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {portals.map((portal) => (
                            <a
                                key={portal.id}
                                href={portal.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block p-6 bg-white rounded-lg border-2 border-gray-300 hover:border-blue-500 hover:shadow-md transition-all"
                            >
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">{portal.name}</h3>
                                <p className="text-sm text-gray-600 mb-2">{portal.category}</p>
                                <p className="text-xs text-blue-600 truncate flex items-center gap-1">
                                    <ExternalLink className="w-3 h-3" />
                                    {portal.url}
                                </p>
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
