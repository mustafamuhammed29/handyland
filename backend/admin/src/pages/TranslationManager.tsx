import React, { useState, useEffect } from 'react';
import { Languages, Search, Plus, Save, Loader2, Trash2, Edit3, X, Sparkles, FolderOpen } from 'lucide-react';
import { api } from '../utils/api';
import useDebounce from '../hooks/useDebounce';
import toast from 'react-hot-toast';

interface TranslationDoc {
    _id: string;
    key: string;
    namespace: string;
    values: {
        en: string;
        de: string;
        ar: string;
        tr: string;
        ru: string;
        fa: string;
    };
}

const SUPPORTED_LANGUAGES = [
    { code: 'de', label: 'German' },
    { code: 'en', label: 'English' },
    { code: 'ar', label: 'Arabic' },
    { code: 'tr', label: 'Turkish' },
    { code: 'ru', label: 'Russian' },
    { code: 'fa', label: 'Persian' }
] as const;

export default function TranslationManager() {
    const [translations, setTranslations] = useState<TranslationDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const debouncedSearch = useDebounce(searchQuery, 300);
    
    // Modal states
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<Partial<TranslationDoc>>({
        key: '',
        namespace: 'translation',
        values: { en: '', de: '', ar: '', tr: '', ru: '', fa: '' }
    });
    
    // Namespace tabs feature
    const [activeTab, setActiveTab] = useState<string>('translation');
    const [autoTranslating, setAutoTranslating] = useState(false);
    // Bulk auto-translate state
    const [bulkTranslating, setBulkTranslating] = useState(false);
    const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);

    const namespaces = Array.from(new Set(translations.map(t => t.namespace || 'translation'))).sort();
    
    // Ensure active tab is valid
    const currentTab = namespaces.includes(activeTab) ? activeTab : (namespaces[0] || 'translation');

    useEffect(() => {
        fetchTranslations();
    }, []);

    const fetchTranslations = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/translations');
            setTranslations(res.data.data || []);
        } catch (error) {
            toast.error('Failed to fetch translations');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (formData._id) {
                await api.put(`/api/translations/${formData._id}`, { values: formData.values });
                toast.success('Translation updated successfully');
            } else {
                await api.post('/api/translations', formData);
                toast.success('New translation key added');
            }
            setShowForm(false);
            fetchTranslations();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to save translation');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, key: string) => {
        if (!window.confirm(`Are you sure you want to delete the key "${key}"?`)) return;
        try {
            await api.delete(`/api/translations/${id}`);
            setTranslations(prev => prev.filter(t => t._id !== id));
            toast.success('Translation deleted');
        } catch (error) {
            toast.error('Failed to delete translation');
        }
    };

    const openEdit = (t: TranslationDoc) => {
        setFormData(t);
        setShowForm(true);
    };

    const openNew = () => {
        setFormData({
            key: '',
            namespace: currentTab || 'translation', // Default to current tab
            values: { en: '', de: '', ar: '', tr: '', ru: '', fa: '' }
        });
        setShowForm(true);
    };

    const tabTranslations = translations.filter(t => (t.namespace || 'translation') === currentTab);
    const filteredTranslations = tabTranslations.filter(t => 
        t.key.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
        Object.values(t.values).some(v => typeof v === 'string' && v.toLowerCase().includes(debouncedSearch.toLowerCase()))
    );

    const handleAutoTranslate = async () => {
        const sourceText = formData.values?.en || formData.values?.de;
        const sourceLang = formData.values?.en ? 'en' : 'de';
        
        if (!sourceText) {
            toast.error("Please enter English or German text first to use auto-translate.");
            return;
        }

        setAutoTranslating(true);
        try {
            const toLangs = SUPPORTED_LANGUAGES.map(l => l.code).filter(c => c !== sourceLang);
            const res = await api.post('/api/translations/auto-translate', {
                text: sourceText,
                from: sourceLang,
                toLangs
            });
            
            if (res.data.success) {
                setFormData(prev => ({
                    ...prev,
                    values: {
                        ...prev.values,
                        ...res.data.translated
                    }
                }));
                toast.success("Auto-translation complete");
            }
        } catch (e: any) {
            toast.error(e.response?.data?.error || "Failed to auto translate");
        } finally {
            setAutoTranslating(false);
        }
    };

    const handleBulkAutoTranslate = async () => {
        const missingRows = tabTranslations.filter(t =>
            SUPPORTED_LANGUAGES.some(l => !t.values?.[l.code])
        );

        if (missingRows.length === 0) {
            toast.success('All translations in this tab are already complete!');
            return;
        }

        if (!window.confirm(`This will auto-translate ${missingRows.length} incomplete keys in "${currentTab}" using MyMemory (free API).\n\nContinue?`)) return;

        setBulkTranslating(true);
        setBulkProgress({ done: 0, total: missingRows.length });

        let updated = 0;
        let errors = 0;

        for (let i = 0; i < missingRows.length; i++) {
            const row = missingRows[i];
            setBulkProgress({ done: i, total: missingRows.length });

            const sourceText = row.values?.en || row.values?.de;
            const sourceLang = row.values?.en ? 'en' : 'de';

            if (!sourceText) {
                errors++;
                continue;
            }

            const toLangs = SUPPORTED_LANGUAGES
                .map(l => l.code)
                .filter(c => c !== sourceLang && !row.values?.[c as keyof typeof row.values]);

            if (toLangs.length === 0) continue;

            try {
                const res = await api.post('/api/translations/auto-translate', {
                    text: sourceText,
                    from: sourceLang,
                    toLangs
                });

                if (res.data.success) {
                    const mergedValues = { ...row.values, ...res.data.translated };
                    await api.put(`/api/translations/${row._id}`, { values: mergedValues });
                    setTranslations(prev =>
                        prev.map(t => t._id === row._id ? { ...t, values: mergedValues as any } : t)
                    );
                    updated++;
                }
            } catch {
                errors++;
            }

            await new Promise(r => setTimeout(r, 400));
        }

        setBulkProgress({ done: missingRows.length, total: missingRows.length });
        toast.success(`Bulk translate complete: ${updated} updated, ${errors} errors`);
        setBulkTranslating(false);
    };

    const handleGlobalBulkAutoTranslate = async () => {
        const missingRows = translations.filter(t =>
            SUPPORTED_LANGUAGES.some(l => !t.values?.[l.code])
        );

        if (missingRows.length === 0) {
            toast.success('All translations across all tabs are already complete!');
            return;
        }

        if (!window.confirm(`This will auto-translate ${missingRows.length} incomplete keys across ALL tabs.\n\nContinue?`)) return;

        setBulkTranslating(true);
        setBulkProgress({ done: 0, total: missingRows.length });

        let updated = 0;
        let errors = 0;

        for (let i = 0; i < missingRows.length; i++) {
            const row = missingRows[i];
            setBulkProgress({ done: i, total: missingRows.length });

            const sourceText = row.values?.en || row.values?.de;
            const sourceLang = row.values?.en ? 'en' : 'de';

            if (!sourceText) {
                errors++;
                continue;
            }

            const toLangs = SUPPORTED_LANGUAGES
                .map(l => l.code)
                .filter(c => c !== sourceLang && !row.values?.[c as keyof typeof row.values]);

            if (toLangs.length === 0) continue;

            try {
                const res = await api.post('/api/translations/auto-translate', {
                    text: sourceText,
                    from: sourceLang,
                    toLangs
                });

                if (res.data.success) {
                    const mergedValues = { ...row.values, ...res.data.translated };
                    await api.put(`/api/translations/${row._id}`, { values: mergedValues });
                    setTranslations(prev =>
                        prev.map(t => t._id === row._id ? { ...t, values: mergedValues as any } : t)
                    );
                    updated++;
                }
            } catch {
                errors++;
            }

            await new Promise(r => setTimeout(r, 400));
        }

        setBulkProgress({ done: missingRows.length, total: missingRows.length });
        toast.success(`Global translate complete: ${updated} updated, ${errors} errors`);
        setBulkTranslating(false);
    };

    return (
        <div className="p-6 max-w-[1600px] mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3 text-white">
                        <div className="p-2 bg-blue-500/20 rounded-xl">
                            <Languages className="w-7 h-7 text-blue-400" />
                        </div>
                        Translation Dictionary
                    </h1>
                    <p className="text-slate-400 mt-2">Manage static texts and localizations dynamically across the platform.</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleGlobalBulkAutoTranslate}
                        disabled={bulkTranslating}
                        className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-violet-900/20 disabled:opacity-50 disabled:cursor-wait text-sm"
                        title="Auto-translate all missing translations across all tabs"
                    >
                        {bulkTranslating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {bulkTranslating && bulkProgress
                            ? `Translating... ${bulkProgress.done}/${bulkProgress.total}`
                            : 'Translate All Pages'}
                    </button>
                    <button 
                        onClick={openNew}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 text-sm"
                    >
                        <Plus size={18} /> Add Key
                    </button>
                </div>
            </div>

            {/* Smart Toolbar */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 p-5 rounded-2xl mb-6 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search translations..."
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-950/50 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                
                {/* BULK AUTO-TRANSLATE BUTTON (Current Tab) */}
                <button
                    onClick={handleBulkAutoTranslate}
                    disabled={bulkTranslating}
                    className="flex items-center gap-2 px-4 py-2.5 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-violet-300 hover:text-violet-200 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-wait shrink-0"
                    title="Auto-translate all rows in this tab that have missing language values"
                >
                    {bulkTranslating
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Sparkles className="w-4 h-4 text-violet-400" />
                    }
                    {bulkTranslating && bulkProgress
                        ? `Translating Tab... ${bulkProgress.done}/${bulkProgress.total}`
                        : 'Auto Translate Tab'
                    }
                </button>
            </div>

            {/* Main Content Area */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl animate-in fade-in duration-500">
                {/* Tabs */}
                <div className="flex gap-2 p-3 bg-slate-950/50 overflow-x-auto custom-scrollbar border-b border-slate-800/80">
                    {namespaces.map(ns => (
                        <button
                            key={ns}
                            onClick={() => setActiveTab(ns)}
                            className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${currentTab === ns ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}`}
                        >
                            <FolderOpen size={16} className={currentTab === ns ? 'text-blue-200' : 'text-slate-500'} />
                            {ns}
                        </button>
                    ))}
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900/60 border-b border-slate-800">
                                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Key Reference</th>
                                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider">English</th>
                                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider">German</th>
                                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Arabic</th>
                                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-16 text-center">
                                        <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
                                        <div className="text-blue-400 font-medium">Loading dictionary...</div>
                                    </td>
                                </tr>
                            ) : filteredTranslations.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-16 text-center text-slate-500">
                                        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl max-w-sm mx-auto">
                                            <Languages className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                                            <h3 className="text-white font-bold mb-2">No keys found</h3>
                                            <p className="text-sm text-slate-400">Try adjusting your search or add a new key to this namespace.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredTranslations.map((t) => (
                                    <tr key={t._id} className="hover:bg-slate-800/30 transition-colors group">
                                        <td className="p-5">
                                            <span className="font-mono text-[13px] px-3 py-1.5 bg-slate-950/80 border border-slate-800 text-blue-400 rounded-lg whitespace-nowrap shadow-inner">
                                                {t.key}
                                            </span>
                                        </td>
                                        <td className="p-5 text-sm font-medium text-slate-300 truncate max-w-[200px]" title={t.values?.en}>{t.values?.en || <span className="text-slate-600 italic">Empty</span>}</td>
                                        <td className="p-5 text-sm font-medium text-slate-300 truncate max-w-[200px]" title={t.values?.de}>{t.values?.de || <span className="text-slate-600 italic">Empty</span>}</td>
                                        <td className="p-5 text-sm font-medium text-slate-300 truncate max-w-[200px]" dir="auto" title={t.values?.ar}>{t.values?.ar || <span className="text-slate-600 italic">Empty</span>}</td>
                                        <td className="p-5 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openEdit(t)} className="p-2 bg-slate-800/50 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 border border-slate-700/50 hover:border-blue-500/30 rounded-xl transition-all" title="Edit row">
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(t._id, t.key)} className="p-2 bg-slate-800/50 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700/50 hover:border-red-500/30 rounded-xl transition-all" title="Delete row">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl relative animate-in zoom-in-95">
                        <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center">
                            <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                                <div className="p-2 bg-blue-500/20 rounded-xl"><Languages className="w-5 h-5 text-blue-400" /></div>
                                {formData._id ? 'Edit Translation' : 'Add New Key'}
                            </h3>
                            <button onClick={() => setShowForm(false)} aria-label="Close dialog" className="text-slate-500 hover:text-white bg-slate-800 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Dictionary Key <span className="text-red-500">*</span></label>
                                    <input 
                                        required
                                        disabled={!!formData._id}
                                        type="text" 
                                        value={formData.key}
                                        onChange={e => setFormData(p => ({ ...p, key: e.target.value }))}
                                        placeholder="e.g. dashboard.title"
                                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    {!formData._id && <p className="text-xs text-slate-500 mt-2">Use dot notation for grouping (e.g., `auth.login.button`)</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Namespace</label>
                                    <input 
                                        type="text" 
                                        value={formData.namespace}
                                        onChange={e => setFormData(p => ({ ...p, namespace: e.target.value }))}
                                        placeholder="e.g. translation, checkout, email"
                                        className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>
                            </div>
                            
                            <div className="p-6 bg-slate-950/50 border border-slate-800 rounded-2xl space-y-6 shadow-inner">
                                <div className="flex justify-between items-center pb-4 border-b border-slate-800/50">
                                    <h4 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Languages className="w-5 h-5 text-slate-400" />
                                        Language Values
                                    </h4>
                                    <button 
                                        type="button" 
                                        onClick={handleAutoTranslate}
                                        disabled={autoTranslating}
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                                    >
                                        {autoTranslating ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4" />}
                                        Auto Translate Missing
                                    </button>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {SUPPORTED_LANGUAGES.map(lang => (
                                        <div key={lang.code} className="space-y-2">
                                            <label className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                                                <span>{lang.label}</span>
                                                <span className="bg-slate-800 px-2 py-0.5 rounded text-[10px]">{lang.code}</span>
                                            </label>
                                            <textarea
                                                dir={lang.code === 'ar' || lang.code === 'fa' ? 'rtl' : 'ltr'}
                                                value={formData.values?.[lang.code as keyof typeof formData.values] || ''}
                                                onChange={e => setFormData(p => ({ 
                                                    ...p, 
                                                    values: { ...(p.values as any), [lang.code]: e.target.value } 
                                                }))}
                                                placeholder={`Missing ${lang.label} translation...`}
                                                className="w-full px-4 py-3 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors min-h-[80px] resize-y shadow-inner"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </form>
                        
                        <div className="px-8 py-6 border-t border-slate-800 flex gap-4 bg-slate-900 rounded-b-3xl">
                            <button 
                                type="button" 
                                onClick={() => setShowForm(false)}
                                className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                {formData._id ? 'Update Key' : 'Save Key'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
