import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Building2, Plus, FolderOpen, ArrowLeft, Pencil, Trash2 } from "lucide-react";

interface Org {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
}

interface Project {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  active: boolean;
  created_at: string;
}

export default function Organizacoes() {
  const { user } = useAuth();
  const { canEdit } = useRole();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Org | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [orgDialog, setOrgDialog] = useState(false);
  const [projDialog, setProjDialog] = useState(false);
  const [editOrg, setEditOrg] = useState<Org | null>(null);
  const [orgForm, setOrgForm] = useState({ name: "", description: "" });
  const [projForm, setProjForm] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(true);

  const fetchOrgs = async () => {
    const { data } = await supabase.from("organizations").select("*").order("created_at", { ascending: false });
    setOrgs((data as any[]) || []);
    setLoading(false);
  };

  const fetchProjects = async (orgId: string) => {
    const { data } = await supabase.from("projects").select("*").eq("organization_id", orgId).order("created_at", { ascending: false });
    setProjects((data as any[]) || []);
  };

  useEffect(() => { fetchOrgs(); }, [user]);

  useEffect(() => { if (selectedOrg) fetchProjects(selectedOrg.id); }, [selectedOrg]);

  const openAddOrg = () => { setEditOrg(null); setOrgForm({ name: "", description: "" }); setOrgDialog(true); };
  const openEditOrg = (o: Org) => { setEditOrg(o); setOrgForm({ name: o.name, description: o.description || "" }); setOrgDialog(true); };

  const saveOrg = async () => {
    if (!orgForm.name) { toast.error("Nome obrigatório"); return; }
    if (editOrg) {
      await supabase.from("organizations").update({ name: orgForm.name, description: orgForm.description } as any).eq("id", editOrg.id);
      toast.success("Organização atualizada");
    } else {
      await supabase.from("organizations").insert({ name: orgForm.name, description: orgForm.description, owner_id: user!.id } as any);
      toast.success("Organização criada");
    }
    setOrgDialog(false);
    fetchOrgs();
  };

  const deleteOrg = async (id: string) => {
    await supabase.from("organizations").delete().eq("id", id);
    toast.success("Organização removida");
    if (selectedOrg?.id === id) setSelectedOrg(null);
    fetchOrgs();
  };

  const saveProject = async () => {
    if (!projForm.name || !selectedOrg) { toast.error("Nome obrigatório"); return; }
    await supabase.from("projects").insert({ name: projForm.name, description: projForm.description, organization_id: selectedOrg.id } as any);
    toast.success("Projeto criado");
    setProjDialog(false);
    fetchProjects(selectedOrg.id);
  };

  const deleteProject = async (id: string) => {
    await supabase.from("projects").delete().eq("id", id);
    toast.success("Projeto removido");
    if (selectedOrg) fetchProjects(selectedOrg.id);
  };

  if (selectedOrg) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedOrg(null)}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold">{selectedOrg.name}</h1>
            <p className="text-muted-foreground">{selectedOrg.description || "Sem descrição"}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Projetos</h2>
          {canEdit && <Button size="sm" onClick={() => { setProjForm({ name: "", description: "" }); setProjDialog(true); }}><Plus className="mr-2 h-4 w-4" /> Novo Projeto</Button>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.length === 0 && <p className="text-muted-foreground col-span-full py-8 text-center">Nenhum projeto ainda. Crie o primeiro!</p>}
          {projects.map((p) => (
            <Card key={p.id} className="glass-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{p.name}</CardTitle>
                  <Badge variant={p.active ? "default" : "outline"} className={p.active ? "bg-emerald-600/20 text-emerald-400 border-emerald-600/30" : ""}>
                    {p.active ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
                <CardDescription>{p.description || "Sem descrição"}</CardDescription>
              </CardHeader>
              {canEdit && (
                <CardContent className="pt-0">
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteProject(p.id)}>
                    <Trash2 className="mr-1 h-3 w-3" /> Remover
                  </Button>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        <Dialog open={projDialog} onOpenChange={setProjDialog}>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Projeto</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nome *</Label><Input value={projForm.name} onChange={(e) => setProjForm({ ...projForm, name: e.target.value })} placeholder="Nome do projeto" /></div>
              <div><Label>Descrição</Label><Textarea value={projForm.description} onChange={(e) => setProjForm({ ...projForm, description: e.target.value })} placeholder="Descrição do projeto" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setProjDialog(false)}>Cancelar</Button>
              <Button onClick={saveProject}>Criar Projeto</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" /> Organizações
          </h1>
          <p className="text-muted-foreground">Gerencie suas empresas e projetos</p>
        </div>
        {canEdit && <Button onClick={openAddOrg}><Plus className="mr-2 h-4 w-4" /> Nova Organização</Button>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? <p className="text-muted-foreground col-span-full text-center py-8">Carregando...</p> : orgs.length === 0 ? <p className="text-muted-foreground col-span-full text-center py-8">Nenhuma organização. Crie a primeira!</p> : null}
        {orgs.map((o) => (
          <Card key={o.id} className="glass-card cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedOrg(o)}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" /> {o.name}
                </CardTitle>
                {canEdit && (
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEditOrg(o)}><Pencil className="h-3 w-3" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteOrg(o.id)}><Trash2 className="h-3 w-3" /></Button>
                  </div>
                )}
              </div>
              <CardDescription>{o.description || "Sem descrição"}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xs text-muted-foreground flex items-center gap-1"><FolderOpen className="h-3 w-3" /> Clique para ver projetos</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={orgDialog} onOpenChange={setOrgDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editOrg ? "Editar Organização" : "Nova Organização"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome *</Label><Input value={orgForm.name} onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })} placeholder="Nome da empresa" /></div>
            <div><Label>Descrição</Label><Textarea value={orgForm.description} onChange={(e) => setOrgForm({ ...orgForm, description: e.target.value })} placeholder="Descrição" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrgDialog(false)}>Cancelar</Button>
            <Button onClick={saveOrg}>{editOrg ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
