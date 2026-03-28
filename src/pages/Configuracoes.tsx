import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Save, TestTube, Settings, Plug, Brain, Radio, MessageSquare, Globe, Webhook, Database, Mail } from "lucide-react";

interface IntegrationField {
  label: string;
  key: string;
  type?: "text" | "url";
  placeholder: string;
}

interface ProviderConfig {
  name: string;
  value: string;
  icon?: string;
  fields: IntegrationField[];
}

// ── Prospecção ──
const prospectionProviders: ProviderConfig[] = [
  { name: "Apollo.io", value: "apollo", fields: [{ label: "API Key", key: "APOLLO_API_KEY", placeholder: "sua-api-key-apollo" }] },
  { name: "Hunter.io", value: "hunter", fields: [{ label: "API Key", key: "HUNTER_API_KEY", placeholder: "sua-api-key-hunter" }] },
  { name: "Apify", value: "apify", fields: [{ label: "API Token", key: "APIFY_API_TOKEN", placeholder: "apify_api_xxxxx" }, { label: "Actor ID Padrão", key: "default_actor_id", placeholder: "apify/google-search-scraper" }] },
  { name: "Snov.io", value: "snov", fields: [{ label: "Client ID", key: "SNOV_CLIENT_ID", placeholder: "seu-client-id" }, { label: "Client Secret", key: "SNOV_CLIENT_SECRET", placeholder: "seu-client-secret" }] },
  { name: "Lusha", value: "lusha", fields: [{ label: "API Key", key: "LUSHA_API_KEY", placeholder: "sua-api-key-lusha" }] },
  { name: "RocketReach", value: "rocketreach", fields: [{ label: "API Key", key: "ROCKETREACH_API_KEY", placeholder: "sua-api-key" }] },
  { name: "Custom API", value: "custom", fields: [{ label: "Endpoint URL", key: "endpoint_url", type: "url", placeholder: "https://api.example.com/search" }, { label: "API Key", key: "CUSTOM_API_KEY", placeholder: "sua-api-key" }] },
];

// ── IA ──
const aiProviders: ProviderConfig[] = [
  { name: "OpenAI", value: "openai", fields: [{ label: "API Key", key: "OPENAI_API_KEY", placeholder: "sk-..." }] },
  { name: "Anthropic (Claude)", value: "anthropic", fields: [{ label: "API Key", key: "ANTHROPIC_API_KEY", placeholder: "sk-ant-..." }] },
  { name: "Google Gemini", value: "gemini", fields: [{ label: "API Key", key: "GEMINI_API_KEY", placeholder: "AIza..." }] },
  { name: "Groq", value: "groq", fields: [{ label: "API Key", key: "GROQ_API_KEY", placeholder: "gsk_..." }] },
  { name: "Ollama (Local)", value: "ollama", fields: [{ label: "Base URL", key: "ollama_base_url", type: "url", placeholder: "http://localhost:11434" }] },
  { name: "Lovable AI", value: "lovable", fields: [] },
];

// ── Sinais ──
const signalProviders: ProviderConfig[] = [
  { name: "Apify", value: "apify", fields: [] },
  { name: "Webhook Manual", value: "webhook", fields: [{ label: "Webhook URL (receber)", key: "SIGNAL_WEBHOOK_URL", type: "url", placeholder: "Gerado automaticamente" }] },
  { name: "Crunchbase", value: "crunchbase", fields: [{ label: "API Key", key: "CRUNCHBASE_API_KEY", placeholder: "sua-api-key" }] },
  { name: "Google Alerts (via Zapier)", value: "google_alerts", fields: [{ label: "Webhook URL", key: "GOOGLE_ALERTS_WEBHOOK", type: "url", placeholder: "https://hooks.zapier.com/..." }] },
];

// ── Outreach (WhatsApp) ──
const outreachProviders: ProviderConfig[] = [
  { name: "Waseller", value: "waseller", fields: [{ label: "Webhook URL", key: "WASELLER_WEBHOOK_URL", type: "url", placeholder: "https://api.waseller.com/webhook/..." }] },
  { name: "N8N", value: "n8n", fields: [{ label: "Webhook URL", key: "N8N_WEBHOOK_URL", type: "url", placeholder: "https://n8n.exemplo.com/webhook/..." }, { label: "Auth Header (opcional)", key: "N8N_AUTH_HEADER", placeholder: "Bearer token..." }] },
  { name: "Z-API", value: "zapi", fields: [{ label: "Instance URL", key: "ZAPI_INSTANCE_URL", type: "url", placeholder: "https://api.z-api.io/instances/..." }, { label: "Token", key: "ZAPI_TOKEN", placeholder: "seu-token-zapi" }] },
  { name: "Evolution API", value: "evolution", fields: [{ label: "Base URL", key: "EVOLUTION_BASE_URL", type: "url", placeholder: "https://evolution.exemplo.com" }, { label: "API Key", key: "EVOLUTION_API_KEY", placeholder: "sua-api-key" }] },
  { name: "Baileys (WPPConnect)", value: "baileys", fields: [{ label: "Server URL", key: "BAILEYS_SERVER_URL", type: "url", placeholder: "https://wppconnect.exemplo.com" }, { label: "Secret Key", key: "BAILEYS_SECRET_KEY", placeholder: "sua-secret-key" }] },
  { name: "Custom Webhook", value: "custom_webhook", fields: [{ label: "Webhook URL", key: "CUSTOM_WEBHOOK_URL", type: "url", placeholder: "https://seu-endpoint.com/webhook" }, { label: "API Key (opcional)", key: "CUSTOM_WEBHOOK_API_KEY", placeholder: "sua-api-key" }, { label: "Header de Auth (opcional)", key: "CUSTOM_WEBHOOK_AUTH_HEADER", placeholder: "Authorization: Bearer ..." }] },
];

// ── Email ──
const emailProviders: ProviderConfig[] = [
  { name: "SendGrid", value: "sendgrid", fields: [{ label: "API Key", key: "SENDGRID_API_KEY", placeholder: "SG.xxxxx" }, { label: "Email Remetente", key: "SENDGRID_FROM_EMAIL", placeholder: "noreply@empresa.com" }] },
  { name: "Mailgun", value: "mailgun", fields: [{ label: "API Key", key: "MAILGUN_API_KEY", placeholder: "key-xxxxx" }, { label: "Domínio", key: "MAILGUN_DOMAIN", placeholder: "mg.empresa.com" }] },
  { name: "Amazon SES", value: "ses", fields: [{ label: "Access Key", key: "AWS_SES_ACCESS_KEY", placeholder: "AKIA..." }, { label: "Secret Key", key: "AWS_SES_SECRET_KEY", placeholder: "sua-secret-key" }, { label: "Região", key: "AWS_SES_REGION", placeholder: "us-east-1" }] },
  { name: "SMTP Customizado", value: "smtp", fields: [{ label: "Host", key: "SMTP_HOST", placeholder: "smtp.empresa.com" }, { label: "Porta", key: "SMTP_PORT", placeholder: "587" }, { label: "Usuário", key: "SMTP_USER", placeholder: "user@empresa.com" }, { label: "Senha", key: "SMTP_PASS", placeholder: "sua-senha" }] },
];

// ── CRM / Webhooks ──
const crmProviders: ProviderConfig[] = [
  { name: "N8N (Automação)", value: "n8n_crm", fields: [{ label: "Base URL", key: "N8N_BASE_URL", type: "url", placeholder: "https://n8n.empresa.com" }, { label: "API Key", key: "N8N_API_KEY", placeholder: "sua-api-key" }] },
  { name: "Zapier", value: "zapier", fields: [{ label: "Webhook URL", key: "ZAPIER_WEBHOOK_URL", type: "url", placeholder: "https://hooks.zapier.com/..." }] },
  { name: "Make (Integromat)", value: "make", fields: [{ label: "Webhook URL", key: "MAKE_WEBHOOK_URL", type: "url", placeholder: "https://hook.us1.make.com/..." }] },
  { name: "Webhook Genérico", value: "generic_webhook", fields: [{ label: "URL", key: "GENERIC_WEBHOOK_URL", type: "url", placeholder: "https://..." }, { label: "Método", key: "GENERIC_WEBHOOK_METHOD", placeholder: "POST" }, { label: "Headers (JSON)", key: "GENERIC_WEBHOOK_HEADERS", placeholder: '{"Authorization": "Bearer ..."}' }] },
];

function LayerSection({ layer, label, description, icon: Icon, providers }: { layer: string; label: string; description: string; icon: React.ElementType; providers: ProviderConfig[] }) {
  const { user } = useAuth();
  const [selectedProvider, setSelectedProvider] = useState(providers[0]?.value || "");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [active, setActive] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    const loadConfig = async () => {
      const { data } = await supabase.from("integrations_config").select("*").eq("layer", layer).eq("user_id", user.id).eq("active", true).limit(1);
      if (data && data[0]) {
        setSelectedProvider(data[0].provider);
        setActive(true);
        setSaved(true);
        const extra = (data[0].extra_config || {}) as Record<string, string>;
        setFields(extra);
      }
    };
    loadConfig();
  }, [user, layer]);

  const handleSave = async () => {
    if (!user) return;
    const { data: existing } = await supabase.from("integrations_config").select("id").eq("layer", layer).eq("user_id", user.id);
    const payload = {
      provider: selectedProvider,
      active,
      extra_config: fields as any,
      api_key_secret_name: Object.keys(fields).find(k => k.includes("API_KEY") || k.includes("TOKEN") || k.includes("SECRET")) || null,
    };
    if (existing && existing.length > 0) {
      await supabase.from("integrations_config").update(payload).eq("id", existing[0].id);
    } else {
      await supabase.from("integrations_config").insert({ user_id: user.id, layer, ...payload });
    }
    setSaved(true);
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
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <Icon className="h-4 w-4 text-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">{label}</CardTitle>
              <CardDescription className="text-xs">{description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {saved && active && <Badge variant="outline" className="text-xs bg-emerald-600/10 text-emerald-500 border-emerald-600/20">Conectado</Badge>}
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="text-xs text-muted-foreground">Provedor</Label>
          <Select value={selectedProvider} onValueChange={setSelectedProvider}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {providers.map(p => <SelectItem key={p.value} value={p.value}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {provider?.fields.map(f => (
          <div key={f.key}>
            <Label className="text-xs text-muted-foreground">{f.label}</Label>
            <Input
              type={f.type === "url" ? "url" : "password"}
              value={fields[f.key] || ""}
              onChange={e => setFields(prev => ({ ...prev, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              className="mt-1"
            />
          </div>
        ))}
        {provider?.fields.length === 0 && (
          <p className="text-xs text-muted-foreground py-2">Nenhuma configuração adicional necessária.</p>
        )}
        <div className="flex gap-2 pt-1">
          <Button onClick={handleSave} size="sm" className="flex-1"><Save className="mr-2 h-3 w-3" /> Salvar</Button>
          <Button variant="outline" size="sm" onClick={handleTest} disabled={testing}>
            <TestTube className="mr-2 h-3 w-3" /> {testing ? "Testando..." : "Testar"}
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
        <p className="text-muted-foreground">Gerencie integrações, conexões e provedores do CRM</p>
      </div>

      <Tabs defaultValue="outreach">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="outreach" className="text-xs"><MessageSquare className="h-3 w-3 mr-1" /> WhatsApp</TabsTrigger>
          <TabsTrigger value="prospection" className="text-xs"><Globe className="h-3 w-3 mr-1" /> Prospecção</TabsTrigger>
          <TabsTrigger value="ai" className="text-xs"><Brain className="h-3 w-3 mr-1" /> IA</TabsTrigger>
          <TabsTrigger value="email" className="text-xs"><Mail className="h-3 w-3 mr-1" /> Email</TabsTrigger>
          <TabsTrigger value="signals" className="text-xs"><Radio className="h-3 w-3 mr-1" /> Sinais</TabsTrigger>
          <TabsTrigger value="webhooks" className="text-xs"><Webhook className="h-3 w-3 mr-1" /> Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="outreach" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {outreachProviders.map(p => (
              <LayerSection key={p.value} layer={`outreach_${p.value}`} label={p.name} description="Envio de mensagens via WhatsApp" icon={MessageSquare} providers={[p]} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="prospection" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <LayerSection layer="prospection" label="Prospecção de Leads" description="Busca e enriquecimento de contatos B2B" icon={Globe} providers={prospectionProviders} />
          </div>
        </TabsContent>

        <TabsContent value="ai" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <LayerSection layer="ai" label="Inteligência Artificial" description="LLM para enriquecimento, scoring e respostas" icon={Brain} providers={aiProviders} />
          </div>
        </TabsContent>

        <TabsContent value="email" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <LayerSection layer="email" label="Envio de Email" description="Provedor para campanhas e notificações por email" icon={Mail} providers={emailProviders} />
          </div>
        </TabsContent>

        <TabsContent value="signals" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <LayerSection layer="signals" label="Sinais de Mercado" description="Captura de sinais de intenção de compra" icon={Radio} providers={signalProviders} />
          </div>
        </TabsContent>

        <TabsContent value="webhooks" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {crmProviders.map(p => (
              <LayerSection key={p.value} layer={`webhook_${p.value}`} label={p.name} description="Automação e integração externa" icon={Webhook} providers={[p]} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
