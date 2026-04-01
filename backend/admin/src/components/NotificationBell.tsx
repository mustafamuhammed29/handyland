/**
 * NotificationBell.tsx
 * Premium real-time notification bell for the Admin Panel header.
 */
import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, UserPlus, ShoppingBag, MessageSquare, Wrench, ScanLine, Trash2, Wifi, WifiOff, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { AdminNotification, NotificationType } from '../hooks/useAdminNotifications';

// ─── Config ──────────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<NotificationType, { color: string; bg: string; Icon: React.ElementType }> = {
    new_user:      { color: 'text-blue-400',    bg: 'bg-blue-500/15',    Icon: UserPlus },
    new_order:     { color: 'text-emerald-400', bg: 'bg-emerald-500/15', Icon: ShoppingBag },
    new_message:   { color: 'text-amber-400',   bg: 'bg-amber-500/15',   Icon: MessageSquare },
    new_repair:    { color: 'text-purple-400',  bg: 'bg-purple-500/15',  Icon: Wrench },
    new_valuation: { color: 'text-cyan-400',    bg: 'bg-cyan-500/15',    Icon: ScanLine },
};

const formatTime = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    if (diff < 60000) return 'Gerade eben';
    if (diff < 3600000) return `vor ${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `vor ${Math.floor(diff / 3600000)}h`;
    return new Date(ts).toLocaleDateString('de-DE');
};

// ─── Single Notification Row ─────────────────────────────────────────────────
const NotificationRow = ({
    notification,
    onRead,
    onNavigate,
}: {
    notification: AdminNotification;
    onRead: (id: number) => void;
    onNavigate: (link?: string, id?: number) => void;
}) => {
    const cfg = TYPE_CONFIG[notification.type] || TYPE_CONFIG.new_message;
    const Icon = cfg.Icon;

    return (
        <div
            className={`group relative flex gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                notification.read ? 'opacity-60 hover:opacity-100' : 'bg-slate-800/60'
            } hover:bg-slate-700/50`}
            onClick={() => onNavigate(notification.link, notification.id)}
        >
            {/* Unread dot */}
            {!notification.read && (
                <div className="absolute top-3 right-3 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            )}

            {/* Icon */}
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                <Icon className={`w-4 h-4 ${cfg.color}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                    <p className={`text-sm font-semibold ${notification.read ? 'text-slate-400' : 'text-white'} truncate`}>
                        {notification.title}
                    </p>
                    <span className="text-[10px] text-slate-500 flex-shrink-0 mt-0.5">{formatTime(notification.timestamp)}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{notification.body}</p>
            </div>

            {/* Mark read button (hover) */}
            {!notification.read && (
                <button
                    title="Als gelesen markieren"
                    onClick={(e) => { e.stopPropagation(); onRead(notification.id); }}
                    className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg bg-slate-700 hover:bg-blue-600 text-slate-400 hover:text-white"
                >
                    <Check className="w-3 h-3" />
                </button>
            )}
        </div>
    );
};

// ─── Main Bell Component ──────────────────────────────────────────────────────
interface NotificationBellProps {
    notifications: AdminNotification[];
    unreadCount: number;
    isConnected: boolean;
    onMarkAllRead: () => void;
    onMarkOneRead: (id: number) => void;
    onClearAll: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
    notifications,
    unreadCount,
    isConnected,
    onMarkAllRead,
    onMarkOneRead,
    onClearAll,
}) => {
    const [open, setOpen] = useState(false);
    const [shake, setShake] = useState(false);
    const [prevUnread, setPrevUnread] = useState(0);
    const panelRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Shake bell on new notification
    useEffect(() => {
        if (unreadCount > prevUnread) {
            setShake(true);
            setTimeout(() => setShake(false), 700);
        }
        setPrevUnread(unreadCount);
    }, [unreadCount]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleNavigate = (link?: string, id?: number) => {
        if (id) onMarkOneRead(id);
        setOpen(false);
        if (link) navigate(link);
    };

    return (
        <div ref={panelRef} className="relative">
            {/* Bell Button */}
            <button
                title={`${unreadCount} ungelesene Benachrichtigungen`}
                onClick={() => { setOpen(o => !o); if (open) {} }}
                className={`relative p-2.5 rounded-xl border transition-all duration-200 ${
                    open
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white hover:border-slate-600'
                }`}
            >
                <Bell
                    className={`w-5 h-5 transition-transform ${shake ? 'animate-[shake_0.7s_ease-in-out]' : ''}`}
                />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 shadow-lg shadow-red-500/30 animate-in zoom-in duration-200">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
                {/* Connection dot */}
                <span className={`absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`} />
            </button>

            {/* Dropdown Panel */}
            {open && (
                <div className="absolute right-0 top-full mt-2 w-[380px] bg-[#0f172a]/95 backdrop-blur-2xl border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/50 z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-blue-400" />
                            <span className="font-bold text-white text-sm">Benachrichtigungen</span>
                            {unreadCount > 0 && (
                                <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full">
                                    {unreadCount} neu
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {/* Connection status */}
                            <div className="flex items-center gap-1 text-xs mr-2">
                                {isConnected
                                    ? <><Wifi className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">Live</span></>
                                    : <><WifiOff className="w-3 h-3 text-red-400" /><span className="text-red-400">Offline</span></>
                                }
                            </div>
                            {unreadCount > 0 && (
                                <button title="Alle gelesen" onClick={onMarkAllRead} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-emerald-400 transition-colors">
                                    <CheckCheck className="w-3.5 h-3.5" />
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button title="Alle löschen" onClick={onClearAll} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                            <button title="Schließen" onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-[420px] overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                                <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mb-3">
                                    <Bell className="w-6 h-6 text-slate-600" />
                                </div>
                                <p className="text-slate-400 font-semibold text-sm">Keine Benachrichtigungen</p>
                                <p className="text-slate-600 text-xs mt-1">Neue Aktivitäten erscheinen hier in Echtzeit.</p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <NotificationRow
                                    key={n.id}
                                    notification={n}
                                    onRead={onMarkOneRead}
                                    onNavigate={handleNavigate}
                                />
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 0 && (
                        <div className="px-4 py-2.5 border-t border-slate-800 flex items-center justify-between">
                            <span className="text-xs text-slate-600">{notifications.length} Einträge</span>
                            <button
                                onClick={() => { setOpen(false); navigate('/messages'); }}
                                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                Alle anzeigen <ExternalLink className="w-3 h-3" />
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
