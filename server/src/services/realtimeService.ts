export type RealtimeEventName = "market.updated" | "portfolio.updated" | "leaderboard.updated" | "notification.new";

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

type RealtimeEmitter = (event: RealtimeEventName, payload: unknown) => void;

type TradeRealtimePayload = {
    userId: string;
    marketId: number;
    optionId: number;
    probability: number;
    balance: number;
    sharesOwned: number;
};

let emitter: RealtimeEmitter | null = null;

export const initializeRealtimeEmitter = (nextEmitter: RealtimeEmitter) => {
    emitter = nextEmitter;
};

export const resetRealtimeEmitter = () => {
    emitter = null;
};

export const emitRealtimeEvent = (event: RealtimeEventName, payload: unknown) => {
    if (!emitter) {
        return;
    }

    try {
        emitter(event, payload);
    } catch (error) {
        console.error("Realtime emitter failed", error);
    }
};

export const emitNotificationNewEvent = (userId: string, notification: NotificationNewPayload['notification']) => {
    emitRealtimeEvent("notification.new", { userId, notification });
};

export const emitTradeRealtimeUpdates = (payload: TradeRealtimePayload) => {
    const now = new Date().toISOString();

    emitRealtimeEvent("market.updated", {
        marketId: payload.marketId,
        optionId: payload.optionId,
        probability: payload.probability,
        updatedAt: now,
    });

    emitRealtimeEvent("portfolio.updated", {
        userId: payload.userId,
        balance: payload.balance,
        position: {
            optionId: payload.optionId,
            sharesOwned: payload.sharesOwned,
        },
        updatedAt: now,
    });

    emitRealtimeEvent("leaderboard.updated", {
        userId: payload.userId,
        marketId: payload.marketId,
        updatedAt: now,
    });
};