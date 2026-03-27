import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claims?.claims) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    const userId = claims.claims.sub as string;

    const body = await req.json();

    if (body.actor_id) {
      // Run Apify actor
      const { data: config } = await supabase.from("integrations_config").select("*").eq("layer", "prospection").eq("provider", "apify").eq("user_id", userId).limit(1);
      const extra = ((config?.[0]?.extra_config || {}) as Record<string, string>);
      const token = extra.APIFY_API_TOKEN;
      if (!token) return new Response(JSON.stringify({ error: "Apify token não configurado" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const runRes = await fetch(`https://api.apify.com/v2/acts/${body.actor_id}/runs?token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body.input_payload || {}),
      });
      const runData = await runRes.json();
      const runId = runData.data?.id;

      if (!runId) return new Response(JSON.stringify({ error: "Failed to start actor run" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      // Poll for completion
      let status = "RUNNING";
      let attempts = 0;
      while (status === "RUNNING" && attempts < 24) {
        await new Promise(r => setTimeout(r, 5000));
        const statusRes = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${token}`);
        const statusData = await statusRes.json();
        status = statusData.data?.status;
        attempts++;
      }

      if (status === "SUCCEEDED") {
        const datasetId = runData.data?.defaultDatasetId;
        const itemsRes = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}`);
        const items = await itemsRes.json();

        for (const item of items) {
          const priority = (item.event_type === "funding" || item.event_type === "hiring") ? "hot" : (item.event_type === "expansion" ? "warm" : "cold");
          await supabase.from("signals").insert({
            user_id: userId,
            company: item.company || item.name,
            domain: item.domain,
            event_type: item.event_type || "unknown",
            source_url: item.url || item.source_url,
            priority: priority as any,
            actor_id: body.actor_id,
          });

          // Boost ICP score for matching leads
          if (item.event_type === "funding" || item.event_type === "hiring") {
            const { data: matchingLeads } = await supabase.from("leads").select("id, icp_score").or(`company.ilike.%${item.company || ""}%,company.ilike.%${item.domain || ""}%`);
            for (const lead of (matchingLeads || [])) {
              const newScore = Math.min(100, (lead.icp_score || 0) + 20);
              await supabase.from("leads").update({ icp_score: newScore }).eq("id", lead.id);
            }
          }
        }

        return new Response(JSON.stringify({ count: items.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      return new Response(JSON.stringify({ error: `Actor run status: ${status}` }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Manual signal
    const { company, event_type, source_url } = body;
    if (!event_type) return new Response(JSON.stringify({ error: "event_type required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const priority = (event_type === "funding" || event_type === "hiring") ? "hot" : (event_type === "expansion" ? "warm" : "cold");
    await supabase.from("signals").insert({
      user_id: userId, company, event_type, source_url, priority: priority as any,
    });

    // Boost matching leads
    if ((event_type === "funding" || event_type === "hiring") && company) {
      const { data: matchingLeads } = await supabase.from("leads").select("id, icp_score").ilike("company", `%${company}%`);
      for (const lead of (matchingLeads || [])) {
        const newScore = Math.min(100, (lead.icp_score || 0) + 20);
        await supabase.from("leads").update({ icp_score: newScore }).eq("id", lead.id);
      }
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("signals error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
