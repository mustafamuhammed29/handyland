import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Loader2, MessageSquare, Plus, ArrowLeft, CheckCircle2, Clock, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message, ViewState } from './inbox/types';
import { InboxListView } from './inbox/InboxListView';
import { InboxThreadView } from './inbox/InboxThreadView';
import { InboxNewTicketView } from './inbox/InboxNewTicketView';

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
                        <InboxListView
                            messages={messages}
                            setView={setView}
                            openThread={openThread}
                            statusInfo={statusInfo}
                        />
                    )}

                    {/* ── THREAD VIEW ── */}
                    {view === 'thread' && selectedMessage && (
                        <InboxThreadView
                            selectedMessage={selectedMessage}
                            messagesEndRef={messagesEndRef}
                            replyText={replyText}
                            setReplyText={setReplyText}
                            handleReply={handleReply}
                            submitting={submitting}
                        />
                    )}

                    {/* ── NEW MESSAGE VIEW ── */}
                    {view === 'new' && (
                        <InboxNewTicketView
                            newMessageText={newMessageText}
                            setNewMessageText={setNewMessageText}
                            handleSendNew={handleSendNew}
                            goBack={goBack}
                            submitting={submitting}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
