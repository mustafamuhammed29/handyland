import React, { useState, useEffect } from 'react';
import { Mail, Trash2, CheckCircle, Clock } from 'lucide-react';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';

interface Message {
    _id: string;
    name: string;
    email: string;
    message: string;
    status: 'unread' | 'read' | 'replied';
    createdAt: string;
}

export const DashboardMessages: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            const data = await api.get<Message[]>('/api/messages');
            setMessages(data);
        } catch (error) {
            console.error('Failed to fetch messages', error);
            addToast('Failed to load messages', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: 'read' | 'replied') => {
        try {
            await api.put(`/api/messages/${id}`, { status: newStatus });
            setMessages(prev => prev.map(msg => msg._id === id ? { ...msg, status: newStatus } : msg));
            addToast('Message status updated', 'success');
        } catch (error) {
            addToast('Failed to update status', 'error');
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this message?')) return;
        try {
            await api.delete(`/api/messages/${id}`);
            setMessages(prev => prev.filter(msg => msg._id !== id));
            addToast('Message deleted', 'success');
        } catch (error) {
            addToast('Failed to delete message', 'error');
        }
    };

    if (loading) return <div className="text-white">Loading messages...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Mail className="w-6 h-6 text-blue-400" />
                Messages Inbox
            </h2>

            <div className="grid gap-4">
                {messages.length === 0 ? (
                    <div className="text-center py-10 bg-slate-900/50 rounded-xl border border-slate-800">
                        <Mail className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400">No messages found.</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg._id} className={`p-6 rounded-xl border ${msg.status === 'unread' ? 'bg-slate-800/80 border-blue-500/50' : 'bg-slate-900/50 border-slate-800'} transition-all`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white">{msg.name}</h3>
                                    <a href={`mailto:${msg.email}`} className="text-blue-400 hover:underline text-sm">{msg.email}</a>
                                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                                        <Clock className="w-3 h-3" />
                                        {new Date(msg.createdAt).toLocaleString()}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {msg.status === 'unread' && (
                                        <button
                                            onClick={() => handleStatusUpdate(msg._id, 'read')}
                                            className="p-2 text-slate-400 hover:text-emerald-400 bg-slate-900 rounded-lg border border-slate-700 hover:border-emerald-500/50"
                                            title="Mark as Read"
                                        >
                                            <CheckCircle className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(msg._id)}
                                        className="p-2 text-slate-400 hover:text-red-400 bg-slate-900 rounded-lg border border-slate-700 hover:border-red-500/50"
                                        title="Delete Message"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="bg-black/30 p-4 rounded-lg text-slate-300 whitespace-pre-wrap">
                                {msg.message}
                            </div>
                            <div className="mt-4 flex gap-2">
                                <span className={`text-xs px-2 py-1 rounded border ${msg.status === 'unread' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : msg.status === 'read' ? 'bg-slate-700/50 border-slate-600 text-slate-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
                                    {msg.status.toUpperCase()}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
