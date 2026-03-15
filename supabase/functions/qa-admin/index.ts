import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Verify admin access
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await supabaseAdmin.auth.getUser(token);
    if (claimsError || !claims.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: corsHeaders });
    }

    const userId = claims.user.id;

    // Check admin role
    const { data: adminRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (!adminRole) {
      return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403, headers: corsHeaders });
    }

    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "create-test-user": {
        const role = body.role || "fan";
        const timestamp = Date.now();
        const email = `qa-test-${role}-${timestamp}@jumtunes-test.internal`;
        const password = `QATest_${timestamp}_${Math.random().toString(36).slice(2)}`;

        // Create user via admin API
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: {
            display_name: `QA Test ${role.charAt(0).toUpperCase() + role.slice(1)} ${timestamp}`,
            role,
            is_test_user: true,
            qa_created_by: userId,
            qa_created_at: new Date().toISOString(),
          },
        });

        if (createError) {
          return new Response(JSON.stringify({ success: false, error: createError.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({
          success: true,
          userId: newUser.user.id,
          email,
          role,
          note: "Test user created with is_test_user flag",
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "list-test-users": {
        // List users with is_test_user metadata
        const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers({
          perPage: 100,
        });

        if (listError) {
          return new Response(JSON.stringify({ success: false, error: listError.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const testUsers = (users?.users || [])
          .filter((u: any) => u.user_metadata?.is_test_user === true)
          .map((u: any) => ({
            id: u.id,
            email: u.email,
            role: u.user_metadata?.role || "unknown",
            display_name: u.user_metadata?.display_name,
            created_at: u.created_at,
            qa_created_by: u.user_metadata?.qa_created_by,
          }));

        return new Response(JSON.stringify({ success: true, users: testUsers }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "cleanup-test-user": {
        const targetUserId = body.userId;
        if (!targetUserId) {
          return new Response(JSON.stringify({ error: "userId required" }), { status: 400, headers: corsHeaders });
        }

        // Verify it's actually a test user
        const { data: targetUser } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
        if (!targetUser?.user?.user_metadata?.is_test_user) {
          return new Response(JSON.stringify({ error: "Not a test user - cannot delete" }), { status: 400, headers: corsHeaders });
        }

        // Delete user (cascades handle related data)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);
        if (deleteError) {
          return new Response(JSON.stringify({ success: false, error: deleteError.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true, deleted: targetUserId }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "cleanup-all-test-users": {
        const { data: users } = await supabaseAdmin.auth.admin.listUsers({ perPage: 100 });
        const testUsers = (users?.users || []).filter((u: any) => u.user_metadata?.is_test_user === true);
        
        let deleted = 0;
        let errors = 0;
        for (const u of testUsers) {
          const { error } = await supabaseAdmin.auth.admin.deleteUser(u.id);
          if (error) errors++;
          else deleted++;
        }

        return new Response(JSON.stringify({ success: true, deleted, errors, total: testUsers.length }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "add-credits": {
        const targetUserId = body.userId;
        const credits = body.credits || 50;
        
        const { data, error } = await supabaseAdmin.rpc("add_ai_credits", {
          p_user_id: targetUserId,
          p_credits: credits,
        });

        if (error) {
          return new Response(JSON.stringify({ success: false, error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({
          success: true,
          newCredits: (data as any)?.new_credits,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
