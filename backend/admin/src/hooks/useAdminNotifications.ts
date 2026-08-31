/**
 * useAdminNotifications.ts
 * Real-time Socket.io notification hook for the Admin Panel.
 * Subscribes to 'admin:notification' events from the backend.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export type NotificationType = 'new_user' | 'new_order' | 'new_message' | 'new_repair' | 'new_valuation';

export interface AdminNotification {
    id: number | string;
    type: NotificationType;
    title: string;
    body: string;
    icon: string;
    link?: string;
    timestamp: string;
    read: boolean;
}

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000';
const MAX_NOTIFICATIONS = 50;

export const useAdminNotifications = (isAuthenticated: boolean) => {
    const [notifications, setNotifications] = useState<AdminNotification[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAllRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const markOneRead = useCallback((id: number | string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        
        // Mark as read in DB if it's a UUID string
        if (typeof id === 'string') {
            import('../utils/api').then(({ api }) => {
                api.put(`/api/notifications/${id}/read`).catch(console.error);
            });
        }
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
        import('../utils/api').then(({ api }) => {
            api.put('/api/notifications/mark-all-read').catch(console.error);
        });
    }, []);

    useEffect(() => {
        if (!isAuthenticated) return;

        // Fetch initial unread notifications from the database
        import('../utils/api').then(({ api }) => {
            api.get('/api/notifications?unreadOnly=true').then((res: any) => {
                const data = res?.data || res;
                if (data && data.data && Array.isArray(data.data)) {
                    const mapped = data.data.map((n: any) => {
                        const msgLower = (n.message || '').toLowerCase();
                        const isMsg = n.type === 'new_message' || msgLower.includes('nachricht') || msgLower.includes('message');
                        const isOrder = n.type === 'new_order' || msgLower.includes('bestellung') || msgLower.includes('order');
                        const isRepair = n.type === 'new_repair' || msgLower.includes('reparatur') || msgLower.includes('repair');

                        return {
                            id: n.id,
                            type: (isMsg ? 'new_message' : isOrder ? 'new_order' : isRepair ? 'new_repair' : 'new_message') as NotificationType,
                            title: isMsg ? 'Neue Nachricht' : isOrder ? 'Neue Bestellung' : isRepair ? 'Neue Reparatur' : 'System Benachrichtigung',
                            body: n.message,
                            icon: isMsg ? '💬' : isOrder ? '📦' : isRepair ? '🔧' : '🔔',
                            link: n.link || (isMsg ? '/messages' : isOrder ? '/orders' : isRepair ? '/repair-tickets' : '/messages'),
                            timestamp: n.created_at,
                            read: n.read
                        };
                    });
                    setNotifications(mapped);
                }
            }).catch(console.error);
        });

        const socket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            setIsConnected(true);
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
        });

        socket.on('admin:notification', (payload: any) => {
            const msgLower = (payload.body || payload.message || '').toLowerCase();
            const isMsg = payload.type === 'new_message' || msgLower.includes('nachricht') || msgLower.includes('message');
            const isOrder = payload.type === 'new_order' || msgLower.includes('bestellung') || msgLower.includes('order');
            const isRepair = payload.type === 'new_repair' || msgLower.includes('reparatur') || msgLower.includes('repair');

            const notification: AdminNotification = {
                id: payload.id || Date.now(),
                type: (isMsg ? 'new_message' : isOrder ? 'new_order' : isRepair ? 'new_repair' : 'new_message') as NotificationType,
                title: isMsg ? 'Neue Nachricht' : isOrder ? 'Neue Bestellung' : isRepair ? 'Neue Reparatur' : (payload.title || 'System Benachrichtigung'),
                body: payload.body || payload.message || 'Neue Benachrichtigung',
                icon: isMsg ? '💬' : isOrder ? '📦' : isRepair ? '🔧' : (payload.icon || '🔔'),
                link: payload.link || (isMsg ? '/messages' : isOrder ? '/orders' : isRepair ? '/repair-tickets' : '/messages'),
                timestamp: payload.timestamp || new Date().toISOString(),
                read: false
            };

            setNotifications(prev => {
                if (prev.some(n => n.id === notification.id)) return prev;
                const updated = [notification, ...prev];
                return updated.slice(0, MAX_NOTIFICATIONS);
            });

            // Browser Notification (if permission granted)
            if (Notification.permission === 'granted') {
                new Notification(`${notification.icon} ${notification.title}`, {
                    body: notification.body,
                    icon: '/favicon.ico',
                });
            }
        });

        // Request browser notification permission
        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }

        return () => {
            socket.disconnect();
            setIsConnected(false);
        };
    }, [isAuthenticated]);

    return { notifications, unreadCount, isConnected, markAllRead, markOneRead, clearAll };
};
