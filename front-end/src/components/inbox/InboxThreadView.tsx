import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Lock, Send, Loader2 } from 'lucide-react';
import { Message } from './types';

interface InboxThreadViewProps {
    selectedMessage: Message;
    messagesEndRef: React.RefObject<HTMLDivElement>;
    replyText: string;
    setReplyText: (text: string) => void;
    handleReply: (e: React.FormEvent) => void;
    submitting: boolean;
}

export const InboxThreadView: React.FC<InboxThreadViewProps> = ({
    selectedMessage,
    messagesEndRef,
    replyText,
    setReplyText,
    handleReply,
    submitting,
}) => {
    return (
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
    );
};
