import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, ShoppingBag, Wrench, MessageSquare, Info, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { api } from '../../utils/api';
import { useSocket } from '../../hooks/useSocket';

interface Notification {
    _id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    link?: string;
    read: boolean;
    createdAt: string;
}

interface Props {
    userId?: string;
    variant?: 'sidebar' | 'navbar';
}

export const NotificationBell: React.FC<Props> = ({ userId, variant = 'sidebar' }) => {
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const { onNotification } = useSocket(userId);

    const unread = notifications.filter(n => !n.read).length;

    // Fetch notifications from API
    const fetchNotifs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/api/notifications');
            const data = res?.data || res;
            const list = data?.notifications || (Array.isArray(data) ? data : []);
            setNotifications(list);
        } catch { /* silent */ }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchNotifs(); }, [userId]);

    // Real-time socket listener — new notification pushed from server
    useEffect(() => {
        const unsubscribe = onNotification((notif: Notification) => {
            setNotifications(prev => [notif, ...prev]);
        });
        return unsubscribe;
    }, [onNotification]);

    // Close panel on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const markRead = async (id: string) => {
        try {
            await api.put(`/api/notifications/${id}/read`, {});
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
        } catch { /* silent */ }
    };

    const markAllRead = async () => {
        try {
            await api.put('/api/notifications/read-all', {});
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch { /* silent */ }
    };

    const typeIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
            case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
            case 'error': return <AlertCircle className="w-4 h-4 text-red-400" />;
            default: return <Info className="w-4 h-4 text-blue-400" />;
        }
    };

    const typeBg = (type: string) => {
        switch (type) {
            case 'success': return 'bg-emerald-500/10';
            case 'warning': return 'bg-yellow-500/10';
            case 'error': return 'bg-red-500/10';
            default: return 'bg-blue-500/10';
        }
    };

    const timeAgo = (date: string) => {
        const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
        if (s < 60) return 'just now';
        if (s < 3600) return `${Math.floor(s / 60)}m ago`;
        if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
        return `${Math.floor(s / 86400)}d ago`;
    };

    // Styling logic based on variant
    const isNavbar = variant === 'navbar';

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell Button */}
            <button
                onClick={() => setOpen(v => !v)}
                title="Notifications"
                aria-label="Open notifications"
                className={isNavbar
                    ? "relative w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 group outline-none bg-transparent hover:bg-white/5"
                    : "relative p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors outline-none"
                }
            >
                <Bell className={isNavbar
                    ? `w-4 h-4 transition-colors ${unread > 0 ? 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)] group-hover:text-red-300' : 'text-slate-400 group-hover:text-white'}`
                    : "w-4 h-4"
                } />
                {unread > 0 && (
                    <span className={isNavbar
                        ? "absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-black rounded-full border border-slate-950 px-1"
                        : "absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-blue-600 text-white text-[10px] font-bold rounded-full px-1 ring-2 ring-slate-950 animate-pulse"
                    }>
                        {isNavbar ? unread : (unread > 9 ? '9+' : unread)}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {open && (
                <div className={`absolute ${isNavbar ? 'right-0 top-[calc(100%+0.5rem)] origin-top-right' : 'left-[calc(100%+0.5rem)] bottom-0 origin-bottom-left'} w-[320px] sm:w-[380px] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl shadow-black/60 z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200`}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
                        <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-blue-400" />
                            <span className="text-white font-bold text-sm">Notifications</span>
                            {unread > 0 && (
                                <span className="text-[10px] bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded-full font-bold border border-blue-500/20">
                                    {unread} new
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {unread > 0 && (
                                <button onClick={markAllRead} title="Mark all as read"
                                    className="text-[11px] text-slate-400 hover:text-emerald-400 px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1 font-medium">
                                    <Check className="w-3 h-3" /> All read
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} title="Close"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-red-500/20 hover:text-red-400 transition-colors">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar bg-slate-900">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center py-12 text-slate-500 gap-3">
                                <Bell className="w-10 h-10 opacity-20" />
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <button
                                    key={n._id}
                                    onClick={() => { markRead(n._id); if (n.link) window.location.href = n.link; }}
                                    className={`w-full text-left px-4 py-3.5 flex items-start gap-3 hover:bg-slate-800 transition-colors border-b border-slate-800/40 last:border-0 relative ${!n.read ? 'bg-slate-800/40' : 'bg-transparent'}`}
                                >
                                    {!n.read && (
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                                    )}
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${typeBg(n.type)}`}>
                                        {typeIcon(n.type)}
                                    </div>
                                    <div className="flex-1 min-w-0 pr-4">
                                        <p className={`text-sm leading-snug ${n.read ? 'text-slate-400' : 'text-white font-medium'}`}>
                                            {n.message}
                                        </p>
                                        <p className="text-[11px] text-slate-500 mt-1.5 font-medium">{timeAgo(n.createdAt)}</p>
                                    </div>
                                    {!n.read && (
                                        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/60 backdrop-blur-md flex justify-center">
                            <button onClick={fetchNotifs}
                                className="text-[11px] font-medium text-slate-400 hover:text-white transition-colors py-1">
                                Refresh notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
