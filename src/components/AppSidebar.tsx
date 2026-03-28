import { LayoutDashboard, Users, Columns3, Megaphone, Radio, Settings, LogOut, Rocket, GitBranch, Bot, Building2, Shield } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRole } from "@/hooks/useRole";
import althiusLogo from "@/assets/althius-logo.png";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

const mainNav = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Leads", url: "/leads", icon: Users },
  { title: "Kanban", url: "/kanban", icon: Columns3 },
  { title: "Campanhas", url: "/campanhas", icon: Megaphone },
  { title: "Sinais", url: "/sinais", icon: Radio },
];

const pipelineNav = [
  { title: "Pipelines", url: "/pipelines", icon: GitBranch },
  { title: "Automações", url: "/automacoes", icon: Rocket },
  { title: "Agentes IA", url: "/agentes", icon: Bot },
];

const adminNav = [
  { title: "Organizações", url: "/organizacoes", icon: Building2 },
  { title: "Usuários", url: "/usuarios", icon: Shield },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut } = useAuth();
  const { canEdit, canManage } = useRole();

  const renderItems = (items: typeof mainNav) => (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild>
            <NavLink
              to={item.url}
              end={item.url === "/"}
              className="hover:bg-sidebar-accent/50"
              activeClassName="bg-sidebar-accent text-primary font-medium"
            >
              <item.icon className="mr-2 h-4 w-4" />
              {!collapsed && <span>{item.title}</span>}
            </NavLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <div className="flex items-center gap-2 px-2 py-4">
            <img src={althiusLogo} alt="Althius" className="h-8 w-8 shrink-0 rounded-md object-contain bg-foreground/10 p-0.5" />
            {!collapsed && <span className="text-lg font-bold text-foreground">Althius CRM</span>}
          </div>
          </div>
          <SidebarGroupLabel>Principal</SidebarGroupLabel>
          <SidebarGroupContent>{renderItems(mainNav)}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Pipeline</SidebarGroupLabel>
          <SidebarGroupContent>{renderItems(canEdit ? pipelineNav : pipelineNav.filter(i => i.url !== "/automacoes"))}</SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Administração</SidebarGroupLabel>
          <SidebarGroupContent>{renderItems(canManage ? adminNav : adminNav.filter(i => i.url !== "/usuarios"))}</SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Button variant="ghost" size="sm" onClick={() => signOut()} className="w-full justify-start text-muted-foreground hover:text-foreground">
          <LogOut className="mr-2 h-4 w-4" />
          {!collapsed && "Sair"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
