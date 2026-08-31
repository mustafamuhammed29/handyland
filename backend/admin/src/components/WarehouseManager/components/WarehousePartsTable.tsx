/**
 * backend/admin/src/components/WarehouseManager/components/WarehousePartsTable.tsx
 * Paginated repair parts table with comprehensive filters, search, and catalog controls (Phase 2C).
 */
import React, { useState } from 'react';
import {
    Search,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Boxes,
    RefreshCw,
    SlidersHorizontal,
    Plus,
    Edit2,
    PowerOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useConfirm } from '../../../context/ConfirmContext';
import { api } from '../../../utils/api';
import AdminPagination from '../../AdminPagination';
import { AddPartModal } from './AddPartModal';
import { EditPartModal } from './EditPartModal';
import type { WarehousePart, WarehouseLocation, PaginationMeta } from '../types';

interface WarehousePartsTableProps {
    parts: WarehousePart[];
    locations: WarehouseLocation[];
    pagination: PaginationMeta;
    loading: boolean;
    error: string | null;
    search: string;
    onSearchChange: (value: string) => void;
    brand: string;
    onBrandChange: (value: string) => void;
    deviceFamily: string;
    onDeviceFamilyChange: (value: string) => void;
    partType: string;
    onPartTypeChange: (value: string) => void;
    quality: string;
    onQualityChange: (value: string) => void;
    status: 'active' | 'discontinued' | '';
    onStatusChange: (value: 'active' | 'discontinued' | '') => void;
    locationId: string;
    onLocationIdChange: (value: string) => void;
    lowStock: boolean;
    onLowStockChange: (value: boolean) => void;
    page: number;
    onPageChange: (page: number) => void;
    limit: number;
    onLimitChange: (limit: number) => void;
    onRetry: () => void;
    onRefresh?: () => void;
}

export const WarehousePartsTable: React.FC<WarehousePartsTableProps> = ({
    parts,
    locations,
    pagination,
    loading,
    error,
    search,
    onSearchChange,
    brand,
    onBrandChange,
    deviceFamily,
    onDeviceFamilyChange,
    partType,
    onPartTypeChange,
    quality,
    onQualityChange,
    status,
    onStatusChange,
    locationId,
    onLocationIdChange,
    lowStock,
    onLowStockChange,
    page,
    onPageChange,
    limit,
    onLimitChange,
    onRetry,
    onRefresh
}) => {
    const { confirm } = useConfirm();
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingPart, setEditingPart] = useState<WarehousePart | null>(null);
    const [discontinuingId, setDiscontinuingId] = useState<string | null>(null);

    // Extract unique brands, part types, qualities from current parts for quick hints
    const brandsList = ['Apple', 'Samsung', 'Xiaomi', 'Huawei', 'Google', 'OnePlus', 'Sony'];
    const partTypesList = ['Display', 'Battery', 'Charging Port', 'Back Cover', 'Camera', 'Speaker', 'Microphone'];
    const qualitiesList = ['Original (OEM)', 'Original (Pulled)', 'Refurbished', 'OLED High Copy', 'In-Cell Copy'];

    const hasActiveFilters = Boolean(
        brand || deviceFamily || partType || quality || status || locationId || lowStock
    );

    const clearAllFilters = () => {
        onBrandChange('');
        onDeviceFamilyChange('');
        onPartTypeChange('');
        onQualityChange('');
        onStatusChange('');
        onLocationIdChange('');
        onLowStockChange(false);
        onPageChange(1);
    };

    const handleDiscontinue = async (part: WarehousePart) => {
        const isConfirmed = await confirm({
            title: 'إيقاف قطعة الصيانة',
            message: `هل أنت متأكد من رغبتك في إيقاف القطعة (${part.name})؟ لا يمكن إيقاف القطع التي تحتوي على أرصدة غير صفرية في المستودع. بعد الإيقاف، لن تتمكن من استلام كميات جديدة لهذه القطعة.`,
            confirmLabel: 'إيقاف القطعة',
            cancelLabel: 'إلغاء',
            variant: 'danger'
        });

        if (!isConfirmed) return;

        setDiscontinuingId(part.id);
        try {
            const res = await api.post(`/api/warehouse/parts/${part.id}/discontinue`);
            if (res.data?.success) {
                toast.success(`تم إيقاف القطعة ${part.name} بنجاح`);
                if (onRefresh) onRefresh();
                else onRetry();
            }
        } catch (err: any) {
            const errorCode = err.response?.data?.error;
            if (errorCode === 'WAREHOUSE_PART_HAS_STOCK') {
                toast.error('لا يمكن إيقاف القطعة لأنها ما زالت تحتوي على مخزون. انقل أو سوِّ الكمية أولاً.');
            } else {
                toast.error(err.response?.data?.message || 'فشل إيقاف القطعة');
            }
        } finally {
            setDiscontinuingId(null);
        }
    };

    return (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
            {/* Search and Quick Filters Bar */}
            <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-col gap-4">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="ابحث بالاسم أو SKU أو الباركود أو الموديل..."
                            value={search}
                            onChange={(e) => {
                                onSearchChange(e.target.value);
                                onPageChange(1);
                            }}
                            className="w-full bg-slate-950/70 border border-slate-700/60 rounded-xl px-4 py-2.5 pl-10 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                        <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                    </div>

                    {/* Filter & Add Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => {
                                onLowStockChange(!lowStock);
                                onPageChange(1);
                            }}
                            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                                lowStock
                                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                                    : 'bg-slate-950/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                            }`}
                        >
                            <AlertTriangle size={15} className={lowStock ? 'text-amber-400' : 'text-slate-400'} />
                            <span>مخزون منخفض فقط</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                                showAdvancedFilters || hasActiveFilters
                                    ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                                    : 'bg-slate-950/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                            }`}
                        >
                            <SlidersHorizontal size={15} />
                            <span>فلاتر متقدمة</span>
                            {hasActiveFilters && (
                                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                            )}
                        </button>

                        <select
                            aria-label="Items per page"
                            value={limit}
                            onChange={(e) => {
                                onLimitChange(Number(e.target.value));
                                onPageChange(1);
                            }}
                            className="bg-slate-950/70 border border-slate-700/60 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                            <option value={15}>15 سطر</option>
                            <option value={25}>25 سطر</option>
                            <option value={50}>50 سطر</option>
                            <option value={100}>100 سطر</option>
                        </select>

                        <button
                            type="button"
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                        >
                            <Plus size={16} />
                            <span>إضافة قطعة صيانة</span>
                        </button>
                    </div>
                </div>

                {/* Advanced Filters Panel */}
                {showAdvancedFilters && (
                    <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        {/* Brand Filter */}
                        <div>
                            <label className="block text-[11px] font-medium text-slate-400 mb-1">الماركة (Brand)</label>
                            <select
                                value={brand}
                                onChange={(e) => {
                                    onBrandChange(e.target.value);
                                    onPageChange(1);
                                }}
                                className="w-full bg-slate-950/80 border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="">الكل (All Brands)</option>
                                {brandsList.map((b) => (
                                    <option key={b} value={b}>
                                        {b}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Part Type Filter */}
                        <div>
                            <label className="block text-[11px] font-medium text-slate-400 mb-1">نوع القطعة (Part Type)</label>
                            <select
                                value={partType}
                                onChange={(e) => {
                                    onPartTypeChange(e.target.value);
                                    onPageChange(1);
                                }}
                                className="w-full bg-slate-950/80 border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="">الكل (All Types)</option>
                                {partTypesList.map((t) => (
                                    <option key={t} value={t}>
                                        {t}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Quality Filter */}
                        <div>
                            <label className="block text-[11px] font-medium text-slate-400 mb-1">درجة الجودة (Quality)</label>
                            <select
                                value={quality}
                                onChange={(e) => {
                                    onQualityChange(e.target.value);
                                    onPageChange(1);
                                }}
                                className="w-full bg-slate-950/80 border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="">الكل (All Qualities)</option>
                                {qualitiesList.map((q) => (
                                    <option key={q} value={q}>
                                        {q}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Location Filter */}
                        <div>
                            <label className="block text-[11px] font-medium text-slate-400 mb-1">الموقع الفيزيائي</label>
                            <select
                                value={locationId}
                                onChange={(e) => {
                                    onLocationIdChange(e.target.value);
                                    onPageChange(1);
                                }}
                                className="w-full bg-slate-950/80 border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="">كافة المواقع</option>
                                {locations.map((loc) => (
                                    <option key={loc.id} value={loc.id}>
                                        {loc.locationCode} ({loc.zone})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Device Family */}
                        <div>
                            <label className="block text-[11px] font-medium text-slate-400 mb-1">عائلة الجهاز</label>
                            <input
                                type="text"
                                placeholder="مثال: iPhone 13, Galaxy S22"
                                value={deviceFamily}
                                onChange={(e) => {
                                    onDeviceFamilyChange(e.target.value);
                                    onPageChange(1);
                                }}
                                className="w-full bg-slate-950/80 border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        {/* Status Filter */}
                        <div>
                            <label className="block text-[11px] font-medium text-slate-400 mb-1">حالة التوفر</label>
                            <select
                                value={status}
                                onChange={(e) => {
                                    onStatusChange(e.target.value as any);
                                    onPageChange(1);
                                }}
                                className="w-full bg-slate-950/80 border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="">النشطة والموقوفة</option>
                                <option value="active">نشطة فقط (Active)</option>
                                <option value="discontinued">موقوفة (Discontinued)</option>
                            </select>
                        </div>

                        {/* Clear Filters Button */}
                        {hasActiveFilters && (
                            <div className="sm:col-span-2 md:col-span-2 flex items-end">
                                <button
                                    type="button"
                                    onClick={clearAllFilters}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                                >
                                    إعادة ضبط كافة الفلاتر
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-red-950/30 border-b border-red-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-red-300 text-sm">
                        <AlertTriangle size={18} className="text-red-400 shrink-0" />
                        <span>{error}</span>
                    </div>
                    <button
                        type="button"
                        onClick={onRetry}
                        className="flex items-center gap-1 px-3 py-1 bg-red-900/50 hover:bg-red-800 text-red-200 rounded-lg text-xs font-semibold"
                    >
                        <RefreshCw size={12} />
                        <span>إعادة المحاولة</span>
                    </button>
                </div>
            )}

            {/* Table Area */}
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-right text-sm">
                    <thead>
                        <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-xs uppercase font-semibold">
                            <th className="py-3.5 px-4">رمز SKU</th>
                            <th className="py-3.5 px-4">اسم القطعة</th>
                            <th className="py-3.5 px-4">الماركة والنوع</th>
                            <th className="py-3.5 px-4">الجودة</th>
                            <th className="py-3.5 px-4">الأجهزة المتوافقة</th>
                            <th className="py-3.5 px-4 text-center">المتاح</th>
                            <th className="py-3.5 px-4 text-center">المحجوز</th>
                            <th className="py-3.5 px-4 text-center">الحد الأدنى</th>
                            <th className="py-3.5 px-4 text-center">الحالة</th>
                            <th className="py-3.5 px-4 text-center">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                        {loading && parts.length === 0 ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={10} className="py-4 px-4">
                                        <div className="h-6 bg-slate-800/60 rounded-lg w-full"></div>
                                    </td>
                                </tr>
                            ))
                        ) : parts.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="py-16 text-center text-slate-500">
                                    <Boxes className="mx-auto mb-3 opacity-40" size={40} />
                                    <p className="font-semibold text-slate-400">لا توجد قطع صيانة تطابق المعايير</p>
                                    <p className="text-xs text-slate-600 mt-1">جرّب تغيير عبارة البحث أو تفريغ الفلاتر</p>
                                </td>
                            </tr>
                        ) : (
                            parts.map((part) => {
                                const isLowStock = part.availableQuantity <= part.minStock;
                                return (
                                    <tr
                                        key={part.id}
                                        className="hover:bg-slate-800/30 transition-colors"
                                    >
                                        {/* SKU */}
                                        <td className="py-3.5 px-4 font-mono text-xs text-blue-400 font-semibold">
                                            {part.sku}
                                            {part.barcode && (
                                                <div className="text-[10px] text-slate-500 font-normal">
                                                    {part.barcode}
                                                </div>
                                            )}
                                        </td>

                                        {/* Name */}
                                        <td className="py-3.5 px-4">
                                            <div className="font-medium text-white max-w-xs truncate" title={part.name}>
                                                {part.name}
                                            </div>
                                            {part.deviceFamily && (
                                                <span className="text-[11px] text-slate-400">
                                                    {part.deviceFamily}
                                                </span>
                                            )}
                                        </td>

                                        {/* Brand & Part Type */}
                                        <td className="py-3.5 px-4">
                                            <div className="text-slate-300 text-xs">
                                                {part.brand || '—'}
                                            </div>
                                            <div className="text-[11px] text-slate-500">
                                                {part.partType || '—'}
                                            </div>
                                        </td>

                                        {/* Quality */}
                                        <td className="py-3.5 px-4 text-xs text-slate-300">
                                            {part.quality ? (
                                                <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[11px]">
                                                    {part.quality}
                                                </span>
                                            ) : (
                                                '—'
                                            )}
                                        </td>

                                        {/* Compatible Devices */}
                                        <td className="py-3.5 px-4 text-xs text-slate-400">
                                            {part.compatibleDevices && part.compatibleDevices.length > 0 ? (
                                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                    {part.compatibleDevices.slice(0, 2).map((dev, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="px-1.5 py-0.5 bg-slate-800/80 rounded text-[10px] text-slate-300 truncate"
                                                            title={dev}
                                                        >
                                                            {dev}
                                                        </span>
                                                    ))}
                                                    {part.compatibleDevices.length > 2 && (
                                                        <span className="text-[10px] text-slate-500 self-center">
                                                            +{part.compatibleDevices.length - 2}
                                                        </span>
                                                    )}
                                                </div>
                                            ) : (
                                                '—'
                                            )}
                                        </td>

                                        {/* Available Quantity */}
                                        <td className="py-3.5 px-4 text-center">
                                            <div className="inline-flex items-center gap-1.5">
                                                <span
                                                    className={`text-sm font-bold ${
                                                        part.availableQuantity <= 0
                                                            ? 'text-rose-400'
                                                            : isLowStock
                                                            ? 'text-amber-400'
                                                            : 'text-emerald-400'
                                                    }`}
                                                >
                                                    {part.availableQuantity}
                                                </span>
                                                {isLowStock && (
                                                    <span
                                                        className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold"
                                                        title="مخزون منخفض: المتاح أقل من أو يساوي الحد الأدنى"
                                                    >
                                                        منخفض
                                                    </span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Reserved Quantity */}
                                        <td className="py-3.5 px-4 text-center text-xs text-slate-400">
                                            {part.reservedQuantity > 0 ? (
                                                <span className="text-amber-400 font-semibold">
                                                    {part.reservedQuantity}
                                                </span>
                                            ) : (
                                                '0'
                                            )}
                                        </td>

                                        {/* Min Stock */}
                                        <td className="py-3.5 px-4 text-center text-xs text-slate-400">
                                            {part.minStock}
                                        </td>

                                        {/* Status */}
                                        <td className="py-3.5 px-4 text-center">
                                            {part.status === 'active' && part.isActive ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
                                                    <CheckCircle size={10} />
                                                    <span>نشط</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] font-semibold">
                                                    <XCircle size={10} />
                                                    <span>موقوف</span>
                                                </span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="py-3.5 px-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingPart(part)}
                                                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs transition-colors"
                                                    title="تعديل بيانات القطعة"
                                                >
                                                    <Edit2 size={13} />
                                                </button>
                                                {part.status === 'active' && part.isActive && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDiscontinue(part)}
                                                        disabled={discontinuingId === part.id}
                                                        className="p-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-300 border border-rose-800/40 rounded-lg text-xs transition-colors disabled:opacity-50"
                                                        title="إيقاف القطعة"
                                                    >
                                                        <PowerOff size={13} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <AdminPagination
                currentPage={page || pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={onPageChange}
                disabled={loading}
            />

            {/* Modals */}
            <AddPartModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={onRefresh ? onRefresh : onRetry}
            />

            <EditPartModal
                isOpen={Boolean(editingPart)}
                part={editingPart}
                onClose={() => setEditingPart(null)}
                onSuccess={onRefresh ? onRefresh : onRetry}
            />
        </div>
    );
};
