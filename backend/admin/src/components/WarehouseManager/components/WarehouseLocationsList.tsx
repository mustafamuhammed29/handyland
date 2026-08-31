/**
 * backend/admin/src/components/WarehouseManager/components/WarehouseLocationsList.tsx
 * Browse-only view of physical warehouse locations, zones, racks, and bins.
 */
import React from 'react';
import {
    MapPin,
    Search,
    CheckCircle,
    XCircle,
    Layers,
    AlertTriangle,
    RefreshCw
} from 'lucide-react';
import type { WarehouseLocation } from '../types';

interface WarehouseLocationsListProps {
    locations: WarehouseLocation[];
    loading: boolean;
    error: string | null;
    search: string;
    onSearchChange: (val: string) => void;
    zone: string;
    onZoneChange: (val: string) => void;
    onRetry: () => void;
}

export const WarehouseLocationsList: React.FC<WarehouseLocationsListProps> = ({
    locations,
    loading,
    error,
    search,
    onSearchChange,
    zone,
    onZoneChange,
    onRetry
}) => {
    // Extract unique zones for quick filter
    const zones = Array.from(new Set(locations.map((l) => l.zone).filter(Boolean))).sort();

    return (
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col">
            {/* Search and Zone Filter Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                    <input
                        type="text"
                        placeholder="ابحث بكود الموقع أو المنطقة أو الرف..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full bg-slate-950/70 border border-slate-700/60 rounded-xl px-4 py-2.5 pl-10 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                    <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <select
                        value={zone}
                        onChange={(e) => onZoneChange(e.target.value)}
                        className="bg-slate-950/70 border border-slate-700/60 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                        <option value="">كافة المناطق (All Zones)</option>
                        {zones.map((z) => (
                            <option key={z} value={z}>
                                {z}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Error State */}
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

            {/* Locations Table */}
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-right text-sm">
                    <thead>
                        <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 text-xs uppercase font-semibold">
                            <th className="py-3.5 px-4">كود الموقع (Code)</th>
                            <th className="py-3.5 px-4">المنطقة (Zone)</th>
                            <th className="py-3.5 px-4">الرف (Rack)</th>
                            <th className="py-3.5 px-4">المستوى (Shelf)</th>
                            <th className="py-3.5 px-4">الصندوق (Bin)</th>
                            <th className="py-3.5 px-4">الوصف</th>
                            <th className="py-3.5 px-4 text-center">الحالة</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                        {loading && locations.length === 0 ? (
                            Array.from({ length: 4 }).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={7} className="py-4 px-4">
                                        <div className="h-6 bg-slate-800/60 rounded-lg w-full"></div>
                                    </td>
                                </tr>
                            ))
                        ) : locations.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="py-16 text-center text-slate-500">
                                    <MapPin className="mx-auto mb-3 opacity-40" size={40} />
                                    <p className="font-semibold text-slate-400">لا توجد مواقع تخزين تطابق البحث</p>
                                    <p className="text-xs text-slate-600 mt-1">تأكد من إدخال كود موقع صحيح أو اختر منطقة أخرى</p>
                                </td>
                            </tr>
                        ) : (
                            locations.map((loc) => (
                                <tr
                                    key={loc.id}
                                    className="hover:bg-slate-800/30 transition-colors"
                                >
                                    {/* Location Code */}
                                    <td className="py-3.5 px-4 font-mono text-sm text-cyan-400 font-bold">
                                        <div className="flex items-center gap-2">
                                            <Layers size={14} className="text-cyan-500/70 shrink-0" />
                                            <span>{loc.locationCode}</span>
                                        </div>
                                    </td>

                                    {/* Zone */}
                                    <td className="py-3.5 px-4 text-xs text-white font-medium">
                                        {loc.zone}
                                    </td>

                                    {/* Rack */}
                                    <td className="py-3.5 px-4 text-xs text-slate-300 font-mono">
                                        {loc.rack || '—'}
                                    </td>

                                    {/* Shelf */}
                                    <td className="py-3.5 px-4 text-xs text-slate-300 font-mono">
                                        {loc.shelf || '—'}
                                    </td>

                                    {/* Bin */}
                                    <td className="py-3.5 px-4 text-xs text-slate-300 font-mono">
                                        {loc.bin || '—'}
                                    </td>

                                    {/* Description */}
                                    <td className="py-3.5 px-4 text-xs text-slate-400 max-w-sm truncate" title={loc.description || ''}>
                                        {loc.description || '—'}
                                    </td>

                                    {/* Status */}
                                    <td className="py-3.5 px-4 text-center">
                                        {loc.isActive ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
                                                <CheckCircle size={10} />
                                                <span>مفعل</span>
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-500 text-[11px] font-semibold">
                                                <XCircle size={10} />
                                                <span>معطل</span>
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
