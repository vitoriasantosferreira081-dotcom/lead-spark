import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Plus, Bot, Pencil, Trash2, MessageSquare } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  channel: string;
  provider: string;
  model: string;
  system_prompt: string | null;
  training_data: string | null;
  can_move_leads: boolean;
  can_score_leads: boolean;
  active: boolean;
  coexistence_mode: boolean;
}

const providers = [
  { value: "openai", label: "OpenAI", models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"] },
  { value: "anthropic", label: "Anthropic", models: ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307"] },
  { value: "grok", label: "Grok", models: ["grok-2", "grok-1"] },
  { value: "ollama", label: "Ollama", models: ["llama3", "mistral", "codellama"] },
];

export default function Agentes() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewAgent, setPreviewAgent] = useState<Agent | null>(null);
  const [previewMessages, setPreviewMessages] = useState<{ role: string; content: string }[]>([]);
  const [previewInput, setPreviewInput] = useState("");

  // Form
  const [form, setForm] = useState({
    name: "",
    channel: "whatsapp",
    provider: "openai",
    model: "gpt-4o-mini",
    system_prompt: "",
    training_data: "",
    can_move_leads: true,
    can_score_leads: true,
    coexistence_mode: true,
    active: true,
  });

  useEffect(() => {
    if (!user) return;
    loadAgents();
  }, [user]);

  const loadAgents = async () => {
    const { data } = await supabase.from("ai_agents").select("*").order("created_at");
    setAgents((data || []) as Agent[]);
  };

  const openCreate = () => {
    setEditingAgent(null);
    setForm({ name: "", channel: "whatsapp", provider: "openai", model: "gpt-4o-mini", system_prompt: "", training_data: "", can_move_leads: true, can_score_leads: true, coexistence_mode: true, active: true });
    setModalOpen(true);
  };

  const openEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setForm({
      name: agent.name,
      channel: agent.channel,
      provider: agent.provider,
      model: agent.model,
      system_prompt: agent.system_prompt || "",
      training_data: agent.training_data || "",
      can_move_leads: agent.can_move_leads,
      can_score_leads: agent.can_score_leads,
      coexistence_mode: agent.coexistence_mode,
      active: agent.active,
    });
    setModalOpen(true);
  };

  const saveAgent = async () => {
    if (!user || !form.name.trim()) return;
    const payload = { ...form, user_id: user.id };
    if (editingAgent) {
      await supabase.from("ai_agents").update(payload).eq("id", editingAgent.id);
      toast.success("Agente atualizado!");
    } else {
      await supabase.from("ai_agents").insert(payload);
      toast.success("Agente criado!");
    }
    setModalOpen(false);
    loadAgents();
  };

  const deleteAgent = async (id: string) => {
    await supabase.from("ai_agents").delete().eq("id", id);
    loadAgents();
    toast.success("Agente removido");
  };

  const openPreview = (agent: Agent) => {
    setPreviewAgent(agent);
    setPreviewMessages([]);
    setPreviewInput("");
    setPreviewOpen(true);
  };

  const sendPreview = () => {
    if (!previewInput.trim() || !previewAgent) return;
    const userMsg = { role: "user", content: previewInput };
    const systemResponse = `[Preview - ${previewAgent.provider}/${previewAgent.model}]\n\nSystem prompt ativo:\n"${previewAgent.system_prompt?.substring(0, 200) || "Não definido"}..."\n\nResposta simulada para: "${previewInput}"`;
    setPreviewMessages(prev => [...prev, userMsg, { role: "assistant", content: systemResponse }]);
    setPreviewInput("");
  };

  const currentModels = providers.find(p => p.value === form.provider)?.models || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agentes IA</h1>
          <p className="text-muted-foreground text-sm">Configure agentes de IA para automatizar interações</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Novo Agente</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map(agent => (
          <Card key={agent.id} className="glass-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{agent.name}</CardTitle>
                </div>
                <Badge variant={agent.active ? "default" : "secondary"}>{agent.active ? "Ativo" : "Inativo"}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Canal:</span> <span className="ml-1">{agent.channel}</span></div>
                <div><span className="text-muted-foreground">Provedor:</span> <span className="ml-1">{agent.provider}</span></div>
                <div><span className="text-muted-foreground">Modelo:</span> <span className="ml-1">{agent.model}</span></div>
                <div><span className="text-muted-foreground">Coexistência:</span> <span className="ml-1">{agent.coexistence_mode ? "Sim" : "Não"}</span></div>
              </div>
              <div className="flex flex-wrap gap-1">
                {agent.can_move_leads && <Badge variant="outline" className="text-[10px]">Move leads</Badge>}
                {agent.can_score_leads && <Badge variant="outline" className="text-[10px]">Score leads</Badge>}
              </div>
              {agent.system_prompt && (
                <p className="text-xs text-muted-foreground line-clamp-2">{agent.system_prompt}</p>
              )}
              <div className="flex gap-2 pt-1">
                <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => openEdit(agent)}>
                  <Pencil className="h-3 w-3 mr-1" /> Editar
                </Button>
                <Button variant="outline" size="sm" className="text-xs" onClick={() => openPreview(agent)}>
                  <MessageSquare className="h-3 w-3 mr-1" /> Preview
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteAgent(agent.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {agents.length === 0 && <p className="text-muted-foreground col-span-full text-center py-12">Nenhum agente criado ainda.</p>}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingAgent ? "Editar Agente" : "Novo Agente"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nome</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: SDR Bot" /></div>
              <div>
                <Label>Canal</Label>
                <Select value={form.channel} onValueChange={v => setForm(p => ({ ...p, channel: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Provedor</Label>
                <Select value={form.provider} onValueChange={v => setForm(p => ({ ...p, provider: v, model: providers.find(x => x.value === v)?.models[0] || "" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {providers.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Modelo</Label>
                <Select value={form.model} onValueChange={v => setForm(p => ({ ...p, model: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {currentModels.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>System Prompt</Label>
              <Textarea
                value={form.system_prompt}
                onChange={e => setForm(p => ({ ...p, system_prompt: e.target.value }))}
                placeholder="Você é um SDR especializado em vendas B2B. Use {{nome}}, {{empresa}}, {{cargo}} para personalizar..."
                rows={6}
              />
            </div>

            <div>
              <Label>Dados de Treinamento</Label>
              <Textarea
                value={form.training_data}
                onChange={e => setForm(p => ({ ...p, training_data: e.target.value }))}
                placeholder="Cole aqui informações sobre sua empresa, produto, diferenciais, objeções comuns..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label>Pode mover leads</Label>
                <Switch checked={form.can_move_leads} onCheckedChange={v => setForm(p => ({ ...p, can_move_leads: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Pode fazer lead score</Label>
                <Switch checked={form.can_score_leads} onCheckedChange={v => setForm(p => ({ ...p, can_score_leads: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Modo coexistência</Label>
                <Switch checked={form.coexistence_mode} onCheckedChange={v => setForm(p => ({ ...p, coexistence_mode: v }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Ativo</Label>
                <Switch checked={form.active} onCheckedChange={v => setForm(p => ({ ...p, active: v }))} />
              </div>
            </div>
          </div>
          <DialogFooter><Button onClick={saveAgent}>{editingAgent ? "Salvar" : "Criar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Preview — {previewAgent?.name}</DialogTitle></DialogHeader>
          <ScrollArea className="h-80 border rounded-lg p-3">
            <div className="space-y-3">
              {previewMessages.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Envie uma mensagem para simular</p>}
              {previewMessages.map((m, i) => (
                <div key={i} className={`p-2 rounded-lg text-sm ${m.role === "user" ? "bg-primary/10 ml-8" : "bg-muted mr-8"}`}>
                  <p className="text-xs text-muted-foreground mb-1">{m.role === "user" ? "Você" : "Agente"}</p>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="flex gap-2">
            <Input value={previewInput} onChange={e => setPreviewInput(e.target.value)} placeholder="Digite uma mensagem..." onKeyDown={e => e.key === "Enter" && sendPreview()} />
            <Button onClick={sendPreview}>Enviar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
