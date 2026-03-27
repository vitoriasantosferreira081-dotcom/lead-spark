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

    const { lead_id, campaign_id, message } = await req.json();
    if (!lead_id || !message) return new Response(JSON.stringify({ error: "lead_id and message required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Get lead
    const { data: lead } = await supabase.from("leads").select("*").eq("id", lead_id).single();
    if (!lead) return new Response(JSON.stringify({ error: "Lead não encontrado" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Replace variables
    const firstName = lead.full_name.split(" ")[0];
    const finalMessage = message
      .replace(/\{\{first_name\}\}/g, firstName)
      .replace(/\{\{company\}\}/g, lead.company || "")
      .replace(/\{\{context\}\}/g, lead.ai_context || "");

    // Get webhook URL
    const { data: outreachConfig } = await supabase.from("integrations_config").select("*").eq("layer", "outreach").eq("user_id", userId).limit(1);
    const webhookUrl = ((outreachConfig?.[0]?.extra_config || {}) as Record<string, string>).WASELLER_WEBHOOK_URL;

    if (webhookUrl && lead.phone) {
      try {
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: lead.phone, message: finalMessage, tag: "altius-gtm" }),
        });
      } catch (e) {
        console.error("Webhook error:", e);
      }
    }

    // Save message
    await supabase.from("messages").insert({
      user_id: userId,
      lead_id,
      campaign_id: campaign_id || null,
      direction: "outbound" as any,
      content: finalMessage,
    });

    // Update lead status
    await supabase.from("leads").update({ status: "contacted" as any }).eq("id", lead_id);

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("outreach error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
