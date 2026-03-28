import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Zap, Plus, Pencil, Trash2 } from "lucide-react";

interface Automation {
  id: string;
  stage_id: string;
  trigger: string;
  action_type: string;
  action_config: any;
  active: boolean;
  stage_name?: string;
  pipeline_name?: string;
}

const triggerLabels: Record<string, string> = {
  on_enter: "Ao entrar na etapa",
  on_exit: "Ao sair da etapa",
  on_no_reply_3days: "Sem resposta (3 dias)",
  on_no_reply_7days: "Sem resposta (7 dias)",
};

const actionLabels: Record<string, string> = {
  send_whatsapp: "Enviar WhatsApp",
  move_stage: "Mover para etapa",
  add_tag: "Adicionar tag",
  notify_human: "Notificar humano",
  stop_cadence: "Parar cadência",
};

export default function Automacoes() {
  const { user } = useAuth();
  const { canEdit } = useRole();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ stage_id: "", trigger: "on_enter", action_type: "send_whatsapp", action_config: "{}" });

  const fetchData = async () => {
    if (!user) return;
    const { data: autos } = await supabase.from("pipeline_automations").select("*").order("created_at", { ascending: false });
    const { data: stgs } = await supabase.from("pipeline_stages").select("*, pipelines(name)");
    setStages(stgs || []);

    const merged = (autos || []).map((a: any) => {
      const stage = (stgs || []).find((s: any) => s.id === a.stage_id);
      return { ...a, stage_name: stage?.name || "—", pipeline_name: (stage as any)?.pipelines?.name || "—" };
    });
    setAutomations(merged);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const toggleActive = async (a: Automation) => {
    await supabase.from("pipeline_automations").update({ active: !a.active }).eq("id", a.id);
    toast.success(a.active ? "Automação desativada" : "Automação ativada");
    fetchData();
  };

  const deleteAuto = async (id: string) => {
    await supabase.from("pipeline_automations").delete().eq("id", id);
    toast.success("Automação removida");
    fetchData();
  };

  const saveAuto = async () => {
    if (!form.stage_id) { toast.error("Selecione uma etapa"); return; }
    let config = {};
    try { config = JSON.parse(form.action_config); } catch { toast.error("JSON inválido"); return; }

    await supabase.from("pipeline_automations").insert({
      user_id: user!.id,
      stage_id: form.stage_id,
      trigger: form.trigger,
      action_type: form.action_type,
      action_config: config,
    });
    toast.success("Automação criada");
    setDialogOpen(false);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" /> Automações
          </h1>
          <p className="text-muted-foreground">Gerencie fluxos automatizados do pipeline</p>
        </div>
        {canEdit && (
          <Button onClick={() => { setForm({ stage_id: "", trigger: "on_enter", action_type: "send_whatsapp", action_config: "{}" }); setDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Nova Automação
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? <p className="text-muted-foreground col-span-full text-center py-8">Carregando...</p> :
          automations.length === 0 ? <p className="text-muted-foreground col-span-full text-center py-8">Nenhuma automação configurada</p> : null}
        {automations.map((a) => (
          <Card key={a.id} className="glass-card">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {triggerLabels[a.trigger] || a.trigger} → {actionLabels[a.action_type] || a.action_type}
                </CardTitle>
                <Switch checked={a.active} onCheckedChange={() => canEdit && toggleActive(a)} disabled={!canEdit} />
              </div>
              <CardDescription>Pipeline: {a.pipeline_name} · Etapa: {a.stage_name}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 flex items-center justify-between">
              <Badge variant={a.active ? "default" : "outline"}>{a.active ? "Ativa" : "Inativa"}</Badge>
              {canEdit && (
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteAuto(a.id)}>
                  <Trash2 className="h-3 w-3 mr-1" /> Remover
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Automação</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Etapa do Pipeline</Label>
              <Select value={form.stage_id} onValueChange={(v) => setForm({ ...form, stage_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione a etapa" /></SelectTrigger>
                <SelectContent>
                  {stages.map((s: any) => <SelectItem key={s.id} value={s.id}>{(s as any).pipelines?.name || "—"} → {s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Gatilho</Label>
              <Select value={form.trigger} onValueChange={(v) => setForm({ ...form, trigger: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(triggerLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ação</Label>
              <Select value={form.action_type} onValueChange={(v) => setForm({ ...form, action_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(actionLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Configuração (JSON)</Label>
              <Textarea value={form.action_config} onChange={(e) => setForm({ ...form, action_config: e.target.value })} placeholder='{"template_id": "...", "delay_hours": 24}' className="font-mono text-sm" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveAuto}>Criar Automação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
