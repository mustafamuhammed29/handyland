import { useState, useEffect } from 'react';
import { Save, FileText, Check, AlertCircle, Eye, Edit3, BookOpen, ShieldCheck, Info, HelpCircle, Users } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { api } from '../utils/api';

const PAGES = [
    { id: 'agb', label: 'AGB', full: 'Geschäftsbedingungen', icon: BookOpen },
    { id: 'datenschutz', label: 'Datenschutz', full: 'Privatsphäre', icon: ShieldCheck },
    { id: 'impressum', label: 'Impressum', full: 'Rechtliches', icon: Info },
    { id: 'kundenservice', label: 'Service', full: 'Hilfe & Kontakt', icon: HelpCircle },
    { id: 'ueber-uns', label: 'Über Uns', full: 'Unsere Story', icon: Users }
];

const QUILL_MODULES = {
    toolbar: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link', 'clean']
    ],
};

const QUILL_FORMATS = [
    'header', 'bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'link'
];

export default function PageManager() {
    const [selectedPage, setSelectedPage] = useState('impressum');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchPage(selectedPage);
    }, [selectedPage]);

    const fetchPage = async (slug: string) => {
        setLoading(true);
        setMessage(null);
        try {
            const response = await api.get(`/api/pages/${slug}`);
            const data = response.data || response;
            setContent(data.content || '');
        } catch (error) {
            console.error('Failed to fetch page:', error);
            setMessage({ type: 'error', text: 'Fehler beim Laden.' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        try {
            await api.post(`/api/pages`, { 
                slug: selectedPage, 
                title: PAGES.find(p => p.id === selectedPage)?.label, 
                content: content 
            });
            setMessage({ type: 'success', text: 'Änderungen gespeichert!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: 'Fehler beim Speichern.' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 pb-10 max-w-[1400px] mx-auto">
            {/* Elegant Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 shadow-xl">
                <div>
                    <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        <FileText className="text-blue-500" /> Inhaltsmanagement
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">Erstellen و bearbeiten Sie Ihre rechtlichen و informativen Seiten.</p>
                </div>
                
                <div className="flex items-center gap-4 w-full lg:w-auto">
                    <div className="bg-slate-950 p-1 rounded-xl flex border border-slate-800 w-full lg:w-auto">
                        <button 
                            onClick={() => setViewMode('edit')}
                            className={`flex-1 lg:px-6 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${viewMode === 'edit' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <Edit3 size={14} /> Editor
                        </button>
                        <button 
                            onClick={() => setViewMode('preview')}
                            className={`flex-1 lg:px-6 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${viewMode === 'preview' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <Eye size={14} /> Vorschau
                        </button>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20 whitespace-nowrap"
                    >
                        {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save size={18} />}
                        {saving ? '...' : 'Speichern'}
                    </button>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                    {message.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                    <span className="text-sm font-bold uppercase tracking-wide">{message.text}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Compact Sidebar */}
                <div className="lg:col-span-3 space-y-2">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 ml-2">Dokumente</p>
                    {PAGES.map(page => (
                        <button
                            key={page.id}
                            onClick={() => setSelectedPage(page.id)}
                            className={`w-full text-left p-3 rounded-xl transition-all border ${selectedPage === page.id
                                ? 'bg-blue-600/10 text-blue-400 border-blue-500/40 shadow-inner'
                                : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300 border-transparent'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg shrink-0 ${selectedPage === page.id ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-900 text-slate-600'}`}>
                                    <page.icon size={18} />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="font-bold text-sm truncate">{page.label}</p>
                                    <p className={`text-[10px] truncate ${selectedPage === page.id ? 'text-blue-500/60' : 'text-slate-600'}`}>{page.full}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-9">
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden min-h-[700px] shadow-2xl relative">
                        {loading ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 bg-slate-950/80 backdrop-blur-sm z-10">
                                <div className="w-12 h-12 border-2 border-slate-800 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                                <p className="text-xs font-black uppercase tracking-widest">Daten werden geladen</p>
                            </div>
                        ) : null}

                        {viewMode === 'edit' ? (
                            <div className="quill-container h-[700px]">
                                <ReactQuill
                                    theme="snow"
                                    value={content}
                                    onChange={setContent}
                                    modules={QUILL_MODULES}
                                    formats={QUILL_FORMATS}
                                    className="h-full text-white"
                                    placeholder="Inhalt hier eingeben..."
                                />
                                <style>{`
                                    .quill { height: 100%; display: flex; flex-direction: column; }
                                    .ql-container { flex: 1; border: none !important; font-size: 16px; background: transparent; }
                                    .ql-toolbar { border: none !important; border-bottom: 1px solid #1e293b !important; background: #0f172a; padding: 15px !important; }
                                    .ql-editor { color: #94a3b8; padding: 40px !important; line-height: 2; font-family: 'Inter', sans-serif; }
                                    .ql-editor.ql-blank::before { color: #334155 !important; font-style: normal !important; left: 40px !important; top: 40px !important; }
                                    .ql-snow .ql-stroke { stroke: #64748b !important; stroke-width: 2px; }
                                    .ql-snow .ql-fill { fill: #64748b !important; }
                                    .ql-snow .ql-picker { color: #64748b !important; font-weight: bold; }
                                    .ql-snow .ql-picker-options { background-color: #0f172a !important; border-color: #1e293b !important; border-radius: 8px; }
                                `}</style>
                            </div>
                        ) : (
                            <div className="p-12 text-slate-400">
                                <div className="max-w-4xl mx-auto">
                                    <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-800">
                                        <div className="p-3 bg-blue-600/10 rounded-2xl text-blue-500">
                                            {(() => {
                                                const Icon = PAGES.find(p => p.id === selectedPage)?.icon || FileText;
                                                return <Icon size={32} />;
                                            })()}
                                        </div>
                                        <div>
                                            <h1 className="text-4xl font-black text-white tracking-tight">
                                                {PAGES.find(p => p.id === selectedPage)?.label}
                                            </h1>
                                            <p className="text-slate-500 font-medium uppercase tracking-[0.3em] text-[10px] mt-1">
                                                {PAGES.find(p => p.id === selectedPage)?.full}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div 
                                        className="prose prose-invert max-w-none prose-p:leading-loose prose-p:mb-6 prose-headings:text-white prose-strong:text-blue-400 whitespace-pre-wrap text-lg leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: content }} 
                                    />
                                    
                                    {(!content || content === '<p><br></p>') && (
                                        <div className="text-center py-32 border-2 border-dashed border-slate-800 rounded-3xl">
                                            <p className="text-slate-600 font-bold italic">Kein Inhalt vorhanden. Wechseln Sie zum Editor, um Text hinzuzufügen.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
