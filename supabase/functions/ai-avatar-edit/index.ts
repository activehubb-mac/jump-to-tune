import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: Record<string, unknown>) => {
  console.log(`[AI-AVATAR-EDIT] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

const EDIT_COSTS: Record<string, number> = { quick: 10, style: 15, full: 25 };

const STYLE_MAP: Record<string, string> = {
  realistic: "photorealistic professional artist portrait with studio lighting, sharp detail, editorial quality",
  futuristic: "futuristic sci-fi artist portrait with holographic elements, neon lighting, chrome accents",
  animated: "high-quality animated character portrait in modern animation style, vibrant colors",
  cyberpunk: "cyberpunk artist portrait with neon city reflections, augmented reality overlays, dark dystopian mood",
  luxury: "luxury editorial fashion portrait, high-end magazine quality, dramatic lighting, elegant composition",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    log("Function started");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");
    const userId = userData.user.id;

    const body = await req.json();
    const {
      edit_mode,
      identity_id,
      accessories,
      background,
      output_style,
      photo_base64,
      preserve_likeness,
      hd,
    } = body;

    if (!edit_mode || !EDIT_COSTS[edit_mode]) throw new Error("Invalid edit_mode");
    if (!identity_id) throw new Error("identity_id required");

    const creditCost = EDIT_COSTS[edit_mode];
    log("Credit cost", { edit_mode, creditCost });

    // Verify identity ownership
    const { data: identity, error: idErr } = await supabase
      .from("artist_identities")
      .select("id, avatar_url, visual_theme, settings")
      .eq("id", identity_id)
      .eq("user_id", userId)
      .single();

    if (idErr || !identity) throw new Error("Identity not found or not owned by user");
    if (!identity.avatar_url && edit_mode !== "full") {
      throw new Error("No existing avatar to edit. Use Full Recreate mode.");
    }

    // Deduct credits
    const { data: deductResult } = await supabase.rpc("deduct_ai_credits", {
      p_user_id: userId,
      p_credits: creditCost,
    });

    if (!deductResult?.success) {
      return new Response(JSON.stringify({
        error: `Need ${creditCost} credits, have ${deductResult?.current_credits ?? 0}.`,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 402 });
    }

    await supabase.from("ai_credit_usage").insert({
      user_id: userId,
      action: "avatar_edit",
      credits_used: creditCost,
      metadata: { edit_mode, identity_id, output_style, hd },
    });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const refundCredits = async () => {
      await supabase.rpc("add_ai_credits", { p_user_id: userId, p_credits: creditCost });
    };

    let editPrompt: string;
    let sourceImageUrl = identity.avatar_url;
    let useImageEdit = true;

    if (edit_mode === "quick") {
      // Quick Edit: accessories/background only, preserve face completely
      const accPart = accessories ? `Add these accessories: ${accessories}.` : "";
      const bgPart = background ? `Change the background to: ${background}.` : "";
      editPrompt = `Make minor adjustments to this artist portrait. ${accPart} ${bgPart} IMPORTANT: Preserve the person's face, expression, and overall appearance exactly. Only modify accessories and background as specified. Professional quality, no text.`;
    } else if (edit_mode === "style") {
      // Style Shift: full aesthetic change, maintain likeness
      const styleDesc = STYLE_MAP[output_style] || STYLE_MAP.realistic;
      const accPart = accessories ? `Include accessories: ${accessories}.` : "";
      editPrompt = `Transform this artist portrait into a completely new aesthetic style: ${styleDesc}. ${accPart} Maintain recognizable likeness and facial features while applying dramatic style transformation. Professional quality, album-ready, no text, square format.`;
    } else {
      // Full Recreate
      if (photo_base64) {
        sourceImageUrl = photo_base64;
      }
      const styleDesc = STYLE_MAP[output_style] || STYLE_MAP.realistic;
      const likenessInstruction = preserve_likeness === "high"
        ? "Preserve facial features accurately."
        : preserve_likeness === "low"
          ? "Use appearance as loose inspiration."
          : "Maintain recognizable resemblance with artistic stylization.";
      const accPart = accessories ? `Include accessories: ${accessories}.` : "";
      const bgPart = background ? `Background: ${background}.` : "";
      editPrompt = `Create a premium artist identity portrait. Style: ${styleDesc}. ${likenessInstruction} ${accPart} ${bgPart} Editorial quality, music industry branding, no text, square format.`;

      if (!photo_base64 && !identity.avatar_url) {
        useImageEdit = false;
      }
    }

    const imageModel = hd ? "google/gemini-3-pro-image-preview" : "google/gemini-2.5-flash-image";

    let imgPayload: any;
    if (useImageEdit && sourceImageUrl) {
      imgPayload = {
        model: imageModel,
        messages: [{
          role: "user",
          content: [
            { type: "text", text: editPrompt },
            { type: "image_url", image_url: { url: sourceImageUrl } },
          ],
        }],
        modalities: ["image", "text"],
      };
    } else {
      imgPayload = {
        model: imageModel,
        messages: [{ role: "user", content: editPrompt }],
        modalities: ["image", "text"],
      };
    }

    const imgResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(imgPayload),
    });

    if (!imgResp.ok) {
      log("Image generation failed", { status: imgResp.status });
      await refundCredits();
      return new Response(JSON.stringify({ error: "AI image generation failed. Credits refunded." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
      });
    }

    const imgData = await imgResp.json();
    const avatarBase64 = imgData.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;

    if (!avatarBase64) {
      await refundCredits();
      return new Response(JSON.stringify({ error: "AI did not return an image. Credits refunded." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
      });
    }

    // Save version to identity_versions
    const { data: version, error: versionErr } = await supabase
      .from("identity_versions")
      .insert({
        identity_id,
        user_id: userId,
        avatar_url: avatarBase64,
        edit_mode,
        settings: { output_style, preserve_likeness, accessories, background, hd },
      })
      .select("id")
      .single();

    if (versionErr) {
      log("Version save failed", { error: versionErr.message });
    }

    return new Response(JSON.stringify({
      avatar_image: avatarBase64,
      version_id: version?.id || null,
      edit_mode,
      credits_used: creditCost,
      credits_remaining: deductResult.new_credits,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500,
    });
  }
});
