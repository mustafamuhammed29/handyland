import React, { useState, useEffect } from 'react';
import { Send, FileText } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

interface EmailTemplate {
    id: string;
    name: string;
    description: string;
    subject: string;
}

const EmailManager: React.FC = () => {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [recipientEmail, setRecipientEmail] = useState('');
    const [sending, setSending] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_URL}/emails/templates`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            if (data.success) {
                setTemplates(data.templates);
            }
        } catch (error) {
            console.error('Error fetching templates:', error);
        }
    };

    const sendTestEmail = async () => {
        if (!selectedTemplate || !recipientEmail) {
            setMessage({ type: 'error', text: 'Please select a template and enter email' });
            return;
        }

        setSending(true);
        setMessage({ type: '', text: '' });

        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`${API_URL}/emails/test`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    templateId: selectedTemplate,
                    email: recipientEmail
                })
            });

            const data = await response.json();
            if (data.success) {
                setMessage({ type: 'success', text: data.message });
                setRecipientEmail('');
            } else {
                setMessage({ type: 'error', text: data.message });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to send test email' });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-black text-white mb-2">Email Management</h1>
                <p className="text-slate-400">Manage email templates and send test emails</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Email Templates */}
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Available Templates
                    </h2>
                    <div className="space-y-3">
                        {templates.map((template) => (
                            <div
                                key={template.id}
                                className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedTemplate === template.id
                                    ? 'border-blue-600 bg-blue-600/10'
                                    : 'border-slate-700 hover:border-slate-600'
                                    }`}
                                onClick={() => setSelectedTemplate(template.id)}
                            >
                                <h3 className="font-medium text-white mb-1">{template.name}</h3>
                                <p className="text-sm text-slate-400 mb-2">{template.description}</p>
                                <p className="text-xs text-slate-500">Subject: {template.subject}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Send Test Email */}
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Send className="w-5 h-5" />
                        Send Test Email
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Select Template
                            </label>
                            <select
                                value={selectedTemplate}
                                onChange={(e) => setSelectedTemplate(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Choose a template...</option>
                                {templates.map((template) => (
                                    <option key={template.id} value={template.id}>
                                        {template.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Recipient Email
                            </label>
                            <input
                                type="email"
                                value={recipientEmail}
                                onChange={(e) => setRecipientEmail(e.target.value)}
                                placeholder="test@example.com"
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {message.text && (
                            <div className={`p-4 rounded-lg ${message.type === 'success'
                                ? 'bg-green-600/10 border border-green-600/50 text-green-400'
                                : 'bg-red-600/10 border border-red-600/50 text-red-400'
                                }`}>
                                {message.text}
                            </div>
                        )}

                        <button
                            onClick={sendTestEmail}
                            disabled={sending || !selectedTemplate || !recipientEmail}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold rounded-lg shadow-lg hover:from-blue-500 hover:to-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {sending ? 'Sending...' : 'Send Test Email'}
                        </button>
                    </div>

                    {/* Info Box */}
                    <div className="mt-6 p-4 bg-slate-800/30 border border-slate-700/50 rounded-lg">
                        <p className="text-xs text-slate-400">
                            <strong className="text-slate-300">Note:</strong> Test emails will be sent using the configured SMTP settings. In development mode, emails may be sent to Ethereal (check console for preview link).
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailManager;
