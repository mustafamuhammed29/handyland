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
};

// Smart Variable Mock Data
const MOCK_DATA: Record<string, string> = {
    '{{user_name}}': 'أحمد العميل',
    '{{name}}': 'أحمد العميل',
    '{{reset_url}}': 'https://handyland.com/reset-password/sample-token',
    '{{verification_url}}': 'https://handyland.com/verify/sample-token',
    '{{amount}}': '€299.00',
    '{{order_id}}': '#HL-849201',
    '{{date}}': new Date().toLocaleDateString('ar-EG'),
};

const renderWithMockData = (html: string) => {
    let output = html;
    // Highlight mock variables with a nice light blue background in the preview
    Object.keys(MOCK_DATA).forEach(key => {
        const regex = new RegExp(key.replace(/[{}]/g, '\\$&'), 'g');
        output = output.replace(regex, `<span style="background-color: #dbeafe; color: #1e3a8a; padding: 2px 6px; border-radius: 4px; font-weight: 600; font-size: 0.9em; margin: 0 2px;">${MOCK_DATA[key]}</span>`);
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
            <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-3 tracking-tight">
                        <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                            <Mail size={28} />
                        </div>
                        Email Studio
                    </h1>
                    <p className="text-slate-400 mt-2 font-medium">Design and manage automated system email templates with live preview.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64 bg-slate-900/40 rounded-3xl border border-slate-800 backdrop-blur-md">
                    <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                </div>
            ) : selectedTemplate ? (
                /* ─── Premium Side-by-Side Editor View ─── */
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                    {/* Editor Toolbar */}
                    <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-700/50 backdrop-blur-xl shadow-lg">
                        <div className="flex items-center gap-4 pl-2">
                            <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center">
                                <LayoutTemplate size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-white">
                                    {TEMPLATE_LABELS[selectedTemplate.name] || selectedTemplate.name}
                                </h2>
                                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{selectedTemplate.description}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={cancelEdit}
                                className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-sm font-bold transition-colors border border-slate-600/50 hover:border-slate-500"
                            >
                                <X size={16} /> Cancel
                            </button>
                            <button
                                onClick={saveTemplate}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(59,130,246,0.4)]"
                            >
                                <Save size={16} /> {saving ? 'Saving...' : 'Publish Template'}
                            </button>
                        </div>
                    </div>

                    {/* Subject Setup */}
                    <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-lg">
                        <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Email Subject Line</label>
                        <input
                            type="text"
                            value={editSubject}
                            onChange={e => setEditSubject(e.target.value)}
                            title="Email Subject Line"
                            placeholder="Enter the email subject line..."
                            className="w-full px-5 py-3.5 bg-slate-900/60 border border-slate-600 rounded-xl text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner"
                        />
                        {/* Variables List */}
                        <div className="flex flex-wrap gap-2 items-center mt-4">
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mr-2">Available Variables:</span>
                            {selectedTemplate.variables.map(v => (
                                <span key={v} onClick={() => setEditHtml(prev => prev + ' ' + v)} className="cursor-pointer hover:bg-blue-500/30 text-xs font-mono bg-blue-500/10 border border-blue-500/30 text-blue-400 px-2.5 py-1 rounded-md transition-colors" title="Click to insert">
                                    {v}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Split Pane Editor / Preview */}
                    <div className="flex flex-col xl:flex-row gap-6 h-[calc(100vh-350px)] min-h-[600px]">
                        
                        {/* Left: IDE Code Editor */}
                        <div className="flex-1 bg-[#1e1e1e] rounded-2xl border border-slate-700/50 flex flex-col overflow-hidden shadow-2xl relative">
                            {/* Editor Header */}
                            <div className="px-5 py-3 bg-[#252526] border-b border-[#3c3c3c] flex items-center justify-between">
                                <span className="text-slate-300 text-sm font-mono flex items-center gap-2">
                                    <Code size={16} className="text-blue-400" /> template.html
                                </span>
                                <span className="text-xs font-medium text-slate-500 bg-[#333333] px-2 py-0.5 rounded">HTML</span>
                            </div>
                            {/* Editor Body */}
                            <div className="flex-1 relative">
                                {/* Line numbers (Mock UI) */}
                                <div className="absolute left-0 top-0 bottom-0 w-12 bg-[#1e1e1e] border-r border-[#333] text-[#858585] text-xs font-mono text-right pr-2 pt-5 select-none opacity-50 hidden sm:block">
                                    {Array.from({ length: 50 }).map((_, i) => <div key={i} className="leading-6">{i + 1}</div>)}
                                </div>
                                <textarea
                                    value={editHtml}
                                    onChange={e => setEditHtml(e.target.value)}
                                    spellCheck={false}
                                    className="w-full h-full bg-transparent text-[#d4d4d4] p-5 sm:pl-16 font-mono text-[13px] leading-6 focus:outline-none resize-none custom-scrollbar"
                                    placeholder="Write your HTML here..."
                                />
                            </div>
                        </div>

                        {/* Right: Live Mockup Preview */}
                        <div className="w-full xl:w-[450px] 2xl:w-[500px] bg-slate-100 rounded-2xl border border-slate-700/50 flex flex-col overflow-hidden shadow-2xl relative shrink-0">
                            {/* Window Header */}
                            <div className="bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Smartphone size={18} className="text-slate-400" />
                                    <span className="text-sm font-bold">Live Preview</span>
                                </div>
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                                    <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                                    <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                                </div>
                            </div>
                            
                            {/* Phone Frame Setup */}
                            <div className="flex-1 bg-slate-100 p-4 md:p-8 overflow-y-auto custom-scrollbar-light flex justify-center">
                                {/* Email Container */}
                                <div className="w-full max-w-[400px] h-fit bg-white rounded-xl shadow-[0_5px_20px_rgba(0,0,0,0.05)] border border-slate-200 overflow-hidden">
                                    {/* Email Header */}
                                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                                        <div className="flex justify-between items-start mb-2">
                                            <p className="text-xs font-semibold text-slate-800">HandyLand <span className="text-slate-400 font-normal">&lt;noreply@handyland.com&gt;</span></p>
                                            <p className="text-[10px] text-slate-400">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                        <p className="text-sm font-black text-slate-800">
                                            {editSubject ? editSubject : <span className="text-slate-300 italic">No subject</span>}
                                        </p>
                                    </div>
                                    
                                    {/* Email Body rendered with mock logic */}
                                    <div className="p-5 text-sm text-slate-700 leading-relaxed overflow-x-hidden">
                                        <div dangerouslySetInnerHTML={{ __html: renderWithMockData(editHtml) }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* ─── Premium Templates List ─── */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {templates.map(template => (
                        <div
                            key={template._id}
                            className={`group bg-gradient-to-br from-slate-900/60 to-slate-800/30 border border-slate-700/50 hover:border-blue-500/50 rounded-2xl p-7 backdrop-blur-md transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] relative overflow-hidden flex flex-col`}
                        >
                            {/* Ambient background glow */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none transition-opacity opacity-50 group-hover:opacity-100"></div>
                            
                            <div className="flex items-start justify-between mb-5 relative z-10">
                                <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-3xl shadow-inner group-hover:bg-blue-500/10 group-hover:border-blue-500/30 transition-colors">
                                    {template.name === 'verify_email' ? '✉️' : template.name === 'reset_password' ? '🔐' : '🛍️'}
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm ${template.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                                    {template.isActive ? 'Active' : 'Disabled'}
                                </span>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2 relative z-10">
                                {TEMPLATE_LABELS[template.name] || template.name}
                            </h3>
                            <p className="text-sm text-slate-400 mb-4 flex-1 relative z-10">{template.description}</p>
                            
                            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 mb-6 relative z-10">
                                <p className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">Subject Line</p>
                                <p className="text-sm text-slate-300 font-medium truncate">{template.subject}</p>
                            </div>

                            <button
                                onClick={() => startEdit(template)}
                                className="w-full py-3.5 flex items-center justify-center gap-2 bg-slate-800 hover:bg-blue-600 text-white rounded-xl text-sm font-bold transition-all group-hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] relative z-10"
                            >
                                <Settings size={18} /> Configure Template
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EmailManager;
