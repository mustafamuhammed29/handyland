import React, { useState, useEffect } from 'react';
import { FileText, Save, ExternalLink } from 'lucide-react';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

interface Page {
    _id: string;
    slug: string;
    title: string;
    content: string;
    lastUpdated: string;
}

export const DashboardPages: React.FC = () => {
    const [pages, setPages] = useState<Page[]>([]);
    const [selectedPage, setSelectedPage] = useState<Page | null>(null);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();

    useEffect(() => {
        fetchPages();
    }, []);

    useEffect(() => {
        if (selectedPage) {
            setContent(selectedPage.content);
        }
    }, [selectedPage]);

    const fetchPages = async () => {
        try {
            const data = await api.get<Page[]>('/api/pages');
            setPages(data);
            if (data.length > 0 && !selectedPage) {
                setSelectedPage(data[0]);
            }
        } catch (error) {
            console.error('Failed to fetch pages', error);
            addToast('Failed to load pages', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!selectedPage) return;

        try {
            await api.put(`/api/pages/${selectedPage.slug}`, { content });

            setPages(prev => prev.map(p =>
                p._id === selectedPage._id
                    ? { ...p, content, lastUpdated: new Date().toISOString() }
                    : p
            ));

            addToast('Page updated successfully', 'success');
        } catch (error) {
            console.error('Failed to update page', error);
            addToast('Failed to update page', 'error');
        }
    };

    if (loading) return <div className="text-white">Loading pages...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <FileText className="w-6 h-6 text-blue-400" />
                Page Management
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Sidebar - Page List */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 h-fit">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Select Page</h3>
                    <div className="space-y-2">
                        {pages.map(page => (
                            <button
                                key={page._id}
                                onClick={() => setSelectedPage(page)}
                                className={`w-full text-left px-4 py-3 rounded-xl transition-all ${selectedPage?._id === page._id
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }`}
                            >
                                <div className="font-medium">{page.title}</div>
                                <div className="text-xs opacity-70 mt-1">/{page.slug}</div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Editor Area */}
                <div className="md:col-span-3">
                    {selectedPage ? (
                        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-white">{selectedPage.title}</h3>
                                    <p className="text-slate-400 text-sm">Last updated: {new Date(selectedPage.lastUpdated).toLocaleString()}</p>
                                </div>
                                <div className="flex gap-2">
                                    <a
                                        href={`/${selectedPage.slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
                                        title="View Live Page"
                                    >
                                        <ExternalLink className="w-5 h-5" />
                                    </a>
                                    <button
                                        onClick={handleSave}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors"
                                    >
                                        <Save className="w-4 h-4" />
                                        Save Changes
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">
                                        Content (HTML/Markdown supported)
                                    </label>
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        className="w-full h-[600px] px-4 py-4 bg-slate-800/50 border border-slate-700 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-blue-500 transition-colors resize-none"
                                        placeholder="Enter page content..."
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
                            <FileText className="w-16 h-16 text-slate-700 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-white mb-2">No Page Selected</h3>
                            <p className="text-slate-400">Select a page from the list to edit its content.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
