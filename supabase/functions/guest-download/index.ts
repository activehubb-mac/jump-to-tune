import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[GUEST-DOWNLOAD] ${step}${detailsStr}`);
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
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (!token) throw new Error("Missing download token");

    logStep("Download requested", { token: token.slice(0, 8) + "..." });

    // Look up download record
    const { data: download, error: dlError } = await supabaseClient
      .from("store_downloads")
      .select("*")
      .eq("download_token", token)
      .single();

    if (dlError || !download) throw new Error("Invalid download link");

    // Check expiry
    if (download.expires_at && new Date(download.expires_at) < new Date()) {
      throw new Error("This download link has expired");
    }

    // Check download count
    if (download.download_count >= download.max_downloads) {
      throw new Error(`Download limit reached (${download.max_downloads} downloads)`);
    }

    // Generate signed URL for the file
    const fileUrl = download.download_url;
    const filePath = fileUrl.replace(/.*\/storage\/v1\/object\/(public|sign)\//, "");
    const bucket = filePath.split("/")[0];
    const path = filePath.split("/").slice(1).join("/");

    const { data: signedUrl, error: signError } = await supabaseClient.storage
      .from(bucket)
      .createSignedUrl(path, 600); // 10 min expiry

    if (signError || !signedUrl) throw new Error("Failed to generate download link");

    // Generate license URL if applicable
    let licenseSignedUrl: string | null = null;
    if (download.license_url) {
      const licensePath = download.license_url.replace(/.*\/storage\/v1\/object\/(public|sign)\//, "");
      const licenseBucket = licensePath.split("/")[0];
      const licenseFile = licensePath.split("/").slice(1).join("/");
      const { data: licSigned } = await supabaseClient.storage
        .from(licenseBucket)
        .createSignedUrl(licenseFile, 600);
      licenseSignedUrl = licSigned?.signedUrl || null;
    }

    // Increment download count
    await supabaseClient
      .from("store_downloads")
      .update({
        download_count: download.download_count + 1,
        last_download_at: new Date().toISOString(),
      })
      .eq("id", download.id);

    logStep("Download served", { downloadId: download.id, count: download.download_count + 1 });

    return new Response(
      JSON.stringify({
        url: signedUrl.signedUrl,
        license_url: licenseSignedUrl,
        downloads_remaining: download.max_downloads - download.download_count - 1,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
