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
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claims?.claims) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    const userId = claims.claims.sub as string;

    const body = await req.json();
    const { job_title, industry, company_size, location } = body;

    // Get active prospection provider
    const { data: config } = await supabase.from("integrations_config").select("*").eq("layer", "prospection").eq("user_id", userId).eq("active", true).limit(1);
    if (!config || config.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhum provedor de prospecção ativo. Configure em Configurações." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const provider = config[0];
    const extra = (provider.extra_config || {}) as Record<string, string>;
    let leads: any[] = [];

    if (provider.provider === "apollo") {
      const apiKey = extra.APOLLO_API_KEY;
      if (!apiKey) return new Response(JSON.stringify({ error: "Apollo API Key não configurada" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const res = await fetch("https://api.apollo.io/v1/mixed_people/search", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
        body: JSON.stringify({
          api_key: apiKey,
          person_titles: job_title ? [job_title] : [],
          person_locations: location ? [location] : [],
          organization_num_employees_ranges: company_size ? [company_size] : [],
          per_page: 25,
        }),
      });
      const data = await res.json();
      leads = (data.people || []).map((p: any) => ({
        full_name: p.name || `${p.first_name} ${p.last_name}`,
        email: p.email,
        phone: p.phone_numbers?.[0]?.sanitized_number,
        company: p.organization?.name,
        job_title: p.title,
        linkedin_url: p.linkedin_url,
        provider_source: "apollo",
      }));
    } else if (provider.provider === "hunter") {
      const apiKey = extra.HUNTER_API_KEY;
      if (!apiKey) return new Response(JSON.stringify({ error: "Hunter API Key não configurada" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const domain = body.domain || "";
      const res = await fetch(`https://api.hunter.io/v2/domain-search?domain=${encodeURIComponent(domain)}&api_key=${apiKey}`);
      const data = await res.json();
      leads = (data.data?.emails || []).map((e: any) => ({
        full_name: `${e.first_name || ""} ${e.last_name || ""}`.trim() || e.value,
        email: e.value,
        company: data.data?.organization,
        job_title: e.position,
        provider_source: "hunter",
      }));
    } else if (provider.provider === "apify") {
      const token = extra.APIFY_API_TOKEN;
      const actorId = extra.default_actor_id || body.actor_id;
      if (!token || !actorId) return new Response(JSON.stringify({ error: "Apify token ou Actor ID não configurado" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const runRes = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs?token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queries: job_title, ...body }),
      });
      const runData = await runRes.json();
      const runId = runData.data?.id;

      if (runId) {
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
          leads = items.map((i: any) => ({
            full_name: i.name || i.full_name || "Unknown",
            email: i.email,
            phone: i.phone,
            company: i.company || i.organization,
            job_title: i.title || i.position,
            linkedin_url: i.linkedin_url || i.url,
            provider_source: "apify",
          }));
        }
      }
    }

    // Save leads
    const leadsToInsert = leads.map(l => ({ ...l, user_id: userId, status: "pending" as const }));
    if (leadsToInsert.length > 0) {
      const { error } = await supabase.from("leads").insert(leadsToInsert);
      if (error) throw error;
    }

    return new Response(JSON.stringify({ count: leadsToInsert.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("prospect error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
