import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Public webhook — no auth required
    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { phone, message } = await req.json();
    if (!phone || !message) return new Response(JSON.stringify({ error: "phone and message required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Find lead by phone
    const { data: leads } = await supabaseAdmin.from("leads").select("*").eq("phone", phone).limit(1);
    if (!leads || leads.length === 0) {
      return new Response(JSON.stringify({ error: "Lead not found for this phone" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const lead = leads[0];

    // Save inbound message
    await supabaseAdmin.from("messages").insert({
      user_id: lead.user_id,
      lead_id: lead.id,
      direction: "inbound" as any,
      content: message,
    });

    // Classify intent using AI
    let classification = "ignore";
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (LOVABLE_API_KEY) {
      const prompt = `Classifique a intenção da seguinte mensagem de resposta a uma abordagem comercial B2B:

"${message}"

Responda APENAS com uma das palavras: interested, objection, ignore`;

      try {
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
          body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
        });
        const data = await res.json();
        const result = (data.choices?.[0]?.message?.content || "ignore").trim().toLowerCase();
        if (["interested", "objection", "ignore"].includes(result)) classification = result;
      } catch (e) {
        console.error("AI classification error:", e);
      }
    }

    // Update lead status
    const statusMap: Record<string, string> = {
      interested: "interested",
      objection: "replied",
      ignore: "replied",
    };
    await supabaseAdmin.from("leads").update({ status: statusMap[classification] as any }).eq("id", lead.id);

    // Update campaign replied count if applicable
    const { data: lastMessage } = await supabaseAdmin.from("messages").select("campaign_id").eq("lead_id", lead.id).eq("direction", "outbound").order("sent_at", { ascending: false }).limit(1);
    if (lastMessage?.[0]?.campaign_id) {
      const cid = lastMessage[0].campaign_id;
      const { data: campaign } = await supabaseAdmin.from("campaigns").select("replied_count").eq("id", cid).single();
      if (campaign) {
        await supabaseAdmin.from("campaigns").update({ replied_count: (campaign.replied_count || 0) + 1 }).eq("id", cid);
      }
    }

    return new Response(JSON.stringify({ classification, lead_id: lead.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("waseller-reply error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
