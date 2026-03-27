import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  enriched: "bg-primary/20 text-primary",
  contacted: "bg-warning/20 text-warning",
  replied: "bg-success/20 text-success",
  interested: "bg-success/30 text-success",
  "no-reply": "bg-destructive/20 text-destructive",
  churned: "bg-destructive/10 text-muted-foreground",
  draft: "bg-muted text-muted-foreground",
  running: "bg-success/20 text-success",
  paused: "bg-warning/20 text-warning",
  done: "bg-primary/20 text-primary",
  hot: "bg-destructive/20 text-destructive",
  warm: "bg-warning/20 text-warning",
  cold: "bg-primary/20 text-primary",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  enriched: "Enriquecido",
  contacted: "Contatado",
  replied: "Respondeu",
  interested: "Interessado",
  "no-reply": "Sem Resposta",
  churned: "Perdido",
  draft: "Rascunho",
  running: "Ativa",
  paused: "Pausada",
  done: "Finalizada",
  hot: "🔥 Hot",
  warm: "⚡ Warm",
  cold: "❄️ Cold",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("status-badge", statusColors[status] || "bg-muted text-muted-foreground")}>
      {statusLabels[status] || status}
    </span>
  );
}
