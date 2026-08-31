/**
 * backend/admin/src/components/WarehouseManager/components/AddPartModal.tsx
 * Modal dialog for creating a new canonical repair part in the warehouse catalog (German).
 */
import React, { useState, useEffect } from 'react';
import { X, Wrench, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../../utils/api';

interface AddPartModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialBrand?: string;
    initialDeviceFamily?: string;
    initialCompatibleDevice?: string;
}

export const AddPartModal: React.FC<AddPartModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    initialBrand,
    initialDeviceFamily,
    initialCompatibleDevice
}) => {
    const [name, setName] = useState('');
    const [sku, setSku] = useState('');
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
        if (isOpen) {
            setName('');
            setSku('');
            setBarcode('');
            setCategory('');
            setBrand(initialBrand || '');
            setDeviceFamily(initialDeviceFamily || '');
            setPartType('');
            setQuality('');
            setCompatibleDevicesText(initialCompatibleDevice || '');
            setMinStock('2');
            setFormError(null);
            setIsSubmitting(false);
        }
    }, [isOpen, initialBrand, initialDeviceFamily, initialCompatibleDevice]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        const trimmedName = name.trim();
        const trimmedSku = sku.trim().toUpperCase();

        if (!trimmedName) {
            setFormError('Ersatzteilbezeichnung ist erforderlich.');
            return;
        }

        if (!trimmedSku) {
            setFormError('SKU-Code ist erforderlich.');
            return;
        }

        const parsedMinStock = parseInt(minStock, 10);
        if (Number.isNaN(parsedMinStock) || parsedMinStock < 0) {
            setFormError('Mindestbestand muss eine positive ganze Zahl oder 0 sein.');
            return;
        }

        // Parse compatible devices array from comma or newline separated text
        const rawDevices = compatibleDevicesText
            .split(/[,\n]/)
            .map((d) => d.trim())
            .filter((d) => d.length > 0);

        const payload: Record<string, any> = {
            name: trimmedName,
            sku: trimmedSku,
            minStock: parsedMinStock
        };

        if (barcode.trim()) payload.barcode = barcode.trim().toUpperCase();
        if (category.trim()) payload.category = category.trim().slice(0, 80);
        if (brand.trim()) payload.brand = brand.trim().slice(0, 80);
        if (deviceFamily.trim()) payload.deviceFamily = deviceFamily.trim().slice(0, 80);
        if (partType.trim()) payload.partType = partType.trim().slice(0, 80);
        if (quality.trim()) payload.quality = quality.trim().slice(0, 80);
        if (rawDevices.length > 0) payload.compatibleDevices = rawDevices;

        setIsSubmitting(true);
        try {
            const res = await api.post('/api/warehouse/parts', payload);
            if (res.data?.success) {
                toast.success('Ersatzteil wurde erfolgreich im Katalog angelegt.');
                onSuccess();
                onClose();
            } else {
                setFormError(res.data?.message || 'Fehler beim Anlegen des Ersatzteils.');
            }
        } catch (err: any) {
            const errorCode = err.response?.data?.error;
            if (errorCode === 'WAREHOUSE_PART_SKU_EXISTS') {
                setFormError('Dieser SKU-Code existiert bereits im Lager. Bitte wählen Sie einen eindeutigen SKU.');
            } else if (errorCode === 'WAREHOUSE_PART_BARCODE_EXISTS') {
                setFormError('Dieser Barcode wird bereits für ein anderes Ersatzteil verwendet.');
            } else {
                setFormError(err.response?.data?.message || 'Fehler beim Anlegen des Ersatzteils. Bitte Eingaben prüfen.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                            <Wrench size={19} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white">Neues Ersatzteil anlegen</h3>
                            <p className="text-xs text-slate-400">Neuen Artikel im internen Ersatzteilkatalog definieren</p>
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
                    {/* Informative Stock Rule Banner */}
                    <div className="p-3 bg-blue-950/40 border border-blue-800/50 rounded-xl flex items-start gap-2.5 text-blue-200 text-xs">
                        <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-semibold block mb-0.5">Hinweis zur Bestandsführung:</span>
                            <span className="text-slate-300">
                                Bestände werden ausschließlich über den &quot;Wareneingang (RECEIVE)&quot; an einen bestimmten Lagerort gebucht. Im Katalog wird kein Anfangsbestand direkt eingetragen.
                            </span>
                        </div>
                    </div>

                    {formError && (
                        <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl flex items-center gap-2 text-red-200 text-xs">
                            <AlertTriangle size={16} className="text-red-400 shrink-0" />
                            <span>{formError}</span>
                        </div>
                    )}

                    {/* Name */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            Ersatzteilbezeichnung <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="z.B. Display iPhone 14 Pro Max OLED OEM"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            maxLength={120}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    {/* SKU & Barcode */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                SKU-Code <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="IP14PM-SCR-OEM"
                                value={sku}
                                onChange={(e) => setSku(e.target.value.toUpperCase())}
                                maxLength={80}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono text-cyan-400 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                            <p className="text-[11px] text-slate-500 mt-1">Der SKU-Code ist nach der Erstellung unveränderlich.</p>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                Barcode (Optional)
                            </label>
                            <input
                                type="text"
                                placeholder="880IP14001"
                                value={barcode}
                                onChange={(e) => setBarcode(e.target.value.toUpperCase())}
                                maxLength={80}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Brand & Device Family */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Marke (Brand)</label>
                            <input
                                type="text"
                                placeholder="Apple, Samsung, Xiaomi..."
                                value={brand}
                                onChange={(e) => setBrand(e.target.value)}
                                maxLength={80}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Gerätefamilie (Device Family)</label>
                            <input
                                type="text"
                                placeholder="iPhone 14 Series, Galaxy S23..."
                                value={deviceFamily}
                                onChange={(e) => setDeviceFamily(e.target.value)}
                                maxLength={80}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Part Type, Quality, Category */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Teiletyp (Part Type)</label>
                            <input
                                type="text"
                                placeholder="screen, battery..."
                                value={partType}
                                onChange={(e) => setPartType(e.target.value)}
                                maxLength={80}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Qualität (Quality)</label>
                            <input
                                type="text"
                                placeholder="OEM Original, Compatible..."
                                value={quality}
                                onChange={(e) => setQuality(e.target.value)}
                                maxLength={80}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Kategorie (Category)</label>
                            <input
                                type="text"
                                placeholder="Screens, Batteries..."
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                maxLength={80}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Compatible Devices */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            Kompatible Modelle (Kommagetrennt oder pro Zeile)
                        </label>
                        <textarea
                            rows={2}
                            placeholder="iPhone 14 Pro Max, iPhone 14 Pro"
                            value={compatibleDevicesText}
                            onChange={(e) => setCompatibleDevicesText(e.target.value)}
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
                                    <span>Ersatzteil anlegen</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
