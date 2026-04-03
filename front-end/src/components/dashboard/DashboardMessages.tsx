import React, { useState, useEffect } from 'react';
import { Mail, Trash2, CheckCircle, Clock, Send, MessageSquare, Loader2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

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
    createdAt: string;
    replies?: Reply[];
}

export const DashboardMessages: React.FC = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
    const [replyText, setReplyText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { t } = useTranslation();

    // New Message State
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [newMsgContent, setNewMsgContent] = useState('');
    const messagesEndRef = React.useRef<HTMLDivElement>(null);
    const { addToast } = useToast();

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedMessage]);

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        try {
            const data = (await api.get<any>('/api/messages/my-messages')) as any;

            // Handle different potential response shapes
            const msgs = Array.isArray(data) ? data : (data.data || []);
            setMessages(msgs);
        } catch (error) {
            console.error('Failed to fetch messages', error);
            addToast(t('messages.error.fetch', 'Failed to load messages'), 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || !selectedMessage) return;

        setSubmitting(true);
        try {
            const res = (await api.post(`/api/messages/${selectedMessage._id}/reply`, {
                message: replyText
            })) as any;

            const updatedMsg = res.data || res;

            setSelectedMessage(updatedMsg);
            setMessages(prev => prev.map(m => m._id === selectedMessage._id ? updatedMsg : m));
            setReplyText('');
        } catch (error) {
            console.error('Failed to send reply', error);
            addToast(t('messages.error.send', 'Failed to send message'), 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateNew = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMsgContent.trim()) return;

        setSubmitting(true);
        try {
            const res = (await api.post('/api/messages', {
                name: user?.name || 'Customer',
                email: user?.email || '',
                message: newMsgContent
            })) as any;

            const newMsg = res.data || res;
            setMessages(prev => [newMsg, ...prev]);
            setSelectedMessage(newMsg);
            setIsCreatingNew(false);
            setNewMsgContent('');
            addToast(t('messages.create.success', 'Support ticket created!'), 'success');
        } catch (err) {
            console.error('Failed to create ticket', err);
            addToast(t('messages.error.create', 'Failed to create ticket'), 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm(t('messages.delete.confirm', 'Are you sure you want to delete this conversation?'))) return;
        try {
            await api.delete(`/api/messages/${id}`);
            setMessages(prev => prev.filter(msg => msg._id !== id));
            if (selectedMessage?._id === id) setSelectedMessage(null);
            addToast(t('messages.delete.success', 'Conversation deleted'), 'success');
        } catch (error) {
            addToast(t('messages.error.delete', 'Failed to delete conversation'), 'error');
        }
    };

    if (loading) return <div className="text-white flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> {t('common.loadingMessages', 'Loading messages...')}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-2">
                        <Mail className="w-6 h-6 text-blue-400" />
                        {t('messages.title', 'Support Messages')}
                    </h2>
                    <p className="text-slate-400">{t('messages.subtitle', 'View and respond to your support tickets.')}</p>
                </div>
                {messages.some(m => m.status !== 'closed') ? (
                    <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        {t('messages.activeTicket', 'You have an active ticket.')}
                    </div>
                ) : (
                    <button
                        onClick={() => { setIsCreatingNew(true); setSelectedMessage(null); }}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        {t('messages.newTicket', 'New Ticket')}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[700px]">
                {/* Thread List */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-800 bg-slate-950/50">
                        <h3 className="font-bold text-white">{t('messages.list.title', 'Your Conversations')}</h3>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                        {messages.length === 0 ? (
                            <div className="text-center p-8 text-slate-500">
                                <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-20" />
                                <p className="text-sm">{t('messages.list.empty', 'No support tickets found.')}</p>
                            </div>
                        ) : (
                            messages.map((msg, idx) => (
                                <motion.button
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={msg._id}
                                    onClick={() => { setSelectedMessage(msg); setIsCreatingNew(false); }}
                                    className={`w-full text-left p-4 rounded-xl border transition-all ${selectedMessage?._id === msg._id
                                        ? 'bg-blue-900/20 border-blue-800/50 ring-1 ring-blue-500 shadow-lg shadow-blue-500/10'
                                        : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-800'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="font-bold text-white truncate pr-2">{t('messages.list.ticketNumber', 'Ticket')} #{msg._id.slice(-6).toUpperCase()}</div>
                                    </div>
                                    <div className="text-sm text-slate-400 line-clamp-2 mb-2">{msg.message}</div>
                                    <div className="text-[10px] text-slate-500 flex justify-between items-center">
                                        <span>{new Date(msg.createdAt).toLocaleDateString()}</span>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-[9px] ${msg.status === 'replied' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                : msg.status === 'closed' ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                }`}>
                                                {msg.status === 'replied' ? t('messages.status.replied', 'Answered') : msg.status === 'closed' ? t('messages.status.closed', 'Closed') : t('messages.status.pending', 'Pending')}
                                            </span>
                                        </div>
                                    </div>
                                </motion.button>
                            ))
                        )}
                    </div>
                </div>

                {/* Thread View & Editor Area */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden relative">
                    <AnimatePresence mode="wait">
                        {/* State 1: Creating New Message */}
                        {isCreatingNew ? (
                            <motion.div
                                key="create-new"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex flex-col h-full absolute inset-0 bg-slate-900"
                            >
                                <div className="p-6 border-b border-slate-800">
                                    <h2 className="text-xl font-bold text-white mb-1">{t('messages.create.title', 'Create New Support Ticket')}</h2>
                                    <p className="text-slate-400 text-sm">{t('messages.create.subtitle', 'Describe your issue or question below.')}</p>
                                </div>
                                <form onSubmit={handleCreateNew} className="p-6 flex-1 flex flex-col">
                                    <textarea
                                        value={newMsgContent}
                                        onChange={(e) => setNewMsgContent(e.target.value)}
                                        placeholder={t('messages.create.placeholder', 'Type your message here...')}
                                        className="w-full flex-1 mb-4 p-4 bg-slate-800/50 border border-slate-700 rounded-xl text-white outline-none focus:border-blue-500 focus:bg-slate-800 transition-all resize-none shadow-inner"
                                        required
                                    />
                                    <div className="flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsCreatingNew(false)}
                                            className="px-6 py-3 rounded-xl font-bold text-slate-300 hover:bg-slate-800 transition-colors"
                                        >
                                            {t('common.cancel', 'Cancel')}
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting || !newMsgContent.trim()}
                                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50 transition-colors shadow-lg shadow-blue-500/25"
                                        >
                                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                                            {t('messages.create.submit', 'Submit Ticket')}
                                        </button>
                                    </div>
                                </form>
                            </motion.div>
                        ) : selectedMessage ? (
                            // State 2: Viewing Existing Thread
                            <motion.div
                                key="view-thread"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex flex-col h-full absolute inset-0 bg-slate-900"
                            >
                                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/30 backdrop-blur-sm z-10 sticky top-0">
                                    <div>
                                        <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                                            {t('messages.list.ticketNumber', 'Ticket')} #{selectedMessage._id.slice(-6).toUpperCase()}
                                            <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full border ${selectedMessage.status === 'replied' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : selectedMessage.status === 'closed' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                                {selectedMessage.status === 'replied' ? t('messages.status.repliedUpper', 'SUPPORT ANSWERED') : selectedMessage.status === 'closed' ? t('messages.status.closedUpper', 'RESOLVED & CLOSED') : t('messages.status.pendingUpper', 'PENDING RESPONSE')}
                                            </span>
                                        </h2>
                                    </div>
                                    <button
                                        onClick={(e) => handleDelete(selectedMessage._id, e)}
                                        className="p-2 text-slate-400 hover:text-red-400 bg-slate-900 rounded-lg border border-slate-800 hover:border-red-500/50 transition-colors shadow-sm"
                                        title={t('messages.delete.title', 'Delete Ticket')}
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 flex flex-col pt-8">
                                    {/* Original Message (Customer - Right Side Chat Bubble) */}
                                    <div className="self-end max-w-[85%]">
                                        <div className="flex items-center justify-end gap-2 mb-1">
                                            <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(selectedMessage.createdAt).toLocaleString(t('common.locale', 'en-US'))}</span>
                                            <span className="font-bold text-slate-300 text-sm">{t('common.you', 'You')}</span>
                                        </div>
                                        <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm p-4 shadow-md shadow-blue-900/20">
                                            <p className="whitespace-pre-wrap text-sm leading-relaxed">{selectedMessage.message}</p>
                                        </div>
                                    </div>

                                    {/* Replies */}
                                    {selectedMessage.replies?.map((reply, idx) => (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            key={reply._id}
                                            className={`max-w-[85%] ${reply.isAdmin ? 'self-start' : 'self-end'}`}
                                        >
                                            <div className={`flex items-center gap-2 mb-1 ${reply.isAdmin ? 'justify-start' : 'justify-end'}`}>
                                                {reply.isAdmin && <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-blue-400">HL</div>}
                                                {!reply.isAdmin && <span className="text-xs text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(reply.createdAt).toLocaleString(t('common.locale', 'en-US'))}</span>}
                                                <span className={`font-bold text-sm ${reply.isAdmin ? 'text-slate-200' : 'text-slate-300'}`}>
                                                    {reply.isAdmin ? t('common.support', 'HandyLand Support') : t('common.you', 'You')}
                                                </span>
                                                {reply.isAdmin && <span className="text-xs text-slate-500 flex items-center gap-1 ml-2"><Clock className="w-3 h-3" /> {new Date(reply.createdAt).toLocaleString(t('common.locale', 'en-US'))}</span>}
                                            </div>

                                            <div className={`${reply.isAdmin
                                                ? 'bg-slate-800 text-slate-200 rounded-2xl rounded-tl-sm border border-slate-700 shadow-sm'
                                                : 'bg-blue-600 text-white rounded-2xl rounded-tr-sm shadow-md shadow-blue-900/20'} 
                                            p-4`}
                                            >
                                                <p className="whitespace-pre-wrap text-sm leading-relaxed">{reply.message}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Reply Input */}
                                {selectedMessage.status !== 'closed' ? (
                                    <div className="p-4 border-t border-slate-800 bg-slate-950/50">
                                        <form onSubmit={handleReply} className="flex gap-3">
                                            <input
                                                type="text"
                                                value={replyText}
                                                onChange={(e) => setReplyText(e.target.value)}
                                                placeholder={t('messages.view.replyPlaceholder', 'Type your reply to support...')}
                                                className="flex-1 bg-slate-900 border border-slate-700 rounded-full px-5 text-white focus:border-blue-500 outline-none transition-colors shadow-inner"
                                            />
                                            <button
                                                type="submit"
                                                disabled={submitting || !replyText.trim()}
                                                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 disabled:opacity-50 transition-colors shadow-lg shadow-blue-500/20"
                                            >
                                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                                            </button>
                                        </form>
                                    </div>
                                ) : (
                                    <div className="p-4 border-t border-slate-800 bg-slate-900/80 backdrop-blur flex items-center justify-center">
                                        <p className="text-slate-400 text-sm italic font-medium">{t('messages.view.closed', 'This ticket has been marked as resolved and closed.')}</p>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            // State 3: Empty State (No Thread Selected, Not Creating New)
                            <motion.div
                                key="empty-state"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8 text-center absolute inset-0 bg-slate-900"
                            >
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.1, type: "spring" }}
                                    className="w-24 h-24 rounded-full bg-slate-800/50 border border-slate-700/50 flex items-center justify-center mb-6 shadow-inner"
                                >
                                    <MessageSquare className="w-10 h-10 text-slate-500" />
                                </motion.div>
                                <h3 className="text-xl font-bold text-white mb-2">{t('messages.view.emptyTitle', 'Select a Conversation')}</h3>
                                <p className="max-w-xs mx-auto mb-8 text-sm">{t('messages.view.emptySubtitle', 'Click on a ticket from the left sidebar to view the conversation or start a new ticket.')}</p>

                                {!messages.some(m => m.status !== 'closed') && (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setIsCreatingNew(true)}
                                        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-500/20"
                                    >
                                        {t('messages.view.emptyCta', 'Start New Ticket')}
                                    </motion.button>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
