/**
 * backend/admin/src/components/WarehouseManager/components/AddLocationModal.tsx
 * Modal dialog for creating a new physical warehouse location (German).
 */
import React, { useState, useEffect } from 'react';
import { X, MapPin, CheckCircle2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../../utils/api';

interface AddLocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const AddLocationModal: React.FC<AddLocationModalProps> = ({
    isOpen,
    onClose,
    onSuccess
}) => {
    const [locationCode, setLocationCode] = useState('');
    const [zone, setZone] = useState('');
    const [rack, setRack] = useState('');
    const [shelf, setShelf] = useState('');
    const [bin, setBin] = useState('');
    const [description, setDescription] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setLocationCode('');
            setZone('');
            setRack('');
            setShelf('');
            setBin('');
            setDescription('');
            setFormError(null);
            setIsSubmitting(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        const trimmedCode = locationCode.trim().toUpperCase();
        const trimmedZone = zone.trim();

        if (!trimmedCode) {
            setFormError('Lagerort-Code ist erforderlich.');
            return;
        }

        if (!trimmedZone) {
            setFormError('Zone ist erforderlich.');
            return;
        }

        const payload: Record<string, string> = {
            locationCode: trimmedCode,
            zone: trimmedZone
        };

        if (rack.trim()) payload.rack = rack.trim().slice(0, 80);
        if (shelf.trim()) payload.shelf = shelf.trim().slice(0, 80);
        if (bin.trim()) payload.bin = bin.trim().slice(0, 80);
        if (description.trim()) payload.description = description.trim().slice(0, 500);

        setIsSubmitting(true);
        try {
            const res = await api.post('/api/warehouse/locations', payload);
            if (res.data?.success) {
                toast.success('Lagerort wurde erfolgreich angelegt.');
                onSuccess();
                onClose();
            } else {
                setFormError(res.data?.message || 'Fehler beim Anlegen des Lagerorts.');
            }
        } catch (err: any) {
            const errorCode = err.response?.data?.error;
            if (errorCode === 'WAREHOUSE_LOCATION_CODE_EXISTS') {
                setFormError('Dieser Lagerort-Code existiert bereits. Bitte wählen Sie einen eindeutigen Code.');
            } else {
                setFormError(err.response?.data?.message || 'Fehler beim Anlegen des Lagerorts. Bitte Eingaben prüfen.');
            }
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
                        <div className="w-9 h-9 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                            <MapPin size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white">Neuen Lagerort anlegen</h3>
                            <p className="text-xs text-slate-400">Physischen Lagerplatz für Reparaturteile einrichten</p>
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

                    {/* Location Code */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            Lagerort-Code (Location Code) <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="z.B. ZONE-A-01"
                            value={locationCode}
                            onChange={(e) => setLocationCode(e.target.value.toUpperCase())}
                            maxLength={80}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                        />
                        <p className="text-[11px] text-slate-500 mt-1">Der Lagerort-Code ist nach der Erstellung unveränderlich.</p>
                    </div>

                    {/* Zone */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            Zone <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="z.B. Zone A - Displays"
                            value={zone}
                            onChange={(e) => setZone(e.target.value)}
                            maxLength={80}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                        />
                    </div>

                    {/* Rack, Shelf, Bin */}
                    <div className="grid grid-cols-3 gap-2.5">
                        <div>
                            <label className="block text-[11px] font-medium text-slate-400 mb-1">Regal (Rack)</label>
                            <input
                                type="text"
                                placeholder="01"
                                value={rack}
                                onChange={(e) => setRack(e.target.value)}
                                maxLength={80}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-medium text-slate-400 mb-1">Ebene (Shelf)</label>
                            <input
                                type="text"
                                placeholder="S02"
                                value={shelf}
                                onChange={(e) => setShelf(e.target.value)}
                                maxLength={80}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] font-medium text-slate-400 mb-1">Fach (Bin)</label>
                            <input
                                type="text"
                                placeholder="B04"
                                value={bin}
                                onChange={(e) => setBin(e.target.value)}
                                maxLength={80}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">Beschreibung (Optional)</label>
                        <input
                            type="text"
                            placeholder="Zusätzliche Hinweise zum Lagerplatz …"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={500}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
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
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <span>Speichern läuft …</span>
                            ) : (
                                <>
                                    <CheckCircle2 size={15} />
                                    <span>Lagerort speichern</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
