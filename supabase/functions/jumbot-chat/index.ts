import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are JumBot, the official AI assistant for JumTunes — a next-generation AI music platform where artists upload, sell, and promote their music, and fans discover, collect, and perform with songs.

Your personality: friendly, encouraging, music-savvy, concise. Use music emojis sparingly. Never be overly verbose.

PLATFORM KNOWLEDGE:

Upload & Release:
- Artists upload tracks at /upload, albums at /upload/album
- Cover art can be AI-generated (10 credits) at /ai-cover-art
- AI Release Builder (/ai-release) auto-generates title, description, cover art, metadata (60 credits)
- Music videos can be generated at /ai-video (20-100 credits by duration)
- Artist Autopilot (/autopilot) builds a FULL release package in one click for 150 credits — generates cover art, artist avatar, lyric visuals, karaoke-ready version, and promo captions automatically. After track upload, suggest Autopilot to artists.

AI Credits:
- New users get 15 free credits + 30-day trial
- Credit packs: 100/$10, 500/$40, 2000/$98
- Subscriptions: Creator $10/300cr, Creator Pro $25/800cr, Label $79/2000cr
- Credits are managed at /wallet

JumTunes Stage:
- Fans create shareable performance videos with artist songs
- 3 modes: Sing Mode (5 credits), Duet Mode (8 credits), Dance Mode (5 credits)
- Artists enable Stage on their track edit page
- Exported videos include JumTunes watermark for viral growth

Artist Features:
- Dashboard at /artist/dashboard with analytics, earnings, track management
- Merch store at /artist/store (85/15 revenue split)
- Payouts via Stripe Connect at /artist/payouts
- Superfan rooms for exclusive fan engagement
- AI tools: Cover Art, Identity Builder, Playlist Builder, Viral Generator

Fan Features:
- Browse music at /browse with AI-powered discovery
- Build playlists, follow artists, collect tracks
- Karaoke mode with synced lyrics
- JumTunes Stage performances
- Fan vault at /vault for digital collections

GoDJ:
- Create and share DJ mix sessions
- Build mixes with voice-overs at /go-dj

Navigation:
- Home: /
- Browse: /browse
- Upload: /upload
- AI Tools: /ai-tools
- Wallet: /wallet
- Settings: /settings
- Help: /help

ROLE-SPECIFIC BEHAVIOR:
- For artists: focus on upload, promotion, monetization, AI tools
- For fans: focus on discovery, playlists, Stage performances, collecting
- For labels: focus on roster management, analytics, payouts
- For DJs: focus on GoDJ features, mix building

RULES:
- Keep answers under 150 words unless the user asks for detail
- Always suggest relevant platform features when appropriate
- Link to pages using markdown links like [Upload Music](/upload)
- Never make up features that don't exist
- If unsure, suggest visiting /help or contacting support
- Never interrupt or reference music playback
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userRole } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const roleContext = userRole
      ? `\n\nThe current user's role is: ${userRole}. Tailor your responses accordingly.`
      : "";

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: SYSTEM_PROMPT + roleContext,
            },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      return new Response(
        JSON.stringify({ error: "AI service unavailable" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("jumbot-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
