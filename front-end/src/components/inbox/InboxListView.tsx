import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Plus, CheckCircle2, Clock, Lock } from 'lucide-react';
import { Message } from './types';
import { useTranslation } from 'react-i18next';

interface InboxListViewProps {
    messages: Message[];
    setView: (view: 'new') => void;
    openThread: (msg: Message) => void;
    statusInfo: (status: string) => { bg: string; text: string; label: string; icon: React.ReactNode };
}

const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Unknown Date';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'Invalid Date';
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const InboxListView: React.FC<InboxListViewProps> = ({ messages, setView, openThread, statusInfo }) => {
    const { t } = useTranslation();
    
    return (
        <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute inset-0 overflow-y-auto custom-scrollbar p-5 space-y-4"
        >
            {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-20 gap-5 animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 rounded-full bg-blue-500/10 border-4 border-blue-500/20 flex items-center justify-center shadow-inner">
                        <MessageSquare className="w-10 h-10 text-blue-500" />
                    </div>
                    <div className="text-center space-y-1.5 max-w-sm">
                        <h3 className="text-white font-black text-xl">{t('messages.empty.title', 'No Messages Yet')}</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">{t('messages.empty.desc', 'Need help or have a question? Start a new conversation with our support team, and we will get back to you shortly.')}</p>
                    </div>
                    <button
                        onClick={() => setView('new')}
                        className="mt-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-7 py-3.5 rounded-2xl font-bold transition-all shadow-xl shadow-blue-900/25 hover:shadow-blue-900/40 transform hover:-translate-y-0.5"
                    >
                        <Plus className="w-5 h-5" />
                        {t('messages.new_ticket', 'Create Support Ticket')}
                    </button>
                </div>
            ) : (
                messages.map((msg, idx) => {
                    const si = statusInfo(msg.status);
                    const lastReply = msg.replies?.length > 0 ? msg.replies[msg.replies.length - 1] : null;
                    return (
                        <motion.button
                            key={msg._id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05, ease: 'easeOut' }}
                            onClick={() => openThread(msg)}
                            className="w-full text-left bg-white/5 dark:bg-slate-800/40 hover:bg-white/10 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 hover:border-blue-500/50 rounded-3xl p-5 transition-all group relative overflow-hidden shadow-sm hover:shadow-md"
                        >
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            
                            <div className="flex justify-between items-start mb-3 gap-4">
                                <div className="flex items-start gap-4 flex-1 overflow-hidden">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-inner">
                                        {msg.name?.charAt(0).toUpperCase() || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <p className="text-slate-900 dark:text-white font-black text-base truncate pr-4">
                                            {msg.message || 'No subject'}
                                        </p>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm line-clamp-1 mt-1 font-medium">
                                            {lastReply
                                                ? <span className={lastReply.isAdmin ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}>{lastReply.isAdmin ? '🤝 Support: ' : 'You: '}{lastReply.message}</span>
                                                : <span className="italic opacity-80">{t('messages.no_replies', 'No replies yet')}</span>
                                            }
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                    <span className={`flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-lg border shadow-sm ${si.bg} ${si.text}`}>
                                        {si.icon} {si.label}
                                    </span>
                                    <div className="text-slate-400 dark:text-slate-500 text-xs font-semibold flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatDate(msg.createdAt)}
                                    </div>
                                </div>
                            </div>
                            
                            {msg.replies?.length > 0 && (
                                <div className="ml-16 mt-3 flex items-center gap-2">
                                    <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-100 dark:bg-slate-800/50 px-2 py-0.5 rounded-full">
                                        {msg.replies.length} {t('messages.replies_count', 'Replies')}
                                    </span>
                                </div>
                            )}
                        </motion.button>
                    );
                })
            )}
        </motion.div>
    );
};
