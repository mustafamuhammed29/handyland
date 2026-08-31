/**
 * backend/admin/src/components/WarehouseManager/components/CreateMovementModal.tsx
 * Modal dialog for recording safe atomic warehouse movements (Phase 1B).
 */
import React, { useState, useEffect } from 'react';
import {
    X,
    Search,
    AlertTriangle,
    CheckCircle2,
    Boxes
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../../utils/api';
import useDebounce from '../../../hooks/useDebounce';
import type {
    WarehouseLocation,
    WarehousePart,
    MovementType,
    CreateMovementPayload
} from '../types';

interface CreateMovementModalProps {
    isOpen: boolean;
    onClose: () => void;
    locations: WarehouseLocation[];
    onSuccess: () => void;
}

export const CreateMovementModal: React.FC<CreateMovementModalProps> = ({
    isOpen,
    onClose,
    locations,
    onSuccess
}) => {
    // Form fields
    const [selectedPart, setSelectedPart] = useState<WarehousePart | null>(null);
    const [partSearch, setPartSearch] = useState('');
    const [searchResults, setSearchResults] = useState<WarehousePart[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const [movementType, setMovementType] = useState<MovementType>('RECEIVE');
    const [quantity, setQuantity] = useState<number>(1);
    const [sourceLocationId, setSourceLocationId] = useState<string>('');
    const [destinationLocationId, setDestinationLocationId] = useState<string>('');
    const [reason, setReason] = useState<string>('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const debouncedPartSearch = useDebounce(partSearch, 300);

    // Reset form when modal opens or closes
    useEffect(() => {
        if (isOpen) {
            setSelectedPart(null);
            setPartSearch('');
            setSearchResults([]);
            setMovementType('RECEIVE');
            setQuantity(1);
            setSourceLocationId('');
            setDestinationLocationId('');
            setReason('');
            setFormError(null);
            setIsSubmitting(false);
        }
    }, [isOpen]);

    // Bounded search for parts against safe read endpoint
    useEffect(() => {
        const searchParts = async () => {
            if (!debouncedPartSearch.trim() || selectedPart?.name === debouncedPartSearch) {
                setSearchResults([]);
                return;
            }

            setSearchLoading(true);
            try {
                const res = await api.get('/api/warehouse/parts', {
                    params: {
                        search: debouncedPartSearch.trim().slice(0, 100),
                        limit: 10,
                        status: 'active'
                    }
                });

                if (res.data?.success && Array.isArray(res.data?.data)) {
                    setSearchResults(res.data.data);
                    setIsDropdownOpen(true);
                }
            } catch (err) {
                console.error('Failed to search repair parts:', err);
            } finally {
                setSearchLoading(false);
            }
        };

        searchParts();
    }, [debouncedPartSearch, selectedPart]);

    if (!isOpen) return null;

    // Determine field requirements based on movement type
    const needsSource = ['TRANSFER', 'ADJUSTMENT_OUT', 'DAMAGE', 'SUPPLIER_RETURN'].includes(movementType);
    const needsDestination = ['RECEIVE', 'ADJUSTMENT_IN', 'TRANSFER'].includes(movementType);
    const reasonRequired = ['ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'DAMAGE', 'SUPPLIER_RETURN'].includes(movementType);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);

        // Validation
        if (!selectedPart) {
            setFormError('يرجى اختيار قطعة الصيانة أولاً');
            return;
        }

        const qtyNum = Number(quantity);
        if (!Number.isInteger(qtyNum) || qtyNum < 1 || qtyNum > 100000) {
            setFormError('الكمية يجب أن تكون عدداً صحيحاً موجباً بين 1 و 100,000');
            return;
        }

        if (needsSource && !sourceLocationId) {
            setFormError('يرجى تحديد الموقع المصدر للحركة');
            return;
        }

        if (needsDestination && !destinationLocationId) {
            setFormError('يرجى تحديد الموقع الوجهة للحركة');
            return;
        }

        if (movementType === 'TRANSFER' && sourceLocationId === destinationLocationId) {
            setFormError('لا يمكن النقل بين نفس الموقع (المصدر والوجهة متطابقان)');
            return;
        }

        if (reasonRequired && (!reason.trim() || reason.trim().length < 3)) {
            setFormError('سبب الحركة إلزامي لهذا النوع (3 أحرف على الأقل)');
            return;
        }

        // Build strict payload
        const payload: CreateMovementPayload = {
            repairPartId: selectedPart.id,
            movementType,
            quantity: qtyNum
        };

        if (needsSource) payload.sourceLocationId = sourceLocationId;
        if (needsDestination) payload.destinationLocationId = destinationLocationId;
        if (reason.trim()) payload.reason = reason.trim().slice(0, 500);

        setIsSubmitting(true);
        try {
            const res = await api.post('/api/warehouse/movements', payload);
            if (res.data?.success) {
                toast.success('تم تسجيل الحركة بنجاح وتحديث أرصدة المستودع');
                onSuccess();
                onClose();
            } else {
                setFormError(res.data?.message || 'فشل تسجيل الحركة');
            }
        } catch (err: any) {
            const backendError = err.response?.data?.error;
            const backendMessage = err.response?.data?.message;

            if (backendError === 'WAREHOUSE_INSUFFICIENT_STOCK') {
                setFormError('الرصيد المتاح في الموقع المصدر غير كافٍ لتنفيذ هذه الحركة');
            } else if (backendError === 'WAREHOUSE_DATA_INTEGRITY_ERROR') {
                setFormError('تعذر تسجيل الحركة بسبب فحص سلامة وتناسق بيانات المخزون');
            } else {
                setFormError(backendMessage || 'حدث خطأ أثناء تنفيذ الحركة. يرجى التحقق من المدخلات.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                            <Boxes size={20} />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white">تسجيل حركة مخزون جديدة</h3>
                            <p className="text-xs text-slate-400">تسجيل حركة ذرية في دفتر أستاذ المستودع</p>
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
                    {/* Error Banner */}
                    {formError && (
                        <div className="p-3.5 bg-red-950/40 border border-red-800/60 rounded-xl flex items-center gap-2.5 text-red-200 text-xs">
                            <AlertTriangle size={16} className="text-red-400 shrink-0" />
                            <span>{formError}</span>
                        </div>
                    )}

                    {/* 1. Part Search and Selection */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            قطعة الصيانة <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="ابحث باسم القطعة أو SKU أو الباركود..."
                                value={selectedPart ? `${selectedPart.name} (${selectedPart.sku})` : partSearch}
                                onChange={(e) => {
                                    setSelectedPart(null);
                                    setPartSearch(e.target.value);
                                    setIsDropdownOpen(true);
                                }}
                                onFocus={() => setIsDropdownOpen(true)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 pl-10 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                            <Search className="absolute left-3 top-3 text-slate-400" size={18} />

                            {selectedPart && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedPart(null);
                                        setPartSearch('');
                                        setSearchResults([]);
                                    }}
                                    className="absolute right-3 top-3 text-slate-400 hover:text-white"
                                >
                                    <X size={16} />
                                </button>
                            )}

                            {/* Dropdown Results */}
                            {isDropdownOpen && !selectedPart && (
                                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                                    {searchLoading ? (
                                        <div className="p-3 text-center text-xs text-slate-400 animate-pulse">
                                            جاري البحث...
                                        </div>
                                    ) : searchResults.length === 0 ? (
                                        <div className="p-3 text-center text-xs text-slate-500">
                                            {partSearch.trim() ? 'لا توجد قطع مطابقة' : 'اكتب للبحث عن قطعة'}
                                        </div>
                                    ) : (
                                        searchResults.map((part) => (
                                            <button
                                                key={part.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedPart(part);
                                                    setPartSearch('');
                                                    setIsDropdownOpen(false);
                                                }}
                                                className="w-full text-right p-2.5 hover:bg-slate-800 flex items-center justify-between border-b border-slate-800/50 last:border-0"
                                            >
                                                <div>
                                                    <div className="font-semibold text-xs text-white">
                                                        {part.name}
                                                    </div>
                                                    <div className="text-[10px] text-blue-400 font-mono">
                                                        {part.sku}
                                                    </div>
                                                </div>
                                                <div className="text-left">
                                                    <span className="text-[11px] font-bold text-emerald-400">
                                                        متاح: {part.availableQuantity}
                                                    </span>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                        {selectedPart && (
                            <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400 px-1">
                                <span>الماركة: {selectedPart.brand || '—'}</span>
                                <span className="text-emerald-400 font-semibold">
                                    الرصيد المتاح الحالي: {selectedPart.availableQuantity}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* 2. Movement Type */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            نوع الحركة <span className="text-red-400">*</span>
                        </label>
                        <select
                            value={movementType}
                            onChange={(e) => setMovementType(e.target.value as MovementType)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                            <option value="RECEIVE">استلام بضاعة جديدة (RECEIVE)</option>
                            <option value="TRANSFER">نقل موقعي داخلي (TRANSFER)</option>
                            <option value="ADJUSTMENT_IN">تسوية جردية - إضافة (ADJUSTMENT_IN)</option>
                            <option value="ADJUSTMENT_OUT">تسوية جردية - خصم (ADJUSTMENT_OUT)</option>
                            <option value="DAMAGE">إتلاف قطعة معطوبة (DAMAGE)</option>
                            <option value="SUPPLIER_RETURN">إرجاع بضاعة لمورد (SUPPLIER_RETURN)</option>
                        </select>
                    </div>

                    {/* 3. Quantity */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            الكمية <span className="text-red-400">*</span>
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="100000"
                            step="1"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* 4. Location Fields (Dynamic) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Source Location */}
                        {needsSource && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                    الموقع المصدر <span className="text-red-400">*</span>
                                </label>
                                <select
                                    value={sourceLocationId}
                                    onChange={(e) => setSourceLocationId(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                                >
                                    <option value="">اختر الموقع المصدر</option>
                                    {locations.map((loc) => (
                                        <option key={loc.id} value={loc.id}>
                                            {loc.locationCode} ({loc.zone})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Destination Location */}
                        {needsDestination && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                                    الموقع الوجهة <span className="text-red-400">*</span>
                                </label>
                                <select
                                    value={destinationLocationId}
                                    onChange={(e) => setDestinationLocationId(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                                >
                                    <option value="">اختر الموقع الوجهة</option>
                                    {locations.map((loc) => (
                                        <option key={loc.id} value={loc.id}>
                                            {loc.locationCode} ({loc.zone})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* 5. Reason / Justification */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                            السبب أو المبرر {reasonRequired ? <span className="text-red-400">*</span> : <span className="text-slate-500">(اختياري)</span>}
                        </label>
                        <input
                            type="text"
                            placeholder={reasonRequired ? 'يرجى كتابة سبب التسوية أو الإتلاف أو الإرجاع...' : 'ملاحظة توضيحية لسبب الحركة...'}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            maxLength={500}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    {/* Submit Actions */}
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
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                                    <span>جاري المعالجة...</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={15} />
                                    <span>تأكيد وتسجيل الحركة</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
