/**
 * front-end/src/hooks/useRealtime.ts
 * Supabase Realtime hook — replaces Socket.IO client
 */
import { useEffect, useRef } from 'react';
import { supabase } from '../config/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeOptions {
    table: string;
    schema?: string;
    event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
    filter?: string; // e.g. "user_id=eq.abc123"
    onData: (payload: { new: Record<string, unknown>; old: Record<string, unknown>; eventType: string }) => void;
}

/**
 * Subscribe to Supabase Realtime changes on a table.
 * Automatically cleans up subscription on unmount.
 *
 * Usage:
 * useRealtime({
 *   table: 'notifications',
 *   filter: `user_id=eq.${userId}`,
 *   event: 'INSERT',
 *   onData: (payload) => handleNewNotification(payload.new)
 * });
 */
export const useRealtime = ({ table, schema = 'public', event = '*', filter, onData }: RealtimeOptions) => {
    const channelRef = useRef<RealtimeChannel | null>(null);

    useEffect(() => {
        const channelName = `realtime-${table}-${Date.now()}`;

        let config: Record<string, unknown> = { event, schema, table };
        if (filter) config.filter = filter;

        channelRef.current = supabase
            .channel(channelName)
            .on(
                'postgres_changes' as Parameters<RealtimeChannel['on']>[0],
                config,
                (payload: { new: Record<string, unknown>; old: Record<string, unknown>; eventType: string }) => {
                    onData(payload);
                }
            )
            .subscribe();

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [table, filter]);
};

/**
 * Subscribe to notification changes for current user.
 */
export const useNotificationRealtime = (userId: string | undefined, onNotification: (n: Record<string, unknown>) => void) => {
    useRealtime({
        table: 'notifications',
        event: 'INSERT',
        filter: userId ? `user_id=eq.${userId}` : undefined,
        onData: (payload) => {
            if (payload.new) onNotification(payload.new);
        }
    });
};

/**
 * Subscribe to order status changes.
 */
export const useOrderRealtime = (orderId: string | undefined, onUpdate: (order: Record<string, unknown>) => void) => {
    useRealtime({
        table: 'orders',
        event: 'UPDATE',
        filter: orderId ? `id=eq.${orderId}` : undefined,
        onData: (payload) => {
            if (payload.new) onUpdate(payload.new);
        }
    });
};

/**
 * Subscribe to repair ticket updates.
 */
export const useRepairRealtime = (ticketId: string | undefined, onUpdate: (ticket: Record<string, unknown>) => void) => {
    useRealtime({
        table: 'repair_tickets',
        event: 'UPDATE',
        filter: ticketId ? `id=eq.${ticketId}` : undefined,
        onData: (payload) => {
            if (payload.new) onUpdate(payload.new);
        }
    });
};
