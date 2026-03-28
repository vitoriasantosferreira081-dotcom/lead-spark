import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  MessageSquare,
  Send,
  Search,
  Phone,
  User,
  Bot,
  Clock,
  CheckCheck,
  Paperclip,
  MoreVertical,
  ArrowLeft,
} from "lucide-react";
import { format } from "date-fns";

interface Lead {
  id: string;
  full_name: string;
  company: string | null;
  whatsapp: string | null;
  phone: string | null;
  status: string | null;
  is_human_mode: boolean | null;
  ai_agent_id: string | null;
}

interface Message {
  id: string;
  lead_id: string;
  content: string;
  direction: "outbound" | "inbound";
  sent_at: string | null;
  user_id: string;
}

export default function WhatsAppInbox() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMobileChat, setIsMobileChat] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadLeads();
  }, [user]);

  useEffect(() => {
    if (selectedLead) {
      loadMessages(selectedLead.id);
    }
  }, [selectedLead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime subscription for messages
  useEffect(() => {
    if (!selectedLead) return;
    const channel = supabase
      .channel(`messages-${selectedLead.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `lead_id=eq.${selectedLead.id}` }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedLead]);

  const loadLeads = async () => {
    const { data } = await supabase
      .from("leads")
      .select("id, full_name, company, whatsapp, phone, status, is_human_mode, ai_agent_id")
      .or("whatsapp.neq.,phone.neq.")
      .order("updated_at", { ascending: false });
    setLeads((data || []) as Lead[]);
  };

  const loadMessages = async (leadId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("lead_id", leadId)
      .order("sent_at", { ascending: true });
    setMessages((data || []) as Message[]);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedLead || !user) return;
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      lead_id: selectedLead.id,
      content: newMessage,
      direction: "outbound" as const,
      user_id: user.id,
    });
    if (error) {
      toast.error("Erro ao enviar mensagem");
    } else {
      setNewMessage("");
    }
    setSending(false);
  };

  const filteredLeads = leads.filter(l =>
    l.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.company || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (l.whatsapp || "").includes(searchQuery)
  );

  const getLastMessage = (leadId: string) => {
    // This would ideally come from a joined query, simplified here
    return null;
  };

  const selectLead = (lead: Lead) => {
    setSelectedLead(lead);
    setIsMobileChat(true);
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">WhatsApp</h1>
        <Badge variant="outline" className="ml-2">{leads.length} conversas</Badge>
      </div>

      <div className="flex-1 flex border border-border rounded-lg overflow-hidden bg-card min-h-0">
        {/* Sidebar - Contact List */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-border flex flex-col ${isMobileChat ? "hidden md:flex" : "flex"}`}>
          {/* Search */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar conversa..."
                className="pl-9"
              />
            </div>
          </div>

          {/* Contact List */}
          <ScrollArea className="flex-1">
            {filteredLeads.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhuma conversa encontrada</p>
                <p className="text-xs mt-1">Leads com WhatsApp aparecerão aqui</p>
              </div>
            ) : (
              filteredLeads.map(lead => (
                <div
                  key={lead.id}
                  onClick={() => selectLead(lead)}
                  className={`flex items-center gap-3 p-3 cursor-pointer border-b border-border/50 hover:bg-muted/50 transition-colors ${selectedLead?.id === lead.id ? "bg-muted" : ""}`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-foreground font-medium text-sm">
                    {lead.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm truncate">{lead.full_name}</p>
                      {lead.is_human_mode ? (
                        <User className="h-3 w-3 text-muted-foreground shrink-0" />
                      ) : lead.ai_agent_id ? (
                        <Bot className="h-3 w-3 text-primary shrink-0" />
                      ) : null}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground truncate">{lead.company || lead.whatsapp || lead.phone}</p>
                      <Badge variant="outline" className="text-[9px] shrink-0 ml-1">
                        {lead.status || "pending"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${!isMobileChat && !selectedLead ? "hidden md:flex" : "flex"} ${isMobileChat && selectedLead ? "flex" : !selectedLead ? "" : ""}`}>
          {selectedLead ? (
            <>
              {/* Chat Header */}
              <div className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setIsMobileChat(false)}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground font-medium text-sm">
                    {selectedLead.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{selectedLead.full_name}</p>
                    <p className="text-xs text-muted-foreground">{selectedLead.whatsapp || selectedLead.phone || selectedLead.company}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {selectedLead.whatsapp && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <a href={`https://wa.me/${selectedLead.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                        <Phone className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-3 max-w-3xl mx-auto">
                  {messages.length === 0 && (
                    <div className="text-center text-muted-foreground text-sm py-12">
                      <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p>Nenhuma mensagem ainda</p>
                      <p className="text-xs mt-1">Envie a primeira mensagem para iniciar a conversa</p>
                    </div>
                  )}
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-xl px-4 py-2 text-sm ${
                          msg.direction === "outbound"
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted text-foreground rounded-bl-sm"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <div className={`flex items-center gap-1 mt-1 ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                          <span className="text-[10px] opacity-60">
                            {msg.sent_at ? format(new Date(msg.sent_at), "HH:mm") : "..."}
                          </span>
                          {msg.direction === "outbound" && <CheckCheck className="h-3 w-3 opacity-60" />}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="border-t border-border p-3 shrink-0">
                <div className="flex items-center gap-2 max-w-3xl mx-auto">
                  <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Digite uma mensagem..."
                    className="flex-1"
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  />
                  <Button
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">Althius WhatsApp</p>
                <p className="text-sm mt-1">Selecione uma conversa para começar</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
