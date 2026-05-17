/**
 * Notification Database Service
 * 
 * All notification DB operations using supabaseAdmin (service role) to bypass RLS.
 * 
 * ─── DDL (run in Supabase SQL editor) ─────────────────────────────────────────
 * 
 * CREATE TABLE public.notifications (
 *     id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *     user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 *     type text NOT NULL DEFAULT 'market',
 *     title text NOT NULL,
 *     body text NOT NULL,
 *     target_path text NOT NULL,
 *     target_signature text NOT NULL DEFAULT '',
 *     is_read boolean DEFAULT false,
 *     created_at timestamptz DEFAULT now()
 * );
 * 
 * CREATE INDEX idx_notifications_user_created ON public.notifications (user_id, created_at DESC);
 * CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id, is_read) WHERE is_read = false;
 */
import { supabaseAdmin } from '../config/supabaseClient';
import { getPaginationRange } from '../utils/pagination';

type InsertNotificationItem = {
    user_id: string;
    type: string;
    title: string;
    body: string;
    target_path: string;
    target_signature?: string;
};

type NotificationRow = {
    id: string;
    user_id: string;
    type: string;
    title: string;
    body: string;
    target_path: string;
    target_signature: string;
    is_read: boolean;
    created_at: string;
};

export const insertNotifications = async (
    items: InsertNotificationItem[]
): Promise<{ data: NotificationRow[] | null; error: unknown }> => {
    const payload = items.map((item) => ({
        user_id: item.user_id,
        type: item.type,
        title: item.title,
        body: item.body,
        target_path: item.target_path,
        target_signature: item.target_signature || '',
    }));

    const { data, error } = await supabaseAdmin
        .from('notifications')
        .insert(payload)
        .select();

    return { data: data as NotificationRow[] | null, error };
};

export const getNotifications = async (
    userId: string,
    page: number,
    limit: number
): Promise<{ data: NotificationRow[] | null; count: number; error: unknown }> => {
    const { from, to } = getPaginationRange(page, limit);

    const { data, error, count } = await supabaseAdmin
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to);

    return { data: data as NotificationRow[] | null, count: count ?? 0, error };
};

export const markAsRead = async (
    notificationId: string,
    userId: string
): Promise<{ data: NotificationRow | null; error: unknown }> => {
    const { data, error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', userId)
        .select()
        .single();

    return { data: data as NotificationRow | null, error };
};

export const markAllAsRead = async (
    userId: string
): Promise<{ error: unknown }> => {
    const { error } = await supabaseAdmin
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

    return { error };
};

export const getUnreadCount = async (
    userId: string
): Promise<{ count: number; error: unknown }> => {
    const { count, error } = await supabaseAdmin
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

    return { count: count ?? 0, error };
};

export const createMarketResolutionNotifications = async (
    marketId: number,
    resolvedOptionId: number
): Promise<{ count: number; error: unknown }> => {
    try {
        // Fetch market title
        const { data: marketData, error: marketError } = await supabaseAdmin
            .from('markets')
            .select('title')
            .eq('id', marketId)
            .single();

        if (marketError || !marketData) {
            return { count: 0, error: marketError || new Error('Market not found') };
        }

        const marketTitle = (marketData as { title: string }).title;

        // Fetch option names for won/lost determination
        const { data: optionsData, error: optionsError } = await supabaseAdmin
            .from('market_options')
            .select('id, name')
            .eq('market_id', marketId);

        if (optionsError) {
            return { count: 0, error: optionsError };
        }

        const options = (optionsData as { id: number; name: string }[]) || [];
        const resolvedOptionName = options.find(
            (o) => o.id === resolvedOptionId
        )?.name || '';

        // Query distinct traders who placed trades on this market
        const { data: traders, error: tradersError } = await supabaseAdmin
            .from('transactions')
            .select('user_id, market_option_id')
            .in(
                'market_option_id',
                options.map((o) => o.id)
            );

        if (tradersError) {
            return { count: 0, error: tradersError };
        }

        // Deduplicate traders by user_id, tracking their last chosen option
        const traderMap = new Map<string, number>();
        for (const t of (traders as { user_id: string; market_option_id: number }[]) || []) {
            traderMap.set(t.user_id, t.market_option_id);
        }

        if (traderMap.size === 0) {
            return { count: 0, error: null };
        }

        // Build notification rows
        const notifications: InsertNotificationItem[] = [];
        for (const [userId, optionId] of traderMap) {
            const won = optionId === resolvedOptionId;
            const body = `"${marketTitle}" resolved — you ${won ? 'won' : 'lost'}!`;

            notifications.push({
                user_id: userId,
                type: 'market',
                title: 'Market Resolved',
                body,
                target_path: `/marketDetails?id=${marketId}`,
            });
        }

        // Bulk insert
        const { data: inserted, error: insertError } = await supabaseAdmin
            .from('notifications')
            .insert(notifications)
            .select();

        if (insertError) {
            return { count: 0, error: insertError };
        }

        return {
            count: (inserted as unknown[] | null)?.length ?? 0,
            error: null,
        };
    } catch (err) {
        return { count: 0, error: err };
    }
};
