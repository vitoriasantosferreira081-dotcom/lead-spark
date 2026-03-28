import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AppRole = "visualizador" | "gestor" | "editor" | "admin";

export function useRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setRole(null); setLoading(false); return; }
    const fetchRole = async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .limit(1)
        .single();
      setRole((data?.role as AppRole) || "editor");
      setLoading(false);
    };
    fetchRole();
  }, [user]);

  const isAdmin = role === "admin";
  const canEdit = isAdmin || role === "editor";
  const canManage = isAdmin || role === "editor";
  const isGestor = role === "gestor";
  const isViewer = role === "visualizador";

  return { role, loading, isAdmin, canEdit, canManage, isGestor, isViewer };
}
