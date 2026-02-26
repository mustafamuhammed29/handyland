import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Mail, Send, Loader2, MessageSquare, Clock, ArrowLeft } from 'lucide-react';

interface Reply {
    _id: string;
    message: string;
    isAdmin: boolean;
    createdAt: string;
}

interface Message {
    _id: string;
    name: string;
    email: string;
    message: string;
    status: string;
    replies: Reply[];
    createdAt: string;
}

export const ContactInbox = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [replyText, setReplyText] = useState('');
    const [newMessageText, setNewMessageText] = useState('');
    const [activeTab, setActiveTab] = useState<'inbox' | 'new'>('inbox');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            const res = await api.get('/api/messages/my-messages') as any;
            if (res.success) {
                setMessages(res.data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendNew = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessageText.trim()) return;
        setSubmitting(true);
        try {
            await api.post('/api/messages', {
                name: user?.name,
                email: user?.email,
                message: newMessageText
            });
            setNewMessageText('');
            setActiveTab('inbox');
            fetchMessages();
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || !selectedMessage) return;
        setSubmitting(true);
        try {
            const res = await api.post(`/api/messages/${selectedMessage._id}/reply`, {
                message: replyText
            }) as any;
            if (res.success) {
                setMessages(messages.map(m => m._id === selectedMessage._id ? res.data : m));
                setSelectedMessage(res.data);
                setReplyText('');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

    return (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
            <div className="flex border-b border-slate-800">
                <button
                    onClick={() => { setActiveTab('inbox'); setSelectedMessage(null); }}
                    className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'inbox' ? 'bg-blue-600/10 text-blue-400 border-b-2 border-blue-500' : 'text-slate-400 hover:text-white'}`}
                >
                    Inbox
                </button>
                <button
                    onClick={() => setActiveTab('new')}
                    className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'new' ? 'bg-blue-600/10 text-blue-400 border-b-2 border-blue-500' : 'text-slate-400 hover:text-white'}`}
                >
                    New Message
                </button>
            </div>

            <div className="p-6">
                {activeTab === 'new' ? (
                    <form onSubmit={handleSendNew} className="space-y-4 max-w-2xl mx-auto">
                        <div>
                            <label className="block text-sm font-bold text-slate-400 mb-2">How can we help you?</label>
                            <textarea
                                value={newMessageText}
                                onChange={e => setNewMessageText(e.target.value)}
                                rows={5}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white focus:border-blue-500 outline-none"
                                placeholder="Describe your issue or question here..."
                            />
                        </div>
                        <button
                            disabled={submitting || !newMessageText.trim()}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Send Message
                        </button>
                    </form>
                ) : (
                    selectedMessage ? (
                        <div className="space-y-6">
                            <button
                                onClick={() => setSelectedMessage(null)}
                                className="text-slate-400 hover:text-white text-sm flex items-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" /> Back to Inbox
                            </button>

                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 ml-8">
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="font-bold text-white text-sm">You</div>
                                        <div className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(selectedMessage.createdAt).toLocaleString()}</div>
                                    </div>
                                    <p className="text-slate-300 text-sm whitespace-pre-wrap">{selectedMessage.message}</p>
                                </div>

                                {selectedMessage.replies.map(reply => (
                                    <div key={reply._id} className={`rounded-xl p-4 border ${reply.isAdmin ? 'bg-blue-900/20 border-blue-800/50 mr-8' : 'bg-slate-800/50 border-slate-700 ml-8'}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <div className={`font-bold text-sm ${reply.isAdmin ? 'text-blue-400' : 'text-white'}`}>{reply.isAdmin ? 'Support Team' : 'You'}</div>
                                            <div className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(reply.createdAt).toLocaleString()}</div>
                                        </div>
                                        <p className="text-slate-300 text-sm whitespace-pre-wrap">{reply.message}</p>
                                    </div>
                                ))}
                            </div>

                            <form onSubmit={handleReply} className="flex gap-2 pt-4 border-t border-slate-800">
                                <input
                                    type="text"
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                    placeholder="Type your reply..."
                                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 text-white focus:border-blue-500 outline-none"
                                />
                                <button
                                    disabled={submitting || !replyText.trim()}
                                    className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl text-white font-bold disabled:opacity-50"
                                >
                                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                </button>
                            </form>
                        </div>
                    ) : (
                        messages.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">
                                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>You have no messages yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {messages.map(msg => (
                                    <div
                                        key={msg._id}
                                        onClick={() => setSelectedMessage(msg)}
                                        className="bg-slate-950 border border-slate-800 rounded-xl p-4 hover:border-slate-600 cursor-pointer transition-colors group flex gap-4 items-start"
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${msg.status === 'replied' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <div className="font-bold text-white truncate">{msg.message.substring(0, 50)}...</div>
                                                <div className="text-xs text-slate-500 flex-shrink-0">{new Date(msg.createdAt).toLocaleDateString()}</div>
                                            </div>
                                            <div className="text-sm text-slate-400 line-clamp-1">
                                                {msg.replies.length > 0 ? `Last reply: ${msg.replies[msg.replies.length - 1].message}` : 'No replies yet.'}
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0">
                                            {msg.status === 'replied' ? (
                                                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-1 rounded-full border border-emerald-500/20">Answered</span>
                                            ) : (
                                                <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-1 rounded-full border border-slate-700">Pending</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )
                )}
            </div>
        </div>
    );
};
