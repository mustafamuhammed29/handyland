import React from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';

interface InboxNewTicketViewProps {
    newMessageText: string;
    setNewMessageText: (text: string) => void;
    handleSendNew: (e: React.FormEvent) => void;
    goBack: () => void;
    submitting: boolean;
}

export const InboxNewTicketView: React.FC<InboxNewTicketViewProps> = ({
    newMessageText,
    setNewMessageText,
    handleSendNew,
    goBack,
    submitting,
}) => {
    return (
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
    );
};
