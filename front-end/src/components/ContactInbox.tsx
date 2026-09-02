import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Loader2, MessageSquare, Plus, ArrowLeft, CheckCircle2, Clock, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Message, ViewState } from './inbox/types';
import { InboxListView } from './inbox/InboxListView';
import { InboxThreadView } from './inbox/InboxThreadView';
import { InboxNewTicketView } from './inbox/InboxNewTicketView';

import { io } from 'socket.io-client';

const getStatusStyles = (t: any): Record<string, { bg: string; text: string; label: string; icon: React.ReactNode }> => ({
    replied: {
        bg: 'bg-emerald-500/10 border-emerald-500/30',
        text: 'text-emerald-400',
        label: t('messages.status.replied', 'Beantwortet'),
        icon: <CheckCircle2 className="w-3 h-3" />
    },
    closed: {
        bg: 'bg-slate-700/40 border-slate-600/50',
        text: 'text-slate-400',
        label: t('messages.status.closed', 'Geschlossen'),
        icon: <Lock className="w-3 h-3" />
    },
    unread: {
        bg: 'bg-blue-500/10 border-blue-500/30',
        text: 'text-blue-400',
        label: t('messages.status.pending', 'Offen'),
        icon: <Clock className="w-3 h-3" />
    },
    read: {
        bg: 'bg-blue-500/10 border-blue-500/30',
        text: 'text-blue-400',
        label: t('messages.status.pending', 'Offen'),
        icon: <Clock className="w-3 h-3" />
    },
});

export const ContactInbox = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { addToast } = useToast();
    const STATUS_STYLES = getStatusStyles(t);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [replyText, setReplyText] = useState('');
    const [newMessageText, setNewMessageText] = useState('');
    const [view, setView] = useState<ViewState>('list');
    const [submitting, setSubmitting] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        fetchMessages();
    }, []);

    // Socket.io real-time connection for customer messages
    useEffect(() => {
        const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
        const socket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
        });

        socket.on('message:reply', (data: any) => {
            const updatedThread = data.thread;
            if (updatedThread) {
                const threadId = updatedThread._id || updatedThread.id;
                setMessages(prev => {
                    const exists = prev.some(m => (m._id || (m as any).id) === threadId);
                    if (exists) {
                        return prev.map(m => (m._id || (m as any).id) === threadId ? updatedThread : m);
                    }
                    return [updatedThread, ...prev];
                });
                setSelectedMessage(curr => {
                    if (curr && (curr._id || (curr as any).id) === threadId) {
                        return updatedThread;
                    }
                    return curr;
                });
            } else {
                fetchMessages();
            }
            addToast('Neue Nachricht vom Support!', 'info');
        });

        return () => {
            socket.disconnect();
        };
    }, [user?.id, user?.email]);

    const hasActiveTicket = messages.some(m => m.status !== 'closed');

    const handleSendNew = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessageText.trim()) return;
        setSubmitting(true);
        try {
            const res = await api.post('/api/messages', {
                name: user?.name || user?.email?.split('@')[0] || 'Kunde',
                email: user?.email,
                message: newMessageText
            }) as any;
            const updatedMsg = res?.data?.message || res?.data || res;
            const threadId = updatedMsg._id || updatedMsg.id;
            setMessages(prev => {
                const exists = prev.some(m => (m._id || (m as any).id) === threadId);
                if (exists) return prev.map(m => (m._id || (m as any).id) === threadId ? updatedMsg : m);
                return [updatedMsg, ...prev];
            });
            setNewMessageText('');
            setSelectedMessage(updatedMsg);
            setView('thread');
            addToast('Nachricht gesendet!', 'success');
        } catch (error) {
            addToast('Fehler beim Senden der Nachricht.', 'error');
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        const targetId = selectedMessage?._id || (selectedMessage as any)?.id;
        if (!replyText.trim() || !targetId) return;
        setSubmitting(true);
        try {
            const res = await api.post(`/api/messages/${targetId}/reply`, {
                message: replyText
            }) as any;
            const updated = res?.data?.message || res?.data || res;
            const threadId = updated._id || updated.id;
            setSelectedMessage(updated);
            setMessages(prev => prev.map(m => (m._id || (m as any).id) === threadId ? updated : m));
            setReplyText('');
        } catch (error) {
            addToast('Fehler beim Senden der Antwort.', 'error');
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
                <p className="text-slate-400 text-sm">{t('common.loading', 'Wird geladen...')}</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col shadow-sm transition-all duration-300" style={{ minHeight: '600px' }}>
            {/* Header */}
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/30 backdrop-blur-sm z-10 relative">
                <AnimatePresence mode="wait">
                    {view !== 'list' ? (
                        <motion.button
                            key={t('back')}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            onClick={goBack}
                            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors text-sm font-bold"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            {t('common.back', 'Zurück')}
                        </motion.button>
                    ) : (
                        <motion.div
                            key="title"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="flex items-center gap-3"
                        >
                            <MessageSquare className="w-6 h-6 text-brand-primary" />
                            <h3 className="text-slate-900 dark:text-white font-black text-xl">{t('messages.title', 'Support-Nachrichten')}</h3>
                            {messages.length > 0 && (
                                <span className="bg-blue-100 dark:bg-blue-600/20 text-blue-700 dark:text-blue-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-500/30">
                                    {messages.length}
                                </span>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* New Ticket Button or status indicator */}
                {view === 'list' && (
                    hasActiveTicket ? (
                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 px-3.5 py-2 rounded-xl shadow-sm">
                            <Clock className="w-3.5 h-3.5" />
                            {t('messages.active_ticket', 'Aktives Ticket offen')}
                        </div>
                    ) : (
                        <button
                            onClick={() => setView('new')}
                            className="flex items-center gap-2 bg-brand-primary hover:bg-blue-600 text-white text-sm px-5 py-2.5 rounded-xl font-bold transition-all shadow-md shadow-blue-900/20 hover:-translate-y-0.5"
                        >
                            <Plus className="w-4 h-4" />
                            {t('messages.new_ticket', 'Neues Ticket')}
                        </button>
                    )
                )}

                {view === 'thread' && selectedMessage && (
                    <div className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl border shadow-sm ${statusInfo(selectedMessage.status).bg} ${statusInfo(selectedMessage.status).text}`}>
                        {statusInfo(selectedMessage.status).icon}
                        {statusInfo(selectedMessage.status).label}
                    </div>
                )}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-hidden relative bg-slate-50/30 dark:bg-transparent">
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
