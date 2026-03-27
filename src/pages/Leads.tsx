import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Search, Plus, Sparkles, Info } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];

export default function Leads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filtered, setFiltered] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [prospectOpen, setProspectOpen] = useState(false);
  const [prospectForm, setProspectForm] = useState({ job_title: "", industry: "", company_size: "", location: "" });

  useEffect(() => {
    if (!user) return;
    const fetchLeads = async () => {
      const { data } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
      setLeads(data || []);
    };
    fetchLeads();

    const channel = supabase.channel("leads-changes").on("postgres_changes", { event: "*", schema: "public", table: "leads" }, () => fetchLeads()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    let f = leads;
    if (search) f = f.filter(l => l.full_name.toLowerCase().includes(search.toLowerCase()) || l.company?.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter !== "all") f = f.filter(l => l.status === statusFilter);
    setFiltered(f);
  }, [leads, search, statusFilter]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleEnrich = async (leadIds: string[]) => {
    toast.info(`Enriquecendo ${leadIds.length} lead(s)...`);
    for (const id of leadIds) {
      try {
        const response = await supabase.functions.invoke("enrich", { body: { lead_id: id } });
        if (response.error) throw response.error;
      } catch {
        toast.error(`Erro ao enriquecer lead`);
      }
    }
    toast.success("Enriquecimento concluído!");
  };

  const handleProspect = async () => {
    toast.info("Prospectando...");
    setProspectOpen(false);
    try {
      const response = await supabase.functions.invoke("prospect", { body: prospectForm });
      if (response.error) throw response.error;
      toast.success(`Prospecção concluída!`);
    } catch {
      toast.error("Erro na prospecção");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-muted-foreground">{filtered.length} leads encontrados</p>
        </div>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <Button variant="secondary" onClick={() => handleEnrich(Array.from(selected))}>
              <Sparkles className="mr-2 h-4 w-4" /> Enriquecer ({selected.size})
            </Button>
          )}
          <Dialog open={prospectOpen} onOpenChange={setProspectOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Prospectar</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova Prospecção</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Cargo</Label><Input value={prospectForm.job_title} onChange={e => setProspectForm(p => ({ ...p, job_title: e.target.value }))} placeholder="Ex: CTO, Head of Sales" /></div>
                <div><Label>Indústria</Label><Input value={prospectForm.industry} onChange={e => setProspectForm(p => ({ ...p, industry: e.target.value }))} placeholder="Ex: SaaS, Fintech" /></div>
                <div><Label>Tamanho</Label><Input value={prospectForm.company_size} onChange={e => setProspectForm(p => ({ ...p, company_size: e.target.value }))} placeholder="Ex: 50-200" /></div>
                <div><Label>Localização</Label><Input value={prospectForm.location} onChange={e => setProspectForm(p => ({ ...p, location: e.target.value }))} placeholder="Ex: Brasil" /></div>
                <Button className="w-full" onClick={handleProspect}>Prospectar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-10" placeholder="Buscar por nome ou empresa..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="enriched">Enriquecido</SelectItem>
            <SelectItem value="contacted">Contatado</SelectItem>
            <SelectItem value="replied">Respondeu</SelectItem>
            <SelectItem value="interested">Interessado</SelectItem>
            <SelectItem value="no-reply">Sem Resposta</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"><Checkbox checked={selected.size === filtered.length && filtered.length > 0} onCheckedChange={(c) => setSelected(c ? new Set(filtered.map(l => l.id)) : new Set())} /></TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>ICP Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sinal</TableHead>
              <TableHead>Fonte</TableHead>
              <TableHead>Contexto IA</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">Nenhum lead encontrado</TableCell></TableRow>
            )}
            {filtered.map(lead => (
              <TableRow key={lead.id}>
                <TableCell><Checkbox checked={selected.has(lead.id)} onCheckedChange={() => toggleSelect(lead.id)} /></TableCell>
                <TableCell className="font-medium">{lead.full_name}</TableCell>
                <TableCell>{lead.company || "—"}</TableCell>
                <TableCell>{lead.job_title || "—"}</TableCell>
                <TableCell>
                  <span className={`font-mono text-sm ${(lead.icp_score || 0) >= 80 ? "text-success" : (lead.icp_score || 0) >= 50 ? "text-warning" : "text-muted-foreground"}`}>
                    {lead.icp_score || 0}
                  </span>
                </TableCell>
                <TableCell><StatusBadge status={lead.status || "pending"} /></TableCell>
                <TableCell className="text-sm">{lead.signal_type || "—"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{lead.provider_source || "—"}</TableCell>
                <TableCell>
                  {lead.ai_context ? (
                    <Tooltip>
                      <TooltipTrigger><Info className="h-4 w-4 text-primary" /></TooltipTrigger>
                      <TooltipContent className="max-w-xs"><p className="text-sm">{lead.ai_context}</p></TooltipContent>
                    </Tooltip>
                  ) : "—"}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => handleEnrich([lead.id])}>
                    <Sparkles className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

import { Card } from "@/components/ui/card";
