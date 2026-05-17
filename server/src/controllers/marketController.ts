import { Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../config/supabaseClient';
import { AuthRequest } from '../types/authRequest';
import { MARKET_CATEGORIES } from '../types/marketCategories';
import { getPaginationRange } from '../utils/pagination';

const PUBLIC_MARKET_STATUSES = [
    'active',
    'closed',
    'resolving',
    'disputed',
    'finalized'
] as const;

const HISTORY_BUCKET_STEPS = {
    '5m': 5 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '1w': 7 * 24 * 60 * 60 * 1000,
} as const;

const HISTORY_TARGET_POINTS = 5;
const INTERNAL_SERVER_ERROR_MESSAGE = 'Internal server error';

type HistoryTimeframe = keyof typeof HISTORY_BUCKET_STEPS;

const CREATED_MARKET_STATUSES = [
    'pending',
    'pending_approval',
    'active',
    'closed',
    'resolving',
    'challenged',
    'disputed',
    'resolved',
    'finalized',
    'rejected'
] as const;

const sanitizeSearchTerm = (value: string) => value
    .replace(/[%_(),]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const clampProbabilityPercent = (value: number) => {
    if (!Number.isFinite(value)) {
        return 0;
    }

    return Math.max(0, Math.min(100, Number(value.toFixed(2))));
};

const normalizeProbabilityPercent = (value: unknown): number => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return 0;
    }

    if (parsed <= 1) {
        return clampProbabilityPercent(parsed * 100);
    }

    return clampProbabilityPercent(parsed);
};

const alignToStepFloor = (timestampMs: number, stepMs: number) => {
    if (!Number.isFinite(timestampMs) || !Number.isFinite(stepMs) || stepMs <= 0) {
        return timestampMs;
    }

    return Math.floor(timestampMs / stepMs) * stepMs;
};

const alignToUtcDayFloor = (timestampMs: number) => {
    const date = new Date(timestampMs);
    return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

const alignToUtcWeekFloor = (timestampMs: number) => {
    const dayFloor = alignToUtcDayFloor(timestampMs);
    const date = new Date(dayFloor);
    const day = date.getUTCDay();
    const mondayOffset = (day + 6) % 7;
    return dayFloor - mondayOffset * 24 * 60 * 60 * 1000;
};

const getAlignedNowMs = (timeframe: HistoryTimeframe, nowMs: number) => {
    if (timeframe === '1w') {
        return alignToUtcWeekFloor(nowMs);
    }

    if (timeframe === '1d') {
        return alignToUtcDayFloor(nowMs);
    }

    return alignToStepFloor(nowMs, HISTORY_BUCKET_STEPS[timeframe]);
};

// GET /markets/categories
export const getCategories = (req: Request, res: Response) => {
    res.status(200).json(MARKET_CATEGORIES);
};

// GET /get-all - Get all markets (Testing only)
export const getAllMarkets = async(req:Request, res:Response) => {
    const page = parseInt(req.query.page as string) || 0;
    const limit = parseInt(req.query.limit as string) || 10;

    const { from, to } = getPaginationRange(page, limit);

    try {
        const { data, error } = await supabase
            .from('markets')
            .select(`
                *,
                option: market_options!market_options_market_id_fkey(
                    id,
                    name,
                    probability
                )
            `)
            .in('status', [...PUBLIC_MARKET_STATUSES])
            .order('created_at', { ascending:false })
            .range(from, to);
        
        if(error) throw error;
        if(!data || !data.length) return res.status(200).json([]);

        const marketData = data.map((item:any) => {
            const rawOptions = item.option || [];
            const sortedOptions = rawOptions.sort((a:any, b:any) => b.probability - a.probability);
            const topOptions = sortedOptions.slice(0, 2);

            const otherOptions = sortedOptions.slice(2);
            const otherProbability = otherOptions.reduce((sum:number, opt:any) => sum + opt.probability, 0);

            const finalOptions = [...topOptions];
            if(otherProbability > 0.01){
                finalOptions.push({
                    id: 'other',
                    name: 'other',
                    probability: otherProbability
                });
            }

            return {
                id: item.id,
                title: item.title,
                image: item.image_url,
                category: item.category,
                endDate: item.end_date,
                status: item.status,
                total_volume: Number(item.total_volume) || 0,
                volume: Number(item.total_volume) || 0,
                options: finalOptions
            }
        });

        return res.status(200).json( marketData );
    } catch(error:any){
        console.error('getAllMarkets failed', error);
        res.status(500).json({ error: INTERNAL_SERVER_ERROR_MESSAGE });
    }
};

// GET /trending - Get trending markets (home page)
export const getTrendingMarkets = async(req:Request, res:Response) => {
    const page = parseInt(req.query.page as string) || 0;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const { from, to } = getPaginationRange(page, limit);

    try {
        const { data, error } = await supabase
            .from('market_24h_stats')
            .select(`
                volume_24h,
                market:markets(
                    *,
                    options: market_options!market_options_market_id_fkey(
                        id, 
                        name, 
                        probability
                    )
                )
            `)
            .order('volume_24h', { ascending: false })
            .range(from, to);
        
        if(error) throw error;
        if(!data || !data.length) return res.status(200).json([]);

        const marketData = data.map((item:any) => {
            const market = item.market;
            const rawOptions = market.options || [];

            const sortedOptions = rawOptions.sort((a: any, b: any) => b.probability - a.probability);
            const topOptions = sortedOptions.slice(0, 2);

            const otherOptions = sortedOptions.slice(2);
            const otherProbability = otherOptions.reduce((sum: number, opt: any) => sum + opt.probability, 0);

            const finalOptions = [...topOptions];
            if (otherProbability > 0.01) {
                finalOptions.push({
                    id: 'other',
                    name: 'Other',
                    probability: otherProbability
                });
            }

            return {
                id: market.id,
                title: market.title,
                image: market.image_url,
                category: market.category,
                endDate: market.end_date,
                status: market.status,
                volume: market.total_volume || 0,
                options: finalOptions
            }
        });

        return res.status(200).json(marketData);
    
    } catch(error: any){
        console.error('getTrendingMarkets failed', error);
        res.status(500).json({ error: INTERNAL_SERVER_ERROR_MESSAGE });
    }
};

// GET /category/:category - Get market by category
export const getMarketByCategory = async(req:Request, res:Response) => {
    const category = (req.params.category as string)?.toUpperCase();    
    if(!category) return res.status(400).json({ error: "Please select a category" });

    const page = parseInt(req.query.page as string) || 0;
    const limit = parseInt(req.query.limit as string) || 10;

    const { from, to } = getPaginationRange(page, limit);

    try {
        const { data, error } = await supabase
            .from('markets')
            .select(`
                *,
                options: market_options!market_options_market_id_fkey(
                    id,
                    name,
                    probability
                )
            `)
            .eq('category', category)
            .in('category', MARKET_CATEGORIES)
            .in('status', [...PUBLIC_MARKET_STATUSES])
            .order('created_at', { ascending: false })
            .range(from, to);

        if(error) throw error;
        if(!data || !data.length) return res.status(404).json({ error: "Category is empty" });

        const marketData = data.map((market:any) => {
            const rawOptions = market.options || [];

            const sortedOptions = rawOptions.sort((a: any, b: any) => b.probability - a.probability);
            const topOptions = sortedOptions.slice(0, 2);

            const otherOptions = sortedOptions.slice(2);
            const otherProbability = otherOptions.reduce((sum: number, opt: any) => sum + opt.probability, 0);

            const finalOptions = [...topOptions];
            if (otherProbability > 0.01) {
                finalOptions.push({
                    id: 'other',
                    name: 'Other',
                    probability: otherProbability
                });
            }

            return {
                id: market.id,
                title: market.title,
                image: market.image_url,
                category: market.category,
                endDate: market.end_date,
                status: market.status,
                volume: market.total_volume,
                options: finalOptions
            }
        });

        return res.status(200).json(marketData);
    } catch(error:any){
        console.error('getMarketByCategory failed', error);
        return res.status(500).json({ error: INTERNAL_SERVER_ERROR_MESSAGE });
    }
};

// GET /resolved - Get resolved markets
export const getResolvedMarkets = async(req:Request, res:Response) => {
    const page = parseInt(req.query.page as string) || 0;
    const limit = parseInt(req.query.limit as string) || 10;

    const { from, to } = getPaginationRange(page, limit);

    try {
        const { data, error } = await supabase
            .from('markets')
            .select(`
                *,
                option: market_options!market_options_market_id_fkey(
                    id,
                    name,
                    probability
                )
            `)
            .eq('status', 'finalized')
            .order('resolved_at', { ascending: false })
            .range(from, to);

        if(error) throw error;
        if(!data || !data.length) return res.status(200).json([]);

        const marketData = data.map((item:any) => {
            const rawOptions = item.option || [];
            const sortedOptions = rawOptions.sort((a:any, b:any) => b.probability - a.probability);
            const topOptions = sortedOptions.slice(0, 2);

            const otherOptions = sortedOptions.slice(2);
            const otherProbability = otherOptions.reduce((sum:number, opt:any) => sum + opt.probability, 0);

            const finalOptions = [...topOptions];
            if(otherProbability > 0.01){
                finalOptions.push({
                    id: 'other',
                    name: 'other',
                    probability: otherProbability
                });
            }

            return {
                id: item.id,
                title: item.title,
                image: item.image_url,
                image_url: item.image_url,
                category: item.category,
                endDate: item.end_date,
                end_date: item.end_date,
                status: item.status,
                total_volume: Number(item.total_volume) || 0,
                volume: Number(item.total_volume) || 0,
                options: finalOptions,
                resolved_option_id: item.resolved_option_id,
                resolution_evidence_url: item.resolution_evidence_url,
                resolution_note: item.resolution_note,
                resolved_at: item.resolved_at,
                description: item.description,
            }
        });

        return res.status(200).json( marketData );
    } catch(error:any){
        console.error('getResolvedMarkets failed', error);
        res.status(500).json({ error: INTERNAL_SERVER_ERROR_MESSAGE });
    }
};

// GET /:id - Get market by ID
export const getMarketById = async(req:Request, res:Response) => {
    try {
        const { id } = req.params;
        const parsedId = Number(id);
        if (!Number.isInteger(parsedId) || parsedId <= 0) {
            return res.status(400).json({ error: 'Invalid market id' });
        }

        const { data, error } = await supabase
            .from('markets')
            .select(`
                *,
                options: market_options!market_options_market_id_fkey(
                    *
                )
            `)
            .eq('id', parsedId)
            .in('status', [...PUBLIC_MARKET_STATUSES])
            .maybeSingle();

        if(error) throw error;

        if(!data) return res.status(404).json({ error: "Market not found or not visible." });

        return res.status(200).json({ data });
    } catch(error:any){
        console.error('getMarketById failed', error);
        return res.status(500).json({ error: INTERNAL_SERVER_ERROR_MESSAGE });
    }
};

// GET /search - Search markets with filters
export const searchMarket = async(req:Request, res:Response) => {
    const search = req.query.search as string;
    const category = req.query.category as string;
    const status = req.query.status as string;
    const sort = req.query.sort as string;
    const isAscending = req.query.isAscending === 'true';

    const page = parseInt(req.query.page as string) || 0;
    const limit = parseInt(req.query.limit as string) || 10;

    const { from, to } = getPaginationRange(page, limit);   
    try {
        let query = supabase
            .from('markets')
            .select(`
                *,
                options: market_options!market_options_market_id_fkey(
                    id,
                    name,
                    probability
                )
            `, { count: "exact" });

        const sanitizedSearch = typeof search === 'string' ? sanitizeSearchTerm(search) : '';
        if(sanitizedSearch) {
            query = query.or(`title.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%`);
        }
        if(category) query = query.eq('category', category.toUpperCase());
        if(status) query = query.eq('status', status.toLowerCase());
        else query = query.eq('status', 'active');
        switch(sort){
            case 'volume': query = query.order('total_volume', { ascending: isAscending }); break;
            case 'end_date': query = query.order('end_date', { ascending: isAscending }); break;
            default: query = query.order('created_at', { ascending: false }); break;
        }

        const { data, count, error } = await query.range(from, to);
        if(error) throw error;

        const marketData = data.map((market: any) => {
            const rawOptions = market.options || [];
            const sortedOptions = rawOptions.sort((a: any, b: any) => b.probability - a.probability);
            const topOptions = sortedOptions.slice(0, 2);

            const otherOptions = sortedOptions.slice(2);
            const otherProbability = otherOptions.reduce((sum: number, opt: any) => sum + opt.probability, 0);

            const finalOptions = [...topOptions];
            if (otherProbability > 0.01) {
                finalOptions.push({
                    id: 'other',
                    name: 'Other',
                    probability: otherProbability
                });
            }

            return {
                id: market.id,
                title: market.title,
                image: market.image_url,
                category: market.category,
                endDate: market.end_date,
                status: market.status,
                volume: market.total_volume || 0,
                options: finalOptions
            };
        });

        return res.status(200).json({
            data: marketData,
            meta: {
                total_records: count,
                current_page: page,
                total_pages: count ? Math.ceil(count / limit) : 0,
                has_next_page: count ? ((page + 1) * limit) < count : false
            }
        });
    } catch(error:any){
        console.error('searchMarket failed', error);
        return res.status(500).json({ error: INTERNAL_SERVER_ERROR_MESSAGE });
    }
};

// GET /markets/created?userId=&status=&page=&limit= - Markets created by a user
export const getCreatedMarkets = async(req: AuthRequest, res: Response) => {
    try {
        const fallbackUserId = req.user?.id;
        const routeUserId = typeof req.params.userId === 'string' ? req.params.userId.trim() : '';
        const queryUserId = typeof req.query.userId === 'string' ? req.query.userId.trim() : '';
        const userId = routeUserId || queryUserId || fallbackUserId;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const page = parseInt(req.query.page as string, 10) || 0;
        const limit = parseInt(req.query.limit as string, 10) || 10;
        const { from, to } = getPaginationRange(page, limit);

        const statusRaw = typeof req.query.status === 'string' ? req.query.status.trim().toLowerCase() : '';
        const requestedStatuses = statusRaw
            ? statusRaw.split(',').map((value) => value.trim()).filter(Boolean)
            : [];

        if (requestedStatuses.some((value) => !CREATED_MARKET_STATUSES.includes(value as typeof CREATED_MARKET_STATUSES[number]))) {
            return res.status(400).json({
                error: `Invalid status filter. Allowed: ${CREATED_MARKET_STATUSES.join(', ')}`,
            });
        }

        let query = supabase
            .from('markets')
            .select('id, title, category, status, end_date, created_at, total_volume', { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (requestedStatuses.length > 0) {
            query = query.in('status', requestedStatuses);
        }

        const { data, count, error } = await query.range(from, to);
        if (error) {
            throw error;
        }

        const normalized = (data || []).map((market: any) => ({
            id: Number(market.id),
            title: typeof market.title === 'string' ? market.title : '',
            category: typeof market.category === 'string' ? market.category : '',
            status: typeof market.status === 'string' ? market.status : 'pending',
            endDate: market.end_date,
            createdAt: market.created_at,
            totalVolume: Number(market.total_volume) || 0,
        }));

        return res.status(200).json({
            data: normalized,
            meta: {
                total_records: count || 0,
                current_page: page,
                total_pages: count ? Math.ceil(count / limit) : 0,
                has_next_page: count ? ((page + 1) * limit) < count : false,
            },
        });
    } catch (error: any) {
        console.error('getCreatedMarkets failed', error);
        return res.status(500).json({ error: INTERNAL_SERVER_ERROR_MESSAGE });
    }
};

// POST /create - Adds market to pending for admin's approval
export const createMarket = async(req:AuthRequest, res:Response) => {
    try {
        const userId = req.user.id;
        const {
            title,
            description,
            imageUrl,
            category,
            endDate,
            options
        } = req.body;

        if(typeof title !== 'string' || !title.trim()) return res.status(400).json({ error: 'Missing required field: title' });
        if(typeof description !== 'string' || !description.trim()) return res.status(400).json({ error: 'Missing required field: description' });
        if(typeof category !== 'string' || !category.trim()) return res.status(400).json({ error: 'Missing required field: category' });
        if(typeof endDate !== 'string' || !endDate.trim()) return res.status(400).json({ error: 'Missing required field: endDate' });

        if(!MARKET_CATEGORIES.includes(category.toUpperCase() as typeof MARKET_CATEGORIES[number])) {
            return res.status(400).json({ error: 'Invalid category' });
        }

        if(Number.isNaN(new Date(endDate).getTime())) {
            return res.status(400).json({ error: 'Invalid resolution date' });
        }

        if(!options || options.length<2) return res.status(400).json({ error: "You must provide atleast 2 options." });
        if(!Array.isArray(options) || options.some((option:string) => typeof option !== 'string' || !option.trim())) {
            return res.status(400).json({ error: 'Options must be non-empty strings.' });
        }

        const { data:market, error:marketError } = await supabase
            .from('markets')
            .insert({
                title: title.trim(),
                description: description.trim(),
                image_url: imageUrl,
                category: category.toUpperCase(),
                end_date: endDate,
                user_id: userId,
                status: 'pending' 
            })
            .select()
            .single();

        if(marketError) throw marketError;

        const initialProbability = 100/options.length;
        const initialPrice = 1.00/options.length;

        const marketOptions = options.map((optName: string) => ({
            market_id: market.id,
            name: optName,
            current_price: initialPrice,
            probability: initialProbability,
            total_shares_outstanding: 0,
            volume: 0
        }));

        const { error:optionsError } = await supabase
            .from('market_options')
            .insert(marketOptions);

        if(optionsError) throw optionsError;

        res.status(201).json({
            message: 'Market submitted and is pending admin approval. It will be visible once approved.',
            marketId: market.id
        }); 
    } catch(error:any){
        console.error('createMarket failed', error);
        return res.status(500).json({ error: INTERNAL_SERVER_ERROR_MESSAGE });
    }
};

// POST /review - Admin approves/rejects market for posting
export const reviewMarket = async(req:AuthRequest, res:Response) => {
    try {
        const { id } = req.params;
        const { action } = req.body || {}; // 'approve', 'reject'

        if(!action) return res.status(400).json({ error: "Missing \'action\' in request body." });

        const validActions = ['approve', 'reject'];
        if(!validActions.includes(action)) return res.status(400).json({ error: "Invalid action. Use \"approve\" or \"reject\"."});

        const newStatus = action === 'approve' ? 'active' : 'rejected';
        
        const { data, error } = await supabase
            .from('markets')
            .update({ status: newStatus })
            .eq('id', id)
            .select()
            .single();
            
        if(error) throw error;

        const messageStatus = action === 'approve' ? 'approved' : 'rejected';    
        return res.status(200).json({
            message: `Market has been ${messageStatus}`,
            market: data
        });
    } catch(error:any){
        console.error('reviewMarket failed', error);
        return res.status(500).json({ error: INTERNAL_SERVER_ERROR_MESSAGE });
    }
};

// GET /:id/history?timeframe=5m|1h|1d|1w - Market chart history by timeframe
export const getMarketHistory = async(req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const parsedId = Number(id);
        if (!Number.isInteger(parsedId) || parsedId <= 0) {
            return res.status(400).json({ error: 'Invalid market id' });
        }

        const optionIdRaw = req.query.optionId;
        const selectedOptionId = optionIdRaw === undefined || optionIdRaw === null || String(optionIdRaw).trim() === ''
            ? null
            : Number(optionIdRaw);
        if (selectedOptionId !== null && (!Number.isInteger(selectedOptionId) || selectedOptionId <= 0)) {
            return res.status(400).json({ error: 'Invalid optionId' });
        }

        const timeframeRaw = String(req.query.timeframe ?? '1d').toLowerCase();
        if (!(timeframeRaw in HISTORY_BUCKET_STEPS)) {
            return res.status(400).json({ error: 'Invalid timeframe. Use 5m, 1h, 1d, or 1w.' });
        }

        const timeframe = timeframeRaw as HistoryTimeframe;
        const nowMs = Date.now();
        const alignedNowMs = getAlignedNowMs(timeframe, nowMs);
        const stepMs = HISTORY_BUCKET_STEPS[timeframe];
        const rangeDurationMs = stepMs * Math.max(1, HISTORY_TARGET_POINTS - 1);
        const rangeStartMs = alignedNowMs - rangeDurationMs;
        const sinceIso = new Date(rangeStartMs).toISOString();

        const { data: optionsData, error: optionsError } = await supabaseAdmin
            .from('market_options')
            .select('id, probability, current_price')
            .eq('market_id', parsedId);

        if (optionsError) {
            throw optionsError;
        }

        const optionRows = (optionsData || []) as Array<{ id: number | string; probability: number | null; current_price: number | null }>;
        if (optionRows.length === 0) {
            return res.status(404).json({ error: 'Market not found or has no options.' });
        }

        const optionIds = optionRows
            .map((row) => Number(row.id))
            .filter((optionId) => Number.isInteger(optionId) && optionId > 0);

        if (selectedOptionId !== null && !optionIds.includes(selectedOptionId)) {
            return res.status(404).json({ error: 'Option not found in market.' });
        }

        const scopedOptionIds = selectedOptionId !== null ? [selectedOptionId] : optionIds;

        const beforeStartQuery = supabaseAdmin
            .from('transactions')
            .select('created_at, price_at_time, market_option_id')
            .in('market_option_id', scopedOptionIds)
            .lt('created_at', sinceIso)
            .order('created_at', { ascending: false })
            .limit(1);

        const { data: beforeStartData, error: beforeStartError } = await beforeStartQuery;
        if (beforeStartError) {
            throw beforeStartError;
        }

        const { data: transactionsData, error: transactionsError } = await supabaseAdmin
            .from('transactions')
            .select('created_at, price_at_time, market_option_id')
            .in('market_option_id', scopedOptionIds)
            .gte('created_at', sinceIso)
            .order('created_at', { ascending: true });

        if (transactionsError) {
            throw transactionsError;
        }

        const transactionPoints = ((transactionsData || []) as Array<{ created_at: string | null; price_at_time: number | null; market_option_id: number | string | null }>)
            .map((row) => {
                if (!row.created_at) {
                    return null;
                }

                const ts = new Date(row.created_at).toISOString();
                const probability = normalizeProbabilityPercent(row.price_at_time);
                const timestamp = new Date(ts).getTime();
                if (Number.isNaN(timestamp)) {
                    return null;
                }

                return {
                    timestamp,
                    ts,
                    probability,
                };
            })
            .filter((point): point is { timestamp: number; ts: string; probability: number } => Boolean(point));

        const selectedOptionRow = selectedOptionId !== null
            ? optionRows.find((row) => Number(row.id) === selectedOptionId)
            : null;
        const topOption = optionRows
            .slice()
            .sort((a, b) => Number(b.probability ?? 0) - Number(a.probability ?? 0))[0];
        const baselineSource = selectedOptionRow ?? topOption;

        let currentProbability = normalizeProbabilityPercent(
            (beforeStartData?.[0] as { price_at_time?: number | null } | undefined)?.price_at_time
                ?? baselineSource?.probability
                ?? baselineSource?.current_price
                ?? 0
        );

        const bucketedPoints: Array<{ ts: string; probability: number }> = [];
        let txIndex = 0;

        for (let i = 0; i < HISTORY_TARGET_POINTS; i += 1) {
            const bucketTime = Math.round(rangeStartMs + stepMs * i);

            while (txIndex < transactionPoints.length) {
                const currentPoint = transactionPoints[txIndex];
                if (!currentPoint || currentPoint.timestamp > bucketTime) {
                    break;
                }

                currentProbability = normalizeProbabilityPercent(currentPoint.probability);
                txIndex += 1;
            }

            bucketedPoints.push({
                ts: new Date(bucketTime).toISOString(),
                probability: clampProbabilityPercent(currentProbability),
            });
        }

        const points = bucketedPoints.length > 0
            ? bucketedPoints
            : [{ ts: new Date(alignedNowMs).toISOString(), probability: clampProbabilityPercent(currentProbability) }];

        return res.status(200).json({
            data: {
                market_id: String(parsedId),
                option_id: selectedOptionId !== null ? String(selectedOptionId) : null,
                timeframe,
                points,
            },
        });
    } catch (error: any) {
        console.error('getMarketHistory failed', error);
        return res.status(500).json({ error: INTERNAL_SERVER_ERROR_MESSAGE });
    }
};