'use client';

import { Job } from '@/types';
import { Trash2 } from 'lucide-react';
import EditableCell from './EditableCell';

interface Props {
    jobs: Job[];
    onCellUpdate: (jobId: string, field: keyof Job, value: string) => void;
    onDelete: (id: string) => void;
    editingCell: { jobId: string; field: keyof Job } | null;
    setEditingCell: (cell: { jobId: string; field: keyof Job } | null) => void;
}

export default function JobTrackerTable({ jobs, onCellUpdate, onDelete, editingCell, setEditingCell }: Props) {
    return (
        <div className="bg-white rounded-lg shadow-sm border-2 border-gray-400 overflow-auto hide-scrollbar" style={{ maxHeight: 'calc(100vh - 200px)' }}>
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
                            <EditableCell job={job} field="date" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b border-r border-gray-400 bg-gray-50" onUpdate={onCellUpdate} editingCell={editingCell} setEditingCell={setEditingCell} />
                            <EditableCell job={job} field="company" className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-r border-gray-400" onUpdate={onCellUpdate} editingCell={editingCell} setEditingCell={setEditingCell} />
                            <EditableCell job={job} field="title" className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border-b border-r border-gray-400 bg-gray-50" onUpdate={onCellUpdate} editingCell={editingCell} setEditingCell={setEditingCell} />
                            <EditableCell job={job} field="jobNature" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b border-r border-gray-400" onUpdate={onCellUpdate} editingCell={editingCell} setEditingCell={setEditingCell} />
                            <EditableCell job={job} field="jobType" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b border-r border-gray-400 bg-gray-50" onUpdate={onCellUpdate} editingCell={editingCell} setEditingCell={setEditingCell} />
                            <EditableCell job={job} field="location" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b border-r border-gray-400" onUpdate={onCellUpdate} editingCell={editingCell} setEditingCell={setEditingCell} />
                            <EditableCell job={job} field="jobLink" className="px-6 py-4 whitespace-nowrap text-sm border-b border-r border-gray-400 bg-gray-50" onUpdate={onCellUpdate} editingCell={editingCell} setEditingCell={setEditingCell} />
                            <EditableCell job={job} field="status" className="px-6 py-4 whitespace-nowrap border-b border-r border-gray-400" onUpdate={onCellUpdate} editingCell={editingCell} setEditingCell={setEditingCell} />
                            <EditableCell job={job} field="email" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b border-r border-gray-400 bg-gray-50" onUpdate={onCellUpdate} editingCell={editingCell} setEditingCell={setEditingCell} />
                            <EditableCell job={job} field="comments" className="px-6 py-4 text-sm text-gray-500 border-b border-r border-gray-400 max-w-xs truncate" onUpdate={onCellUpdate} editingCell={editingCell} setEditingCell={setEditingCell} />
                            <td className="px-6 py-4 whitespace-nowrap text-sm border-b border-gray-400 bg-gray-50">
                                <button
                                    onClick={() => onDelete(job.id)}
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
    );
}
