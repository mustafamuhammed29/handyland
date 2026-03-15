import React, { useState, useEffect } from 'react';
import { Languages, Search, Plus, Save, Loader2, Trash2, Edit3, X } from 'lucide-react';
import { api } from '../utils/api';

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
    
    // Modal states
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<Partial<TranslationDoc>>({
        key: '',
        namespace: 'translation',
        values: { en: '', de: '', ar: '', tr: '', ru: '', fa: '' }
    });

    useEffect(() => {
        fetchTranslations();
    }, []);

    const fetchTranslations = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/translations');
            setTranslations(res.data.data);
        } catch (error) {
            console.error('Failed to fetch translations', error);
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
            } else {
                await api.post('/api/translations', formData);
            }
            setShowForm(false);
            fetchTranslations();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to save translation');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string, key: string) => {
        if (!window.confirm(`Are you sure you want to delete the key "${key}"?`)) return;
        try {
            await api.delete(`/api/translations/${id}`);
            setTranslations(prev => prev.filter(t => t._id !== id));
        } catch (error) {
            console.error('Failed to delete', error);
        }
    };

    const openEdit = (t: TranslationDoc) => {
        setFormData(t);
        setShowForm(true);
    };

    const openNew = () => {
        setFormData({
            key: '',
            namespace: 'translation',
            values: { en: '', de: '', ar: '', tr: '', ru: '', fa: '' }
        });
        setShowForm(true);
    };

    const filteredTranslations = translations.filter(t => 
        t.key.toLowerCase().includes(searchQuery.toLowerCase()) || 
        Object.values(t.values).some(v => typeof v === 'string' && v.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Languages className="w-8 h-8 text-blue-500" />
                        Translation Dictionary
                    </h1>
                    <p className="text-slate-400 mt-1">Manage static texts and localizations dynamically.</p>
                </div>
                
                <button 
                    onClick={openNew}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" /> Add Key
                </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                {/* Header Actions */}
                <div className="p-4 border-b border-slate-800 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search keys or translated values..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-800/50">
                                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Key Reference</th>
                                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">German</th>
                                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">English</th>
                                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Arabic</th>
                                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        Loading dictionary...
                                    </td>
                                </tr>
                            ) : filteredTranslations.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">
                                        No translation keys found.
                                    </td>
                                </tr>
                            ) : (
                                filteredTranslations.map((t) => (
                                    <tr key={t._id} className="hover:bg-slate-800/30 transition-colors">
                                        <td className="p-4">
                                            <span className="font-mono text-xs px-2 py-1 bg-slate-800 text-blue-400 rounded-lg whitespace-nowrap">
                                                {t.key}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-slate-300 truncate max-w-[200px]" title={t.values?.de}>{t.values?.de || '-'}</td>
                                        <td className="p-4 text-sm text-slate-300 truncate max-w-[200px]" title={t.values?.en}>{t.values?.en || '-'}</td>
                                        <td className="p-4 text-sm text-slate-300 truncate max-w-[200px]" dir="auto" title={t.values?.ar}>{t.values?.ar || '-'}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2 text-slate-400">
                                                <button onClick={() => openEdit(t)} className="p-2 hover:bg-slate-800 hover:text-blue-400 rounded-lg transition-colors" title="Edit row">
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(t._id, t.key)} className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-colors" title="Delete row">
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
                        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Languages className="w-5 h-5 text-blue-500" />
                                {formData._id ? 'Edit Translation' : 'Add New Key'}
                            </h3>
                            <button onClick={() => setShowForm(false)} aria-label="Close dialog" className="text-slate-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Dictionary Key / Token (e.g. `nav.home`)</label>
                                    <input 
                                        required
                                        disabled={!!formData._id}
                                        type="text" 
                                        value={formData.key}
                                        onChange={e => setFormData(p => ({ ...p, key: e.target.value }))}
                                        placeholder="dashboard.title"
                                        className="w-full px-4 py-2.5 bg-slate-800 border-none rounded-xl text-white font-mono text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all disabled:opacity-50"
                                    />
                                </div>
                                
                                <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-xl space-y-4">
                                    <h4 className="text-sm font-semibold text-white mb-2">Language Values</h4>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {SUPPORTED_LANGUAGES.map(lang => (
                                            <div key={lang.code}>
                                                <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase">{lang.label} ({lang.code})</label>
                                                <textarea
                                                    dir={lang.code === 'ar' || lang.code === 'fa' ? 'rtl' : 'ltr'}
                                                    value={formData.values?.[lang.code as keyof typeof formData.values] || ''}
                                                    onChange={e => setFormData(p => ({ 
                                                        ...p, 
                                                        values: { ...(p.values as any), [lang.code]: e.target.value } 
                                                    }))}
                                                    placeholder={`Missing ${lang.label} translation...`}
                                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm outline-none focus:border-blue-500 transition-colors min-h-[60px] resize-y"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </form>
                        
                        <div className="px-6 py-4 border-t border-slate-800 flex gap-3 justify-end">
                            <button 
                                type="button" 
                                onClick={() => setShowForm(false)}
                                className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {formData._id ? 'Update Key' : 'Save Key'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
