'use client';

import { Share2, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function ShareButton() {
    const [copied, setCopied] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const shareUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/share/user123` 
        : '';

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success('✅ Link copied to clipboard!', {
            duration: 2000,
            position: 'bottom-right',
        });
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
                <Share2 className="w-5 h-5" /> Share
            </button>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowModal(false)}>
                    <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-2xl font-semibold mb-4">Share Your Job Tracker</h2>
                        <p className="text-gray-600 mb-4">Anyone with this link can view your job tracker (read-only)</p>
                        
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={shareUrl}
                                readOnly
                                className="flex-1 px-4 py-2 border rounded-lg bg-gray-50 text-sm"
                            />
                            <button
                                onClick={copyToClipboard}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                            >
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                            <p className="text-sm text-blue-800">
                                🔒 <strong>Note:</strong> This is currently a read-only public link. Authentication will be added in the future.
                            </p>
                        </div>

                        <button
                            onClick={() => setShowModal(false)}
                            className="w-full px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
