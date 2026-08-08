import React, { useState, useEffect } from 'react';
import { Smartphone, Save, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface Loaner {
    _id: string;
    name: string;
    imei: string;
    notes: string;
}

interface EditLoanerModalProps {
    isOpen: boolean;
    onClose: () => void;
    loaner: Loaner | null;
    onSave: (id: string, updateData: Partial<Loaner>) => Promise<void>;
}

export function EditLoanerModal({ isOpen, onClose, loaner, onSave }: EditLoanerModalProps) {
    const [formData, setFormData] = useState<Partial<Loaner>>({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (loaner && isOpen) {
            setFormData({
                name: loaner.name,
                imei: loaner.imei,
                notes: loaner.notes || ''
            });
        }
    }, [loaner, isOpen]);

    if (!isOpen || !loaner) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave(loaner._id, formData);
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
                className="bg-slate-900 border border-slate-700/50 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>

                <div className="p-6 border-b border-slate-800/50 flex justify-between items-center bg-slate-900/50 backdrop-blur-xl">
                    <h2 className="text-xl font-black text-white flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-xl"><Smartphone className="w-5 h-5 text-blue-400" /></div>
                        Leihgerät bearbeiten
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
                        <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Gerätename</label>
                        <input
                            required
                            value={formData.name || ''}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">IMEI (15-stellig)</label>
                        <input
                            required
                            value={formData.imei || ''}
                            onChange={e => setFormData({ ...formData, imei: e.target.value })}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-blue-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">Initiale Notizen / Zustand</label>
                        <textarea
                            value={formData.notes || ''}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white resize-none focus:outline-none focus:border-blue-500 transition-colors"
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
                            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 disabled:from-blue-800 disabled:to-blue-700 text-white font-bold py-3.5 rounded-xl hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                        >
                            <Save size={18} />
                            {isSaving ? 'Speichern...' : 'Änderungen speichern'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
