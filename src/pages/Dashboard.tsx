import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { Users, TrendingUp, Flame, Megaphone, Radio } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { format, subDays } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalLeads: 0, responseRate: 0, hotLeads: 0, activeCampaigns: 0 });
  const [chartData, setChartData] = useState<{ date: string; count: number }[]>([]);
  const [recentSignals, setRecentSignals] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: leads } = await supabase.from("leads").select("*");
      const { data: campaigns } = await supabase.from("campaigns").select("*").eq("status", "running");
      const { data: signals } = await supabase.from("signals").select("*").order("created_at", { ascending: false }).limit(10);

      const total = leads?.length || 0;
      const replied = leads?.filter(l => ["replied", "interested"].includes(l.status || "")).length || 0;
      const contacted = leads?.filter(l => l.status !== "pending" && l.status !== "enriched").length || 0;
      const hot = leads?.filter(l => (l.icp_score || 0) >= 80).length || 0;

      setStats({
        totalLeads: total,
        responseRate: contacted > 0 ? Math.round((replied / contacted) * 100) : 0,
        hotLeads: hot,
        activeCampaigns: campaigns?.length || 0,
      });

      const last30 = Array.from({ length: 30 }, (_, i) => {
        const date = format(subDays(new Date(), 29 - i), "yyyy-MM-dd");
        const count = leads?.filter(l => l.status !== "pending" && l.status !== "enriched" && l.updated_at?.startsWith(date)).length || 0;
        return { date: format(subDays(new Date(), 29 - i), "dd/MM"), count };
      });
      setChartData(last30);
      setRecentSignals(signals || []);
    };
    fetchData();
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pipeline de Contato</h1>
        <p className="text-muted-foreground">Relatório de performance — visão geral da operação</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total de Leads" value={stats.totalLeads} icon={Users} />
        <StatCard title="Taxa de Resposta" value={`${stats.responseRate}%`} icon={TrendingUp} />
        <StatCard title="Leads Quentes" value={stats.hotLeads} icon={Flame} description="ICP Score ≥ 80" />
        <StatCard title="Campanhas Ativas" value={stats.activeCampaigns} icon={Megaphone} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="glass-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Conversões — Leads contatados (30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="fill-muted-foreground" fontSize={12} />
                <YAxis className="fill-muted-foreground" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--card-foreground))",
                  }}
                />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Radio className="h-4 w-4 text-primary" /> Sinais Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSignals.length === 0 && <p className="text-sm text-muted-foreground">Nenhum sinal recebido</p>}
              {recentSignals.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm border-b border-border/50 pb-2">
                  <div>
                    <p className="font-medium">{s.company || "—"}</p>
                    <p className="text-xs text-muted-foreground">{s.event_type}</p>
                  </div>
                  <StatusBadge status={s.priority || "cold"} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
