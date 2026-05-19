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

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
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
                    const mapped = data.data.map((n: any) => ({
                        id: n.id,
                        type: n.type || 'new_message',
                        title: n.type === 'new_order' ? 'Neue Bestellung' : 'System Benachrichtigung',
                        body: n.message,
                        icon: n.type === 'new_order' ? '📦' : '🔔',
                        link: n.link,
                        timestamp: n.created_at,
                        read: n.read
                    }));
                    setNotifications(mapped);
                }
            }).catch(console.error);
        });

        const socket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
            auth: {
                // Send the admin JWT so the server can verify role === 'admin'
                // and permit the socket to join the 'admin' notification room
                token: sessionStorage.getItem('adminSocketToken') || undefined,
            },
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            setIsConnected(true);
            socket.emit('join:admin'); // Join the admin room
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
        });

        socket.on('admin:notification', (payload: Omit<AdminNotification, 'read'>) => {
            const notification: AdminNotification = { ...payload, read: false };

            setNotifications(prev => {
                const updated = [notification, ...prev];
                return updated.slice(0, MAX_NOTIFICATIONS);
            });

            // Browser Notification (if permission granted)
            if (Notification.permission === 'granted') {
                new Notification(`${payload.icon} ${payload.title}`, {
                    body: payload.body,
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
