import crypto from "crypto";
import { Response } from "express";
import { AuthRequest } from "../types/authRequest";
import { supabaseAdmin } from "../config/supabaseClient";
import * as notificationDbService from "../services/notificationDbService";

type Platform = "ios" | "android" | "web";
type NotificationType = "market" | "leaderboard" | "profile";

type NotificationRegistration = {
  user_id: string;
  device_token: string;
  platform: Platform;
  updated_at: string;
};

const registrations = new Map<string, NotificationRegistration>();

const PLATFORM_SET: Platform[] = ["ios", "android", "web"];
const TYPE_SET: NotificationType[] = ["market", "leaderboard", "profile"];

const ensureInt = (value: unknown): number | null => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
};

const buildTargetPath = (type: NotificationType, payload: Record<string, unknown>): string | null => {
  if (type === "market") {
    const marketId = ensureInt(payload.marketId);
    if (!marketId) {
      return null;
    }
    return `/marketDetails?id=${marketId}`;
  }

  if (type === "leaderboard") {
    return "/tabs/leaderboard";
  }

  if (type === "profile") {
    const profileUserId = typeof payload.profileUserId === "string" ? payload.profileUserId.trim() : "";
    if (!profileUserId) {
      return "/tabs/profile";
    }
    return `/tabs/profile?userId=${encodeURIComponent(profileUserId)}`;
  }

  return null;
};

const signTarget = (recipientUserId: string, type: NotificationType, targetPath: string): string => {
  const secret = process.env.NOTIFICATION_SIGNING_SECRET || "dev-notification-secret";
  return crypto
    .createHmac("sha256", secret)
    .update(`${recipientUserId}:${type}:${targetPath}`)
    .digest("hex");
};

export const registerNotificationChannel = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const rawToken = typeof req.body?.deviceToken === "string" ? req.body.deviceToken.trim() : "";
  const rawPlatform = typeof req.body?.platform === "string" ? req.body.platform.trim().toLowerCase() : "";

  if (!rawToken || rawToken.length > 2048) {
    return res.status(400).json({ error: "Invalid deviceToken" });
  }

  if (!PLATFORM_SET.includes(rawPlatform as Platform)) {
    return res.status(400).json({ error: "Invalid platform" });
  }

  const registration: NotificationRegistration = {
    user_id: userId,
    device_token: rawToken,
    platform: rawPlatform as Platform,
    updated_at: new Date().toISOString(),
  };

  registrations.set(userId, registration);

  return res.status(200).json({
    message: "Notification channel registered",
    registration: {
      user_id: registration.user_id,
      device_token: registration.device_token,
      platform: registration.platform,
    },
  });
};

export const triggerNotification = async (req: AuthRequest, res: Response) => {
  const actorId = req.user?.id;
  if (!actorId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const type = typeof req.body?.type === "string" ? req.body.type.trim().toLowerCase() : "";
  const recipientUserId = typeof req.body?.recipientUserId === "string" ? req.body.recipientUserId.trim() : "";
  const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
  const body = typeof req.body?.body === "string" ? req.body.body.trim() : "";

  if (!TYPE_SET.includes(type as NotificationType)) {
    return res.status(400).json({ error: "Invalid notification type" });
  }

  if (!recipientUserId) {
    return res.status(400).json({ error: "Invalid recipientUserId" });
  }

  if (!title || !body || title.length > 120 || body.length > 280) {
    return res.status(400).json({ error: "Invalid notification message" });
  }

  const targetPath = buildTargetPath(type as NotificationType, req.body ?? {});
  if (!targetPath) {
    return res.status(400).json({ error: "Invalid notification target" });
  }

  const targetSignature = signTarget(recipientUserId, type as NotificationType, targetPath);

  return res.status(202).json({
    notification: {
      type,
      recipient_user_id: recipientUserId,
      title,
      body,
      target_path: targetPath,
      target_signature: targetSignature,
    },
  });
};

// ─── New notification endpoints ──────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const page = Math.max(0, parseInt(req.query.page as string, 10) || 0);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));

    const { data, count, error } = await notificationDbService.getNotifications(userId, page, limit);

    if (error) {
      console.error('getNotifications failed', error);
      return res.status(500).json({ error: 'Internal server error' });
    }

    const totalPages = Math.ceil(count / limit);

    return res.status(200).json({
      data: data || [],
      meta: {
        total_records: count,
        current_page: page,
        total_pages: totalPages,
        has_next_page: page + 1 < totalPages,
      },
    });
  } catch (error) {
    console.error('getNotifications failed', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const id = req.body?.id || req.params?.id;
    if (typeof id !== 'string' || !UUID_RE.test(id)) {
      return res.status(400).json({ error: 'Invalid notification id' });
    }

    const { data, error } = await notificationDbService.markAsRead(id, userId);

    if (error) {
      console.error('markAsRead failed', error);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    return res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('markAsRead failed', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const markAllAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { error } = await notificationDbService.markAllAsRead(userId);

    if (error) {
      console.error('markAllAsRead failed', error);
      return res.status(500).json({ error: 'Internal server error' });
    }

    return res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('markAllAsRead failed', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { count, error } = await notificationDbService.getUnreadCount(userId);

    if (error) {
      console.error('getUnreadCount failed', error);
      return res.status(500).json({ error: 'Internal server error' });
    }

    return res.status(200).json({ count });
  } catch (error) {
    console.error('getUnreadCount failed', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const sendAdminNotification = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';
    const body = typeof req.body?.body === 'string' ? req.body.body.trim() : '';

    if (!title || title.length > 120) {
      return res.status(400).json({ error: 'Title is required and must be 120 characters or less' });
    }

    if (!body || body.length > 280) {
      return res.status(400).json({ error: 'Body is required and must be 280 characters or less' });
    }

    const targetUserId = typeof req.body?.targetUserId === 'string' ? req.body.targetUserId.trim() : '';

    if (targetUserId) {
      // Send to single user
      const { data, error } = await notificationDbService.insertNotifications([
        {
          user_id: targetUserId,
          type: 'profile',
          title,
          body,
          target_path: '/tabs/profile',
        },
      ]);

      if (error) {
        console.error('sendAdminNotification failed', error);
        return res.status(500).json({ error: 'Internal server error' });
      }

      return res.status(200).json({ message: 'Admin notification sent', count: data?.length ?? 0 });
    }

    // Broadcast to all users
    const { data: allUsers, error: userError } = await supabaseAdmin
      .from('users')
      .select('id');

    if (userError) {
      console.error('sendAdminNotification: failed to fetch users', userError);
      return res.status(500).json({ error: 'Internal server error' });
    }

    const userIds = (allUsers as { id: string }[] | null) || [];
    if (userIds.length === 0) {
      return res.status(200).json({ message: 'No users to notify', count: 0 });
    }

    const notifications = userIds.map((u) => ({
      user_id: u.id,
      type: 'profile' as const,
      title,
      body,
      target_path: '/tabs/profile',
    }));

    const { data, error } = await notificationDbService.insertNotifications(notifications);

    if (error) {
      console.error('sendAdminNotification failed', error);
      return res.status(500).json({ error: 'Internal server error' });
    }

    return res.status(200).json({ message: 'Admin notification sent', count: data?.length ?? 0 });
  } catch (error) {
    console.error('sendAdminNotification failed', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
