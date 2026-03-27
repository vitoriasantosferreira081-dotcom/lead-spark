import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Send } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Campaign = Database["public"]["Tables"]["campaigns"]["Row"];

export default function Campanhas() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", message_template: "" });
  const [sendingCampaign, setSendingCampaign] = useState<string | null>(null);
  const [sendProgress, setSendProgress] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false });
      setCampaigns(data || []);
    };
    fetch();
  }, [user]);

  const handleCreate = async () => {
    if (!user || !form.name) return;
    const { error } = await supabase.from("campaigns").insert({ name: form.name, message_template: form.message_template, user_id: user.id });
    if (error) { toast.error("Erro ao criar campanha"); return; }
    toast.success("Campanha criada!");
    setCreateOpen(false);
    setForm({ name: "", message_template: "" });
    const { data } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false });
    setCampaigns(data || []);
  };

  const handleDispatch = async (campaign: Campaign) => {
    setSendingCampaign(campaign.id);
    setSendProgress(0);
    const { data: leads } = await supabase.from("leads").select("*").in("status", ["enriched", "pending"]);
    if (!leads || leads.length === 0) { toast.error("Nenhum lead elegível"); setSendingCampaign(null); return; }

    for (let i = 0; i < leads.length; i++) {
      try {
        await supabase.functions.invoke("outreach", {
          body: { lead_id: leads[i].id, campaign_id: campaign.id, message: campaign.message_template || "" }
        });
      } catch { /* continue */ }
      setSendProgress(Math.round(((i + 1) / leads.length) * 100));
    }

    await supabase.from("campaigns").update({ status: "running" as Campaign["status"], leads_count: leads.length }).eq("id", campaign.id);
    toast.success("Disparo concluído!");
    setSendingCampaign(null);
    const { data } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false });
    setCampaigns(data || []);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campanhas</h1>
          <p className="text-muted-foreground">{campaigns.length} campanhas</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Nova Campanha</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova Campanha</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nome</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Outbound Q1 2025" /></div>
              <div>
                <Label>Template da Mensagem</Label>
                <Textarea value={form.message_template} onChange={e => setForm(f => ({ ...f, message_template: e.target.value }))} placeholder="Olá {{first_name}}, vi que a {{company}} está {{context}}..." rows={4} />
                <p className="text-xs text-muted-foreground mt-1">Variáveis: {"{{first_name}}"}, {"{{company}}"}, {"{{context}}"}</p>
              </div>
              {form.message_template && (
                <Card className="glass-card">
                  <CardContent className="p-3">
                    <p className="text-xs font-medium text-primary mb-1">Preview</p>
                    <p className="text-sm">{form.message_template.replace("{{first_name}}", "João").replace("{{company}}", "Acme Corp").replace("{{context}}", "expandindo para o mercado brasileiro")}</p>
                  </CardContent>
                </Card>
              )}
              <Button className="w-full" onClick={handleCreate}>Criar Campanha</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {sendingCampaign && (
        <Card className="glass-card">
          <CardContent className="p-4">
            <p className="text-sm mb-2">Enviando mensagens...</p>
            <Progress value={sendProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">{sendProgress}% concluído</p>
          </CardContent>
        </Card>
      )}

      <Card className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Leads</TableHead>
              <TableHead>Respostas</TableHead>
              <TableHead>Taxa</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campaigns.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma campanha</TableCell></TableRow>
            )}
            {campaigns.map(c => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell><StatusBadge status={c.status || "draft"} /></TableCell>
                <TableCell>{c.leads_count || 0}</TableCell>
                <TableCell>{c.replied_count || 0}</TableCell>
                <TableCell>{c.leads_count ? Math.round(((c.replied_count || 0) / c.leads_count) * 100) : 0}%</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => handleDispatch(c)} disabled={sendingCampaign === c.id}>
                    <Send className="h-4 w-4" />
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
