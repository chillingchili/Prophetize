import { supabaseAdmin } from '../config/supabaseClient';

const EXPO_PUSH_API = 'https://exp.host/--/api/v2/push/send';

type ExpoPushMessage = {
  to: string;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
  priority?: 'default' | 'normal' | 'high';
};

export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<{ status: string; message?: string }> {
  const message: ExpoPushMessage = {
    to: token,
    title,
    body,
    ...(data !== undefined ? { data } : {}),
    sound: 'default',
    priority: 'high',
  };

  try {
    const response = await fetch(EXPO_PUSH_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();

    if (result.data?.[0]?.status === 'error') {
      const error = result.data[0];
      if (error.details?.error === 'DeviceNotRegistered') {
        await removePushToken(token);
      }
      return { status: 'error', message: error.message };
    }

    return { status: 'ok' };
  } catch (err) {
    console.error('pushNotificationService: send failed', err);
    return { status: 'error', message: String(err) };
  }
}

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<{ sent: number; failed: number }> {
  const { data: tokens, error } = await supabaseAdmin
    .from('push_tokens')
    .select('token, platform')
    .eq('user_id', userId);

  if (error || !tokens || tokens.length === 0) {
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  for (const row of tokens as { token: string; platform: string }[]) {
    const result = await sendPushNotification(row.token, title, body, data);
    if (result.status === 'ok') {
      sent++;
    } else {
      failed++;
    }
  }

  return { sent, failed };
}

export async function sendPushToMultipleUsers(
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<{ sent: number; failed: number }> {
  let totalSent = 0;
  let totalFailed = 0;

  for (const userId of userIds) {
    const result = await sendPushToUser(userId, title, body, data);
    totalSent += result.sent;
    totalFailed += result.failed;
  }

  return { sent: totalSent, failed: totalFailed };
}

async function removePushToken(token: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('push_tokens')
    .delete()
    .eq('token', token);

  if (error) {
    console.error('pushNotificationService: failed to remove invalid token', error);
  }
}

export async function registerPushToken(
  userId: string,
  token: string,
  platform: string
): Promise<{ error: unknown }> {
  const { error } = await supabaseAdmin.from('push_tokens').upsert(
    {
      user_id: userId,
      token,
      platform,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id, token' }
  );

  return { error };
}

export async function unregisterPushToken(
  userId: string,
  token: string
): Promise<{ error: unknown }> {
  const { error } = await supabaseAdmin
    .from('push_tokens')
    .delete()
    .eq('user_id', userId)
    .eq('token', token);

  return { error };
}

export async function unregisterAllPushTokens(userId: string): Promise<{ error: unknown }> {
  const { error } = await supabaseAdmin
    .from('push_tokens')
    .delete()
    .eq('user_id', userId);

  return { error };
}
