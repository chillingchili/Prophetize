-- Migration: push_tokens table for Expo Push Notification tokens
-- Stores device push tokens per user for sending push notifications

CREATE TABLE IF NOT EXISTS public.push_tokens (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token text NOT NULL,
    platform text NOT NULL CHECK (platform IN ('ios', 'android')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE (user_id, token)
);

CREATE INDEX idx_push_tokens_user_id ON public.push_tokens (user_id);
CREATE INDEX idx_push_tokens_token ON public.push_tokens (token);
