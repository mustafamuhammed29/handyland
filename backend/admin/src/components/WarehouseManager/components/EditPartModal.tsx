/**
 * backend/admin/src/components/WarehouseManager/components/EditPartModal.tsx
 * Modal dialog for updating repair part catalog metadata (Phase 2C).
 */
import React, { useState, useEffect } from 'react';
import { X, Edit2, CheckCircle2, AlertTriangle, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../../utils/api';
import type { WarehousePart } from '../types';

interface EditPartModalProps {
    isOpen: boolean;
    part: WarehousePart | null;
    onClose: () => void;
    onSuccess: () => void;
}

export const EditPartModal: React.FC<EditPartModalProps> = ({
    isOpen,
    part,
    onClose,
    onSuccess
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

    if (!isOpen || !part) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        const trimmedName = name.trim();
        if (!trimmedName) {
            setFormError('اسم قطعة الصيانة إلزامي');
            return;
        }

        const parsedMinStock = parseInt(minStock, 10);
        if (Number.isNaN(parsedMinStock) || parsedMinStock < 0) {
            setFormError('الحد الأدنى للمخزون يجب أن يكون رقماً صحيحاً موجباً أو صفراً');
            return;
        }

        const rawDevices = compatibleDevicesText
            .split(/[,\n]/)
            .map((d) => d.trim())
            .filter((d) => d.length > 0);

        const payload: Record<string, any> = {
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
                toast.success('تم تحديث بيانات قطعة الصيانة بنجاح');
                onSuccess();
                onClose();
            } else {
                setFormError(res.data?.message || 'فشل تحديث بيانات القطعة');
            }
        } catch (err: any) {
            const errorCode = err.response?.data?.error;
            if (errorCode === 'WAREHOUSE_PART_BARCODE_EXISTS') {
                setFormError('رمز الباركود مستخدم مسبقاً لقطعة أخرى.');
            } else {
                setFormError(err.response?.data?.message || 'حدث خطأ أثناء تحديث القطعة. تحقق من المدخلات.');
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
                            <Edit2 size={18} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white">تعديل بيانات قطعة الصيانة</h3>
                            <p className="text-xs text-slate-400">تحديث البيانات الوصفية لقطعة الغيار في الكتالوج</p>
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

                    {/* Immutable SKU Badge */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
                            <Lock size={12} className="text-slate-500" />
                            <span>رمز SKU (ثابت غير قابل للتعديل)</span>
                        </label>
                        <div className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-mono text-cyan-400 font-bold select-none cursor-not-allowed">
                            {part.sku}
                        </div>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            اسم قطعة الصيانة <span className="text-red-400">*</span>
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
                            الباركود (اختياري)
                        </label>
                        <input
                            type="text"
                            value={barcode}
                            onChange={(e) => setBarcode(e.target.value.toUpperCase())}
                            maxLength={80}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Brand & Device Family */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">الماركة (Brand)</label>
                            <input
                                type="text"
                                value={brand}
                                onChange={(e) => setBrand(e.target.value)}
                                maxLength={80}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">عائلة الجهاز (Device Family)</label>
                            <input
                                type="text"
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
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">نوع القطعة (Part Type)</label>
                            <input
                                type="text"
                                value={partType}
                                onChange={(e) => setPartType(e.target.value)}
                                maxLength={80}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">الجودة (Quality)</label>
                            <input
                                type="text"
                                value={quality}
                                onChange={(e) => setQuality(e.target.value)}
                                maxLength={80}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">الفئة (Category)</label>
                            <input
                                type="text"
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
                            الأجهزة المتوافقة (مفصولة بفواصل أو أسطر)
                        </label>
                        <textarea
                            rows={2}
                            value={compatibleDevicesText}
                            onChange={(e) => setCompatibleDevicesText(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 custom-scrollbar resize-none"
                        />
                    </div>

                    {/* Min Stock */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            الحد الأدنى لتنبيه نقص المخزون (Min Stock)
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
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <span>جاري الحفظ...</span>
                            ) : (
                                <>
                                    <CheckCircle2 size={15} />
                                    <span>حفظ التعديلات</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
