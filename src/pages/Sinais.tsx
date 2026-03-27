import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Radio, Search as SearchIcon, Play, Settings2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Signal = Database["public"]["Tables"]["signals"]["Row"];

export default function Sinais() {
  const { user } = useAuth();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [actorModal, setActorModal] = useState(false);
  const [actorForm, setActorForm] = useState({ actor_id: "", input_payload: "{}" });
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase.from("signals").select("*").order("created_at", { ascending: false });
      setSignals(data || []);
    };
    fetch();

    const channel = supabase.channel("signals-changes").on("postgres_changes", { event: "*", schema: "public", table: "signals" }, () => fetch()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleRunActor = async () => {
    setRunning(true);
    try {
      let payload: any;
      try { payload = JSON.parse(actorForm.input_payload); } catch { toast.error("JSON inválido"); setRunning(false); return; }
      const response = await supabase.functions.invoke("signals", {
        body: { actor_id: actorForm.actor_id, input_payload: payload }
      });
      if (response.error) throw response.error;
      toast.success("Actor executado com sucesso!");
      setActorModal(false);
    } catch {
      toast.error("Erro ao executar actor");
    } finally {
      setRunning(false);
    }
  };

  const handleProspectCompany = (domain: string) => {
    toast.info(`Prospectando ${domain}... (configure provedor em Configurações)`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Radio className="h-6 w-6 text-primary" /> Sinais de Mercado
          </h1>
          <p className="text-muted-foreground">{signals.length} sinais capturados</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={actorModal} onOpenChange={setActorModal}>
            <DialogTrigger asChild>
              <Button variant="secondary"><Settings2 className="mr-2 h-4 w-4" /> Configurar Actor</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Executar Apify Actor</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Actor ID</Label><Input value={actorForm.actor_id} onChange={e => setActorForm(f => ({ ...f, actor_id: e.target.value }))} placeholder="ex: apify/google-search-scraper" /></div>
                <div><Label>Input Payload (JSON)</Label><Textarea value={actorForm.input_payload} onChange={e => setActorForm(f => ({ ...f, input_payload: e.target.value }))} rows={6} /></div>
                <Button className="w-full" onClick={handleRunActor} disabled={running}>
                  <Play className="mr-2 h-4 w-4" /> {running ? "Executando..." : "Executar Actor"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="space-y-3">
        {signals.length === 0 && (
          <Card className="glass-card"><CardContent className="py-12 text-center text-muted-foreground">Nenhum sinal capturado ainda. Configure um actor Apify ou envie sinais via webhook.</CardContent></Card>
        )}
        {signals.map(s => (
          <Card key={s.id} className="glass-card hover:border-primary/30 transition-colors">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-medium">{s.company || s.domain || "—"}</p>
                  <p className="text-sm text-muted-foreground">{s.event_type} • {new Date(s.created_at || "").toLocaleDateString("pt-BR")}</p>
                  {s.source_url && <a href={s.source_url} target="_blank" rel="noopener" className="text-xs text-primary hover:underline">Ver fonte →</a>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={s.priority || "cold"} />
                <Button variant="ghost" size="sm" onClick={() => handleProspectCompany(s.domain || s.company || "")}>
                  <SearchIcon className="h-4 w-4 mr-1" /> Prospectar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
