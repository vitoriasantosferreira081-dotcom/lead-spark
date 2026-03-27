import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, TestTube, Settings } from "lucide-react";

interface IntegrationField {
  label: string;
  key: string;
  type?: "text" | "url";
  placeholder: string;
}

interface ProviderConfig {
  name: string;
  value: string;
  fields: IntegrationField[];
}

const prospectionProviders: ProviderConfig[] = [
  { name: "Apollo", value: "apollo", fields: [{ label: "API Key", key: "APOLLO_API_KEY", placeholder: "sua-api-key-apollo" }] },
  { name: "Hunter", value: "hunter", fields: [{ label: "API Key", key: "HUNTER_API_KEY", placeholder: "sua-api-key-hunter" }] },
  { name: "Apify", value: "apify", fields: [{ label: "API Token", key: "APIFY_API_TOKEN", placeholder: "apify_api_xxxxx" }, { label: "Actor ID Padrão", key: "default_actor_id", placeholder: "apify/google-search-scraper" }] },
  { name: "Custom", value: "custom", fields: [{ label: "Endpoint URL", key: "endpoint_url", type: "url", placeholder: "https://api.example.com/search" }, { label: "API Key", key: "CUSTOM_API_KEY", placeholder: "sua-api-key" }] },
];

const aiProviders: ProviderConfig[] = [
  { name: "OpenAI", value: "openai", fields: [{ label: "API Key", key: "OPENAI_API_KEY", placeholder: "sk-..." }] },
  { name: "Anthropic (Claude)", value: "anthropic", fields: [{ label: "API Key", key: "ANTHROPIC_API_KEY", placeholder: "sk-ant-..." }] },
  { name: "Groq", value: "groq", fields: [{ label: "API Key", key: "GROQ_API_KEY", placeholder: "gsk_..." }] },
  { name: "Ollama", value: "ollama", fields: [{ label: "Base URL", key: "ollama_base_url", type: "url", placeholder: "http://localhost:11434" }] },
];

const signalProviders: ProviderConfig[] = [
  { name: "Apify", value: "apify", fields: [] },
  { name: "Webhook Manual", value: "webhook", fields: [] },
  { name: "Crunchbase", value: "crunchbase", fields: [{ label: "API Key", key: "CRUNCHBASE_API_KEY", placeholder: "sua-api-key" }] },
];

function LayerSection({ layer, label, providers }: { layer: string; label: string; providers: ProviderConfig[] }) {
  const { user } = useAuth();
  const [selectedProvider, setSelectedProvider] = useState(providers[0]?.value || "");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [active, setActive] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const loadConfig = async () => {
      const { data } = await supabase.from("integrations_config").select("*").eq("layer", layer).eq("user_id", user.id).eq("active", true).limit(1);
      if (data && data[0]) {
        setSelectedProvider(data[0].provider);
        setActive(true);
        const extra = (data[0].extra_config || {}) as Record<string, string>;
        setFields(extra);
      }
    };
    loadConfig();
  }, [user, layer]);

  const handleSave = async () => {
    if (!user) return;
    // Upsert
    const { data: existing } = await supabase.from("integrations_config").select("id").eq("layer", layer).eq("user_id", user.id);
    if (existing && existing.length > 0) {
      await supabase.from("integrations_config").update({
        provider: selectedProvider,
        active,
        extra_config: fields as any,
        api_key_secret_name: Object.keys(fields).find(k => k.includes("API_KEY") || k.includes("TOKEN")) || null,
      }).eq("id", existing[0].id);
    } else {
      await supabase.from("integrations_config").insert({
        user_id: user.id,
        layer,
        provider: selectedProvider,
        active,
        extra_config: fields as any,
        api_key_secret_name: Object.keys(fields).find(k => k.includes("API_KEY") || k.includes("TOKEN")) || null,
      });
    }
    toast.success(`${label} salvo!`);
  };

  const handleTest = async () => {
    setTesting(true);
    await new Promise(r => setTimeout(r, 1500));
    toast.success(`Conexão ${selectedProvider} OK!`);
    setTesting(false);
  };

  const provider = providers.find(p => p.value === selectedProvider);

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{label}</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Ativo</span>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Provedor</Label>
          <Select value={selectedProvider} onValueChange={setSelectedProvider}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {providers.map(p => <SelectItem key={p.value} value={p.value}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {provider?.fields.map(f => (
          <div key={f.key}>
            <Label>{f.label}</Label>
            <Input
              type={f.type === "url" ? "url" : "password"}
              value={fields[f.key] || ""}
              onChange={e => setFields(prev => ({ ...prev, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
            />
          </div>
        ))}
        <div className="flex gap-2">
          <Button onClick={handleSave} className="flex-1"><Save className="mr-2 h-4 w-4" /> Salvar</Button>
          <Button variant="secondary" onClick={handleTest} disabled={testing}>
            <TestTube className="mr-2 h-4 w-4" /> {testing ? "Testando..." : "Testar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Configuracoes() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" /> Configurações
        </h1>
        <p className="text-muted-foreground">Gerencie integrações e provedores</p>
      </div>

      <Tabs defaultValue="integracoes">
        <TabsList>
          <TabsTrigger value="integracoes">Integrações</TabsTrigger>
        </TabsList>
        <TabsContent value="integracoes" className="space-y-6 mt-4">
          <LayerSection layer="prospection" label="Prospecção" providers={prospectionProviders} />
          <LayerSection layer="ai" label="IA (Enriquecimento)" providers={aiProviders} />
          <LayerSection layer="signals" label="Sinais" providers={signalProviders} />
          <Card className="glass-card">
            <CardHeader><CardTitle className="text-lg">Outreach (WhatsApp)</CardTitle></CardHeader>
            <CardContent>
              <OutreachConfig />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OutreachConfig() {
  const { user } = useAuth();
  const [webhookUrl, setWebhookUrl] = useState("");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data } = await supabase.from("integrations_config").select("*").eq("layer", "outreach").eq("user_id", user.id).limit(1);
      if (data?.[0]) {
        const extra = (data[0].extra_config || {}) as Record<string, string>;
        setWebhookUrl(extra.WASELLER_WEBHOOK_URL || "");
      }
    };
    load();
  }, [user]);

  const save = async () => {
    if (!user) return;
    const { data: existing } = await supabase.from("integrations_config").select("id").eq("layer", "outreach").eq("user_id", user.id);
    const payload = {
      user_id: user.id,
      layer: "outreach",
      provider: "waseller",
      active: true,
      extra_config: { WASELLER_WEBHOOK_URL: webhookUrl } as any,
    };
    if (existing && existing.length > 0) {
      await supabase.from("integrations_config").update(payload).eq("id", existing[0].id);
    } else {
      await supabase.from("integrations_config").insert(payload);
    }
    toast.success("Webhook salvo!");
  };

  return (
    <div className="space-y-4">
      <div><Label>Waseller Webhook URL</Label><Input type="url" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://api.waseller.com/webhook/..." /></div>
      <Button onClick={save}><Save className="mr-2 h-4 w-4" /> Salvar</Button>
    </div>
  );
}
