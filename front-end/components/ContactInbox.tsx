import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Send, Loader2, MessageSquare, Plus, ArrowLeft, CheckCircle2, Clock, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    status: 'unread' | 'read' | 'replied' | 'closed';
    initiatedByAdmin?: boolean;
    replies: Reply[];
    createdAt: string;
}

type ViewState = 'list' | 'thread' | 'new';

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
    replied: {
        bg: 'bg-emerald-500/10 border-emerald-500/30',
        text: 'text-emerald-400',
        label: 'Answered',
        icon: <CheckCircle2 className="w-3 h-3" />
    },
    closed: {
        bg: 'bg-slate-700/40 border-slate-600/50',
        text: 'text-slate-400',
        label: 'Closed',
        icon: <Lock className="w-3 h-3" />
    },
    unread: {
        bg: 'bg-blue-500/10 border-blue-500/30',
        text: 'text-blue-400',
        label: 'Pending',
        icon: <Clock className="w-3 h-3" />
    },
    read: {
        bg: 'bg-blue-500/10 border-blue-500/30',
        text: 'text-blue-400',
        label: 'Pending',
        icon: <Clock className="w-3 h-3" />
    },
};

export const ContactInbox = () => {
    const { user } = useAuth();
    const { addToast } = useToast();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [replyText, setReplyText] = useState('');
    const [newMessageText, setNewMessageText] = useState('');
    const [view, setView] = useState<ViewState>('list');
    const [submitting, setSubmitting] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchMessages();
    }, []);

    useEffect(() => {
        if (view === 'thread') {
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        }
    }, [selectedMessage, view]);

    const fetchMessages = async () => {
        try {
            const res = await api.get('/api/messages/my-messages') as any;
            const msgs = res?.data || (Array.isArray(res) ? res : []);
            setMessages(msgs);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const hasActiveTicket = messages.some(m => m.status !== 'closed');

    const handleSendNew = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessageText.trim()) return;
        setSubmitting(true);
        try {
            const res = await api.post('/api/messages', {
                name: user?.name,
                email: user?.email,
                message: newMessageText
            }) as any;
            const newMsg = res?.data || res;
            setMessages(prev => [newMsg, ...prev]);
            setNewMessageText('');
            setSelectedMessage(newMsg);
            setView('thread');
            addToast('Support ticket created!', 'success');
        } catch (error) {
            addToast('Failed to create ticket. Please try again.', 'error');
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
            const updated = res?.data || res;
            setSelectedMessage(updated);
            setMessages(prev => prev.map(m => m._id === selectedMessage._id ? updated : m));
            setReplyText('');
        } catch (error) {
            addToast('Failed to send message.', 'error');
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const openThread = (msg: Message) => {
        setSelectedMessage(msg);
        setView('thread');
    };

    const goBack = () => {
        setView('list');
        setSelectedMessage(null);
    };

    const statusInfo = (status: string) => STATUS_STYLES[status] || STATUS_STYLES['unread'];

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-slate-400 text-sm">Loading your messages...</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex flex-col" style={{ minHeight: '600px' }}>
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 backdrop-blur-sm">
                <AnimatePresence mode="wait">
                    {view !== 'list' ? (
                        <motion.button
                            key="back"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            onClick={goBack}
                            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Inbox
                        </motion.button>
                    ) : (
                        <motion.div
                            key="title"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="flex items-center gap-2"
                        >
                            <MessageSquare className="w-5 h-5 text-blue-400" />
                            <h3 className="text-white font-bold text-base">Support Messages</h3>
                            {messages.length > 0 && (
                                <span className="bg-blue-600/20 text-blue-400 text-xs font-bold px-2 py-0.5 rounded-full border border-blue-500/30">
                                    {messages.length}
                                </span>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* New Ticket Button or status indicator */}
                {view === 'list' && (
                    hasActiveTicket ? (
                        <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold bg-yellow-500/10 border border-yellow-500/30 px-3 py-1.5 rounded-xl">
                            <Clock className="w-3 h-3" />
                            Active ticket open
                        </div>
                    ) : (
                        <button
                            onClick={() => setView('new')}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-xl font-bold transition-all shadow-md shadow-blue-900/25"
                        >
                            <Plus className="w-4 h-4" />
                            New Ticket
                        </button>
                    )
                )}

                {view === 'thread' && selectedMessage && (
                    <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${statusInfo(selectedMessage.status).bg} ${statusInfo(selectedMessage.status).text}`}>
                        {statusInfo(selectedMessage.status).icon}
                        {statusInfo(selectedMessage.status).label}
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-hidden relative">
                <AnimatePresence mode="wait">
                    {/* ── LIST VIEW ── */}
                    {view === 'list' && (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="absolute inset-0 overflow-y-auto custom-scrollbar p-4 space-y-3"
                        >
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
                                    <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center">
                                        <MessageSquare className="w-9 h-9 text-slate-500" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-300 font-bold text-lg">No messages yet</p>
                                        <p className="text-slate-500 text-sm mt-1">Start a conversation with our support team</p>
                                    </div>
                                    <button
                                        onClick={() => setView('new')}
                                        className="mt-2 flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/25"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Create Support Ticket
                                    </button>
                                </div>
                            ) : (
                                messages.map((msg, idx) => {
                                    const si = statusInfo(msg.status);
                                    const lastReply = msg.replies?.length > 0 ? msg.replies[msg.replies.length - 1] : null;
                                    return (
                                        <motion.button
                                            key={msg._id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.04 }}
                                            onClick={() => openThread(msg)}
                                            className="w-full text-left bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 rounded-2xl p-4 transition-all group"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-9 h-9 rounded-full bg-blue-600/15 border border-blue-500/25 flex items-center justify-center text-blue-400 font-bold text-sm flex-shrink-0">
                                                        {msg.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <p className="text-white font-bold text-sm truncate max-w-[200px]">
                                                        {msg.message.length > 45 ? msg.message.substring(0, 45) + '...' : msg.message}
                                                    </p>
                                                </div>
                                                <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${si.bg} ${si.text} flex-shrink-0`}>
                                                    {si.icon} {si.label}
                                                </span>
                                            </div>
                                            <div className="text-slate-500 text-xs line-clamp-1 ml-11">
                                                {lastReply
                                                    ? <span className={lastReply.isAdmin ? 'text-blue-400/70' : ''}>{lastReply.isAdmin ? '🤝 Support: ' : 'You: '}{lastReply.message}</span>
                                                    : <span className="italic">No replies yet</span>
                                                }
                                            </div>
                                            <div className="text-slate-600 text-[10px] mt-2 ml-11">
                                                {new Date(msg.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                {msg.replies?.length > 0 && ` · ${msg.replies.length} message${msg.replies.length !== 1 ? 's' : ''}`}
                                            </div>
                                        </motion.button>
                                    );
                                })
                            )}
                        </motion.div>
                    )}

                    {/* ── THREAD VIEW ── */}
                    {view === 'thread' && selectedMessage && (
                        <motion.div
                            key="thread"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="absolute inset-0 flex flex-col"
                        >
                            {/* Messages scroll area */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4 flex flex-col">
                                {/* Original message — show on the right if customer wrote it, left if admin initiated */}
                                {selectedMessage.initiatedByAdmin ? (
                                    // Admin initiated: show on LEFT as Support Team message
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="self-start max-w-[82%]"
                                    >
                                        <div className="text-xs text-slate-500 text-left mb-1">
                                            <Clock className="w-3 h-3 inline mr-1" />
                                            {new Date(selectedMessage.createdAt).toLocaleString()}
                                        </div>
                                        <div className="bg-slate-700/70 text-slate-100 rounded-2xl rounded-tl-sm p-4 border border-slate-600/50 shadow-sm">
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedMessage.message}</p>
                                        </div>
                                        <div className="text-[10px] text-slate-500 text-left mt-1 font-medium">🤝 Support Team</div>
                                    </motion.div>
                                ) : (
                                    // Customer initiated: show on RIGHT as customer's opening message
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="self-end max-w-[82%]"
                                    >
                                        <div className="text-xs text-slate-500 text-right mb-1">
                                            <Clock className="w-3 h-3 inline mr-1" />
                                            {new Date(selectedMessage.createdAt).toLocaleString()}
                                        </div>
                                        <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm p-4 shadow-lg shadow-blue-900/20">
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedMessage.message}</p>
                                        </div>
                                        <div className="text-[10px] text-slate-500 text-right mt-1 font-medium">You</div>
                                    </motion.div>
                                )}

                                {/* Replies */}
                                {selectedMessage.replies?.map((reply, idx) => (
                                    <motion.div
                                        key={reply._id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.03 }}
                                        className={`max-w-[82%] ${reply.isAdmin ? 'self-start' : 'self-end'}`}
                                    >
                                        <div className={`text-xs text-slate-500 mb-1 ${reply.isAdmin ? 'text-left' : 'text-right'}`}>
                                            <Clock className="w-3 h-3 inline mr-1" />
                                            {new Date(reply.createdAt).toLocaleString()}
                                        </div>
                                        <div className={
                                            reply.isAdmin
                                                ? 'bg-slate-700/70 text-slate-100 rounded-2xl rounded-tl-sm p-4 border border-slate-600/50 shadow-sm'
                                                : 'bg-blue-600 text-white rounded-2xl rounded-tr-sm p-4 shadow-lg shadow-blue-900/20'
                                        }>
                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{reply.message}</p>
                                        </div>
                                        <div className={`text-[10px] text-slate-500 mt-1 font-medium ${reply.isAdmin ? 'text-left' : 'text-right'}`}>
                                            {reply.isAdmin ? '🤝 Support Team' : 'You'}
                                        </div>
                                    </motion.div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input or Closed notice */}
                            {selectedMessage.status === 'closed' ? (
                                <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-center gap-2">
                                    <Lock className="w-4 h-4 text-slate-500" />
                                    <p className="text-slate-400 text-sm font-medium">This ticket has been closed. Open a new one if you need further help.</p>
                                </div>
                            ) : (
                                <form onSubmit={handleReply} className="p-4 border-t border-slate-800 bg-slate-950/70 flex gap-3 items-end">
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            value={replyText}
                                            onChange={e => setReplyText(e.target.value)}
                                            placeholder="Type your message..."
                                            className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-3 text-white focus:border-blue-500 outline-none transition-colors text-sm placeholder:text-slate-500"
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={submitting || !replyText.trim()}
                                        className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-md shadow-blue-900/30 flex-shrink-0"
                                    >
                                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                    </button>
                                </form>
                            )}
                        </motion.div>
                    )}

                    {/* ── NEW MESSAGE VIEW ── */}
                    {view === 'new' && (
                        <motion.div
                            key="new"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="absolute inset-0 flex flex-col"
                        >
                            <div className="flex-1 p-6 flex flex-col">
                                <div className="mb-6">
                                    <h3 className="text-white font-bold text-lg">How can we help?</h3>
                                    <p className="text-slate-400 text-sm mt-1">Describe your issue or question. Our team will respond shortly.</p>
                                </div>
                                <form onSubmit={handleSendNew} className="flex-1 flex flex-col gap-4">
                                    <textarea
                                        value={newMessageText}
                                        onChange={e => setNewMessageText(e.target.value)}
                                        placeholder="Describe your issue in detail..."
                                        className="flex-1 bg-slate-800/70 border border-slate-700 rounded-2xl p-4 text-white focus:border-blue-500 outline-none resize-none transition-colors text-sm placeholder:text-slate-500 shadow-inner"
                                        required
                                        minLength={10}
                                    />
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={goBack}
                                            className="flex-1 py-3 px-5 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700 transition-all text-sm"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting || newMessageText.trim().length < 10}
                                            className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-3 px-5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-900/25 text-sm"
                                        >
                                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                            Submit Ticket
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
