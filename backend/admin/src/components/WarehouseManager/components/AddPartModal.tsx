/**
 * backend/admin/src/components/WarehouseManager/components/AddPartModal.tsx
 * Modal dialog for creating a new canonical repair part in the warehouse catalog (Phase 2C).
 */
import React, { useState, useEffect } from 'react';
import { X, Wrench, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../../utils/api';

interface AddPartModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const AddPartModal: React.FC<AddPartModalProps> = ({
    isOpen,
    onClose,
    onSuccess
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
            setBrand('');
            setDeviceFamily('');
            setPartType('');
            setQuality('');
            setCompatibleDevicesText('');
            setMinStock('2');
            setFormError(null);
            setIsSubmitting(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        const trimmedName = name.trim();
        const trimmedSku = sku.trim().toUpperCase();

        if (!trimmedName) {
            setFormError('اسم قطعة الصيانة إلزامي');
            return;
        }

        if (!trimmedSku) {
            setFormError('رمز SKU إلزامي');
            return;
        }

        const parsedMinStock = parseInt(minStock, 10);
        if (Number.isNaN(parsedMinStock) || parsedMinStock < 0) {
            setFormError('الحد الأدنى للمخزون يجب أن يكون رقماً صحيحاً موجباً أو صفراً');
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
                toast.success('تمت إضافة قطعة الصيانة إلى الكتالوج بنجاح');
                onSuccess();
                onClose();
            } else {
                setFormError(res.data?.message || 'فشل إنشاء قطعة الصيانة');
            }
        } catch (err: any) {
            const errorCode = err.response?.data?.error;
            if (errorCode === 'WAREHOUSE_PART_SKU_EXISTS') {
                setFormError('رمز SKU مستخدم مسبقاً في المستودع. يرجى إدخال رمز فريد.');
            } else if (errorCode === 'WAREHOUSE_PART_BARCODE_EXISTS') {
                setFormError('رمز الباركود مستخدم مسبقاً لقطعة أخرى.');
            } else {
                setFormError(err.response?.data?.message || 'حدث خطأ أثناء إنشاء القطعة. تحقق من المدخلات.');
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
                            <h3 className="text-base font-bold text-white">إضافة قطعة صيانة للكتالوج</h3>
                            <p className="text-xs text-slate-400">تعريف قطعة غيار جديدة في نظام المستودع الداخلي</p>
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
                            <span className="font-semibold block mb-0.5">تنبيه إدارة المخزون:</span>
                            <span className="text-slate-300">
                                أضف الكمية لاحقاً عبر حركة &quot;استلام بضاعة&quot; إلى موقع مستودع محدد. لا يمكن تعيين أرصدة مخزون أولية من نموذج الكتالوج.
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
                            اسم قطعة الصيانة <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="مثال: شاشة iPhone 13 Pro OLED الأصلية"
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
                                رمز SKU <span className="text-red-400">*</span>
                            </label>
                            <input
                                type="text"
                                placeholder="SCR-IPH13P-OLED"
                                value={sku}
                                onChange={(e) => setSku(e.target.value.toUpperCase())}
                                maxLength={80}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono text-cyan-400 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                            <p className="text-[11px] text-slate-500 mt-1">رمز SKU غير قابل للتعديل بعد الإنشاء.</p>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                الباركود (اختياري)
                            </label>
                            <input
                                type="text"
                                placeholder="BAR-8829103"
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
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">الماركة (Brand)</label>
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
                            <label className="block text-xs font-semibold text-slate-300 mb-1.5">عائلة الجهاز (Device Family)</label>
                            <input
                                type="text"
                                placeholder="iPhone 13, Galaxy S22..."
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
                                placeholder="Display, Battery..."
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
                                placeholder="Original (OEM), Refurbished..."
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
                            الأجهزة المتوافقة (مفصولة بفواصل أو أسطر)
                        </label>
                        <textarea
                            rows={2}
                            placeholder="iPhone 13 Pro, iPhone 13 Pro Max (A2638, A2483)"
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
                                    <span>حفظ القطعة</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
