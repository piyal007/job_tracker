'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import axios from 'axios';

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
    const [selectedJobRow, setSelectedJobRow] = useState<string | null>(null);
    const [selectedPortalRow, setSelectedPortalRow] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [jobsRes, portalsRes] = await Promise.all([
                axios.get(`${API_URL}/api/jobs`),
                axios.get(`${API_URL}/api/portals`)
            ]);

            setJobs(jobsRes.data);
            setPortals(portalsRes.data);
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
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="px-4 py-4 flex-1 flex flex-col">
                {/* Header */}
                <div className="mb-4">
                    <h1 className="text-3xl font-bold text-gray-900">Piyal Job Tracker</h1>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-4">
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
                    <div className="bg-white shadow-sm border-t-2 border-gray-300 overflow-auto flex-1" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                        <table className="w-full border-collapse" style={{ minWidth: '1200px' }}>
                            <thead className="bg-gray-700 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-4 text-center text-xs font-semibold text-white uppercase border-r border-gray-600" style={{ width: '50px' }}>#</th>
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-white uppercase border-r border-gray-600" style={{ width: '110px' }}>Date</th>
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-white uppercase border-r border-gray-600" style={{ width: '180px' }}>Company</th>
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-white uppercase border-r border-gray-600" style={{ width: '200px' }}>Position</th>
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-white uppercase border-r border-gray-600" style={{ width: '120px' }}>Job Nature</th>
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-white uppercase border-r border-gray-600" style={{ width: '110px' }}>Job Type</th>
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-white uppercase border-r border-gray-600" style={{ width: '140px' }}>Location</th>
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-white uppercase border-r border-gray-600" style={{ width: '130px' }}>Status</th>
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-white uppercase" style={{ width: '80px' }}>Link</th>
                                </tr>
                            </thead>
                            <tbody>
                                {jobs.map((job, index) => (
                                    <tr 
                                        key={job.id} 
                                        onClick={() => setSelectedJobRow(job.id)}
                                        className={`border-b cursor-pointer ${
                                            selectedJobRow === job.id 
                                                ? 'bg-blue-200' 
                                                : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                        } hover:bg-blue-100`}
                                    >
                                        <td className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-r border-gray-300">{index + 1}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500 border-r border-gray-300">{new Date(job.date).toLocaleDateString()}</td>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-300">
                                            <div className="overflow-hidden text-ellipsis whitespace-nowrap" title={job.company}>
                                                {job.company}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900 border-r border-gray-300">
                                            <div className="overflow-hidden text-ellipsis whitespace-nowrap" title={job.title}>
                                                {job.title}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm border-r border-gray-300">
                                            {job.jobNature && (
                                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                                    {job.jobNature}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm border-r border-gray-300">
                                            {job.jobType && (
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                                                    {job.jobType}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500 border-r border-gray-300">
                                            <div className="overflow-hidden text-ellipsis whitespace-nowrap" title={job.location || ''}>
                                                {job.location || '-'}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm border-r border-gray-300">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[job.status] || 'bg-gray-100 text-gray-800'}`}>
                                                {job.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {job.jobLink && (
                                                <a href={job.jobLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
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
                    <div className="bg-white shadow-sm border-t-2 border-gray-300 overflow-auto flex-1" style={{ maxHeight: 'calc(100vh - 200px)' }}>
                        <table className="w-full border-collapse" style={{ minWidth: '800px' }}>
                            <thead className="bg-gray-700 sticky top-0 z-10">
                                <tr>
                                    <th className="px-4 py-4 text-center text-xs font-semibold text-white uppercase border-r border-gray-600" style={{ width: '50px' }}>#</th>
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-white uppercase border-r border-gray-600" style={{ width: '250px' }}>Portal Name</th>
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-white uppercase border-r border-gray-600" style={{ width: '150px' }}>Category</th>
                                    <th className="px-4 py-4 text-left text-xs font-semibold text-white uppercase" style={{ width: '350px' }}>URL</th>
                                </tr>
                            </thead>
                            <tbody>
                                {portals.map((portal, index) => (
                                    <tr 
                                        key={portal.id} 
                                        onClick={() => setSelectedPortalRow(portal.id)}
                                        className={`border-b cursor-pointer ${
                                            selectedPortalRow === portal.id 
                                                ? 'bg-blue-200' 
                                                : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                        } hover:bg-blue-100`}
                                    >
                                        <td className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-r border-gray-300">{index + 1}</td>
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-300">
                                            <div className="overflow-hidden text-ellipsis whitespace-nowrap" title={portal.name}>
                                                {portal.name}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600 border-r border-gray-300">{portal.category}</td>
                                        <td className="px-4 py-3 text-sm">
                                            <a 
                                                href={portal.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer" 
                                                className="text-blue-600 hover:underline flex items-center gap-1 overflow-hidden text-ellipsis whitespace-nowrap"
                                                onClick={(e) => e.stopPropagation()}
                                                title={portal.url}
                                            >
                                                <ExternalLink className="w-4 h-4 flex-shrink-0" />
                                                <span className="overflow-hidden text-ellipsis">{portal.url}</span>
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
