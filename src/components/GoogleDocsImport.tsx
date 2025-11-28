'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';
import toast from 'react-hot-toast';

interface GoogleDocsImportProps {
    onImport: (jobs: any[]) => void;
}

export default function GoogleDocsImport({ onImport }: GoogleDocsImportProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [docUrl, setDocUrl] = useState('');
    const [showModal, setShowModal] = useState(false);

    const extractDocId = (url: string) => {
        // Support both Google Docs and Google Sheets
        const docMatch = url.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
        const sheetMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        return docMatch ? { id: docMatch[1], type: 'doc' } : 
               sheetMatch ? { id: sheetMatch[1], type: 'sheet' } : null;
    };

    const handleImportFromDocs = async () => {
        if (!docUrl.trim()) {
            toast.error('Please enter a Google Docs/Sheets URL');
            return;
        }

        const docInfo = extractDocId(docUrl);
        if (!docInfo) {
            toast.error('Invalid Google Docs/Sheets URL');
            return;
        }

        setIsLoading(true);
        try {
            let exportUrl = '';
            
            if (docInfo.type === 'sheet') {
                // For Google Sheets, export as CSV
                exportUrl = `https://docs.google.com/spreadsheets/d/${docInfo.id}/export?format=csv`;
            } else {
                // For Google Docs, export as plain text
                exportUrl = `https://docs.google.com/document/d/${docInfo.id}/export?format=txt`;
            }
            
            // Try to fetch the data
            const response = await fetch(exportUrl);
            
            if (!response.ok) {
                throw new Error('Failed to fetch document. Make sure it is publicly accessible.');
            }
            
            const text = await response.text();
            handleTextImport(text);

        } catch (error: any) {
            console.error('Import error:', error);
            toast.error(error.message || 'Failed to import. Please make sure the document is publicly accessible, or copy-paste the content below.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleTextImport = (text: string) => {
        try {
            // Try to parse as JSON first
            const jobs = JSON.parse(text);
            onImport(Array.isArray(jobs) ? jobs : [jobs]);
            toast.success('Jobs imported successfully!');
            setShowModal(false);
            setDocUrl('');
        } catch (e) {
            // Parse as CSV/TSV
            const lines = text.split('\n').filter(line => line.trim());
            
            if (lines.length === 0) {
                toast.error('No data found');
                return;
            }

            // Split first line to check for headers
            const firstLineParts = lines[0].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)|\t/).map(p => p.trim().toLowerCase().replace(/^"|"$/g, ''));
            
            // Define possible header names for each field (order matters - more specific first)
            const headerMap: any = {
                date: ['date', 'applied date', 'application date', 'date applied'],
                company: ['company name', 'company', 'employer', 'organization'],
                location: ['company location', 'location', 'city', 'place', 'where'],
                title: ['job title', 'title', 'position', 'role', 'job position'],
                salary: ['salary', 'compensation', 'pay', 'wage'],
                status: ['job status', 'status', 'application status', 'stage'],
                jobNature: ['job nature', 'nature', 'employment type', 'employment', 'type of employment'],
                jobType: ['job type', 'work type', 'remote', 'work mode', 'mode'],
                jobLink: ['job link', 'link', 'url', 'job url', 'posting'],
                email: ['email status', 'email', 'contact'],
                comments: ['comments', 'notes', 'remarks', 'description']
            };

            // Detect column mapping - match most specific first
            const columnMapping: any = {};
            let hasHeader = false;

            firstLineParts.forEach((header, index) => {
                // Check each field's possible names in order (most specific first)
                for (const [field, possibleNames] of Object.entries(headerMap)) {
                    // Find the first matching name for this header
                    const matchedName = (possibleNames as string[]).find((name: string) => {
                        const headerLower = header.toLowerCase();
                        const nameLower = name.toLowerCase();
                        return headerLower === nameLower || headerLower.includes(nameLower);
                    });
                    
                    if (matchedName && !columnMapping[field]) {
                        // Only assign if this field hasn't been mapped yet
                        columnMapping[field] = index;
                        hasHeader = true;
                        break; // Stop checking other fields for this header
                    }
                }
            });

            // Helper function to parse dates intelligently
            const parseDate = (dateStr: string | undefined): string => {
                if (!dateStr || !dateStr.trim()) {
                    return new Date().toISOString();
                }

                const trimmed = dateStr.trim();
                const currentYear = new Date().getFullYear();
                
                // Handle "20, November" format (day, month - with comma)
                const dayCommaMonthMatch = trimmed.match(/^(\d{1,2}),?\s+([A-Za-z]+)$/);
                if (dayCommaMonthMatch) {
                    const [, day, monthName] = dayCommaMonthMatch;
                    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                                       'july', 'august', 'september', 'october', 'november', 'december'];
                    const monthIndex = monthNames.findIndex(m => m.startsWith(monthName.toLowerCase()));
                    
                    if (monthIndex !== -1) {
                        const parsedDate = new Date(currentYear, monthIndex, parseInt(day));
                        return parsedDate.toISOString();
                    }
                }
                
                // Handle "13. November" or "13 November" format (day + month, no year)
                const dayMonthMatch = trimmed.match(/^(\d{1,2})\.?\s+([A-Za-z]+)$/);
                if (dayMonthMatch) {
                    const [, day, monthName] = dayMonthMatch;
                    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                                       'july', 'august', 'september', 'october', 'november', 'december'];
                    const monthIndex = monthNames.findIndex(m => m.startsWith(monthName.toLowerCase()));
                    
                    if (monthIndex !== -1) {
                        const parsedDate = new Date(currentYear, monthIndex, parseInt(day));
                        return parsedDate.toISOString();
                    }
                }
                
                // Try parsing as-is first
                let parsedDate = new Date(trimmed);
                
                // If the year is before 2020 or invalid, fix it
                if (isNaN(parsedDate.getTime()) || parsedDate.getFullYear() < 2020) {
                    // Check for MM/DD/YYYY or M/D/YYYY format
                    const dateMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
                    if (dateMatch) {
                        const [, month, day, year] = dateMatch;
                        const fixedYear = year.length === 2 || parseInt(year) < 2020 ? currentYear : parseInt(year);
                        parsedDate = new Date(fixedYear, parseInt(month) - 1, parseInt(day));
                    } else {
                        // Try other formats - maybe it's just month/day without year
                        const monthDayMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})$/);
                        if (monthDayMatch) {
                            const [, month, day] = monthDayMatch;
                            parsedDate = new Date(currentYear, parseInt(month) - 1, parseInt(day));
                        } else {
                            // Last resort: use current date
                            parsedDate = new Date();
                        }
                    }
                }
                
                return parsedDate.toISOString();
            };

            const dataLines = hasHeader ? lines.slice(1) : lines;
            
            const jobs = dataLines.map(line => {
                // Split by comma (respecting quotes), tab, or pipe
                const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)|\t/).map(p => p.trim().replace(/^"|"$/g, ''));
                
                if (hasHeader && Object.keys(columnMapping).length > 0) {
                    // Use detected column mapping
                    return {
                        date: parseDate(parts[columnMapping.date]),
                        company: parts[columnMapping.company] || '',
                        title: parts[columnMapping.title] || '',
                        location: parts[columnMapping.location] || '',
                        salary: parts[columnMapping.salary] || '',
                        status: (parts[columnMapping.status]?.toLowerCase() || 'applied'),
                        jobNature: parts[columnMapping.jobNature] || '',
                        jobType: parts[columnMapping.jobType] || '',
                        jobLink: parts[columnMapping.jobLink] || '',
                        email: parts[columnMapping.email] || '',
                        comments: parts[columnMapping.comments] || ''
                    };
                } else {
                    // Use default order: Date, Company, Title, Location, Salary, Status, JobNature, JobType, JobLink, Email, Comments
                    return {
                        date: parseDate(parts[0]),
                        company: parts[1] || '',
                        title: parts[2] || '',
                        location: parts[3] || '',
                        salary: parts[4] || '',
                        status: (parts[5]?.toLowerCase() || 'applied'),
                        jobNature: parts[6] || '',
                        jobType: parts[7] || '',
                        jobLink: parts[8] || '',
                        email: parts[9] || '',
                        comments: parts[10] || ''
                    };
                }
            }).filter(job => job.company || job.title); // Filter out empty rows
            
            if (jobs.length > 0) {
                onImport(jobs);
                toast.success(`Imported ${jobs.length} job(s)!`);
                setShowModal(false);
                setDocUrl('');
            } else {
                toast.error('No valid jobs found');
            }
        }
    };

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
                <FileText className="w-5 h-5" /> Import from Docs
            </button>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
                        <h2 className="text-2xl font-semibold mb-4">Import from Google Docs/Sheets</h2>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Method 1: Paste Google Docs/Sheets URL
                                </label>
                                <input
                                    type="text"
                                    value={docUrl}
                                    onChange={(e) => setDocUrl(e.target.value)}
                                    placeholder="https://docs.google.com/spreadsheets/d/... or /document/d/..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    ⚠️ Important: Click "Share" → "Anyone with the link" → "Viewer" to make it accessible
                                </p>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-300"></div>
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="px-2 bg-white text-gray-500">Or</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Method 2: Copy & Paste Content
                                </label>
                                <textarea
                                    placeholder="Paste your job data here (CSV format with all fields)&#10;&#10;Format: Date, Company Name, Title, Location, Salary, Status, JobNature, JobType, JobLink, Email, Comments&#10;&#10;Example:&#10;2024-01-15, Google, Software Engineer, Mountain View, $150k, applied, Full time, Remote, https://..., Sent, Great company&#10;2024-01-20, Meta, Frontend Dev, Menlo Park, $140k, interview, Full time, Hybrid, https://..., Responded, Exciting role"
                                    className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-mono text-sm"
                                    onChange={(e) => {
                                        if (e.target.value.trim()) {
                                            handleTextImport(e.target.value);
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleImportFromDocs}
                                disabled={isLoading || !docUrl}
                                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {isLoading ? 'Importing...' : 'Import from URL'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setDocUrl('');
                                }}
                                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
