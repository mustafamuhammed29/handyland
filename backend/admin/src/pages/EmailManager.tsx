import React, { useState, useEffect } from 'react';
import { Save, X, CheckCircle, AlertCircle, Code, Smartphone, Mail, Settings, LayoutTemplate } from 'lucide-react';
import { api } from '../utils/api';

interface EmailTemplate {
    _id: string;
    name: string;
    description: string;
    subject: string;
    html: string;
    variables: string[];
    isActive: boolean;
}

const TEMPLATE_LABELS: Record<string, string> = {
    verify_email: 'تأكيد البريد الإلكتروني',
    reset_password: 'إعادة تعيين كلمة المرور',
    order_confirmation: 'تأكيد الطلب',
    sell_device_confirmation: 'تأكيد عملية بيع جهاز'
};

// Smart Variable Mock Data
const MOCK_DATA: Record<string, string> = {
    '{{user_name}}': 'أحمد العميل',
    '{{userName}}': 'أحمد العميل',
    '{{name}}': 'أحمد العميل',
    '{{customerName}}': 'أحمد العميل',
    '{{device}}': 'iPhone 15 Pro Max',
    '{{price}}': '850',
    '{{quoteRef}}': 'HV-170123-ABCD',
    '{{bankName}}': 'Deutsche Bank',
    '{{ibanSnippet}}': '1234',
    '{{reset_url}}': 'https://handyland.com/reset-password/sample-token',
    '{{verification_url}}': 'https://handyland.com/verify/sample-token',
    '{{verificationUrl}}': 'https://handyland.com/verify/sample-token',
    '{{resetUrl}}': 'https://handyland.com/reset-password/sample-token',
    '{{amount}}': '€299.00',
    '{{totalAmount}}': '299.00',
    '{{order_id}}': '#HL-849201',
    '{{orderNumber}}': '#HL-849201',
    '{{date}}': new Date().toLocaleDateString('ar-EG'),
};

const renderWithMockData = (html: string) => {
    if (!html) return '';
    let output = html;
    // Highlight mock variables with a nice light blue background in the preview
    Object.keys(MOCK_DATA).forEach(key => {
        const regex = new RegExp(key.replace(/[{}]/g, '\\$&'), 'g');
        output = output.replace(regex, `<span style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 2px 8px; border-radius: 6px; font-weight: bold; font-size: 0.9em; margin: 0 4px; box-shadow: 0 4px 10px rgba(16,185,129,0.2); white-space: nowrap;">${MOCK_DATA[key]}</span>`);
    });
    return output;
};

const EmailManager: React.FC = () => {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
    const [editSubject, setEditSubject] = useState('');
    const [editHtml, setEditHtml] = useState('');
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchTemplates(); }, []);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const response = await api.get('/api/email-templates');
            const data = (response as any)?.data || response;
            if (data.success) setTemplates(data.data);
        } catch (err) {
            console.error('Failed to load email templates', err);
        } finally {
            setLoading(false);
        }
    };

    const showNotification = (type: 'success' | 'error', text: string) => {
        setNotification({ type, text });
        setTimeout(() => setNotification(null), 4000);
    };

    const startEdit = (template: EmailTemplate) => {
        setSelectedTemplate(template);
        setEditSubject(template.subject);
        setEditHtml(template.html);
    };

    const cancelEdit = () => {
        setSelectedTemplate(null);
    };

    const saveTemplate = async () => {
        if (!selectedTemplate) return;
        setSaving(true);
        try {
            const response = await api.put(`/api/email-templates/${selectedTemplate._id}`, {
                subject: editSubject,
                html: editHtml
            });
            const data = (response as any)?.data || response;
            if (data.success) {
                showNotification('success', '✅ تم حفظ القالب بنجاح!');
                setTemplates(prev => prev.map(t => t._id === selectedTemplate._id ? data.data : t));
                cancelEdit();
            } else {
                showNotification('error', data.message || 'فشل الحفظ');
            }
        } catch (err) {
            showNotification('error', 'حدث خطأ أثناء الاتصال بالخادم');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-8 pb-20 min-h-screen">
            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl border text-sm font-bold transition-all animate-in slide-in-from-top-5 ${notification.type === 'success'
                    ? 'bg-emerald-900/90 border-emerald-500/50 text-emerald-300 backdrop-blur-md'
                    : 'bg-red-900/90 border-red-500/50 text-red-300 backdrop-blur-md'
                    }`}>
                    {notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    {notification.text}
                </div>
            )}

            {/* Header */}
            <div className="mb-12 relative">
                <div className="absolute top-1/2 left-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full -translate-y-1/2 pointer-events-none"></div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.3)] ring-1 ring-white/10 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
                            <Mail size={32} className="text-white relative z-10" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-tight mb-1">
                                Email Studio <span className="text-blue-500 text-5xl leading-none">.</span>
                            </h1>
                            <p className="text-slate-400 font-medium tracking-wide">Design and automate your system emails with live rendering.</p>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-[50vh] bg-slate-900/30 rounded-[2rem] border border-slate-800/60 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-500/5 pulse-slow"></div>
                    <div className="relative z-10 flex flex-col items-center gap-4">
                        <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                        <span className="text-blue-400 font-bold tracking-widest uppercase text-sm animate-pulse">Loading Studio...</span>
                    </div>
                </div>
            ) : selectedTemplate ? (
                /* ─── Premium Side-by-Side Editor View ─── */
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 relative z-10">
                    {/* Editor Toolbar */}
                    <div className="flex flex-col md:flex-row items-center justify-between bg-slate-900/80 p-5 rounded-3xl border border-slate-700/60 backdrop-blur-2xl shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
                        <div className="flex items-center gap-5 w-full md:w-auto mb-4 md:mb-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500/30 to-indigo-500/30 text-blue-400 rounded-2xl flex items-center justify-center ring-1 ring-blue-500/20 shadow-inner group-hover:scale-110 transition-transform">
                                <LayoutTemplate size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-white tracking-wide">
                                    {TEMPLATE_LABELS[selectedTemplate.name] || selectedTemplate.name}
                                </h2>
                                <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">{selectedTemplate.description}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <button
                                onClick={cancelEdit}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-slate-800/80 hover:bg-slate-700 hover:text-white text-slate-300 rounded-2xl text-sm font-black uppercase tracking-wider transition-all border border-slate-600/50 hover:border-slate-500 hover:shadow-lg"
                            >
                                <X size={18} /> Cancel
                            </button>
                            <button
                                onClick={saveTemplate}
                                disabled={saving}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-sm font-black uppercase tracking-wider transition-all disabled:opacity-50 shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:shadow-[0_0_40px_rgba(59,130,246,0.7)]"
                            >
                                <Save size={18} /> {saving ? 'Saving...' : 'Publish'}
                            </button>
                        </div>
                    </div>

                    {/* Subject Setup */}
                    <div className="bg-slate-900/60 backdrop-blur-2xl border border-slate-700/60 rounded-3xl p-8 shadow-2xl relative overflow-hidden group hover:border-slate-600/80 transition-colors">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[60px] pointer-events-none group-hover:bg-indigo-500/10 transition-colors"></div>
                        <label className="block text-sm font-black text-slate-300 mb-3 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span> Email Subject
                        </label>
                        <input
                            type="text"
                            value={editSubject}
                            onChange={e => setEditSubject(e.target.value)}
                            title="Email Subject Line"
                            placeholder="Enter the email subject line..."
                            className="w-full px-6 py-4 bg-slate-950/80 border-2 border-slate-800 rounded-2xl text-xl text-white font-bold focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner placeholder-slate-600"
                        />
                        {/* Variables List */}
                        <div className="flex flex-wrap gap-2.5 items-center mt-6">
                            <span className="text-xs text-slate-500 font-bold uppercase tracking-widest mr-3">Insert Variables:</span>
                            {selectedTemplate.variables.map(v => (
                                <button
                                    key={v} 
                                    onClick={() => setEditHtml(prev => prev + ' ' + v)} 
                                    className="cursor-pointer hover:-translate-y-0.5 hover:bg-indigo-500 hover:text-white hover:border-indigo-400 text-xs font-mono font-bold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 px-3 py-1.5 rounded-lg transition-all shadow-sm active:translate-y-0" 
                                    title={`Insert ${v}`}
                                >
                                    {v}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Split Pane Editor / Preview */}
                    <div className="flex flex-col xl:flex-row gap-6 h-[calc(100vh-400px)] min-h-[700px]">
                        
                        {/* Left: IDE Code Editor */}
                        <div className="flex-1 bg-[#0f111a] rounded-[2rem] border border-slate-700/60 flex flex-col overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.5)] relative">
                            {/* Editor Header */}
                            <div className="px-6 py-4 bg-[#1a1d27] border-b border-[#2d313f] flex items-center justify-between">
                                <span className="text-slate-300 text-sm font-black tracking-wider uppercase flex items-center gap-3">
                                    <div className="p-1.5 bg-[#2d313f] rounded-lg"><Code size={18} className="text-blue-400" /></div> HTML Source / Template
                                </span>
                                <div className="flex gap-2">
                                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                                </div>
                            </div>
                            {/* Editor Body */}
                            <div className="flex-1 relative group">
                                {/* Line numbers */}
                                <div className="absolute left-0 top-0 bottom-0 w-14 bg-[#13151f] border-r border-[#2d313f] text-[#4b5563] text-xs font-mono text-right pr-3 pt-6 select-none opacity-50 hidden sm:block pointer-events-none">
                                    {Array.from({ length: 60 }).map((_, i) => <div key={i} className="leading-7">{i + 1}</div>)}
                                </div>
                                <textarea
                                    value={editHtml}
                                    onChange={e => setEditHtml(e.target.value)}
                                    spellCheck={false}
                                    className="w-full h-full bg-transparent text-[#e0e7ff] p-6 sm:pl-20 font-mono text-sm leading-7 focus:outline-none resize-none custom-scrollbar-light selection:bg-blue-500/30"
                                    placeholder="Write your HTML here..."
                                />
                                <div className="absolute bottom-4 right-4 bg-blue-500/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider shadow-lg opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none">
                                    Live Sync Active
                                </div>
                            </div>
                        </div>

                        {/* Right: Live Mockup Preview */}
                        <div className="w-full xl:w-[500px] 2xl:w-[550px] bg-gradient-to-b from-slate-200 to-slate-300 rounded-[2rem] border-[8px] border-slate-800 flex flex-col overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative shrink-0 ring-4 ring-slate-900 mx-auto max-w-full">
                            {/* Device Inner Shadow Base */}
                            <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.2)] pointer-events-none z-20"></div>

                            {/* Window Header (Mobile Notch Mock) */}
                            <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between relative z-10 shadow-sm">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-6 bg-slate-800 rounded-b-3xl"></div>
                                <div className="flex items-center gap-2 text-slate-800 font-bold pt-2">
                                    <Smartphone size={20} className="text-blue-500" />
                                    <span>Mail Inbox</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-400 font-bold text-xs pt-2">
                                    <span>9:41</span>
                                    <div className="w-6 h-3 border-2 border-slate-400 rounded-sm relative">
                                        <div className="absolute left-0.5 top-0.5 bottom-0.5 right-1 bg-slate-800 rounded-[1px]"></div>
                                        <div className="absolute -right-1 top-1 bottom-1 w-0.5 bg-slate-400 rounded-r-sm"></div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Phone Frame Setup */}
                            <div className="flex-1 bg-slate-100 p-0 overflow-y-auto custom-scrollbar-light relative z-10">
                                {/* Email Container */}
                                <div className="w-full h-auto min-h-full bg-white relative">
                                    {/* Email Header */}
                                    <div className="p-6 border-b border-slate-100 bg-white">
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg shrink-0">
                                                H
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <p className="font-bold text-slate-900 text-base truncate">HandyLand Support</p>
                                                    <p className="text-xs text-slate-400 font-semibold shrink-0 pt-1 block">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                </div>
                                                <p className="text-xs text-slate-500 truncate block">to {MOCK_DATA['{{user_name}}']} &lt;user@example.com&gt;</p>
                                            </div>
                                        </div>
                                        <h2 className="text-xl font-black text-slate-900 leading-tight">
                                            {editSubject ? renderWithMockData(editSubject).replace(/<[^>]*>?/gm, (match) => { return match; }) : <span className="text-slate-300 italic">No Subject</span>}
                                        </h2>
                                    </div>
                                    
                                    {/* Email Body rendered with mock logic */}
                                    <div className="p-6 text-slate-800 leading-relaxed overflow-x-hidden text-base preview-content">
                                        <div dangerouslySetInnerHTML={{ __html: renderWithMockData(editHtml) }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* ─── Premium Templates List ─── */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {templates.map((template, i) => (
                        <div
                            key={template._id}
                            style={{ animationDelay: `${i * 100}ms` }}
                            className="group bg-gradient-to-br from-slate-900/90 to-slate-800/80 border border-slate-700/60 hover:border-blue-500/60 rounded-[2rem] p-8 backdrop-blur-2xl transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(59,130,246,0.15)] relative overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-8"
                        >
                            {/* Ambient background glow */}
                            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[60px] -mr-10 -mt-10 pointer-events-none transition-all duration-700 group-hover:bg-blue-500/20 group-hover:scale-150"></div>
                            
                            <div className="flex items-start justify-between mb-8 relative z-10">
                                <div className="w-16 h-16 rounded-2xl bg-slate-950 border border-slate-700/80 flex items-center justify-center text-3xl shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] group-hover:bg-gradient-to-br group-hover:from-blue-600 group-hover:to-indigo-600 group-hover:border-transparent transition-all duration-500 group-hover:shadow-[0_10px_30px_rgba(59,130,246,0.4)] group-hover:text-white">
                                    {template.name === 'verify_email' ? <Mail size={30} /> : template.name === 'reset_password' ? '🔐' : template.name === 'sell_device_confirmation' ? '📦' : '🛍️'}
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-inner ${template.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                                    {template.isActive ? 'Active Mode' : 'Disabled'}
                                </span>
                            </div>

                            <h3 className="text-2xl font-black text-white mb-3 relative z-10 tracking-wide">
                                {TEMPLATE_LABELS[template.name] || template.name}
                            </h3>
                            <p className="text-sm text-slate-400 mb-8 flex-1 relative z-10 leading-relaxed font-medium">{template.description}</p>
                            
                            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 mb-8 relative z-10 shadow-inner group-hover:border-slate-700 transition-colors">
                                <p className="text-[11px] text-blue-400 font-black mb-1.5 uppercase tracking-widest flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Subject Line</p>
                                <p className="text-sm text-slate-300 font-medium truncate">{template.subject}</p>
                            </div>

                            <button
                                onClick={() => startEdit(template)}
                                className="w-full py-4 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-all group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-indigo-500 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] relative z-10 border border-slate-700 group-hover:border-transparent"
                            >
                                <Settings size={18} /> Modify Template
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EmailManager;
