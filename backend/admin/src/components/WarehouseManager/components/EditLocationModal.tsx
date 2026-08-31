/**
 * backend/admin/src/components/WarehouseManager/components/EditLocationModal.tsx
 * Modal dialog for updating physical warehouse location metadata (German).
 */
import React, { useState, useEffect } from 'react';
import { X, Edit2, CheckCircle2, AlertTriangle, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../../utils/api';
import type { WarehouseLocation } from '../types';

interface EditLocationModalProps {
    isOpen: boolean;
    location: WarehouseLocation | null;
    onClose: () => void;
    onSuccess: () => void;
}

export const EditLocationModal: React.FC<EditLocationModalProps> = ({
    isOpen,
    location,
    onClose,
    onSuccess
}) => {
    const [zone, setZone] = useState('');
    const [rack, setRack] = useState('');
    const [shelf, setShelf] = useState('');
    const [bin, setBin] = useState('');
    const [description, setDescription] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && location) {
            setZone(location.zone || '');
            setRack(location.rack || '');
            setShelf(location.shelf || '');
            setBin(location.bin || '');
            setDescription(location.description || '');
            setFormError(null);
            setIsSubmitting(false);
        }
    }, [isOpen, location]);

    if (!isOpen || !location) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        const trimmedZone = zone.trim();
        if (!trimmedZone) {
            setFormError('Zone ist erforderlich.');
            return;
        }

        const payload: Record<string, string | null> = {
            zone: trimmedZone,
            rack: rack.trim() ? rack.trim().slice(0, 80) : null,
            shelf: shelf.trim() ? shelf.trim().slice(0, 80) : null,
            bin: bin.trim() ? bin.trim().slice(0, 80) : null,
            description: description.trim() ? description.trim().slice(0, 500) : null
        };

        setIsSubmitting(true);
        try {
            const res = await api.patch(`/api/warehouse/locations/${location.id}`, payload);
            if (res.data?.success) {
                toast.success('Lagerort-Daten wurden erfolgreich aktualisiert.');
                onSuccess();
                onClose();
            } else {
                setFormError(res.data?.message || 'Fehler beim Aktualisieren des Lagerorts.');
            }
        } catch (err: any) {
            setFormError(err.response?.data?.message || 'Fehler beim Aktualisieren des Lagerorts. Bitte Eingaben prüfen.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                            <Edit2 size={18} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white">Lagerort bearbeiten</h3>
                            <p className="text-xs text-slate-400">Metadaten des Lagerplatzes aktualisieren</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
                    {formError && (
                        <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl flex items-center gap-2 text-red-200 text-xs">
                            <AlertTriangle size={16} className="text-red-400 shrink-0" />
                            <span>{formError}</span>
                        </div>
                    )}

                    {/* Immutable Location Code Badge */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                            <Lock size={12} className="text-slate-500" />
                            <span>Lagerort-Code (Unveränderlich)</span>
                        </label>
                        <div className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-cyan-400 font-bold select-none cursor-not-allowed">
                            {location.locationCode}
                        </div>
                    </div>

                    {/* Zone */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            Zone <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={zone}
                            onChange={(e) => setZone(e.target.value)}
                            maxLength={80}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    {/* Rack, Shelf, Bin */}
                    <div className="grid grid-cols-3 gap-2.5">
                        <div>
                            <label className="block text-[11px] font-medium text-slate-400 mb-1">Regal (Rack)</label>
                            <input
                                type="text"
                                value={rack}
                                onChange={(e) => setRack(e.target.value)}
                                maxLength={80}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-medium text-slate-400 mb-1">Ebene (Shelf)</label>
                            <input
                                type="text"
                                value={shelf}
                                onChange={(e) => setShelf(e.target.value)}
                                maxLength={80}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-medium text-slate-400 mb-1">Fach (Bin)</label>
                            <input
                                type="text"
                                value={bin}
                                onChange={(e) => setBin(e.target.value)}
                                maxLength={80}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Beschreibung (Optional)</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={500}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                            Abbrechen
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <span>Speichern läuft …</span>
                            ) : (
                                <>
                                    <CheckCircle2 size={15} />
                                    <span>Änderungen speichern</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
