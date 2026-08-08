import React, { useState } from 'react';
import { Wrench, CheckCircle, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface MaintenanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    loanerId: string;
    onConfirm: (id: string, notes: string) => Promise<void>;
}

export function MaintenanceModal({ isOpen, onClose, loanerId, onConfirm }: MaintenanceModalProps) {
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onConfirm(loanerId, notes);
            setNotes('');
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-slate-900 border border-amber-500/30 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>

                <div className="p-6 border-b border-slate-800/50 flex justify-between items-center bg-slate-900/50 backdrop-blur-xl">
                    <h2 className="text-xl font-black text-white flex items-center gap-3">
                        <div className="p-2 bg-amber-500/20 rounded-xl"><Wrench className="w-5 h-5 text-amber-400" /></div>
                        In Wartung setzen
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Grund / Bemerkung (Optional)</label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="z.B. Display gesprungen, Akku schwach..."
                            rows={3}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white resize-none focus:outline-none focus:border-amber-500 transition-colors"
                        />
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-slate-800/50">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3.5 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 transition-colors"
                        >
                            Abbrechen
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 bg-gradient-to-r from-amber-600 to-amber-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2"
                        >
                            <CheckCircle size={18} />
                            {isSaving ? 'Bitte warten...' : 'Bestätigen'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
