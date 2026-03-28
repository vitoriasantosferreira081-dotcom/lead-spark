import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Building2, Users, LayoutDashboard, GitBranch, Bot } from "lucide-react";

const steps = [
  { icon: LayoutDashboard, title: "Dashboard", desc: "Acompanhe métricas de pipeline, taxas de resposta e conversões em tempo real." },
  { icon: Building2, title: "Organizações & Projetos", desc: "Gerencie múltiplas empresas e projetos dentro de cada organização." },
  { icon: Users, title: "Gestão de Usuários", desc: "Adicione membros com diferentes níveis de acesso: Visualizador, Gestor ou Editor." },
  { icon: GitBranch, title: "Automações & Pipelines", desc: "Configure fluxos automatizados de atendimento e acompanhamento de leads." },
  { icon: Bot, title: "Agentes IA", desc: "Treine agentes inteligentes para qualificar e responder leads automaticamente." },
];

export function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem("altius_onboarding_done");
    if (!seen) setOpen(true);
  }, []);

  const finish = () => {
    localStorage.setItem("altius_onboarding_done", "true");
    setOpen(false);
  };

  const current = steps[step];
  const Icon = current.icon;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) finish(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">{current.title}</DialogTitle>
          <DialogDescription className="text-center">{current.desc}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center gap-1.5 py-2">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 w-6 rounded-full transition-colors ${i === step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>
        <DialogFooter className="flex-row gap-2 sm:justify-between">
          <Button variant="ghost" onClick={finish} className="text-muted-foreground">Pular</Button>
          <Button onClick={() => step < steps.length - 1 ? setStep(step + 1) : finish()}>
            {step < steps.length - 1 ? "Próximo" : "Começar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
