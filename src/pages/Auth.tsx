import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Rocket } from "lucide-react";

export default function Auth() {
  const { user, loading, signIn, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><div className="animate-pulse-glow text-primary text-2xl font-bold">Carregando...</div></div>;
  if (user) return <Navigate to="/" replace />;

  const handleAuth = async (mode: "login" | "signup") => {
    if (!email || !password) { toast.error("Preencha todos os campos"); return; }
    setIsSubmitting(true);
    try {
      if (mode === "login") {
        await signIn(email, password);
        toast.success("Login realizado!");
      } else {
        await signUp(email, password);
        toast.success("Conta criada! Verifique seu email.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro de autenticação");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md glass-card">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg gradient-primary">
            <Rocket className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Althius CRM</CardTitle>
          <CardDescription>Plataforma de Go-to-Market Engineering</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar Conta</TabsTrigger>
            </TabsList>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAuth("login")} />
              </div>
              <TabsContent value="login" className="mt-0">
                <Button className="w-full" onClick={() => handleAuth("login")} disabled={isSubmitting}>
                  {isSubmitting ? "Entrando..." : "Entrar"}
                </Button>
              </TabsContent>
              <TabsContent value="signup" className="mt-0">
                <Button className="w-full" onClick={() => handleAuth("signup")} disabled={isSubmitting}>
                  {isSubmitting ? "Criando..." : "Criar Conta"}
                </Button>
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
