import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const RENDER_URL = 'https://prophetize.onrender.com';

const envBackendUrl = process.env.EXPO_PUBLIC_BACKEND_URL?.trim();
const expoHostUri = Constants.expoConfig?.hostUri;
const expoHost = expoHostUri?.split(':')[0];
const inferredLanBackendUrl = expoHost ? `http://${expoHost}:3001` : null;
const platformFallbackUrl = Platform.OS === 'android' ? 'http://10.0.2.2:3001' : 'http://127.0.0.1:3001';

const baseUrl: string = envBackendUrl || inferredLanBackendUrl || platformFallbackUrl || RENDER_URL;
const FETCH_TIMEOUT_MS = 15000;
const NETWORK_ERROR_MESSAGE = 'Network request failed. Check backend server and API URL.';

let _clearAuth: (() => Promise<void>) | null = null;

export const registerClearAuth = (fn: () => Promise<void>) => {
    _clearAuth = fn;
};

// Helper function for getting the token
const getToken = async (): Promise<string | null> => {
    const accessToken = await SecureStore.getItemAsync('access_token');
    if(accessToken){
        return accessToken;
    } else {
        return null;
    }
}

const getRefreshToken = async (): Promise<string | null> => {
    const refreshToken = await SecureStore.getItemAsync('refresh_token');
    if(refreshToken){
        return refreshToken;
    } else {
        return null;
    }
 }
 
const handleResponse = async (response: Response, retryFn?: ()=> Promise<Response>) => {
    if (response.status === 401) {
        const refreshToken = await getRefreshToken();
        if(refreshToken){
            try {
                const refreshResponse = await fetch(baseUrl + '/auth/refresh-token', {
                    method: 'POST',
                    headers: {
                        'Content-Type':'application/json'},
                    body: JSON.stringify({ refresh_token: refreshToken })
                });
                if(refreshResponse.ok){
                    const data = await refreshResponse.json();
                    if (data?.access_token) {
                        await SecureStore.setItemAsync('access_token', data.access_token);
                    }
                    if(retryFn){
                        try {
                            const retried = await retryFn();
                            return { ok: retried.ok, data: await safeJson(retried)};
                        } catch (error) {
                            console.error('Retried request failed after token refresh', error);
                            return { ok: false, data: { error: NETWORK_ERROR_MESSAGE } };
                        }
                    }
                    return { ok: true, data };
                }
            } catch (error) {
                console.error('Token refresh request failed', error);
                return { ok: false, data: { error: NETWORK_ERROR_MESSAGE } };
            }
        }
        await _clearAuth?.();
        return { ok: false, data: null};
    }
    return { ok: response.ok, data: await safeJson(response) };
};

const safeJson = async (response: Response) => {
    const text = await response.text();
    try {
        return JSON.parse(text);
    } catch {
        console.error('Non-JSON response from', response.url, ':', text);
        return { error: text };
    }
};

const fetchWithTimeout = (url: string, options: RequestInit, timeoutMs: number = FETCH_TIMEOUT_MS) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
};

export const post = async(endpoint:string, body?:object) => {
    const token = await getToken();
    const doRequest = () => fetchWithTimeout(baseUrl+endpoint, {
        method: 'POST',
        headers: {
            'Content-Type':'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(body)
    });
    try {
        const response = await doRequest();
        return handleResponse(response, doRequest);
    } catch (error) {
        console.error(`POST ${endpoint} failed`, error);
        return { ok: false, data: { error: NETWORK_ERROR_MESSAGE } };
    }
}

export const get = async(endpoint:string) => {
    const token = await getToken();
    const doRequest = () => fetchWithTimeout(baseUrl+endpoint, {
        method: 'GET',
        headers: {
            'Content-Type':'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
    });
    try {
        const response = await doRequest();
        return handleResponse(response, doRequest);
    } catch (error) {
        console.error(`GET ${endpoint} failed`, error);
        return { ok: false, data: { error: NETWORK_ERROR_MESSAGE } };
    }
}

export const patch = async(endpoint:string, body?:object) => {
    const token = await getToken();
    const doRequest = () => fetch(baseUrl+endpoint, {
        method: 'PATCH',
        headers: {
            'Content-Type':'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(body)
    });
    try {
        const response = await doRequest();
        return handleResponse(response, doRequest);
    } catch (error) {
        console.error(`PATCH ${endpoint} failed`, error);
        return { ok: false, data: { error: NETWORK_ERROR_MESSAGE } };
    }
}

export type LeaderboardPeriod = 'weekly' | 'all_time';

export type LeaderboardApiEntry = {
    rank: number;
    user_id: string;
    username: string;
    avatar_url: string | null;
    wins?: number;
    revenue?: number;
    profit_pct?: number;
    is_current_user?: boolean;
};

export type LeaderboardApiMeta = {
    page: number;
    limit: number;
    has_next_page: boolean;
    total_records: number;
    total_pages: number;
};

export type LeaderboardApiResponse = {
    data: LeaderboardApiEntry[];
    meta: LeaderboardApiMeta;
};

export type MyLeaderboardPositionResponse = {
    position: number;
    username: string;
    avatar_url: string | null;
    wins?: number;
    revenue?: number;
    profit_pct?: number;
};

export const getLeaderboard = async (
    period: LeaderboardPeriod,
    page: number = 0,
    limit: number = 10
) => {
    const params = new URLSearchParams({
        period,
        page: String(page),
        limit: String(limit),
    });

    return get(`/leaderboard?${params.toString()}`);
};

export const getMyLeaderboardPosition = async (period: LeaderboardPeriod) => {
    const params = new URLSearchParams({ period });
    return get(`/leaderboard/me?${params.toString()}`);
};

export type CreateMarketPayload = {
    title: string;
    description: string;
    category: string;
    endDate: string;
    options: string[];
    imageUrl?: string;
};

const CREATE_MARKET_ERROR_FALLBACK = 'Unable to submit market right now. Please try again.';

const normalizeCreateMarketError = (data: unknown): string => {
    if (!data || typeof data !== 'object') {
        return CREATE_MARKET_ERROR_FALLBACK;
    }

    const payload = data as Record<string, unknown>;
    const rawError = payload.error;

    if (typeof rawError === 'string') {
        const trimmed = rawError.trim();
        if (!trimmed) {
            return CREATE_MARKET_ERROR_FALLBACK;
        }

        // Never surface raw html/transport payloads in user-facing messages.
        if (trimmed.startsWith('<') || trimmed.toLowerCase().includes('syntaxerror')) {
            return CREATE_MARKET_ERROR_FALLBACK;
        }

        return trimmed;
    }

    return CREATE_MARKET_ERROR_FALLBACK;
};

export const createMarket = async (payload: CreateMarketPayload) => {
    const response = await post('/markets/create', payload);

    if (!response.ok) {
        const normalizedError = normalizeCreateMarketError(response.data);
        const normalizedData = response.data && typeof response.data === 'object'
            ? { ...(response.data as Record<string, unknown>), error: normalizedError }
            : { error: normalizedError };

        return {
            ...response,
            data: normalizedData,
        };
    }

    return response;
};

export type TradePayload = {
    optionId: number;
    shares: number;
};

export type TradeSnapshot = {
    balance: number;
    position: {
        optionId: number;
        sharesOwned: number;
    };
};

export type TradeResponse = {
    message: string;
    trade: {
        side: 'buy' | 'sell';
        optionId: number;
        shares: number;
        price: number;
        totalCost?: number;
        totalReturn?: number;
    };
    snapshot?: TradeSnapshot;
};

const TRADE_PAYLOAD_ERROR = 'Received an unexpected trade response. Please try again.';

const parseFiniteNumber = (value: unknown): number | null => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const unwrapTradePayload = (payload: unknown): unknown => {
    if (Array.isArray(payload)) {
        return payload[0];
    }

    if (!payload || typeof payload !== 'object') {
        return payload;
    }

    const record = payload as Record<string, unknown>;
    if (!('data' in record)) {
        return payload;
    }

    const inner = record.data;
    if (Array.isArray(inner)) {
        return inner[0];
    }

    return inner;
};

const normalizeTradeResponse = (
    payload: unknown,
    fallbackMessage: string
): { ok: true; data: TradeResponse } | { ok: false; error: string } => {
    const candidate = unwrapTradePayload(payload);
    if (!candidate || typeof candidate !== 'object') {
        return { ok: false, error: TRADE_PAYLOAD_ERROR };
    }

    const record = candidate as Record<string, unknown>;
    const tradeRecord = record.trade;
    if (!tradeRecord || typeof tradeRecord !== 'object') {
        return { ok: false, error: TRADE_PAYLOAD_ERROR };
    }

    const trade = tradeRecord as Record<string, unknown>;
    const side = trade.side === 'buy' || trade.side === 'sell' ? trade.side : null;
    const optionId = parseFiniteNumber(trade.optionId);
    const shares = parseFiniteNumber(trade.shares);
    const price = parseFiniteNumber(trade.price);

    if (!side || optionId === null || shares === null || price === null) {
        return { ok: false, error: TRADE_PAYLOAD_ERROR };
    }

    const message = typeof record.message === 'string' && record.message.trim()
        ? record.message.trim()
        : fallbackMessage;

    const normalizedTrade: TradeResponse['trade'] = {
        side,
        optionId,
        shares,
        price,
    };

    const totalCost = parseFiniteNumber(trade.totalCost);
    if (totalCost !== null) {
        normalizedTrade.totalCost = totalCost;
    }

    const totalReturn = parseFiniteNumber(trade.totalReturn);
    if (totalReturn !== null) {
        normalizedTrade.totalReturn = totalReturn;
    }

    let snapshot: TradeSnapshot | undefined;
    if (record.snapshot !== undefined) {
        if (!record.snapshot || typeof record.snapshot !== 'object') {
            return { ok: false, error: TRADE_PAYLOAD_ERROR };
        }

        const snapshotRecord = record.snapshot as Record<string, unknown>;
        const balance = parseFiniteNumber(snapshotRecord.balance);
        const positionRecord = snapshotRecord.position;
        if (
            balance === null ||
            !positionRecord ||
            typeof positionRecord !== 'object'
        ) {
            return { ok: false, error: TRADE_PAYLOAD_ERROR };
        }

        const position = positionRecord as Record<string, unknown>;
        const positionOptionId = parseFiniteNumber(position.optionId);
        const sharesOwned = parseFiniteNumber(position.sharesOwned);
        if (positionOptionId === null || sharesOwned === null) {
            return { ok: false, error: TRADE_PAYLOAD_ERROR };
        }

        snapshot = {
            balance,
            position: {
                optionId: positionOptionId,
                sharesOwned,
            },
        };
    }

    return {
        ok: true,
        data: {
            message,
            trade: normalizedTrade,
            snapshot,
        },
    };
};

export const buyShares = async (payload: TradePayload) => {
    const response = await post('/transaction/buy', payload);
    if (!response.ok) {
        return response;
    }

    const normalized = normalizeTradeResponse(response.data, 'Purchase successful');
    if (!normalized.ok) {
        return {
            ok: false,
            data: {
                error: normalized.error,
            },
        };
    }

    return {
        ok: true,
        data: normalized.data,
    };
};

export const sellShares = async (payload: TradePayload) => {
    const response = await post('/transaction/sell', payload);
    if (!response.ok) {
        return response;
    }

    const normalized = normalizeTradeResponse(response.data, 'Sale successful');
    if (!normalized.ok) {
        return {
            ok: false,
            data: {
                error: normalized.error,
            },
        };
    }

    return {
        ok: true,
        data: normalized.data,
    };
};

export type MarketPositionSnapshot = {
    market_id: string;
    total_shares: number;
    options: Array<{
        option_id: string;
        option_name: string;
        shares_owned: number;
    }>;
    updated_at: string | null;
};

const normalizeStringId = (value: unknown): string | null => {
    if (typeof value === 'string') {
        const normalized = value.trim();
        return normalized.length > 0 ? normalized : null;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
    }

    return null;
};

const normalizeMarketPositionSnapshot = (raw: unknown): MarketPositionSnapshot | null => {
    if (!raw || typeof raw !== 'object') {
        return null;
    }

    const record = raw as Record<string, unknown>;
    const marketId = normalizeStringId(record.market_id ?? record.marketId);
    const optionsRaw = Array.isArray(record.options) ? record.options : [];

    if (!marketId) {
        return null;
    }

    const options = optionsRaw
        .map((item: unknown) => {
            if (!item || typeof item !== 'object') return null;
            const optionRecord = item as Record<string, unknown>;
                        const optionId = normalizeStringId(optionRecord.option_id ?? optionRecord.optionId ?? optionRecord.id);
                        const optionName =
                                typeof optionRecord.option_name === 'string'
                                        ? optionRecord.option_name
                                        : typeof optionRecord.optionName === 'string'
                                            ? optionRecord.optionName
                                            : '';
            const sharesOwned = Number(optionRecord.shares_owned ?? optionRecord.sharesOwned);

            if (!optionId || !Number.isFinite(sharesOwned)) return null;

            return {
                option_id: optionId,
                option_name: optionName,
                shares_owned: sharesOwned,
            };
        })
        .filter((item): item is { option_id: string; option_name: string; shares_owned: number } => Boolean(item));

    const rawTotalShares = Number(record.total_shares ?? record.totalShares);
    const totalShares = Number.isFinite(rawTotalShares)
        ? rawTotalShares
        : options.reduce((sum, option) => sum + option.shares_owned, 0);

    return {
        market_id: marketId,
        total_shares: totalShares,
        options,
        updated_at:
            typeof record.updated_at === 'string'
                ? record.updated_at
                : typeof record.updatedAt === 'string'
                  ? record.updatedAt
                  : null,
    };
};

export const getPortfolioPositionByMarketId = async (marketId: number) => {
    const response = await get(`/portfolio/position/${marketId}`);
    if (!response.ok) {
        return response;
    }

    const payload = response.data as Record<string, unknown> | unknown[] | null;
    const nested = payload && !Array.isArray(payload) ? payload.data : payload;
    const candidate = Array.isArray(nested) ? nested[0] : nested;
    const snapshot = normalizeMarketPositionSnapshot(candidate);
    if (!snapshot) {
        return {
            ok: false,
            data: {
                error: 'Invalid market position response',
            },
        };
    }

    const root = (payload as Record<string, unknown>) || {};
    const realizedPL = typeof root.realized_pl === 'number' ? root.realized_pl : null;

    return {
        ok: true,
        data: {
            snapshot,
            realized_pl: realizedPL,
        },
    };
};

export type PortfolioSummary = {
    username: string;
    avatar_url: string | null;
    joined: string;
    balance: number;
    positions_value: number;
    net_worth: number;
    biggest_win: number;
    predictions_count: number;
};

export type PortfolioActivityTransaction = {
    id: string;
    market_option_id: string;
    type: string;
    shares: number;
    price_at_time: number;
    amount: number;
    created_at: string;
    option_name: string;
    market_id: string;
    market_title: string;
};

export type CreatedMarketItem = {
    id: number;
    title: string;
    category: string;
    status: string;
    endDate: string;
    createdAt: string;
    totalVolume: number;
};

export const normalizeCreatedMarketsPayload = (payload: unknown): CreatedMarketItem[] => {
    const source = payload && typeof payload === 'object'
        ? (payload as Record<string, unknown>).data
        : payload;

    if (!Array.isArray(source)) {
        return [];
    }

    return source
        .map((item) => {
            if (!item || typeof item !== 'object') {
                return null;
            }

            const row = item as Record<string, unknown>;
            const id = Number(row.id);
            if (!Number.isInteger(id) || id <= 0) {
                return null;
            }

            const title = typeof row.title === 'string' ? row.title : '';
            if (!title) {
                return null;
            }

            return {
                id,
                title,
                category: typeof row.category === 'string' ? row.category : '',
                status: typeof row.status === 'string' ? row.status : 'pending',
                endDate: typeof row.endDate === 'string' ? row.endDate : '',
                createdAt: typeof row.createdAt === 'string' ? row.createdAt : '',
                totalVolume: Number(row.totalVolume) || 0,
            } satisfies CreatedMarketItem;
        })
        .filter((item): item is CreatedMarketItem => Boolean(item));
};

export const getPortfolioSummary = async () => {
    return get('/portfolio/summary');
};

export const getPortfolioActivity = async () => {
    return get('/portfolio/activity');
};

export type PortfolioChartRange = '1D' | '1W' | '1M' | 'ALL';

export type PortfolioChartPoint = {
    snapshot_date: string;
    net_worth: number;
    period: string;
};

export const getPortfolioChart = async (range: PortfolioChartRange = '1W') => {
    return get(`/portfolio/chart?range=${range}`);
};

export const getCreatedMarkets = async (params?: {
    userId?: string;
    status?: string;
    page?: number;
    limit?: number;
}) => {
    const searchParams = new URLSearchParams();
    if (params?.userId) {
        searchParams.set('userId', params.userId);
    }
    if (params?.status) {
        searchParams.set('status', params.status);
    }
    if (typeof params?.page === 'number') {
        searchParams.set('page', String(params.page));
    }
    if (typeof params?.limit === 'number') {
        searchParams.set('limit', String(params.limit));
    }

    const query = searchParams.toString();
    const endpoint = params?.userId
        ? `/markets/created/user/${params.userId}${query ? `?${query}` : ''}`
        : `/markets/created${query ? `?${query}` : ''}`;
    return get(endpoint);
};

export type MarketHistoryTimeframe = '5m' | '1h' | '1d' | '1w';

export type MarketHistoryPoint = {
    ts: string;
    probability: number;
};

const normalizeMarketHistoryPoint = (value: unknown): MarketHistoryPoint | null => {
    if (!value || typeof value !== 'object') {
        return null;
    }

    const record = value as Record<string, unknown>;
    const ts = typeof record.ts === 'string' ? record.ts : null;
    const probability = Number(record.probability);
    if (!ts || !Number.isFinite(probability)) {
        return null;
    }

    return {
        ts,
        probability: Math.max(0, Math.min(100, Number(probability.toFixed(2)))),
    };
};

export const getMarketHistory = async (
    marketId: number,
    timeframe: MarketHistoryTimeframe,
    optionId?: number | null
) => {
    const params = new URLSearchParams({ timeframe });
    if (typeof optionId === 'number' && Number.isInteger(optionId) && optionId > 0) {
        params.set('optionId', String(optionId));
    }
    const response = await get(`/markets/${marketId}/history?${params.toString()}`);
    if (!response.ok) {
        return response;
    }

    const payload = response.data as Record<string, unknown> | null;
    const nested = payload && typeof payload === 'object' ? payload.data : null;
    const pointsRaw = nested && typeof nested === 'object'
        ? (nested as Record<string, unknown>).points
        : null;
    const points = Array.isArray(pointsRaw)
        ? pointsRaw
            .map(normalizeMarketHistoryPoint)
            .filter((item): item is MarketHistoryPoint => Boolean(item))
        : [];

    return {
        ok: true,
        data: {
            points,
        },
    };
};

export type NotificationType = 'market' | 'leaderboard' | 'profile';

export type NotificationPayload = {
    type: NotificationType;
    recipient_user_id: string;
    title: string;
    body: string;
    target_path: string;
    target_signature: string;
};

export type NotificationInboxSource = 'backend' | 'fallback';

export type NotificationInboxItem = NotificationPayload & {
    id: string;
    created_at: string;
};

export type NotificationRouteTarget =
    | { pathname: '/marketDetails'; params: { id: string } }
    | { pathname: '/tabs/leaderboard' }
    | { pathname: '/tabs/profile'; params?: { userId: string } };

export type NotificationPlatform = 'ios' | 'android' | 'web';

export const registerNotificationChannel = async (
    deviceToken: string,
    platform: NotificationPlatform
) => {
    return post('/notifications/register', {
        deviceToken,
        platform,
    });
};

type TriggerNotificationPayload = {
    type: NotificationType;
    recipientUserId: string;
    title: string;
    body: string;
    marketId?: number;
    profileUserId?: string;
};

export const triggerNotification = async (payload: TriggerNotificationPayload) => {
    return post('/notifications/trigger', payload);
};

const normalizeNotificationItem = (raw: unknown): NotificationInboxItem | null => {
    if (!raw || typeof raw !== 'object') {
        return null;
    }

    const record = raw as Record<string, unknown>;
    const type = typeof record.type === 'string' ? record.type : '';
    const recipientUserId = typeof record.recipient_user_id === 'string' ? record.recipient_user_id : '';
    const title = typeof record.title === 'string' ? record.title : '';
    const body = typeof record.body === 'string' ? record.body : '';
    const targetPath = typeof record.target_path === 'string' ? record.target_path : '';
    const targetSignature = typeof record.target_signature === 'string' ? record.target_signature : '';

    if (
        (type !== 'market' && type !== 'leaderboard' && type !== 'profile') ||
        !recipientUserId ||
        !title ||
        !body ||
        !targetPath ||
        !targetSignature
    ) {
        return null;
    }

    const createdAt = typeof record.created_at === 'string' && record.created_at
        ? record.created_at
        : new Date().toISOString();
    const id = typeof record.id === 'string' && record.id
        ? record.id
        : `${type}:${recipientUserId}:${targetPath}:${createdAt}`;

    return {
        id,
        created_at: createdAt,
        type,
        recipient_user_id: recipientUserId,
        title,
        body,
        target_path: targetPath,
        target_signature: targetSignature,
    };
};

const extractNotifications = (payload: unknown): NotificationInboxItem[] => {
    if (Array.isArray(payload)) {
        return payload.map(normalizeNotificationItem).filter((item): item is NotificationInboxItem => Boolean(item));
    }

    if (!payload || typeof payload !== 'object') {
        return [];
    }

    const record = payload as Record<string, unknown>;
    const candidate = Array.isArray(record.notifications)
        ? record.notifications
        : Array.isArray(record.data)
            ? record.data
            : [];

    return candidate.map(normalizeNotificationItem).filter((item): item is NotificationInboxItem => Boolean(item));
};

export const getNotifications = async (): Promise<{
    ok: boolean;
    data: { items: NotificationInboxItem[]; source: NotificationInboxSource; message?: string } | { error: string };
}> => {
    const token = await getToken();

    const doRequest = () => fetch(baseUrl + '/notifications', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    });

    try {
        const initial = await doRequest();
        if (initial.status === 404) {
            return {
                ok: true,
                data: {
                    items: [],
                    source: 'fallback',
                    message: 'Notification inbox endpoint is not available yet.',
                },
            };
        }

        const handled = await handleResponse(initial, doRequest);
        if (!handled.ok) {
            return {
                ok: false,
                data: {
                    error: (handled.data as Record<string, unknown>)?.error as string || 'Unable to load notifications right now.',
                },
            };
        }

        return {
            ok: true,
            data: {
                items: extractNotifications(handled.data),
                source: 'backend',
            },
        };
    } catch (error) {
        console.error('GET /notifications failed', error);
        return {
            ok: false,
            data: {
                error: NETWORK_ERROR_MESSAGE,
            },
        };
    }
};

export const markNotificationAsRead = async (notificationId: string) => {
    return patch('/notifications/read', { id: notificationId });
};

export const markAllNotificationsAsRead = async () => {
    return patch('/notifications/read-all', {});
};

export type FollowAction = 'follow' | 'unfollow';

export const followUser = async (targetUserId: string, action: FollowAction = 'follow') => {
    return post('/social/follow', { targetUserId, action });
};

export type CommentItem = {
    id: string;
    market_id: number;
    user_id: string;
    content: string;
    created_at: string;
};

export const getComments = async (marketId: number) => {
    return get(`/social/comments/${marketId}`);
};

export const createComment = async (marketId: number, content: string) => {
    return post('/social/comments', { marketId, content });
};

const parseTargetPath = (path: string) => {
    if (!path.startsWith('/')) {
        return null;
    }

    const [pathname, queryString = ''] = path.split('?');
    const query = new URLSearchParams(queryString);
    return { pathname, query };
};

export const resolveNotificationTarget = (
    payload: Pick<NotificationPayload, 'type' | 'target_path'>
): NotificationRouteTarget | null => {
    const parsedTarget = parseTargetPath(payload.target_path);
    if (!parsedTarget) {
        return null;
    }

    const { pathname, query } = parsedTarget;

    if (payload.type === 'market' && pathname === '/marketDetails') {
        const id = query.get('id');
        if (!id) return null;
        return { pathname: '/marketDetails', params: { id } };
    }

    if (payload.type === 'leaderboard' && pathname === '/tabs/leaderboard') {
        return { pathname: '/tabs/leaderboard' };
    }

    if (payload.type === 'profile' && pathname === '/tabs/profile') {
        const userId = query.get('userId') || undefined;
        return userId
            ? { pathname: '/tabs/profile', params: { userId } }
            : { pathname: '/tabs/profile' };
    }

    return null;
};

