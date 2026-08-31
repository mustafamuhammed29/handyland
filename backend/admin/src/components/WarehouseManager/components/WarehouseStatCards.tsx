/**
 * backend/admin/src/components/WarehouseManager/components/WarehouseStatCards.tsx
 * Displays the 8 warehouse KPI cards derived strictly from GET /api/warehouse/stats.
 */
import React from 'react';
import {
    Boxes,
    PackageCheck,
    CheckCircle2,
    Lock,
    AlertOctagon,
    Eye,
    AlertTriangle,
    MapPin,
    RefreshCw
} from 'lucide-react';
import type { WarehouseStats } from '../types';

interface WarehouseStatCardsProps {
    stats: WarehouseStats | null;
    loading: boolean;
    error: string | null;
    onRetry: () => void;
}

interface StatConfig {
    label: string;
    value: number;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    borderColor: string;
    description: string;
}

export const WarehouseStatCards: React.FC<WarehouseStatCardsProps> = ({
    stats,
    loading,
    error,
    onRetry
}) => {
    if (loading && !stats) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div
                        key={i}
                        className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 sm:p-5 animate-pulse flex flex-col justify-between h-28"
                    >
                        <div className="flex justify-between items-center">
                            <div className="h-3.5 bg-slate-800 rounded w-24"></div>
                            <div className="w-8 h-8 bg-slate-800 rounded-xl"></div>
                        </div>
                        <div className="h-7 bg-slate-800 rounded w-16 mt-2"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (error && !stats) {
        return (
            <div className="bg-red-950/20 border border-red-800/50 rounded-2xl p-6 mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <AlertTriangle className="text-red-400" size={24} />
                    <div>
                        <h4 className="text-sm font-semibold text-red-300">خطأ في جلب مؤشرات المستودع</h4>
                        <p className="text-xs text-red-400/80 mt-0.5">{error}</p>
                    </div>
                </div>
                <button
                    onClick={onRetry}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-900/40 hover:bg-red-800/60 border border-red-700/50 text-red-200 rounded-xl text-xs font-semibold transition-colors"
                >
                    <RefreshCw size={14} />
                    <span>إعادة المحاولة</span>
                </button>
            </div>
        );
    }

    const statList: StatConfig[] = [
        {
            label: 'القطع النشطة',
            value: stats?.activePartCount ?? 0,
            icon: Boxes,
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10',
            borderColor: 'border-blue-500/20',
            description: 'أنواع قطع الصيانة المعتمدة'
        },
        {
            label: 'إجمالي المخزون الفعلي',
            value: stats?.totalOnHandQuantity ?? 0,
            icon: PackageCheck,
            color: 'text-sky-400',
            bgColor: 'bg-sky-500/10',
            borderColor: 'border-sky-500/20',
            description: 'الكميات الفيزيائية في الرفوف'
        },
        {
            label: 'المتاح للصيانة',
            value: stats?.totalAvailableQuantity ?? 0,
            icon: CheckCircle2,
            color: 'text-emerald-400',
            bgColor: 'bg-emerald-500/10',
            borderColor: 'border-emerald-500/20',
            description: 'جاهز للاستخدام الفوري'
        },
        {
            label: 'المخزون المحجوز',
            value: stats?.totalReservedQuantity ?? 0,
            icon: Lock,
            color: 'text-amber-400',
            bgColor: 'bg-amber-500/10',
            borderColor: 'border-amber-500/20',
            description: 'مخصص لتذاكر صيانة قيد التنفيذ'
        },
        {
            label: 'القطع التالفة',
            value: stats?.totalDefectiveQuantity ?? 0,
            icon: AlertOctagon,
            color: 'text-rose-400',
            bgColor: 'bg-rose-500/10',
            borderColor: 'border-rose-500/20',
            description: 'معزولة بانتظار الإرجاع/الإتلاف'
        },
        {
            label: 'قيد الفحص المخبري',
            value: stats?.totalInspectionQuantity ?? 0,
            icon: Eye,
            color: 'text-purple-400',
            bgColor: 'bg-purple-500/10',
            borderColor: 'border-purple-500/20',
            description: 'تخضع لاختبارات الجودة'
        },
        {
            label: 'مخزون منخفض',
            value: stats?.lowStockPartCount ?? 0,
            icon: AlertTriangle,
            color: (stats?.lowStockPartCount ?? 0) > 0 ? 'text-amber-400' : 'text-slate-400',
            bgColor: (stats?.lowStockPartCount ?? 0) > 0 ? 'bg-amber-500/10' : 'bg-slate-800/40',
            borderColor: (stats?.lowStockPartCount ?? 0) > 0 ? 'border-amber-500/30' : 'border-slate-800',
            description: 'وصلت لحد إعادة الطلب'
        },
        {
            label: 'مواقع التخزين النشطة',
            value: stats?.activeLocationCount ?? 0,
            icon: MapPin,
            color: 'text-cyan-400',
            bgColor: 'bg-cyan-500/10',
            borderColor: 'border-cyan-500/20',
            description: 'الرفوف والصناديق المفعلة'
        }
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
            {statList.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                    <div
                        key={idx}
                        className={`bg-slate-900/50 backdrop-blur-md border ${item.borderColor} rounded-2xl p-4 sm:p-5 transition-all duration-200 hover:border-slate-700/80 shadow-lg shadow-black/20 flex flex-col justify-between`}
                    >
                        <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-medium text-slate-400">
                                {item.label}
                            </span>
                            <div className={`p-2 rounded-xl ${item.bgColor} ${item.color}`}>
                                <IconComponent size={18} />
                            </div>
                        </div>

                        <div className="mt-3">
                            <div className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                                {item.value.toLocaleString()}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 truncate">
                                {item.description}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
