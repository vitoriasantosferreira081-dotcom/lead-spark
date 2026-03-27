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

    const { lead_id } = await req.json();
    if (!lead_id) return new Response(JSON.stringify({ error: "lead_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Get lead
    const { data: lead } = await supabase.from("leads").select("*").eq("id", lead_id).single();
    if (!lead) return new Response(JSON.stringify({ error: "Lead não encontrado" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Get AI provider
    const { data: config } = await supabase.from("integrations_config").select("*").eq("layer", "ai").eq("user_id", userId).eq("active", true).limit(1);

    const prompt = `Você é um especialista em GTM B2B. Com base nos dados do lead abaixo, gere um contexto de 2 frases para personalizar uma abordagem comercial via WhatsApp. Seja direto, relevante e mencione o contexto de negócio.

Lead:
- Nome: ${lead.full_name}
- Cargo: ${lead.job_title || "N/A"}
- Empresa: ${lead.company || "N/A"}
- Sinal: ${lead.signal_type || "N/A"}

Responda apenas com as 2 frases de contexto.`;

    let aiContext = "";

    if (config && config.length > 0) {
      const provider = config[0];
      const extra = (provider.extra_config || {}) as Record<string, string>;

      if (provider.provider === "openai") {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${extra.OPENAI_API_KEY}` },
          body: JSON.stringify({ model: "gpt-4o", messages: [{ role: "user", content: prompt }], max_tokens: 200 }),
        });
        const data = await res.json();
        aiContext = data.choices?.[0]?.message?.content || "";
      } else if (provider.provider === "anthropic") {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-api-key": extra.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
          body: JSON.stringify({ model: "claude-3-5-sonnet-20241022", max_tokens: 200, messages: [{ role: "user", content: prompt }] }),
        });
        const data = await res.json();
        aiContext = data.content?.[0]?.text || "";
      } else if (provider.provider === "groq") {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${extra.GROQ_API_KEY}` },
          body: JSON.stringify({ model: "llama3-8b-8192", messages: [{ role: "user", content: prompt }], max_tokens: 200 }),
        });
        const data = await res.json();
        aiContext = data.choices?.[0]?.message?.content || "";
      } else if (provider.provider === "ollama") {
        const baseUrl = extra.ollama_base_url || "http://localhost:11434";
        const res = await fetch(`${baseUrl}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ model: "llama3", messages: [{ role: "user", content: prompt }], stream: false }),
        });
        const data = await res.json();
        aiContext = data.message?.content || "";
      }
    } else {
      // Fallback: use Lovable AI
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (LOVABLE_API_KEY) {
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${LOVABLE_API_KEY}` },
          body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
        });
        const data = await res.json();
        aiContext = data.choices?.[0]?.message?.content || "";
      } else {
        aiContext = `Lead ${lead.full_name} atua como ${lead.job_title || "profissional"} na ${lead.company || "empresa"}. Contexto gerado automaticamente.`;
      }
    }

    // Update lead
    await supabase.from("leads").update({ ai_context: aiContext, status: "enriched" as any }).eq("id", lead_id);

    return new Response(JSON.stringify({ ai_context: aiContext }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("enrich error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
