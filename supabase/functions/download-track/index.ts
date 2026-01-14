import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[DOWNLOAD-TRACK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { trackId } = await req.json();
    if (!trackId) throw new Error("Track ID is required");
    logStep("Track ID received", { trackId });

    // Check if user owns the track
    const { data: purchase, error: purchaseError } = await supabaseClient
      .from("purchases")
      .select("*")
      .eq("user_id", user.id)
      .eq("track_id", trackId)
      .single();

    if (purchaseError || !purchase) {
      logStep("User does not own this track", { userId: user.id, trackId });
      throw new Error("You do not own this track. Please purchase it first.");
    }
    logStep("Ownership verified", { purchaseId: purchase.id });

    // Get track details to find audio URL
    const { data: track, error: trackError } = await supabaseClient
      .from("tracks")
      .select("audio_url, title")
      .eq("id", trackId)
      .single();

    if (trackError || !track) {
      throw new Error("Track not found");
    }
    logStep("Track found", { title: track.title });

    // Extract the path from the audio URL
    // Audio URL format: https://<project>.supabase.co/storage/v1/object/public/tracks/<path>
    const audioUrl = track.audio_url;
    let storagePath: string;

    if (audioUrl.includes("/storage/v1/object/public/tracks/")) {
      storagePath = audioUrl.split("/storage/v1/object/public/tracks/")[1];
    } else if (audioUrl.includes("/storage/v1/object/sign/tracks/")) {
      storagePath = audioUrl.split("/storage/v1/object/sign/tracks/")[1].split("?")[0];
    } else {
      // Assume it's just the path
      storagePath = audioUrl;
    }
    logStep("Storage path extracted", { storagePath });

    // Generate a signed URL for download (valid for 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await supabaseClient
      .storage
      .from("tracks")
      .createSignedUrl(storagePath, 3600, {
        download: `${track.title}.mp3`,
      });

    if (signedUrlError || !signedUrlData) {
      logStep("Error creating signed URL", { error: signedUrlError });
      throw new Error("Failed to generate download URL");
    }
    logStep("Signed URL created", { url: signedUrlData.signedUrl.substring(0, 50) + "..." });

    return new Response(JSON.stringify({ 
      downloadUrl: signedUrlData.signedUrl,
      filename: `${track.title}.mp3`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
