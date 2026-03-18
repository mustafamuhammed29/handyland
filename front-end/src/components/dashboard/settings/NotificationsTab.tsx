import React from 'react';
import { ShoppingBag, Wrench, Tag, Newspaper, Loader2, Check, AlertCircle } from 'lucide-react';

function ToggleSwitch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
    return (
        <button
            role="switch"
            title={label}
            aria-label={label}
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${checked ? 'bg-blue-600' : 'bg-slate-700'}`}
        >
            <span className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
        </button>
    );
}

const NOTIF_KEYS = ['orderUpdates', 'repairStatus', 'promotions', 'newsletter'] as const;
export type NotifKey = typeof NOTIF_KEYS[number];
const NOTIF_ITEMS: { key: NotifKey; label: string; desc: string; icon: React.ReactNode; def: boolean }[] = [
    { key: 'orderUpdates', label: 'Order Updates', desc: 'Get notified when your order status changes', icon: <ShoppingBag className="w-5 h-5" />, def: true },
    { key: 'repairStatus', label: 'Repair Status', desc: 'Updates on your repair and service tickets', icon: <Wrench className="w-5 h-5" />, def: true },
    { key: 'promotions', label: 'Promotions & Deals', desc: 'Special offers and exclusive discounts', icon: <Tag className="w-5 h-5" />, def: false },
    { key: 'newsletter', label: 'Newsletter', desc: 'Weekly product updates and news', icon: <Newspaper className="w-5 h-5" />, def: false },
];

interface NotificationsTabProps {
    notifs: Record<NotifKey, boolean>;
    toggleNotif: (key: NotifKey, val: boolean) => void;
    notifLoading: boolean;
    notifSaving: boolean;
    notifSaved: boolean;
    notifError: string | null;
}

export const NotificationsTab: React.FC<NotificationsTabProps> = ({
    notifs,
    toggleNotif,
    notifLoading,
    notifSaving,
    notifSaved,
    notifError,
}) => {
    return (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-white">Notification Preferences</h3>
                    <p className="text-slate-400 text-sm mt-0.5">Choose what you want to be notified about</p>
                </div>
                <div className="flex items-center gap-2">
                    {notifSaving && (
                        <span className="flex items-center gap-1 text-slate-400 text-xs">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...
                        </span>
                    )}
                    {notifSaved && !notifSaving && (
                        <span className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
                            <Check className="w-3.5 h-3.5" /> Saved to account
                        </span>
                    )}
                </div>
            </div>

            {notifError && (
                <div className="mx-4 mt-4 flex items-center gap-2 p-3 rounded-xl text-sm bg-red-500/10 text-red-400 border border-red-500/20">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {notifError}
                </div>
            )}

            <div className="divide-y divide-slate-800/60">
                {notifLoading ? (
                    // Skeleton loader
                    [1, 2, 3, 4].map(i => (
                        <div key={i} className="flex items-center justify-between p-5">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-800 animate-pulse" />
                                <div className="space-y-2">
                                    <div className="w-28 h-3 bg-slate-800 rounded animate-pulse" />
                                    <div className="w-44 h-2.5 bg-slate-800/60 rounded animate-pulse" />
                                </div>
                            </div>
                            <div className="w-11 h-6 bg-slate-800 rounded-full animate-pulse" />
                        </div>
                    ))
                ) : (
                    NOTIF_ITEMS.map(item => (
                        <div key={item.key} className="flex items-center justify-between p-5 hover:bg-slate-800/20 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${notifs[item.key] ? 'bg-blue-600/20 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
                                    {item.icon}
                                </div>
                                <div>
                                    <p className="text-white font-semibold text-sm">{item.label}</p>
                                    <p className="text-slate-400 text-xs mt-0.5">{item.desc}</p>
                                </div>
                            </div>
                            <ToggleSwitch
                                checked={notifs[item.key]}
                                onChange={v => toggleNotif(item.key, v)}
                                label={item.label}
                            />
                        </div>
                    ))
                )}
            </div>
            <div className="p-4 border-t border-slate-800/60 bg-slate-950/30">
                <p className="text-slate-500 text-xs text-center">Changes are saved automatically to your account across all devices.</p>
            </div>
        </div>
    );
};
