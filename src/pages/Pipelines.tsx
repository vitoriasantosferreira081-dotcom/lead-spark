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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, GripVertical, Trash2, ArrowLeft, Zap, RotateCcw } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

interface Pipeline {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
}

interface Stage {
  id: string;
  pipeline_id: string;
  name: string;
  position: number;
  color: string;
}

interface Automation {
  id: string;
  stage_id: string;
  trigger: string;
  action_type: string;
  action_config: any;
  active: boolean;
}

interface Cadence {
  id: string;
  stage_id: string;
  name: string;
  steps: any[];
  active: boolean;
}

const triggerLabels: Record<string, string> = {
  on_enter: "Ao entrar",
  on_exit: "Ao sair",
  on_no_reply_Xdays: "Sem resposta X dias",
};

const actionLabels: Record<string, string> = {
  send_whatsapp: "Enviar WhatsApp",
  move_stage: "Mover etapa",
  add_tag: "Adicionar tag",
  notify_human: "Notificar humano",
  stop_cadence: "Parar cadência",
};

export default function Pipelines() {
  const { user } = useAuth();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [cadences, setCadences] = useState<Cadence[]>([]);

  // Modals
  const [pipelineModal, setPipelineModal] = useState(false);
  const [stageModal, setStageModal] = useState(false);
  const [automationModal, setAutomationModal] = useState<string | null>(null);
  const [cadenceModal, setCadenceModal] = useState<string | null>(null);

  // Forms
  const [pipelineName, setPipelineName] = useState("");
  const [pipelineDesc, setPipelineDesc] = useState("");
  const [stageName, setStageName] = useState("");
  const [stageColor, setStageColor] = useState("#6366F1");
  const [autoTrigger, setAutoTrigger] = useState("on_enter");
  const [autoAction, setAutoAction] = useState("send_whatsapp");
  const [autoConfig, setAutoConfig] = useState("{}");
  const [cadenceName, setCadenceName] = useState("");
  const [cadenceSteps, setCadenceSteps] = useState("[]");

  useEffect(() => {
    if (!user) return;
    loadPipelines();
  }, [user]);

  const loadPipelines = async () => {
    const { data } = await supabase.from("pipelines").select("*").order("created_at");
    setPipelines((data || []) as Pipeline[]);
  };

  const loadStages = async (pipelineId: string) => {
    const { data } = await supabase.from("pipeline_stages").select("*").eq("pipeline_id", pipelineId).order("position");
    setStages((data || []) as Stage[]);
  };

  const loadAutomations = async (pipelineId: string) => {
    const stageIds = stages.map(s => s.id);
    if (stageIds.length === 0) { setAutomations([]); return; }
    const { data } = await supabase.from("pipeline_automations").select("*").in("stage_id", stageIds);
    setAutomations((data || []) as Automation[]);
  };

  const loadCadences = async () => {
    const stageIds = stages.map(s => s.id);
    if (stageIds.length === 0) { setCadences([]); return; }
    const { data } = await supabase.from("cadences").select("*").in("stage_id", stageIds);
    setCadences((data || []) as Cadence[]);
  };

  useEffect(() => {
    if (selectedPipeline) {
      loadStages(selectedPipeline.id);
    }
  }, [selectedPipeline]);

  useEffect(() => {
    if (stages.length > 0) {
      loadAutomations(selectedPipeline?.id || "");
      loadCadences();
    }
  }, [stages]);

  const createPipeline = async () => {
    if (!user || !pipelineName.trim()) return;
    await supabase.from("pipelines").insert({ name: pipelineName, description: pipelineDesc || null, user_id: user.id, is_default: pipelines.length === 0 });
    setPipelineModal(false);
    setPipelineName("");
    setPipelineDesc("");
    loadPipelines();
    toast.success("Pipeline criado!");
  };

  const deletePipeline = async (id: string) => {
    await supabase.from("pipelines").delete().eq("id", id);
    if (selectedPipeline?.id === id) setSelectedPipeline(null);
    loadPipelines();
    toast.success("Pipeline removido");
  };

  const createStage = async () => {
    if (!user || !selectedPipeline || !stageName.trim()) return;
    const maxPos = stages.length > 0 ? Math.max(...stages.map(s => s.position)) + 1 : 0;
    await supabase.from("pipeline_stages").insert({
      pipeline_id: selectedPipeline.id,
      user_id: user.id,
      name: stageName,
      position: maxPos,
      color: stageColor,
    });
    setStageModal(false);
    setStageName("");
    loadStages(selectedPipeline.id);
    toast.success("Etapa criada!");
  };

  const deleteStage = async (id: string) => {
    await supabase.from("pipeline_stages").delete().eq("id", id);
    if (selectedPipeline) loadStages(selectedPipeline.id);
    toast.success("Etapa removida");
  };

  const onStageReorder = async (result: DropResult) => {
    if (!result.destination) return;
    const reordered = Array.from(stages);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    const updated = reordered.map((s, i) => ({ ...s, position: i }));
    setStages(updated);
    for (const s of updated) {
      await supabase.from("pipeline_stages").update({ position: s.position }).eq("id", s.id);
    }
  };

  const createAutomation = async () => {
    if (!user || !automationModal) return;
    let config = {};
    try { config = JSON.parse(autoConfig); } catch {}
    await supabase.from("pipeline_automations").insert({
      stage_id: automationModal,
      user_id: user.id,
      trigger: autoTrigger,
      action_type: autoAction,
      action_config: config,
      active: true,
    });
    setAutomationModal(null);
    setAutoConfig("{}");
    if (selectedPipeline) loadStages(selectedPipeline.id);
    toast.success("Automação criada!");
  };

  const createCadence = async () => {
    if (!user || !cadenceModal || !cadenceName.trim()) return;
    let steps: any[] = [];
    try { steps = JSON.parse(cadenceSteps); } catch {}
    await supabase.from("cadences").insert({
      stage_id: cadenceModal,
      user_id: user.id,
      name: cadenceName,
      steps,
      active: true,
    });
    setCadenceModal(null);
    setCadenceName("");
    setCadenceSteps("[]");
    loadCadences();
    toast.success("Cadência criada!");
  };

  // Pipeline list view
  if (!selectedPipeline) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Pipelines</h1>
            <p className="text-muted-foreground text-sm">Gerencie seus pipelines de vendas</p>
          </div>
          <Button onClick={() => setPipelineModal(true)}><Plus className="h-4 w-4 mr-2" /> Novo Pipeline</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pipelines.map(p => (
            <Card key={p.id} className="glass-card cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setSelectedPipeline(p)}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  {p.is_default && <Badge variant="secondary" className="text-xs">Padrão</Badge>}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{p.description || "Sem descrição"}</p>
                <Button variant="ghost" size="sm" className="mt-2 text-destructive" onClick={e => { e.stopPropagation(); deletePipeline(p.id); }}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
                </Button>
              </CardContent>
            </Card>
          ))}
          {pipelines.length === 0 && <p className="text-muted-foreground col-span-full text-center py-12">Nenhum pipeline criado ainda.</p>}
        </div>

        <Dialog open={pipelineModal} onOpenChange={setPipelineModal}>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Pipeline</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome</Label><Input value={pipelineName} onChange={e => setPipelineName(e.target.value)} placeholder="Ex: Vendas B2B" /></div>
              <div><Label>Descrição</Label><Textarea value={pipelineDesc} onChange={e => setPipelineDesc(e.target.value)} placeholder="Descrição opcional..." /></div>
            </div>
            <DialogFooter><Button onClick={createPipeline}>Criar</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Pipeline detail view
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => setSelectedPipeline(null)}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-2xl font-bold">{selectedPipeline.name}</h1>
          <p className="text-muted-foreground text-sm">{selectedPipeline.description || "Pipeline de vendas"}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Etapas</h2>
        <Button size="sm" onClick={() => setStageModal(true)}><Plus className="h-4 w-4 mr-1" /> Nova Etapa</Button>
      </div>

      <DragDropContext onDragEnd={onStageReorder}>
        <Droppable droppableId="stages">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
              {stages.map((stage, index) => (
                <Draggable key={stage.id} draggableId={stage.id} index={index}>
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.draggableProps} className="glass-card">
                      <div className="flex items-center gap-3 p-4">
                        <div {...provided.dragHandleProps}><GripVertical className="h-4 w-4 text-muted-foreground" /></div>
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: stage.color }} />
                        <span className="font-medium flex-1">{stage.name}</span>
                        <span className="text-xs text-muted-foreground">Pos: {stage.position}</span>
                        <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => deleteStage(stage.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <Tabs defaultValue="automations" className="px-4 pb-4">
                        <TabsList className="h-8">
                          <TabsTrigger value="automations" className="text-xs h-7">Automações</TabsTrigger>
                          <TabsTrigger value="cadence" className="text-xs h-7">Cadência</TabsTrigger>
                        </TabsList>
                        <TabsContent value="automations" className="space-y-2 mt-2">
                          {automations.filter(a => a.stage_id === stage.id).map(a => (
                            <div key={a.id} className="flex items-center gap-2 text-sm bg-muted/50 rounded p-2">
                              <Zap className="h-3.5 w-3.5 text-primary" />
                              <span>{triggerLabels[a.trigger] || a.trigger}</span>
                              <span className="text-muted-foreground">→</span>
                              <span>{actionLabels[a.action_type] || a.action_type}</span>
                              <Badge variant={a.active ? "default" : "secondary"} className="ml-auto text-[10px]">{a.active ? "Ativo" : "Inativo"}</Badge>
                            </div>
                          ))}
                          <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setAutomationModal(stage.id)}>
                            <Plus className="h-3 w-3 mr-1" /> Automação
                          </Button>
                        </TabsContent>
                        <TabsContent value="cadence" className="space-y-2 mt-2">
                          {cadences.filter(c => c.stage_id === stage.id).map(c => (
                            <div key={c.id} className="flex items-center gap-2 text-sm bg-muted/50 rounded p-2">
                              <RotateCcw className="h-3.5 w-3.5 text-primary" />
                              <span>{c.name}</span>
                              <span className="text-xs text-muted-foreground">{Array.isArray(c.steps) ? c.steps.length : 0} passos</span>
                              <Badge variant={c.active ? "default" : "secondary"} className="ml-auto text-[10px]">{c.active ? "Ativa" : "Inativa"}</Badge>
                            </div>
                          ))}
                          <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => setCadenceModal(stage.id)}>
                            <Plus className="h-3 w-3 mr-1" /> Cadência
                          </Button>
                        </TabsContent>
                      </Tabs>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {stages.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhuma etapa. Adicione a primeira etapa do pipeline.</p>}

      {/* Stage Modal */}
      <Dialog open={stageModal} onOpenChange={setStageModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Etapa</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={stageName} onChange={e => setStageName(e.target.value)} placeholder="Ex: Qualificação" /></div>
            <div><Label>Cor</Label><Input type="color" value={stageColor} onChange={e => setStageColor(e.target.value)} className="h-10 w-20" /></div>
          </div>
          <DialogFooter><Button onClick={createStage}>Criar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Automation Modal */}
      <Dialog open={!!automationModal} onOpenChange={() => setAutomationModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Automação</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Gatilho</Label>
              <Select value={autoTrigger} onValueChange={setAutoTrigger}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(triggerLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ação</Label>
              <Select value={autoAction} onValueChange={setAutoAction}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(actionLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Configuração (JSON)</Label>
              <Textarea value={autoConfig} onChange={e => setAutoConfig(e.target.value)} placeholder='{"days": 3}' className="font-mono text-xs" />
            </div>
          </div>
          <DialogFooter><Button onClick={createAutomation}>Criar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cadence Modal */}
      <Dialog open={!!cadenceModal} onOpenChange={() => setCadenceModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Cadência</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={cadenceName} onChange={e => setCadenceName(e.target.value)} placeholder="Ex: Follow-up 3 dias" /></div>
            <div>
              <Label>Steps (JSON)</Label>
              <Textarea value={cadenceSteps} onChange={e => setCadenceSteps(e.target.value)} placeholder='[{"day":1,"template_id":"...","channel":"whatsapp"}]' className="font-mono text-xs" rows={4} />
            </div>
          </div>
          <DialogFooter><Button onClick={createCadence}>Criar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
