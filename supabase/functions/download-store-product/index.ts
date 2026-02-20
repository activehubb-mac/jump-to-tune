import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Not authenticated");

    const { productId } = await req.json();
    if (!productId) throw new Error("Missing productId");

    // Verify buyer has a completed order
    const { data: order, error: orderError } = await supabaseClient
      .from("store_orders")
      .select("id")
      .eq("product_id", productId)
      .eq("buyer_id", userData.user.id)
      .in("status", ["completed", "fulfilled", "shipped"])
      .limit(1)
      .single();

    if (orderError || !order) throw new Error("No completed order found for this product");

    // Get product audio URL
    const { data: product } = await supabaseClient
      .from("store_products")
      .select("audio_url")
      .eq("id", productId)
      .single();

    if (!product?.audio_url) throw new Error("No downloadable file for this product");

    // Generate signed URL (assumes audio stored in tracks bucket)
    const filePath = product.audio_url.replace(/.*\/storage\/v1\/object\/public\//, "");
    const bucket = filePath.split("/")[0];
    const path = filePath.split("/").slice(1).join("/");

    const { data: signedUrl, error: signError } = await supabaseClient.storage
      .from(bucket)
      .createSignedUrl(path, 300); // 5 min expiry

    if (signError || !signedUrl) throw new Error("Failed to generate download link");

    return new Response(JSON.stringify({ url: signedUrl.signedUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
