import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { StatusBadge } from "@/components/StatusBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type Message = Database["public"]["Tables"]["messages"]["Row"];

const columns = [
  { id: "pending", label: "Pendente" },
  { id: "enriched", label: "Enriquecido" },
  { id: "contacted", label: "Contatado" },
  { id: "replied", label: "Respondeu" },
  { id: "interested", label: "Interessado" },
] as const;

export default function Kanban() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase.from("leads").select("*").order("icp_score", { ascending: false });
      setLeads(data || []);
    };
    fetch();
  }, [user]);

  const openDrawer = async (lead: Lead) => {
    setSelectedLead(lead);
    const { data } = await supabase.from("messages").select("*").eq("lead_id", lead.id).order("sent_at", { ascending: true });
    setMessages(data || []);
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId as Lead["status"];
    const leadId = result.draggableId;
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    const { error } = await supabase.from("leads").update({ status: newStatus }).eq("id", leadId);
    if (error) toast.error("Erro ao mover lead");
  };

  const getColumnLeads = (status: string) => leads.filter(l => l.status === status);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kanban</h1>
        <p className="text-muted-foreground">Arraste leads entre colunas para atualizar status</p>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map(col => (
            <Droppable droppableId={col.id} key={col.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-shrink-0 w-72 rounded-lg border border-border p-3 transition-colors ${snapshot.isDraggingOver ? "bg-primary/5 border-primary/30" : "bg-card/50"}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-sm">{col.label}</h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{getColumnLeads(col.id).length}</span>
                  </div>
                  <div className="space-y-2 min-h-[200px]">
                    {getColumnLeads(col.id).map((lead, index) => (
                      <Draggable key={lead.id} draggableId={lead.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`glass-card p-3 cursor-pointer transition-shadow ${snapshot.isDragging ? "shadow-lg glow-primary" : "hover:border-primary/30"}`}
                            onClick={() => openDrawer(lead)}
                          >
                            <p className="font-medium text-sm">{lead.full_name}</p>
                            <p className="text-xs text-muted-foreground">{lead.company || "—"}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className={`text-xs font-mono ${(lead.icp_score || 0) >= 80 ? "text-success" : "text-muted-foreground"}`}>
                                ICP: {lead.icp_score || 0}
                              </span>
                              {lead.signal_type && <span className="text-xs text-primary">{lead.signal_type}</span>}
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
          ))}
        </div>
      </DragDropContext>

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
                  <div><span className="text-muted-foreground">Telefone:</span> <span className="ml-1">{selectedLead.phone || "—"}</span></div>
                  <div><span className="text-muted-foreground">ICP Score:</span> <span className="ml-1 font-mono">{selectedLead.icp_score}</span></div>
                  <div><span className="text-muted-foreground">Status:</span> <StatusBadge status={selectedLead.status || "pending"} /></div>
                </div>

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
