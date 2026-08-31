/**
 * backend/admin/src/components/WarehouseManager/components/WarehouseMovementsTable.tsx
 * Paginated append-only movement ledger table with filters, search, and date bounds.
 */
import React from 'react';
import {
    Search,
    History,
    AlertTriangle,
    ArrowDownLeft,
    ArrowUpRight,
    ArrowRightLeft,
    AlertOctagon,
    RotateCcw,
    RefreshCw,
    SlidersHorizontal
} from 'lucide-react';
import AdminPagination from '../../AdminPagination';
import { formatDate } from '../../../utils/formatDate';
import type { WarehouseMovement, WarehouseLocation, PaginationMeta } from '../types';

interface WarehouseMovementsTableProps {
    movements: WarehouseMovement[];
    locations: WarehouseLocation[];
    pagination: PaginationMeta;
    loading: boolean;
    error: string | null;
    search: string;
    onSearchChange: (val: string) => void;
    movementType: string;
    onMovementTypeChange: (val: string) => void;
    sourceLocationId: string;
    onSourceLocationIdChange: (val: string) => void;
    destinationLocationId: string;
    onDestinationLocationIdChange: (val: string) => void;
    fromDate: string;
    onFromDateChange: (val: string) => void;
    toDate: string;
    onToDateChange: (val: string) => void;
    page: number;
    onPageChange: (page: number) => void;
    limit: number;
    onLimitChange: (limit: number) => void;
    onRetry: () => void;
}

export const WarehouseMovementsTable: React.FC<WarehouseMovementsTableProps> = ({
    movements,
    locations,
    pagination,
    loading,
    error,
    search,
    onSearchChange,
    movementType,
    onMovementTypeChange,
    sourceLocationId,
    onSourceLocationIdChange,
    destinationLocationId,
    onDestinationLocationIdChange,
    fromDate,
    onFromDateChange,
    toDate,
    onToDateChange,
    page,
    onPageChange,
    limit,
    onLimitChange,
    onRetry
}) => {
    const [showFilters, setShowFilters] = React.useState(false);

    const movementTypeConfigs: Record<
        string,
        { label: string; icon: React.ElementType; colorClass: string }
    > = {
        RECEIVE: {
            label: 'استلام بضاعة',
            icon: ArrowDownLeft,
            colorClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
        },
        ADJUSTMENT_IN: {
            label: 'تسوية إضافة (+)',
            icon: ArrowDownLeft,
            colorClass: 'bg-teal-500/10 text-teal-400 border-teal-500/30'
        },
        ADJUSTMENT_OUT: {
            label: 'تسوية خصم (-)',
            icon: ArrowUpRight,
            colorClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
        },
        TRANSFER: {
            label: 'نقل موقعي',
            icon: ArrowRightLeft,
            colorClass: 'bg-blue-500/10 text-blue-400 border-blue-500/30'
        },
        DAMAGE: {
            label: 'إتلاف قطعة',
            icon: AlertOctagon,
            colorClass: 'bg-rose-500/10 text-rose-400 border-rose-500/30'
        },
        SUPPLIER_RETURN: {
            label: 'إرجاع لمورد',
            icon: RotateCcw,
            colorClass: 'bg-purple-500/10 text-purple-400 border-purple-500/30'
        },
        RESERVE: {
            label: 'حجز لصيانة',
            icon: ArrowRightLeft,
            colorClass: 'bg-amber-500/10 text-amber-300 border-amber-500/20'
        },
        RELEASE: {
            label: 'إلغاء حجز',
            icon: RotateCcw,
            colorClass: 'bg-slate-500/10 text-slate-300 border-slate-500/20'
        },
        CONSUME: {
            label: 'استهلاك صيانة',
            icon: ArrowUpRight,
            colorClass: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
        },
        RETURN_FROM_REPAIR: {
            label: 'مسترجع من صيانة',
            icon: ArrowDownLeft,
            colorClass: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
        }
    };

    const hasActiveFilters = Boolean(
        movementType || sourceLocationId || destinationLocationId || fromDate || toDate
    );

    const clearAllFilters = () => {
        onMovementTypeChange('');
        onSourceLocationIdChange('');
        onDestinationLocationIdChange('');
        onFromDateChange('');
        onToDateChange('');
        onPageChange(1);
    };

    return (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
            {/* Filter Bar */}
            <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-col gap-4">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                    {/* Search Input */}
                    <div className="relative flex-1">
                        <input
                            type="text"
                            placeholder="ابحث باسم القطعة أو SKU أو الباركود..."
                            value={search}
                            onChange={(e) => {
                                onSearchChange(e.target.value);
                                onPageChange(1);
                            }}
                            className="w-full bg-slate-950/70 border border-slate-700/60 rounded-xl px-4 py-2.5 pl-10 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                        <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                    </div>

                    {/* Quick Movement Type and Filters Toggle */}
                    <div className="flex items-center gap-2 shrink-0">
                        <select
                            value={movementType}
                            onChange={(e) => {
                                onMovementTypeChange(e.target.value);
                                onPageChange(1);
                            }}
                            className="bg-slate-950/70 border border-slate-700/60 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                            <option value="">كافة أنواع الحركات</option>
                            <option value="RECEIVE">استلام بضاعة (RECEIVE)</option>
                            <option value="TRANSFER">نقل موقعي (TRANSFER)</option>
                            <option value="ADJUSTMENT_IN">تسوية إضافة (ADJUSTMENT_IN)</option>
                            <option value="ADJUSTMENT_OUT">تسوية خصم (ADJUSTMENT_OUT)</option>
                            <option value="DAMAGE">إتلاف قطعة (DAMAGE)</option>
                            <option value="SUPPLIER_RETURN">إرجاع لمورد (SUPPLIER_RETURN)</option>
                        </select>

                        <button
                            type="button"
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                                showFilters || hasActiveFilters
                                    ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                                    : 'bg-slate-950/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                            }`}
                        >
                            <SlidersHorizontal size={15} />
                            <span>تصفية متقدمة</span>
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
                    </div>
                </div>

                {/* Advanced Movement Filters */}
                {showFilters && (
                    <div className="pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        {/* Source Location */}
                        <div>
                            <label className="block text-[11px] font-medium text-slate-400 mb-1">الموقع المصدر</label>
                            <select
                                value={sourceLocationId}
                                onChange={(e) => {
                                    onSourceLocationIdChange(e.target.value);
                                    onPageChange(1);
                                }}
                                className="w-full bg-slate-950/80 border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="">كافة المواقع المصدر</option>
                                {locations.map((loc) => (
                                    <option key={loc.id} value={loc.id}>
                                        {loc.locationCode} ({loc.zone})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Destination Location */}
                        <div>
                            <label className="block text-[11px] font-medium text-slate-400 mb-1">الموقع الوجهة</label>
                            <select
                                value={destinationLocationId}
                                onChange={(e) => {
                                    onDestinationLocationIdChange(e.target.value);
                                    onPageChange(1);
                                }}
                                className="w-full bg-slate-950/80 border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="">كافة المواقع الوجهة</option>
                                {locations.map((loc) => (
                                    <option key={loc.id} value={loc.id}>
                                        {loc.locationCode} ({loc.zone})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* From Date */}
                        <div>
                            <label className="block text-[11px] font-medium text-slate-400 mb-1">من تاريخ</label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => {
                                    onFromDateChange(e.target.value);
                                    onPageChange(1);
                                }}
                                className="w-full bg-slate-950/80 border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        {/* To Date */}
                        <div>
                            <label className="block text-[11px] font-medium text-slate-400 mb-1">إلى تاريخ</label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => {
                                    onToDateChange(e.target.value);
                                    onPageChange(1);
                                }}
                                className="w-full bg-slate-950/80 border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        {/* Clear Filters */}
                        {hasActiveFilters && (
                            <div className="sm:col-span-2 md:col-span-4 flex justify-end">
                                <button
                                    type="button"
                                    onClick={clearAllFilters}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                                >
                                    إعادة ضبط فلاتر الحركات
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

            {/* Movements Table */}
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-right text-sm">
                    <thead>
                        <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-xs uppercase font-semibold">
                            <th className="py-3.5 px-4">التاريخ والوقت</th>
                            <th className="py-3.5 px-4">نوع الحركة</th>
                            <th className="py-3.5 px-4">القطعة (SKU / الاسم)</th>
                            <th className="py-3.5 px-4 text-center">الكمية</th>
                            <th className="py-3.5 px-4">المصدر</th>
                            <th className="py-3.5 px-4">الوجهة</th>
                            <th className="py-3.5 px-4">المنفذ</th>
                            <th className="py-3.5 px-4">السبب / المبرر</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                        {loading && movements.length === 0 ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={8} className="py-4 px-4">
                                        <div className="h-6 bg-slate-800/60 rounded-lg w-full"></div>
                                    </td>
                                </tr>
                            ))
                        ) : movements.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="py-16 text-center text-slate-500">
                                    <History className="mx-auto mb-3 opacity-40" size={40} />
                                    <p className="font-semibold text-slate-400">لا توجد حركات مخزنية مطابقة</p>
                                    <p className="text-xs text-slate-600 mt-1">سجل دفتر الأستاذ لحركات قطع الصيانة فارغ أو لا يطابق الفلاتر المحددة</p>
                                </td>
                            </tr>
                        ) : (
                            movements.map((m) => {
                                const typeConfig = movementTypeConfigs[m.movementType] || {
                                    label: m.movementType,
                                    icon: History,
                                    colorClass: 'bg-slate-800 text-slate-300 border-slate-700'
                                };
                                const TypeIcon = typeConfig.icon;

                                return (
                                    <tr
                                        key={m.id}
                                        className="hover:bg-slate-800/30 transition-colors"
                                    >
                                        {/* Date and Time */}
                                        <td className="py-3.5 px-4 text-xs text-slate-400 font-mono whitespace-nowrap">
                                            {formatDate(m.createdAt)}
                                        </td>

                                        {/* Movement Type */}
                                        <td className="py-3.5 px-4">
                                            <span
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${typeConfig.colorClass}`}
                                            >
                                                <TypeIcon size={13} />
                                                <span>{typeConfig.label}</span>
                                            </span>
                                        </td>

                                        {/* Part SKU & Name */}
                                        <td className="py-3.5 px-4 max-w-xs">
                                            <div className="font-mono text-xs text-blue-400 font-semibold">
                                                {m.repairPart?.sku || '—'}
                                            </div>
                                            <div className="text-xs text-white truncate" title={m.repairPart?.name || ''}>
                                                {m.repairPart?.name || 'قطعة محذوفة'}
                                            </div>
                                        </td>

                                        {/* Quantity */}
                                        <td className="py-3.5 px-4 text-center">
                                            <span className="font-bold text-sm text-white bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/50">
                                                {m.quantity}
                                            </span>
                                        </td>

                                        {/* Source Location */}
                                        <td className="py-3.5 px-4 text-xs">
                                            {m.sourceLocation ? (
                                                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                                                    {m.sourceLocation.locationCode}
                                                </span>
                                            ) : (
                                                <span className="text-slate-600">—</span>
                                            )}
                                        </td>

                                        {/* Destination Location */}
                                        <td className="py-3.5 px-4 text-xs">
                                            {m.destinationLocation ? (
                                                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                                                    {m.destinationLocation.locationCode}
                                                </span>
                                            ) : (
                                                <span className="text-slate-600">—</span>
                                            )}
                                        </td>

                                        {/* Performed By */}
                                        <td className="py-3.5 px-4 text-xs text-slate-300">
                                            {m.performedBy?.displayName || 'المسؤول'}
                                        </td>

                                        {/* Reason */}
                                        <td className="py-3.5 px-4 text-xs text-slate-400 max-w-xs truncate" title={m.reason || ''}>
                                            {m.reason || '—'}
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
        </div>
    );
};
