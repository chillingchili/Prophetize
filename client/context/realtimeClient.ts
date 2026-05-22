import { io, Socket } from 'socket.io-client';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const envBackendUrl = process.env.EXPO_PUBLIC_BACKEND_URL?.trim();
const expoHostUri = Constants.expoConfig?.hostUri;
const expoHost = expoHostUri?.split(':')[0];
const inferredLanBackendUrl = expoHost ? `http://${expoHost}:3001` : null;
const platformFallbackUrl = Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://127.0.0.1:3001';

const backendUrl: string = envBackendUrl || inferredLanBackendUrl || platformFallbackUrl;

export type RealtimeEventName = 'market.updated' | 'portfolio.updated' | 'leaderboard.updated' | 'notification.new';

export type RealtimeConnectionState = 'connected' | 'reconnecting' | 'stale' | 'disconnected';

export type MarketUpdatedPayload = {
    marketId: number;
    optionId: number;
    probability: number;
    updatedAt: string;
};

export type PortfolioUpdatedPayload = {
    userId: string;
    balance: number;
    position: {
        optionId: number;
        sharesOwned: number;
    };
    updatedAt: string;
};

export type LeaderboardUpdatedPayload = {
    userId: string;
    marketId: number;
    updatedAt: string;
};

export type NotificationNewPayload = {
    userId: string;
    notification: {
        id: string;
        type: string;
        title: string;
        body: string;
        target_path: string;
        target_signature: string;
        created_at: string;
        is_read: boolean;
    };
};

type RealtimePayloadMap = {
    'market.updated': MarketUpdatedPayload;
    'portfolio.updated': PortfolioUpdatedPayload;
    'leaderboard.updated': LeaderboardUpdatedPayload;
    'notification.new': NotificationNewPayload;
};

type Subscription = {
    id: number;
    channels: RealtimeEventName[];
    onEvent: <T extends RealtimeEventName>(event: T, payload: RealtimePayloadMap[T]) => void;
    onReconnect?: () => void;
    onConnectionState?: (state: RealtimeConnectionState) => void;
    lastReconnectAt: number;
};

const SOCKET_EVENTS: RealtimeEventName[] = ['market.updated', 'portfolio.updated', 'leaderboard.updated', 'notification.new'];
const RECONNECT_RESYNC_COOLDOWN_MS = 3000;
const STALE_STATE_DELAY_MS = 12000;

let socket: Socket | null = null;
let nextSubscriptionId = 1;
let hasConnectedOnce = false;
let listenersBound = false;
let staleTimer: ReturnType<typeof setTimeout> | null = null;
let connectionState: RealtimeConnectionState = 'disconnected';
const subscriptions = new Map<number, Subscription>();

const clearStaleTimer = () => {
    if (staleTimer) {
        clearTimeout(staleTimer);
        staleTimer = null;
    }
};

const notifyConnectionState = (nextState: RealtimeConnectionState) => {
    if (connectionState === nextState) {
        return;
    }

    connectionState = nextState;
    for (const subscription of subscriptions.values()) {
        subscription.onConnectionState?.(connectionState);
    }
};

const scheduleStaleState = () => {
    clearStaleTimer();
    staleTimer = setTimeout(() => {
        notifyConnectionState('stale');
    }, STALE_STATE_DELAY_MS);
};

const notifyEvent = <T extends RealtimeEventName>(event: T, payload: RealtimePayloadMap[T]) => {
    for (const subscription of subscriptions.values()) {
        if (!subscription.channels.includes(event)) {
            continue;
        }

        subscription.onEvent(event, payload);
    }
};

const emitCurrentSubscriptions = () => {
    if (!socket || !socket.connected) {
        return;
    }

    const channelSet = new Set<RealtimeEventName>();
    for (const subscription of subscriptions.values()) {
        for (const channel of subscription.channels) {
            channelSet.add(channel);
        }
    }

    if (channelSet.size > 0) {
        socket.emit('subscribe', Array.from(channelSet));
    }
};

const notifyReconnect = () => {
    const now = Date.now();

    for (const subscription of subscriptions.values()) {
        if (!subscription.onReconnect) {
            continue;
        }

        if (now - subscription.lastReconnectAt < RECONNECT_RESYNC_COOLDOWN_MS) {
            continue;
        }

        subscription.lastReconnectAt = now;
        subscription.onReconnect();
    }
};

const ensureSocket = () => {
    if (socket) {
        return socket;
    }

    socket = io(backendUrl, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
    });

    if (!listenersBound) {
        socket.on('connect', () => {
            clearStaleTimer();
            notifyConnectionState('connected');
            emitCurrentSubscriptions();

            if (hasConnectedOnce) {
                notifyReconnect();
            }

            hasConnectedOnce = true;
        });

        socket.on('market.updated', (payload: MarketUpdatedPayload) => {
            notifyEvent('market.updated', payload);
        });

        socket.on('portfolio.updated', (payload: PortfolioUpdatedPayload) => {
            notifyEvent('portfolio.updated', payload);
        });

        socket.on('leaderboard.updated', (payload: LeaderboardUpdatedPayload) => {
            notifyEvent('leaderboard.updated', payload);
        });

        socket.on('notification.new', (payload: NotificationNewPayload) => {
            notifyEvent('notification.new', payload);
        });

        socket.on('disconnect', () => {
            notifyConnectionState('reconnecting');
            scheduleStaleState();
        });

        socket.io.on('reconnect_attempt', () => {
            notifyConnectionState('reconnecting');
            scheduleStaleState();
        });

        socket.io.on('reconnect_failed', () => {
            notifyConnectionState('stale');
            clearStaleTimer();
        });

        listenersBound = true;
    }

    return socket;
};

export const subscribeRealtime = (subscription: {
    channels: RealtimeEventName[];
    onEvent: Subscription['onEvent'];
    onReconnect?: () => void;
    onConnectionState?: Subscription['onConnectionState'];
}) => {
    const client = ensureSocket();

    const normalizedChannels = subscription.channels.filter((channel) => SOCKET_EVENTS.includes(channel));

    const id = nextSubscriptionId;
    nextSubscriptionId += 1;

    subscriptions.set(id, {
        id,
        channels: normalizedChannels,
        onEvent: subscription.onEvent,
        onReconnect: subscription.onReconnect,
        onConnectionState: subscription.onConnectionState,
        lastReconnectAt: 0,
    });

    subscription.onConnectionState?.(connectionState);

    if (client.connected && normalizedChannels.length > 0) {
        client.emit('subscribe', normalizedChannels);
    }

    return () => {
        const active = subscriptions.get(id);
        subscriptions.delete(id);

        if (active && socket?.connected && active.channels.length > 0) {
            socket.emit('unsubscribe', active.channels);
        }

        if (subscriptions.size === 0 && socket) {
            clearStaleTimer();
            notifyConnectionState('disconnected');
            socket.disconnect();
            socket = null;
            listenersBound = false;
            hasConnectedOnce = false;
        }
    };
};