import { useState, useEffect } from 'react';
import { Save, FileText, Check, AlertCircle, Globe } from 'lucide-react';
import { api } from '../utils/api';

const PAGES = [
    { id: 'agb', label: 'AGB (Terms)' },
    { id: 'datenschutz', label: 'Datenschutz (Privacy)' },
    { id: 'impressum', label: 'Impressum (Imprint)' },
    { id: 'kundenservice', label: 'Kundenservice (Service)' },
    { id: 'ueber-uns', label: 'Über Uns (About Us)' }
];

export default function PageManager() {
    const [selectedPage, setSelectedPage] = useState('impressum');
    const [content, setContent] = useState('');
    const [seo, setSeo] = useState({
        metaTitle: '',
        metaDescription: '',
        keywords: '',
        canonicalUrl: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchPage(selectedPage);
    }, [selectedPage]);

    const fetchPage = async (slug: string) => {
        setLoading(true);
        setMessage(null);
        try {
            const response = await api.get(`/api/pages/${slug}`);
            setContent(response.data.content || '');
            setSeo(response.data.seo || {
                metaTitle: '',
                metaDescription: '',
                keywords: '',
                canonicalUrl: ''
            });
        } catch (error) {
            console.error('Failed to fetch page:', error);
            setMessage({ type: 'error', text: 'Failed to load page content' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const strippedContent = content;
            await api.put(`/api/pages/${selectedPage}`, { content: strippedContent, seo });
            setMessage({ type: 'success', text: 'Page updated successfully!' });
        } catch (error) {
            console.error('Failed to save page:', error);
            setMessage({ type: 'error', text: 'Failed to save changes' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-black text-white">Content Pages</h2>
                    <p className="text-slate-400 mt-2">Manage legal terms and information pages</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-bold rounded-xl flex items-center gap-2 transition-all"
                >
                    {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save size={20} />}
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {message.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar List */}
                <div className="space-y-2">
                    {PAGES.map(page => (
                        <button
                            key={page.id}
                            onClick={() => setSelectedPage(page.id)}
                            className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition-all ${selectedPage === page.id
                                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <FileText size={18} />
                            {page.label}
                        </button>
                    ))}
                </div>

                {/* Editor Area */}
                <div className="lg:col-span-3">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-1 overflow-hidden">
                        {loading ? (
                            <div className="h-96 flex items-center justify-center text-slate-500">
                                Loading content...
                            </div>
                        ) : (
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full h-[600px] bg-slate-950 text-slate-300 p-6 focus:outline-none resize-none font-mono text-sm leading-relaxed"
                                placeholder={`Enter content for ${PAGES.find(p => p.id === selectedPage)?.label}...`}
                            />
                        )}
                    </div>
                    <div className="mt-4 text-xs text-slate-500 flex items-center gap-1">
                        <span>💡 HTML is supported.</span>
                        <span className="text-slate-600">Use tags like</span>
                        <code className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">&lt;h2&gt;</code>
                        <code className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">&lt;p&gt;</code>
                        <code className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">&lt;ul&gt;</code>
                        <code className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">&lt;strong&gt;</code>
                        <span className="text-slate-600">for rich formatting.</span>
                    </div>

                    {/* SEO */}
                    {!loading && (
                        <div className="p-4 border border-slate-700/50 rounded-xl bg-slate-900/30 space-y-4 mt-8">
                            <div className="flex items-center gap-2 mb-2">
                                <Globe className="text-purple-400 w-5 h-5" />
                                <h4 className="text-blue-400 font-bold text-sm">SEO Overrides (Optional)</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-400">Meta Title</label>
                                    <input
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none"
                                        placeholder="Custom meta title"
                                        value={seo.metaTitle}
                                        onChange={e => setSeo({ ...seo, metaTitle: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-slate-400">Canonical URL</label>
                                    <input
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none"
                                        placeholder="https://..."
                                        value={seo.canonicalUrl}
                                        onChange={e => setSeo({ ...seo, canonicalUrl: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-xs font-medium text-slate-400">Keywords</label>
                                    <input
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none"
                                        placeholder="terms, conditions, privacy"
                                        value={seo.keywords}
                                        onChange={e => setSeo({ ...seo, keywords: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-xs font-medium text-slate-400">Meta Description</label>
                                    <textarea
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none h-20 resize-none"
                                        placeholder="Custom meta description for search results..."
                                        value={seo.metaDescription}
                                        onChange={e => setSeo({ ...seo, metaDescription: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
