/**
 * useAdminNotifications.ts
 * Real-time Socket.io notification hook for the Admin Panel.
 * Subscribes to 'admin:notification' events from the backend.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export type NotificationType = 'new_user' | 'new_order' | 'new_message' | 'new_repair' | 'new_valuation';

export interface AdminNotification {
    id: number;
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

    const markOneRead = useCallback((id: number) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    useEffect(() => {
        if (!isAuthenticated) return;

        const socket = io(SOCKET_URL, {
            withCredentials: true,
            transports: ['websocket', 'polling'],
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
