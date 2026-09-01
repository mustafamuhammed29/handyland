/**
 * backend/admin/src/components/WarehouseManager/components/DiscontinueModelPartsModal.tsx
 * Modal for safely retiring all zero-balance repair parts linked to a device model (German).
 * Strictly excludes and protects shared-active repair parts.
 */

import React, { useState, useEffect } from 'react';
import {
    X,
    Archive,
    AlertTriangle,
    ShieldAlert,
    CheckCircle2,
    RefreshCw,
    Boxes,
    Share2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../../utils/api';
import type { DeviceModel, ModelPartsPreview } from '../types';

interface DiscontinueModelPartsModalProps {
    isOpen: boolean;
    model: DeviceModel | null;
    onClose: () => void;
    onSuccess: () => void;
}

export const DiscontinueModelPartsModal: React.FC<DiscontinueModelPartsModalProps> = ({
    isOpen,
    model,
    onClose,
    onSuccess
}) => {
    const [preview, setPreview] = useState<ModelPartsPreview | null>(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(true);
    const [previewError, setPreviewError] = useState<string | null>(null);

    const [confirmText, setConfirmText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && model) {
            setConfirmText('');
            setSubmitError(null);
            setPreviewError(null);
            setIsLoadingPreview(true);

            api.get(`/api/warehouse/models/${model.id}/discontinue-parts/preview`)
                .then((res) => {
                    if (res.data?.success) {
                        setPreview(res.data.data);
                    } else {
                        setPreviewError(res.data?.message || 'Fehler beim Laden der Ersatzteil-Vorschau.');
                    }
                })
                .catch((err) => {
                    setPreviewError(err.response?.data?.message || 'Vorschau konnte nicht geladen werden.');
                })
                .finally(() => {
                    setIsLoadingPreview(false);
                });
        }
    }, [isOpen, model]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isSubmitting && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isSubmitting, onClose]);

    if (!isOpen || !model) return null;

    const isMatch = confirmText.trim().toLowerCase() === model.modelName.trim().toLowerCase();
    const canSubmit = preview && !preview.isBlocked && preview.eligiblePartsCount > 0 && isMatch && !isSubmitting;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        setSubmitError(null);
        setIsSubmitting(true);

        try {
            const res = await api.post(`/api/warehouse/models/${model.id}/discontinue-parts`);
            if (res.data?.success) {
                toast.success(`Ersatzteile für Modell „${model.modelName}“ wurden erfolgreich ausgemustert.`);
                onSuccess();
                onClose();
            } else {
                setSubmitError(res.data?.message || 'Fehler beim Ausmustern der Ersatzteile.');
            }
        } catch (err: any) {
            const errorCode = err.response?.data?.error;
            if (errorCode === 'WAREHOUSE_MODEL_HAS_ACTIVE_STOCK') {
                setSubmitError('Ausmustern abgebrochen: Mindestens ein ausschließlich zugeordnetes Ersatzteil besitzt noch aktiven Lagerbestand.');
            } else {
                setSubmitError(err.response?.data?.message || 'Fehler beim Ausmustern der Ersatzteile.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 border border-slate-700/90 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                            <Archive size={18} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white">Zugehörige Ersatzteile ausmustern</h3>
                            <p className="text-xs text-slate-400">{model.brand} / {model.modelName}</p>
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

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
                    {isLoadingPreview ? (
                        <div className="py-8 flex flex-col items-center justify-center gap-3 text-slate-400">
                            <RefreshCw size={24} className="animate-spin text-blue-400" />
                            <p className="text-xs">Lagerbestände und verknüpfte Ersatzteile werden geprüft …</p>
                        </div>
                    ) : previewError ? (
                        <div className="p-3.5 bg-red-950/50 border border-red-800/70 rounded-xl flex items-center gap-2 text-red-200 text-xs">
                            <AlertTriangle size={16} className="text-red-400 shrink-0" />
                            <span>{previewError}</span>
                        </div>
                    ) : preview ? (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-0.5">Verknüpft</span>
                                    <span className="text-lg font-bold text-white">{preview.totalLinkedParts}</span>
                                </div>
                                <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/50 text-cyan-400 text-center">
                                    <span className="text-[10px] uppercase tracking-wider font-bold block mb-0.5">Geteilt (Aktiv)</span>
                                    <span className="text-lg font-bold">{preview.sharedActivePartsCount}</span>
                                </div>
                                <div className={`p-3 rounded-xl border text-center ${preview.blockedByStockCount > 0 ? 'bg-red-950/30 border-red-800/50 text-red-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                                    <span className="text-[10px] uppercase tracking-wider font-bold block mb-0.5">Mit Bestand</span>
                                    <span className="text-lg font-bold">{preview.blockedByStockCount}</span>
                                </div>
                                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/50 text-emerald-400 text-center">
                                    <span className="text-[10px] uppercase tracking-wider font-bold block mb-0.5">Berechtigt (0)</span>
                                    <span className="text-lg font-bold">{preview.eligiblePartsCount}</span>
                                </div>
                            </div>

                            {/* Shared parts notice */}
                            {preview.sharedActivePartsCount > 0 && (
                                <div className="p-3.5 bg-cyan-950/30 border border-cyan-600/40 rounded-xl flex items-start gap-2.5 text-cyan-200 text-xs">
                                    <Share2 size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-bold text-white block mb-0.5">Ausgenommene geteilte Ersatzteile: {preview.sharedActivePartsCount}</span>
                                        <span>Diese Ersatzteile bleiben aktiv, da sie mit mindestens einem weiteren aktiven Modell kompatibel sind.</span>
                                    </div>
                                </div>
                            )}

                            {/* Blocked or Notice state */}
                            {preview.isBlocked ? (
                                <div className="p-4 bg-red-950/40 border border-red-600/50 rounded-xl flex items-start gap-3 text-red-200 text-xs">
                                    <ShieldAlert size={20} className="text-red-400 shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-bold text-white block mb-1">Ausmustern nicht möglich:</span>
                                        <span>Für mindestens ein ausschließlich zugeordnetes Ersatzteil besteht noch Lagerbestand. Buchen Sie die Bestände zuerst über <strong>Lagerbewegungen</strong> aus.</span>
                                    </div>
                                </div>
                            ) : preview.eligiblePartsCount === 0 ? (
                                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-3 text-slate-400 text-xs">
                                    <Boxes size={20} className="text-slate-500 shrink-0" />
                                    <span>Für dieses Modell sind keine ausschließlich zugeordneten Ersatzteile zum Ausmustern vorhanden.</span>
                                </div>
                            ) : (
                                <div className="p-4 bg-amber-950/30 border border-amber-600/40 rounded-xl flex items-start gap-3 text-amber-200 text-xs">
                                    <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
                                    <div>
                                        <span className="font-bold text-white block mb-1">Unwiderrufliche Ausmusterung:</span>
                                        <span>Alle <strong>{preview.eligiblePartsCount}</strong> ausschließlich zugeordneten Ersatzteile mit Nullbestand werden auf den Status „Ausgemustert“ (discontinued) gesetzt. Lagerbewegungen und Historie bleiben unverändert erhalten.</span>
                                    </div>
                                </div>
                            )}

                            {submitError && (
                                <div className="p-3.5 bg-red-950/50 border border-red-800/70 rounded-xl flex items-center gap-2 text-red-200 text-xs">
                                    <AlertTriangle size={16} className="text-red-400 shrink-0" />
                                    <span>{submitError}</span>
                                </div>
                            )}

                            {/* Typed confirmation input if eligible */}
                            {!preview.isBlocked && preview.eligiblePartsCount > 0 && (
                                <div className="space-y-2 pt-2">
                                    <label className="block text-xs font-semibold text-slate-300">
                                        Bestätigung: Tippen Sie <strong className="text-amber-400 font-mono">"{model.modelName}"</strong> ein:
                                    </label>
                                    <input
                                        type="text"
                                        value={confirmText}
                                        onChange={(e) => setConfirmText(e.target.value)}
                                        placeholder={model.modelName}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                                    />
                                </div>
                            )}
                        </>
                    ) : null}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-end gap-2.5 bg-slate-950/70">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                        Schließen
                    </button>
                    {preview && !preview.isBlocked && preview.eligiblePartsCount > 0 && (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(217,119,6,0.4)] disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <span>Ausmustern läuft …</span>
                            ) : (
                                <>
                                    <CheckCircle2 size={15} />
                                    <span>Zugehörige Ersatzteile ausmustern</span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
