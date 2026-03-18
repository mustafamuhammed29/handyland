import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Plus } from 'lucide-react';
import { Message } from './types';

interface InboxListViewProps {
    messages: Message[];
    setView: (view: 'new') => void;
    openThread: (msg: Message) => void;
    statusInfo: (status: string) => { bg: string; text: string; label: string; icon: React.ReactNode };
}

export const InboxListView: React.FC<InboxListViewProps> = ({ messages, setView, openThread, statusInfo }) => {
    return (
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
    );
};
