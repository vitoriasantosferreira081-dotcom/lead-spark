export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      campaigns: {
        Row: {
          created_at: string | null
          id: string
          leads_count: number | null
          message_template: string | null
          name: string
          replied_count: number | null
          status: Database["public"]["Enums"]["campaign_status"] | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          leads_count?: number | null
          message_template?: string | null
          name: string
          replied_count?: number | null
          status?: Database["public"]["Enums"]["campaign_status"] | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          leads_count?: number | null
          message_template?: string | null
          name?: string
          replied_count?: number | null
          status?: Database["public"]["Enums"]["campaign_status"] | null
          user_id?: string
        }
        Relationships: []
      }
      integrations_config: {
        Row: {
          active: boolean | null
          api_key_secret_name: string | null
          extra_config: Json | null
          id: string
          layer: string
          provider: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          api_key_secret_name?: string | null
          extra_config?: Json | null
          id?: string
          layer: string
          provider: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          api_key_secret_name?: string | null
          extra_config?: Json | null
          id?: string
          layer?: string
          provider?: string
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          ai_context: string | null
          company: string | null
          created_at: string | null
          email: string | null
          full_name: string
          icp_score: number | null
          id: string
          job_title: string | null
          linkedin_url: string | null
          phone: string | null
          provider_source: string | null
          signal_type: string | null
          status: Database["public"]["Enums"]["lead_status"] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_context?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          icp_score?: number | null
          id?: string
          job_title?: string | null
          linkedin_url?: string | null
          phone?: string | null
          provider_source?: string | null
          signal_type?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_context?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          icp_score?: number | null
          id?: string
          job_title?: string | null
          linkedin_url?: string | null
          phone?: string | null
          provider_source?: string | null
          signal_type?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          campaign_id: string | null
          content: string
          direction: Database["public"]["Enums"]["message_direction"]
          id: string
          lead_id: string
          sent_at: string | null
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          content: string
          direction: Database["public"]["Enums"]["message_direction"]
          id?: string
          lead_id: string
          sent_at?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          content?: string
          direction?: Database["public"]["Enums"]["message_direction"]
          id?: string
          lead_id?: string
          sent_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      signals: {
        Row: {
          actor_id: string | null
          company: string | null
          created_at: string | null
          domain: string | null
          event_type: string
          id: string
          priority: Database["public"]["Enums"]["signal_priority"] | null
          processed: boolean | null
          source_url: string | null
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          company?: string | null
          created_at?: string | null
          domain?: string | null
          event_type: string
          id?: string
          priority?: Database["public"]["Enums"]["signal_priority"] | null
          processed?: boolean | null
          source_url?: string | null
          user_id: string
        }
        Update: {
          actor_id?: string | null
          company?: string | null
          created_at?: string | null
          domain?: string | null
          event_type?: string
          id?: string
          priority?: Database["public"]["Enums"]["signal_priority"] | null
          processed?: boolean | null
          source_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      campaign_status: "draft" | "running" | "paused" | "done"
      lead_status:
        | "pending"
        | "enriched"
        | "contacted"
        | "replied"
        | "interested"
        | "no-reply"
        | "churned"
      message_direction: "outbound" | "inbound"
      signal_priority: "hot" | "warm" | "cold"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      campaign_status: ["draft", "running", "paused", "done"],
      lead_status: [
        "pending",
        "enriched",
        "contacted",
        "replied",
        "interested",
        "no-reply",
        "churned",
      ],
      message_direction: ["outbound", "inbound"],
      signal_priority: ["hot", "warm", "cold"],
    },
  },
} as const
