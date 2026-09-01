/**
 * backend/admin/src/components/WarehouseManager/components/EditPartModal.tsx
 * Modal dialog for updating repair part catalog metadata (German, Metadata-Only).
 * Strictly guarantees no inventory/stock fields are present or mutated.
 */

import React, { useState, useEffect } from 'react';
import {
    X,
    Edit2,
    CheckCircle2,
    AlertTriangle,
    Lock,
    Info,
    ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../../utils/api';
import {
    TEILETYP_OPTIONS,
    QUALITAET_OPTIONS,
    KATEGORIE_OPTIONS
} from '../utils/catalogHelpers';
import type { WarehousePart, UpdatePartMetadataPayload } from '../types';

interface EditPartModalProps {
    isOpen: boolean;
    part: WarehousePart | null;
    onClose: () => void;
    onSuccess: () => void;
    onNavigateToMovements?: () => void;
}

export const EditPartModal: React.FC<EditPartModalProps> = ({
    isOpen,
    part,
    onClose,
    onSuccess,
    onNavigateToMovements
}) => {
    const [name, setName] = useState('');
    const [barcode, setBarcode] = useState('');
    const [category, setCategory] = useState('');
    const [brand, setBrand] = useState('');
    const [deviceFamily, setDeviceFamily] = useState('');
    const [partType, setPartType] = useState('');
    const [quality, setQuality] = useState('');
    const [compatibleDevicesText, setCompatibleDevicesText] = useState('');
    const [minStock, setMinStock] = useState('2');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && part) {
            setName(part.name || '');
            setBarcode(part.barcode || '');
            setCategory(part.category || '');
            setBrand(part.brand || '');
            setDeviceFamily(part.deviceFamily || '');
            setPartType(part.partType || '');
            setQuality(part.quality || '');
            setCompatibleDevicesText((part.compatibleDevices || []).join(', '));
            setMinStock(String(part.minStock !== undefined ? part.minStock : 2));
            setFormError(null);
            setIsSubmitting(false);
        }
    }, [isOpen, part]);

    // Escape key listener (only when not submitting)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isSubmitting && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isSubmitting, onClose]);

    if (!isOpen || !part) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        const trimmedName = name.trim();
        if (!trimmedName) {
            setFormError('Ersatzteilbezeichnung ist erforderlich.');
            return;
        }

        const parsedMinStock = parseInt(minStock, 10);
        if (Number.isNaN(parsedMinStock) || parsedMinStock < 0) {
            setFormError('Mindestbestand muss eine positive ganze Zahl oder 0 sein.');
            return;
        }

        const rawDevices = compatibleDevicesText
            .split(/[,\n]/)
            .map((d) => d.trim())
            .filter((d) => d.length > 0);

        // Strictly metadata-only payload
        const payload: UpdatePartMetadataPayload = {
            name: trimmedName,
            minStock: parsedMinStock,
            barcode: barcode.trim() ? barcode.trim().toUpperCase() : null,
            category: category.trim() ? category.trim().slice(0, 80) : null,
            brand: brand.trim() ? brand.trim().slice(0, 80) : null,
            deviceFamily: deviceFamily.trim() ? deviceFamily.trim().slice(0, 80) : null,
            partType: partType.trim() ? partType.trim().slice(0, 80) : null,
            quality: quality.trim() ? quality.trim().slice(0, 80) : null,
            compatibleDevices: rawDevices
        };

        setIsSubmitting(true);
        try {
            const res = await api.patch(`/api/warehouse/parts/${part.id}`, payload);
            if (res.data?.success) {
                toast.success('Ersatzteil wurde erfolgreich aktualisiert.');
                onSuccess();
                onClose();
            } else {
                setFormError(res.data?.message || 'Fehler beim Aktualisieren des Ersatzteils.');
            }
        } catch (err: any) {
            const errorCode = err.response?.data?.error;
            if (errorCode === 'WAREHOUSE_PART_BARCODE_EXISTS') {
                setFormError('Dieser Barcode wird bereits für ein anderes Ersatzteil verwendet.');
            } else {
                setFormError(err.response?.data?.message || 'Fehler beim Aktualisieren des Ersatzteils. Bitte Eingaben prüfen.');
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
                        <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                            <Edit2 size={18} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white">Ersatzteil bearbeiten</h3>
                            <p className="text-xs text-slate-400">Metadaten des Reparaturteils im Katalog aktualisieren</p>
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

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
                    {/* Informational Stock Ledger Notice */}
                    <div className="p-3.5 bg-blue-950/40 border border-blue-500/40 rounded-xl flex items-start gap-2.5 text-blue-200 text-xs">
                        <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-semibold text-white block mb-0.5">Hinweis zur Bestandsführung:</span>
                            <span>Bestandsänderungen werden ausschließlich über <strong>Lagerbewegungen</strong> erfasst.</span>
                        </div>
                    </div>

                    {formError && (
                        <div className="p-3.5 bg-red-950/50 border border-red-800/70 rounded-xl flex items-center gap-2 text-red-200 text-xs">
                            <AlertTriangle size={16} className="text-red-400 shrink-0" />
                            <span>{formError}</span>
                        </div>
                    )}

                    {/* Immutable SKU */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                            <Lock size={12} className="text-slate-500" />
                            <span>SKU-Code (unveränderlich)</span>
                        </label>
                        <div className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-cyan-400 font-bold select-none cursor-not-allowed">
                            {part.sku}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                            Eindeutiger Stammdaten-Schlüssel (kann nach der Erstellung nicht geändert werden).
                        </p>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            Ersatzteilbezeichnung <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={120}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    {/* Barcode */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            Barcode (Optional)
                        </label>
                        <input
                            type="text"
                            value={barcode}
                            onChange={(e) => setBarcode(e.target.value.toUpperCase())}
                            maxLength={80}
                            placeholder="z.B. 880IP14PL001"
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Brand & Device Family */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Marke (Brand)</label>
                            <input
                                type="text"
                                value={brand}
                                onChange={(e) => setBrand(e.target.value)}
                                maxLength={80}
                                placeholder="z.B. Apple"
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Gerätefamilie (Device Family)</label>
                            <input
                                type="text"
                                value={deviceFamily}
                                onChange={(e) => setDeviceFamily(e.target.value)}
                                maxLength={80}
                                placeholder="z.B. iPhone 14 Series"
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Part Type, Quality, Category */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Teiletyp</label>
                            <select
                                value={partType}
                                onChange={(e) => setPartType(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                            >
                                <option value="">Nicht angegeben</option>
                                {TEILETYP_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Qualität</label>
                            <select
                                value={quality}
                                onChange={(e) => setQuality(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                            >
                                <option value="">Nicht angegeben</option>
                                {QUALITAET_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Kategorie</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                            >
                                <option value="">Nicht angegeben</option>
                                {KATEGORIE_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>
                                        {opt}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Compatible Devices */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            Kompatible Modelle (Kommagetrennt oder pro Zeile)
                        </label>
                        <textarea
                            rows={2}
                            value={compatibleDevicesText}
                            onChange={(e) => setCompatibleDevicesText(e.target.value)}
                            placeholder="z.B. iPhone 14 Plus"
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 custom-scrollbar resize-none"
                        />
                    </div>

                    {/* Min Stock */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            Mindestbestand für Benachrichtigung (Min Stock)
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="100000"
                            value={minStock}
                            onChange={(e) => setMinStock(e.target.value)}
                            className="w-full sm:w-48 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                            Löst bei Erreichen oder Unterschreiten den Status „Niedriger Bestand“ aus.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        {onNavigateToMovements ? (
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    onNavigateToMovements();
                                }}
                                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-950/30 hover:bg-blue-900/40 border border-blue-800/40 transition-colors"
                            >
                                <span>Zu Lagerbewegungen</span>
                                <ArrowRight size={13} />
                            </button>
                        ) : (
                            <div />
                        )}

                        <div className="flex items-center gap-2.5 justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-center"
                            >
                                Abbrechen
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:opacity-50"
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
                    </div>
                </form>
            </div>
        </div>
    );
};
