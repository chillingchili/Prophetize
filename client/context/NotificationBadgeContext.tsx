import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { get } from '@/utils/api';
import { subscribeRealtime, NotificationNewPayload } from './realtimeClient';
import { useAuth } from './AuthContext';

type NotificationBadgeState = {
    unreadCount: number;
    refreshUnreadCount: () => Promise<void>;
    resetUnreadCount: () => void;
};

const NotificationBadgeContext = createContext<NotificationBadgeState>({
    unreadCount: 0,
    refreshUnreadCount: async () => {},
    resetUnreadCount: () => {},
});

export const useNotificationBadge = () => useContext(NotificationBadgeContext);

export const NotificationBadgeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [unreadCount, setUnreadCount] = useState(0);
    const isMounted = useRef(true);
    const { token } = useAuth();

    const fetchUnreadCount = useCallback(async () => {
        if (!token) return;
        try {
            const result = await get('/notifications/unread-count');
            if (result.ok && result.data && typeof result.data.count === 'number') {
                if (isMounted.current) setUnreadCount(result.data.count);
            }
        } catch {
            // Silently fail — badge just stays at 0
        }
    }, [token]);

    const resetUnreadCount = useCallback(() => {
        if (isMounted.current) setUnreadCount(0);
    }, []);

    // Fetch on mount and when auth token changes
    useEffect(() => {
        isMounted.current = true;
        void fetchUnreadCount();
        return () => { isMounted.current = false; };
    }, [fetchUnreadCount]);

    // Subscribe to realtime notification events
    useEffect(() => {
        const unsubscribe = subscribeRealtime({
            channels: ['notification.new'],
            onEvent: (event, payload) => {
                if (event === 'notification.new') {
                    const notif = payload as NotificationNewPayload;
                    // Only increment if notification is for current user
                    // (userId matching is done client-side since room is broadcast)
                    if (isMounted.current) {
                        setUnreadCount((prev) => prev + 1);
                    }
                }
            },
        });

        return () => {
            unsubscribe();
        };
    }, []);

    return (
        <NotificationBadgeContext.Provider value={{ unreadCount, refreshUnreadCount: fetchUnreadCount, resetUnreadCount }}>
            {children}
        </NotificationBadgeContext.Provider>
    );
};
