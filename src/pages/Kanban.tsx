import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { StatusBadge } from "@/components/StatusBadge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { toast } from "sonner";
import { MessageSquare, User, Bot, Phone, ExternalLink } from "lucide-react";

interface PipelineStage {
  id: string;
  pipeline_id: string;
  name: string;
  position: number;
  color: string;
}

interface Lead {
  id: string;
  full_name: string;
  company: string | null;
  job_title: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  icp_score: number | null;
  lead_score: number | null;
  status: string | null;
  signal_type: string | null;
  provider_source: string | null;
  ai_context: string | null;
  stage_id: string | null;
  pipeline_id: string | null;
  is_human_mode: boolean | null;
  ai_agent_id: string | null;
  tags: string[] | null;
  linkedin_url: string | null;
}

interface ScoreQuestion {
  id: string;
  question: string;
  type: string;
  options: string[];
  weight: number;
}

interface Message {
  id: string;
  content: string;
  direction: string;
  sent_at: string | null;
}

interface Pipeline {
  id: string;
  name: string;
  is_default: boolean;
}

export default function Kanban() {
  const { user } = useAuth();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [activePipelineId, setActivePipelineId] = useState<string | null>(null);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  // Lead score modal
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [pendingDrop, setPendingDrop] = useState<{ leadId: string; newStageId: string } | null>(null);
  const [scoreQuestions, setScoreQuestions] = useState<ScoreQuestion[]>([]);
  const [scoreAnswers, setScoreAnswers] = useState<Record<string, string>>({});

  // Fetch pipelines
  useEffect(() => {
    if (!user) return;
    supabase.from("pipelines").select("*").then(({ data }) => {
      const p = (data || []) as Pipeline[];
      setPipelines(p);
      const def = p.find(x => x.is_default) || p[0];
      if (def) setActivePipelineId(def.id);
    });
  }, [user]);

  // Fetch stages for active pipeline
  useEffect(() => {
    if (!activePipelineId) return;
    supabase
      .from("pipeline_stages")
      .select("*")
      .eq("pipeline_id", activePipelineId)
      .order("position")
      .then(({ data }) => setStages((data || []) as PipelineStage[]));
  }, [activePipelineId]);

  // Fetch leads for active pipeline
  useEffect(() => {
    if (!user || !activePipelineId) return;
    supabase
      .from("leads")
      .select("*")
      .eq("pipeline_id", activePipelineId)
      .order("icp_score", { ascending: false })
      .then(({ data }) => setLeads((data || []) as Lead[]));
  }, [user, activePipelineId]);

  // Fetch score questions
  useEffect(() => {
    if (!user) return;
    supabase
      .from("lead_score_questions")
      .select("*")
      .eq("active", true)
      .order("position")
      .then(({ data }) => {
        setScoreQuestions((data || []).map((q: any) => ({
          ...q,
          options: Array.isArray(q.options) ? q.options : [],
        })));
      });
  }, [user]);

  const openDrawer = async (lead: Lead) => {
    setSelectedLead(lead);
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("lead_id", lead.id)
      .order("sent_at", { ascending: true });
    setMessages((data || []) as Message[]);
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const newStageId = result.destination.droppableId;
    const leadId = result.draggableId;
    const lead = leads.find(l => l.id === leadId);
    if (!lead || lead.stage_id === newStageId) return;

    if (scoreQuestions.length > 0) {
      setPendingDrop({ leadId, newStageId });
      setScoreAnswers({});
      setScoreModalOpen(true);
    } else {
      await moveLeadToStage(leadId, newStageId, 0);
    }
  };

  const moveLeadToStage = async (leadId: string, newStageId: string, newScore: number) => {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage_id: newStageId, lead_score: newScore, icp_score: newScore } : l));
    await supabase.from("leads").update({ stage_id: newStageId, lead_score: newScore, icp_score: newScore }).eq("id", leadId);
  };

  const handleScoreSubmit = async () => {
    if (!pendingDrop || !user) return;
    let totalScore = 0;
    const answersToSave = scoreQuestions.map(q => {
      const ans = scoreAnswers[q.id] || "";
      const contribution = ans ? q.weight : 0;
      totalScore += contribution;
      return {
        lead_id: pendingDrop.leadId,
        question_id: q.id,
        user_id: user.id,
        answer: ans,
        score_contribution: contribution,
      };
    });

    await supabase.from("lead_score_answers").insert(answersToSave);
    await moveLeadToStage(pendingDrop.leadId, pendingDrop.newStageId, totalScore);
    setScoreModalOpen(false);
    setPendingDrop(null);
    toast.success("Lead movido e score atualizado!");
  };

  const toggleHumanMode = async (lead: Lead) => {
    const newMode = !lead.is_human_mode;
    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, is_human_mode: newMode } : l));
    await supabase.from("leads").update({ is_human_mode: newMode }).eq("id", lead.id);
    toast.success(newMode ? "Modo humano ativado" : "IA reativada");
  };

  const getStageLeads = (stageId: string) => leads.filter(l => l.stage_id === stageId);

  const getScoreBadgeColor = (score: number) => {
    if (score >= 70) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (score >= 40) return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    return "bg-red-500/20 text-red-400 border-red-500/30";
  };

  const getAvgScore = (stageId: string) => {
    const sl = getStageLeads(stageId);
    if (sl.length === 0) return 0;
    return Math.round(sl.reduce((sum, l) => sum + (l.icp_score || 0), 0) / sl.length);
  };

  // If no pipelines exist, show empty state
  if (pipelines.length === 0 && !activePipelineId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h1 className="text-2xl font-bold">Kanban</h1>
        <p className="text-muted-foreground">Nenhum pipeline encontrado. Crie um pipeline primeiro em <span className="text-primary">/pipelines</span>.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kanban</h1>
          <p className="text-muted-foreground text-sm">Arraste leads entre etapas do pipeline</p>
        </div>
        {pipelines.length > 1 && (
          <Select value={activePipelineId || ""} onValueChange={setActivePipelineId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Pipeline" />
            </SelectTrigger>
            <SelectContent>
              {pipelines.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.map(stage => {
            const stageLeads = getStageLeads(stage.id);
            return (
              <Droppable droppableId={stage.id} key={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-shrink-0 w-72 rounded-lg border border-border p-3 transition-colors ${snapshot.isDraggingOver ? "bg-primary/5 border-primary/30" : "bg-card/50"}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                        <h3 className="font-semibold text-sm">{stage.name}</h3>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{stageLeads.length}</span>
                        <span className="text-xs text-muted-foreground">avg: {getAvgScore(stage.id)}</span>
                      </div>
                    </div>
                    <div className="space-y-2 min-h-[200px]">
                      {stageLeads.map((lead, index) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`glass-card p-3 cursor-pointer transition-shadow ${snapshot.isDragging ? "shadow-lg glow-primary" : "hover:border-primary/30"}`}
                              onClick={() => openDrawer(lead)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{lead.full_name}</p>
                                  <p className="text-xs text-muted-foreground truncate">{lead.company || "—"} • {lead.job_title || "—"}</p>
                                </div>
                                <div className="flex items-center gap-1 ml-2">
                                  {lead.is_human_mode ? (
                                    <User className="h-3.5 w-3.5 text-amber-400" />
                                  ) : lead.ai_agent_id ? (
                                    <Bot className="h-3.5 w-3.5 text-primary" />
                                  ) : null}
                                </div>
                              </div>
                              <div className="flex items-center justify-between mt-2 gap-1 flex-wrap">
                                <span className={`text-xs font-mono px-1.5 py-0.5 rounded border ${getScoreBadgeColor(lead.icp_score || 0)}`}>
                                  {lead.icp_score || 0}
                                </span>
                                {lead.whatsapp && (
                                  <a
                                    href={`https://wa.me/${lead.whatsapp.replace(/\D/g, "")}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    className="text-emerald-400 hover:text-emerald-300"
                                  >
                                    <Phone className="h-3.5 w-3.5" />
                                  </a>
                                )}
                                {lead.provider_source && (
                                  <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{lead.provider_source}</span>
                                )}
                                {lead.signal_type && (
                                  <span className="text-[10px] text-primary">{lead.signal_type}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 mt-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-[10px]"
                                  onClick={e => { e.stopPropagation(); toggleHumanMode(lead); }}
                                >
                                  {lead.is_human_mode ? "Reativar IA" : "Assumir"}
                                </Button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            );
          })}
        </div>
      </DragDropContext>

      {/* Lead Score Modal */}
      <Dialog open={scoreModalOpen} onOpenChange={(open) => { if (!open) { setScoreModalOpen(false); setPendingDrop(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Lead Score — Qualificação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {scoreQuestions.map(q => (
              <div key={q.id} className="space-y-1.5">
                <Label className="text-sm">{q.question} <span className="text-muted-foreground text-xs">(peso: {q.weight})</span></Label>
                {q.type === "select" && q.options.length > 0 ? (
                  <Select value={scoreAnswers[q.id] || ""} onValueChange={v => setScoreAnswers(prev => ({ ...prev, [q.id]: v }))}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {q.options.map((opt: string) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : q.type === "boolean" ? (
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={scoreAnswers[q.id] === "true"}
                      onCheckedChange={v => setScoreAnswers(prev => ({ ...prev, [q.id]: String(v) }))}
                    />
                    <span className="text-sm text-muted-foreground">{scoreAnswers[q.id] === "true" ? "Sim" : "Não"}</span>
                  </div>
                ) : (
                  <Input
                    type={q.type === "number" ? "number" : "text"}
                    value={scoreAnswers[q.id] || ""}
                    onChange={e => setScoreAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder="Resposta..."
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setScoreModalOpen(false); setPendingDrop(null); }}>Cancelar</Button>
            <Button onClick={handleScoreSubmit}>Salvar e Mover</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lead Detail Drawer */}
      <Sheet open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          {selectedLead && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedLead.full_name}</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 mt-6">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Empresa:</span> <span className="ml-1">{selectedLead.company || "—"}</span></div>
                  <div><span className="text-muted-foreground">Cargo:</span> <span className="ml-1">{selectedLead.job_title || "—"}</span></div>
                  <div><span className="text-muted-foreground">Email:</span> <span className="ml-1">{selectedLead.email || "—"}</span></div>
                  <div><span className="text-muted-foreground">WhatsApp:</span> <span className="ml-1">{selectedLead.whatsapp || selectedLead.phone || "—"}</span></div>
                  <div><span className="text-muted-foreground">ICP Score:</span> <span className="ml-1 font-mono">{selectedLead.icp_score}</span></div>
                  <div><span className="text-muted-foreground">Lead Score:</span> <span className="ml-1 font-mono">{selectedLead.lead_score}</span></div>
                  <div><span className="text-muted-foreground">Status:</span> <StatusBadge status={selectedLead.status || "pending"} /></div>
                  <div><span className="text-muted-foreground">Modo:</span> <span className="ml-1">{selectedLead.is_human_mode ? "👤 Humano" : "🤖 IA"}</span></div>
                </div>
                {selectedLead.tags && selectedLead.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedLead.tags.map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                  </div>
                )}
                {selectedLead.ai_context && (
                  <div className="glass-card p-3">
                    <p className="text-xs font-medium text-primary mb-1">Contexto IA</p>
                    <p className="text-sm">{selectedLead.ai_context}</p>
                  </div>
                )}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Histórico de Mensagens</h4>
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {messages.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma mensagem</p>}
                      {messages.map(m => (
                        <div key={m.id} className={`p-2 rounded-lg text-sm ${m.direction === "outbound" ? "bg-primary/10 ml-4" : "bg-muted mr-4"}`}>
                          <p className="text-xs text-muted-foreground mb-1">{m.direction === "outbound" ? "Enviada" : "Recebida"} • {new Date(m.sent_at || "").toLocaleString("pt-BR")}</p>
                          <p>{m.content}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
