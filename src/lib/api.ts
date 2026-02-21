/**
 * JumTunes RESTful API Client
 *
 * Provides typed helpers for calling the unified /api edge function.
 * All responses follow: { success: boolean, data: T | null, error: string | null }
 */

import { supabase } from "@/integrations/supabase/client";

export type ApiResponse<T = any> = {
  success: boolean;
  data: T | null;
  error: string | null;
};

const SUPABASE_URL = "https://ezamzkycxqrstuznqaha.supabase.co";

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV6YW16a3ljeHFyc3R1em5xYWhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMTQ1MDQsImV4cCI6MjA4Mzg5MDUwNH0.fdXx5zzxS3NUw1RCHCyhl783qTws6lARgZs2GOaDn2k",
  };
  if (data.session?.access_token) {
    headers.Authorization = `Bearer ${data.session.access_token}`;
  }
  return headers;
}

async function request<T = any>(
  method: string,
  path: string,
  body?: any,
): Promise<ApiResponse<T>> {
  const headers = await getAuthHeaders();
  const url = `${SUPABASE_URL}/functions/v1/api/${path}`;
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

// ── Auth ────────────────────────────────────────────────────────────────────

export const api = {
  auth: {
    me: () => request("GET", "auth/me"),
  },

  // ── Follow ────────────────────────────────────────────────────────────
  artists: {
    follow: (artistId: string) => request("POST", `artists/${artistId}/follow`),
    unfollow: (artistId: string) =>
      request("DELETE", `artists/${artistId}/follow`),
    followers: (artistId: string) =>
      request("GET", `artists/${artistId}/followers`),
    announcements: (artistId: string) =>
      request("GET", `artist/${artistId}/announcements`),
  },

  // ── Drops ─────────────────────────────────────────────────────────────
  drops: {
    list: () => request("GET", "drops"),
    get: (id: string) => request("GET", `drops/${id}`),
    checkoutSession: (id: string) =>
      request("POST", `drops/${id}/checkout-session`),
  },

  // ── Artist drops management ───────────────────────────────────────────
  artistDrops: {
    list: () => request("GET", "artist/drops"),
    create: (body: {
      title: string;
      type: string;
      price_cents: number;
      description?: string;
      image_url?: string;
      audio_url?: string;
      inventory_limit?: number;
    }) => request("POST", "artist/drops", body),
    update: (id: string, body: Record<string, any>) =>
      request("PUT", `artist/drops/${id}`, body),
    activate: (id: string) => request("POST", `artist/drops/${id}/activate`),
  },

  // ── Waitlist ──────────────────────────────────────────────────────────
  waitlist: {
    join: (dropId: string) => request("POST", `drops/${dropId}/waitlist`),
    leave: (dropId: string) => request("DELETE", `drops/${dropId}/waitlist`),
    count: (dropId: string) =>
      request("GET", `drops/${dropId}/waitlist-count`),
  },

  // ── Announcements ────────────────────────────────────────────────────
  announcements: {
    create: (body: {
      title: string;
      body: string;
      image_url?: string;
      cta_label?: string;
      cta_url?: string;
    }) => request("POST", "artist/announcements", body),
    list: () => request("GET", "artist/announcements"),
    delete: (id: string) => request("DELETE", `artist/announcements/${id}`),
    react: (id: string, emoji: string) =>
      request("POST", `announcements/${id}/react`, { emoji }),
  },

  // ── Badges ────────────────────────────────────────────────────────────
  badges: {
    forUser: (userId: string) => request("GET", `users/${userId}/badges`),
  },

  // ── Messages ──────────────────────────────────────────────────────────
  messages: {
    inbox: () => request("GET", "messages/inbox"),
    send: (artistId: string, message: string) =>
      request("POST", "messages/send", { artist_id: artistId, message }),
  },

  // ── Analytics ─────────────────────────────────────────────────────────
  analytics: {
    overview: () => request("GET", "artist/analytics/overview"),
    drops: () => request("GET", "artist/analytics/drops"),
    supporters: () => request("GET", "artist/analytics/supporters"),
  },

  // ── Trending ──────────────────────────────────────────────────────────
  trending: () => request("GET", "trending"),

  // ── Admin ─────────────────────────────────────────────────────────────
  admin: {
    feature: (body: {
      content_id: string;
      content_type: string;
      display_location?: string;
      priority?: number;
    }) => request("POST", "admin/featured", body),
    analytics: () => request("GET", "admin/analytics"),
    moderate: (body: {
      report_id: string;
      status: string;
      admin_notes?: string;
    }) => request("POST", "admin/moderate", body),
  },
};
