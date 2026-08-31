/**
 * backend/admin/src/components/WarehouseManager/components/WarehouseTabs.tsx
 * Accessible tab switcher for Parts, Movements, and Locations views.
 */
import React from 'react';
import { Boxes, History, MapPin } from 'lucide-react';
import type { WarehouseTab } from '../types';

interface WarehouseTabsProps {
    activeTab: WarehouseTab;
    onTabChange: (tab: WarehouseTab) => void;
    partsCount?: number;
    locationsCount?: number;
}

export const WarehouseTabs: React.FC<WarehouseTabsProps> = ({
    activeTab,
    onTabChange,
    partsCount,
    locationsCount
}) => {
    const tabs: Array<{
        id: WarehouseTab;
        label: string;
        icon: React.ElementType;
        count?: number;
    }> = [
        {
            id: 'parts',
            label: 'Ersatzteilkatalog',
            icon: Boxes,
            count: partsCount
        },
        {
            id: 'movements',
            label: 'Lagerbewegungen',
            icon: History
        },
        {
            id: 'locations',
            label: 'Lagerorte',
            icon: MapPin,
            count: locationsCount
        }
    ];

    return (
        <div className="flex border-b border-slate-800 mb-6 overflow-x-auto custom-scrollbar">
            <div className="flex gap-2">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            onClick={() => onTabChange(tab.id)}
                            className={`flex items-center gap-2.5 px-5 py-3 font-medium text-sm transition-all duration-200 border-b-2 whitespace-nowrap rounded-t-lg ${
                                isActive
                                    ? 'border-blue-500 text-blue-400 bg-blue-500/10 shadow-[inset_0_-2px_0_rgba(59,130,246,1)]'
                                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                            }`}
                        >
                            <Icon size={18} className={isActive ? 'text-blue-400' : 'text-slate-500'} />
                            <span>{tab.label}</span>
                            {tab.count !== undefined && (
                                <span
                                    className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                                        isActive
                                            ? 'bg-blue-500/20 text-blue-300'
                                            : 'bg-slate-800 text-slate-400'
                                    }`}
                                >
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
