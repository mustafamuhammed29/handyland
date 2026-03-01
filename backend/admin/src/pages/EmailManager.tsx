import React, { useState, useEffect } from 'react';
import { Edit3, Save, X, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

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
    verify_email: '✉️ تأكيد البريد الإلكتروني',
    reset_password: '🔑 إعادة تعيين كلمة المرور',
    order_confirmation: '🛒 تأكيد الطلب',
};

const EmailManager: React.FC = () => {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [editSubject, setEditSubject] = useState('');
    const [editHtml, setEditHtml] = useState('');
    const [preview, setPreview] = useState(false);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchTemplates(); }, []);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_URL}/email-templates`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setTemplates(data.data);
        } catch (err) {
            showNotification('error', 'Failed to load email templates');
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
        setEditMode(true);
        setPreview(false);
    };

    const cancelEdit = () => {
        setEditMode(false);
        setPreview(false);
    };

    const saveTemplate = async () => {
        if (!selectedTemplate) return;
        setSaving(true);
        try {
            const token = localStorage.getItem('adminToken');
            const res = await fetch(`${API_URL}/email-templates/${selectedTemplate._id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ subject: editSubject, html: editHtml })
            });
            const data = await res.json();
            if (data.success) {
                showNotification('success', '✅ تم حفظ القالب بنجاح!');
                setTemplates(prev => prev.map(t => t._id === selectedTemplate._id ? data.data : t));
                setEditMode(false);
            } else {
                showNotification('error', data.message || 'Failed to save template');
            }
        } catch (err) {
            showNotification('error', 'Error saving template');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="p-6 min-h-screen">
            {/* Notification */}
            {notification && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border text-sm font-semibold transition-all animate-pulse ${notification.type === 'success'
                    ? 'bg-green-600/20 border-green-500/50 text-green-300'
                    : 'bg-red-600/20 border-red-500/50 text-red-300'
                    }`}>
                    {notification.type === 'success'
                        ? <CheckCircle className="w-5 h-5" />
                        : <AlertCircle className="w-5 h-5" />
                    }
                    {notification.text}
                </div>
            )}

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-black text-white mb-2 flex items-center gap-3">
                    <span className="text-3xl">📧</span> إدارة قوالب البريد الإلكتروني
                </h1>
                <p className="text-slate-400">قم بتخصيص نصوص رسائل البريد الإلكتروني المُرسَلة تلقائياً من النظام</p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
            ) : editMode && selectedTemplate ? (
                /* ─── Edit View ─── */
                <div className="space-y-6">
                    {/* Back + Title */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {TEMPLATE_LABELS[selectedTemplate.name] || selectedTemplate.name}
                            </h2>
                            <p className="text-slate-400 text-sm mt-1">{selectedTemplate.description}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setPreview(!preview)}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
                            >
                                {preview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                {preview ? 'المحرر' : 'معاينة'}
                            </button>
                            <button
                                onClick={cancelEdit}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
                            >
                                <X className="w-4 h-4" /> إلغاء
                            </button>
                            <button
                                onClick={saveTemplate}
                                disabled={saving}
                                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" /> {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                            </button>
                        </div>
                    </div>

                    {/* Subject */}
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-6">
                        <label className="block text-sm font-semibold text-slate-300 mb-2">عنوان الرسالة (Subject)</label>
                        <input
                            type="text"
                            value={editSubject}
                            onChange={e => setEditSubject(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>

                    {/* Variables hint */}
                    <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-xs text-slate-500 font-medium">المتغيرات المتاحة:</span>
                        {selectedTemplate.variables.map(v => (
                            <span key={v} className="text-xs font-mono bg-blue-600/10 border border-blue-500/30 text-blue-400 px-2 py-1 rounded">{v}</span>
                        ))}
                    </div>

                    {/* HTML Editor / Preview */}
                    <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800">
                            <h3 className="text-sm font-semibold text-slate-300">
                                {preview ? '👁 معاينة الرسالة' : '✏️ محتوى HTML'}
                            </h3>
                        </div>
                        {preview ? (
                            <div className="p-6 bg-white text-slate-900 rounded-b-xl">
                                <div dangerouslySetInnerHTML={{ __html: editHtml }} />
                            </div>
                        ) : (
                            <textarea
                                value={editHtml}
                                onChange={e => setEditHtml(e.target.value)}
                                rows={18}
                                className="w-full px-6 py-4 bg-transparent text-slate-200 font-mono text-sm focus:outline-none resize-y"
                                placeholder="أدخل كود HTML الخاص بالرسالة..."
                            />
                        )}
                    </div>
                </div>
            ) : (
                /* ─── Templates List ─── */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {templates.map(template => (
                        <div
                            key={template._id}
                            className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-6 hover:border-slate-600 transition-all group"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-2xl">
                                    {template.name === 'verify_email' ? '✉️' : template.name === 'reset_password' ? '🔑' : '🛒'}
                                </div>
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${template.isActive ? 'bg-green-600/20 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                                    {template.isActive ? 'نشط' : 'معطّل'}
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-white mb-1">
                                {TEMPLATE_LABELS[template.name] || template.name}
                            </h3>
                            <p className="text-sm text-slate-400 mb-3">{template.description}</p>
                            <p className="text-xs text-slate-500 font-mono truncate mb-5">📌 {template.subject}</p>

                            <div className="flex flex-wrap gap-1 mb-5">
                                {template.variables.map(v => (
                                    <span key={v} className="text-xs font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded">{v}</span>
                                ))}
                            </div>

                            <button
                                onClick={() => startEdit(template)}
                                className="w-full py-2.5 flex items-center justify-center gap-2 bg-blue-600/10 border border-blue-500/30 text-blue-400 hover:bg-blue-600/20 rounded-lg text-sm font-semibold transition-all group-hover:border-blue-400"
                            >
                                <Edit3 className="w-4 h-4" /> تعديل القالب
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EmailManager;
