import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { ENV } from '../src/config/env';

// Strip /api from ENV.API_URL to get base URL
const SOCKET_URL = ENV.API_URL.endsWith('/api')
    ? ENV.API_URL.slice(0, -4)
    : ENV.API_URL;

let socket: Socket | null = null;

const getSocket = (): Socket => {
    if (!socket) {
        socket = io(SOCKET_URL, {
            autoConnect: false,
            transports: ['websocket', 'polling'],
        });
    }
    return socket;
};

export const useSocket = (userId?: string) => {
    const socketRef = useRef<Socket>(getSocket());

    useEffect(() => {
        const s = socketRef.current;
        s.connect();

        if (userId) {
            s.emit('join', userId);
        }

        return () => {
            s.disconnect();
        };
    }, [userId]);

    const onOrderUpdate = useCallback((callback: (data: any) => void) => {
        socketRef.current.on('order:updated', callback);
        return () => { socketRef.current.off('order:updated', callback); };
    }, []);

    const onNewOrder = useCallback((callback: (data: any) => void) => {
        socketRef.current.on('order:new', callback);
        return () => { socketRef.current.off('order:new', callback); };
    }, []);

    const onNotification = useCallback((callback: (data: any) => void) => {
        socketRef.current.on('notification', callback);
        return () => { socketRef.current.off('notification', callback); };
    }, []);

    const joinAdmin = useCallback(() => {
        socketRef.current.emit('join:admin');
    }, []);

    return { socket: socketRef.current, onOrderUpdate, onNewOrder, onNotification, joinAdmin };
};
