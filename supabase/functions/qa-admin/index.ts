import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Phase 1: Allowlisted tables for proxy operations
const PROXY_ALLOWED_TABLES = [
  'playlists', 'playlist_tracks', 'collection_bookmarks',
  'artist_stores', 'qa_dummy_assets', 'qa_test_runs', 'qa_test_results',
];

async function verifyTestUser(supabaseAdmin: any, userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin.auth.admin.getUserById(userId);
  return data?.user?.user_metadata?.is_test_user === true;
}

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

        const { data: targetUser } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
        if (!targetUser?.user?.user_metadata?.is_test_user) {
          return new Response(JSON.stringify({ error: "Not a test user - cannot delete" }), { status: 400, headers: corsHeaders });
        }

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
          p_credits: Number(credits),
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

      // ===== PHASE 1: Proxy operations for RLS-sensitive test fixtures =====

      case "proxy-insert": {
        const { table, data: rowData, targetUserId } = body;
        if (!table || !rowData) {
          return new Response(JSON.stringify({ error: "table and data required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        if (!PROXY_ALLOWED_TABLES.includes(table)) {
          return new Response(JSON.stringify({ error: `Table '${table}' not allowed for proxy operations` }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        // If targetUserId is specified, verify it's a test user
        if (targetUserId) {
          const isTest = await verifyTestUser(supabaseAdmin, targetUserId);
          if (!isTest) {
            return new Response(JSON.stringify({ error: "Target user is not a test user" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }
        }

        const { data: inserted, error: insertError } = await supabaseAdmin
          .from(table)
          .insert(rowData)
          .select()
          .single();

        if (insertError) {
          return new Response(JSON.stringify({ success: false, error: insertError.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true, data: inserted }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "proxy-delete": {
        const { table, match, targetUserId: delTargetUserId } = body;
        if (!table || !match) {
          return new Response(JSON.stringify({ error: "table and match required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        if (!PROXY_ALLOWED_TABLES.includes(table)) {
          return new Response(JSON.stringify({ error: `Table '${table}' not allowed for proxy operations` }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        if (delTargetUserId) {
          const isTest = await verifyTestUser(supabaseAdmin, delTargetUserId);
          if (!isTest) {
            return new Response(JSON.stringify({ error: "Target user is not a test user" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }
        }

        let query = supabaseAdmin.from(table).delete();
        for (const [key, val] of Object.entries(match)) {
          query = query.eq(key, val);
        }
        const { error: deleteError } = await query;

        if (deleteError) {
          return new Response(JSON.stringify({ success: false, error: deleteError.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "proxy-select": {
        const { table, match: selectMatch, targetUserId: selTargetUserId } = body;
        if (!table || !selectMatch) {
          return new Response(JSON.stringify({ error: "table and match required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        if (!PROXY_ALLOWED_TABLES.includes(table)) {
          return new Response(JSON.stringify({ error: `Table '${table}' not allowed for proxy operations` }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        if (selTargetUserId) {
          const isTest = await verifyTestUser(supabaseAdmin, selTargetUserId);
          if (!isTest) {
            return new Response(JSON.stringify({ error: "Target user is not a test user" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
          }
        }

        let selectQuery = supabaseAdmin.from(table).select('*');
        for (const [key, val] of Object.entries(selectMatch)) {
          selectQuery = selectQuery.eq(key, val);
        }
        const { data: rows, error: selectError } = await selectQuery;

        if (selectError) {
          return new Response(JSON.stringify({ success: false, error: selectError.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ success: true, data: rows }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ===== PHASE 3: Credit deduction for test users =====

      case "deduct-test-credits": {
        const { userId: creditUserId, credits: creditAmount } = body;
        if (!creditUserId || !creditAmount) {
          return new Response(JSON.stringify({ error: "userId and credits required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const isTest = await verifyTestUser(supabaseAdmin, creditUserId);
        if (!isTest) {
          return new Response(JSON.stringify({ error: "Target user is not a test user" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // Get balance before
        const { data: walletBefore } = await supabaseAdmin
          .from('credit_wallets')
          .select('ai_credits')
          .eq('user_id', creditUserId)
          .maybeSingle();

        const previousCredits = Number(walletBefore?.ai_credits ?? 0);

        const { data: deductResult, error: deductError } = await supabaseAdmin.rpc("deduct_ai_credits", {
          p_user_id: creditUserId,
          p_credits: creditAmount,
        });

        if (deductError) {
          return new Response(JSON.stringify({ success: false, error: deductError.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({
          success: (deductResult as any)?.success ?? false,
          previousCredits,
          newCredits: (deductResult as any)?.new_credits,
          deducted: creditAmount,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ===== PHASE 3: Get credit balance for test user =====

      case "get-test-credits": {
        const { userId: balanceUserId } = body;
        if (!balanceUserId) {
          return new Response(JSON.stringify({ error: "userId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const isTest = await verifyTestUser(supabaseAdmin, balanceUserId);
        if (!isTest) {
          return new Response(JSON.stringify({ error: "Target user is not a test user" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        const { data: wallet, error: walletError } = await supabaseAdmin
          .from('credit_wallets')
          .select('ai_credits, balance_cents')
          .eq('user_id', balanceUserId)
          .maybeSingle();

        if (walletError) {
          return new Response(JSON.stringify({ success: false, error: walletError.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({
          success: true,
          ai_credits: Number(wallet?.ai_credits ?? 0),
          balance_cents: Number(wallet?.balance_cents ?? 0),
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
