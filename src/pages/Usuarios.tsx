import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRole, AppRole } from "@/hooks/useRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserPlus, Users, Pencil, UserX, Shield } from "lucide-react";

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  active: boolean | null;
  role?: AppRole;
}

const roleBadge: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  editor: { label: "Editor", variant: "default" },
  gestor: { label: "Gestor", variant: "secondary" },
  visualizador: { label: "Visualizador", variant: "outline" },
};

export default function Usuarios() {
  const { user } = useAuth();
  const { canManage } = useRole();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", confirmPassword: "", role: "visualizador" as AppRole });

  const fetchUsers = async () => {
    if (!user) return;
    const { data: profiles } = await supabase.from("profiles").select("*");
    const { data: roles } = await supabase.from("user_roles").select("*");
    const merged = (profiles || []).map((p: any) => ({
      ...p,
      role: (roles || []).find((r: any) => r.user_id === p.id)?.role || "visualizador",
    }));
    setUsers(merged);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [user]);

  const openAdd = () => {
    setEditUser(null);
    setForm({ full_name: "", email: "", password: "", confirmPassword: "", role: "visualizador" });
    setDialogOpen(true);
  };

  const openEdit = (u: UserProfile) => {
    setEditUser(u);
    setForm({ full_name: u.full_name || "", email: u.email || "", password: "", confirmPassword: "", role: u.role || "visualizador" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.full_name || !form.email) { toast.error("Preencha nome e e-mail"); return; }

    if (editUser) {
      // Update profile
      await supabase.from("profiles").update({ full_name: form.full_name, email: form.email }).eq("id", editUser.id);
      // Update role
      const { data: existingRole } = await supabase.from("user_roles").select("id").eq("user_id", editUser.id);
      if (existingRole && existingRole.length > 0) {
        await supabase.from("user_roles").update({ role: form.role } as any).eq("id", existingRole[0].id);
      } else {
        await supabase.from("user_roles").insert({ user_id: editUser.id, role: form.role } as any);
      }
      toast.success("Usuário atualizado");
    } else {
      // Create new user via signup
      if (!form.password || form.password.length < 6) { toast.error("Senha deve ter no mínimo 6 caracteres"); return; }
      if (form.password !== form.confirmPassword) { toast.error("Senhas não conferem"); return; }

      const { data: signupData, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.full_name } },
      });
      if (error) { toast.error(error.message); return; }
      if (signupData.user) {
        // Profile and role will be created by the app logic
        // We just need to ensure the role is set after creation
        await supabase.from("profiles").upsert({ id: signupData.user.id, full_name: form.full_name, email: form.email } as any);
        await supabase.from("user_roles").upsert({ user_id: signupData.user.id, role: form.role } as any);
      }
      toast.success("Usuário criado! Um e-mail de verificação foi enviado.");
    }
    setDialogOpen(false);
    fetchUsers();
  };

  const toggleActive = async (u: UserProfile) => {
    await supabase.from("profiles").update({ active: !u.active }).eq("id", u.id);
    toast.success(u.active ? "Usuário desativado" : "Usuário reativado");
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" /> Gestão de Usuários
          </h1>
          <p className="text-muted-foreground">Gerencie acessos e permissões</p>
        </div>
        {canManage && (
          <Button onClick={openAdd}>
            <UserPlus className="mr-2 h-4 w-4" /> Adicionar Usuário
          </Button>
        )}
      </div>

      <Card className="glass-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Tipo de Acesso</TableHead>
                <TableHead>Status</TableHead>
                {canManage && <TableHead className="text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Carregando...</TableCell></TableRow>
              ) : users.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum usuário encontrado</TableCell></TableRow>
              ) : (
                users.map((u) => {
                  const rb = roleBadge[u.role || "visualizador"];
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                      <TableCell>{u.email || "—"}</TableCell>
                      <TableCell><Badge variant={rb.variant}>{rb.label}</Badge></TableCell>
                      <TableCell>
                        <Badge variant={u.active !== false ? "default" : "outline"} className={u.active !== false ? "bg-emerald-600/20 text-emerald-400 border-emerald-600/30" : "text-muted-foreground"}>
                          {u.active !== false ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      {canManage && (
                        <TableCell className="text-right space-x-2">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(u)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => toggleActive(u)}>
                            <UserX className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editUser ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome completo *</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Nome completo" /></div>
            <div><Label>E-mail *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@empresa.com" disabled={!!editUser} /></div>
            {!editUser && (
              <>
                <div><Label>Senha *</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 6 caracteres" /></div>
                <div><Label>Confirmar Senha *</Label><Input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Repita a senha" /></div>
              </>
            )}
            <div>
              <Label>Tipo de Acesso</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as AppRole })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="visualizador">Visualizador</SelectItem>
                  <SelectItem value="gestor">Gestor</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar Usuário</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
