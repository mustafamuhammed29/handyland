import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, Send, Clock, ShieldCheck, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function MessagesManager() {
    const { token } = useAuth();
    const [messages, setMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
    const [replyText, setReplyText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [filter, setFilter] = useState('all');

    const fetchMessages = async () => {
        try {
            const res = await axios.get(`${API_URL}/messages`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessages(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, [token]);

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || !selectedMessage) return;

        setSubmitting(true);
        try {
            const res = await axios.post(`${API_URL}/messages/${selectedMessage._id}/reply`,
                { message: replyText },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSelectedMessage(res.data.data);
            setMessages(messages.map(m => m._id === selectedMessage._id ? res.data.data : m));
            setReplyText('');
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    const filteredMessages = messages.filter(m => {
        if (filter === 'unread') return m.status === 'unread';
        if (filter === 'replied') return m.status === 'replied';
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Messages & Inbox</h1>
                    <p className="text-slate-400">Manage customer inquiries and contact forms.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
                {/* Thread List */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-800">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilter('all')}
                                className={`flex-1 py-1.5 rounded-lg text-sm font-medium ${filter === 'all' ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:bg-slate-800'}`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setFilter('unread')}
                                className={`flex-1 py-1.5 rounded-lg text-sm font-medium ${filter === 'unread' ? 'bg-emerald-600/20 text-emerald-400' : 'text-slate-400 hover:bg-slate-800'}`}
                            >
                                Unread
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                        {loading ? (
                            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-blue-500" /></div>
                        ) : filteredMessages.length === 0 ? (
                            <div className="text-center p-8 text-slate-500">No messages found.</div>
                        ) : (
                            filteredMessages.map(msg => (
                                <button
                                    key={msg._id}
                                    onClick={() => setSelectedMessage(msg)}
                                    className={`w-full text-left p-4 rounded-xl border transition-all ${selectedMessage?._id === msg._id ? 'bg-blue-900/20 border-blue-800/50 ring-1 ring-blue-500' : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800'}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="font-bold text-white truncate pr-2">{msg.name}</div>
                                        {msg.status === 'unread' && <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0 mt-1"></span>}
                                    </div>
                                    <div className="text-xs text-blue-400 mb-2 truncate">{msg.email}</div>
                                    <div className="text-sm text-slate-400 line-clamp-2">{msg.message}</div>
                                    <div className="text-[10px] text-slate-500 mt-2 flex justify-between">
                                        <span>{new Date(msg.createdAt).toLocaleDateString()}</span>
                                        <span>{msg.replies?.length || 0} replies</span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Thread View */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
                    {selectedMessage ? (
                        <>
                            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-bold text-white">{selectedMessage.name}</h2>
                                    <a href={`mailto:${selectedMessage.email}`} className="text-blue-400 text-sm hover:underline">{selectedMessage.email}</a>
                                </div>
                                <div className="flex gap-2">
                                    <span className={`px-3 py-1 text-xs font-bold rounded-full border ${selectedMessage.status === 'replied' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                                        {selectedMessage.status.toUpperCase()}
                                    </span>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                                {/* Original Message */}
                                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 mr-12">
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-blue-600/20 flex flex-shrink-0 items-center justify-center text-blue-400 font-bold text-xs">
                                                {selectedMessage.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="font-bold text-slate-200">{selectedMessage.name}</span>
                                        </div>
                                        <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(selectedMessage.createdAt).toLocaleString()}</span>
                                    </div>
                                    <p className="text-slate-300 whitespace-pre-wrap ml-10 text-sm">{selectedMessage.message}</p>
                                </div>

                                {/* Replies */}
                                {selectedMessage.replies?.map((reply: any) => (
                                    <div key={reply._id} className={`rounded-xl p-5 border ${reply.isAdmin ? 'bg-blue-900/20 border-blue-800/50 ml-12' : 'bg-slate-800/50 border-slate-700 mr-12'}`}>
                                        <div className="flex justify-between items-center mb-3">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${reply.isAdmin ? 'bg-emerald-600/20 text-emerald-400' : 'bg-blue-600/20 text-blue-400'}`}>
                                                    {reply.isAdmin ? <ShieldCheck className="w-4 h-4" /> : selectedMessage.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className={`font-bold ${reply.isAdmin ? 'text-blue-400' : 'text-slate-200'}`}>{reply.isAdmin ? 'Admin Support' : selectedMessage.name}</span>
                                            </div>
                                            <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(reply.createdAt).toLocaleString()}</span>
                                        </div>
                                        <p className="text-slate-300 whitespace-pre-wrap ml-10 text-sm">{reply.message}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Reply Form */}
                            <div className="p-4 border-t border-slate-800 bg-slate-950/50">
                                <form onSubmit={handleReply} className="flex gap-3">
                                    <input
                                        type="text"
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        placeholder="Type your reply here..."
                                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:border-blue-500 outline-none transition-colors"
                                    />
                                    <button
                                        disabled={submitting || !replyText.trim()}
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 transition-colors"
                                    >
                                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                        Send
                                    </button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                            <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                            <p>Select a message thread to view and reply</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
