/**
 * backend/admin/src/components/WarehouseManager/components/AddModelModal.tsx
 * Modal for creating a new first-class device model (German, Metadata-Only).
 */

import React, { useState, useEffect } from 'react';
import { X, Smartphone, CheckCircle2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../../utils/api';
import type { CreateModelPayload } from '../types';

interface AddModelModalProps {
    isOpen: boolean;
    initialBrand?: string;
    onClose: () => void;
    onSuccess: () => void;
}

export const AddModelModal: React.FC<AddModelModalProps> = ({
    isOpen,
    initialBrand = 'Apple',
    onClose,
    onSuccess
}) => {
    const [brand, setBrand] = useState(initialBrand);
    const [modelName, setModelName] = useState('');
    const [deviceFamily, setDeviceFamily] = useState('');
    const [releaseYear, setReleaseYear] = useState('');
    const [sortWeight, setSortWeight] = useState('0');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setBrand(initialBrand || 'Apple');
            setModelName('');
            setDeviceFamily('');
            setReleaseYear('');
            setSortWeight('0');
            setFormError(null);
            setIsSubmitting(false);
        }
    }, [isOpen, initialBrand]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isSubmitting && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isSubmitting, onClose]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        const trimmedBrand = brand.trim();
        const trimmedModelName = modelName.trim();
        const trimmedFamily = deviceFamily.trim();

        if (!trimmedBrand) {
            setFormError('Marke ist erforderlich.');
            return;
        }
        if (!trimmedModelName) {
            setFormError('Modellbezeichnung ist erforderlich.');
            return;
        }
        if (!trimmedFamily) {
            setFormError('Gerätefamilie ist erforderlich.');
            return;
        }

        let parsedYear: number | null = null;
        if (releaseYear.trim()) {
            parsedYear = parseInt(releaseYear.trim(), 10);
            if (Number.isNaN(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
                setFormError('Erscheinungsjahr muss zwischen 2000 und 2100 liegen.');
                return;
            }
        }

        const parsedSort = parseInt(sortWeight.trim(), 10) || 0;

        const payload: CreateModelPayload = {
            brand: trimmedBrand,
            modelName: trimmedModelName,
            deviceFamily: trimmedFamily,
            releaseYear: parsedYear,
            sortWeight: parsedSort
        };

        setIsSubmitting(true);
        try {
            const res = await api.post('/api/warehouse/models', payload);
            if (res.data?.success) {
                toast.success(`Modell „${trimmedModelName}“ erfolgreich angelegt.`);
                onSuccess();
                onClose();
            } else {
                setFormError(res.data?.message || 'Fehler beim Anlegen des Modells.');
            }
        } catch (err: any) {
            const errorCode = err.response?.data?.error;
            if (errorCode === 'WAREHOUSE_MODEL_EXISTS') {
                setFormError(`Dieses Modell existiert bereits unter der Marke „${trimmedBrand}“.`);
            } else {
                setFormError(err.response?.data?.message || 'Fehler beim Anlegen des Modells. Bitte Eingaben prüfen.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 border border-slate-700/90 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                            <Smartphone size={18} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white">Neues Gerätemodell anlegen</h3>
                            <p className="text-xs text-slate-400">Modell unabhängig im Ersatzteilkatalog registrieren</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-30"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
                    {formError && (
                        <div className="p-3.5 bg-red-950/50 border border-red-800/70 rounded-xl flex items-center gap-2 text-red-200 text-xs">
                            <AlertTriangle size={16} className="text-red-400 shrink-0" />
                            <span>{formError}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                Marke <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={brand}
                                onChange={(e) => setBrand(e.target.value)}
                                maxLength={80}
                                placeholder="z.B. Apple"
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                Gerätefamilie <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                value={deviceFamily}
                                onChange={(e) => setDeviceFamily(e.target.value)}
                                maxLength={80}
                                placeholder="z.B. iPhone 14 Series"
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            Modellbezeichnung <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={modelName}
                            onChange={(e) => setModelName(e.target.value)}
                            maxLength={80}
                            placeholder="z.B. iPhone 14 Plus"
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                Erscheinungsjahr (Optional)
                            </label>
                            <input
                                type="number"
                                min="2000"
                                max="2100"
                                value={releaseYear}
                                onChange={(e) => setReleaseYear(e.target.value)}
                                placeholder="z.B. 2022"
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                Sortiergewicht (Optional)
                            </label>
                            <input
                                type="number"
                                value={sortWeight}
                                onChange={(e) => setSortWeight(e.target.value)}
                                placeholder="0"
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                            />
                            <p className="text-[10px] text-slate-500 mt-1">Höhere Werte erscheinen weiter oben.</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
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
                            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <span>Anlegen läuft …</span>
                            ) : (
                                <>
                                    <CheckCircle2 size={15} />
                                    <span>Modell anlegen</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
