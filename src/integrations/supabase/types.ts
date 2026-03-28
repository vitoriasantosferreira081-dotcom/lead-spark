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
      ai_agents: {
        Row: {
          active: boolean | null
          can_move_leads: boolean | null
          can_score_leads: boolean | null
          channel: string | null
          coexistence_mode: boolean | null
          created_at: string | null
          id: string
          model: string | null
          name: string
          provider: string | null
          system_prompt: string | null
          training_data: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          can_move_leads?: boolean | null
          can_score_leads?: boolean | null
          channel?: string | null
          coexistence_mode?: boolean | null
          created_at?: string | null
          id?: string
          model?: string | null
          name: string
          provider?: string | null
          system_prompt?: string | null
          training_data?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          can_move_leads?: boolean | null
          can_score_leads?: boolean | null
          channel?: string | null
          coexistence_mode?: boolean | null
          created_at?: string | null
          id?: string
          model?: string | null
          name?: string
          provider?: string | null
          system_prompt?: string | null
          training_data?: string | null
          user_id?: string
        }
        Relationships: []
      }
      cadences: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          name: string
          stage_id: string
          steps: Json | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name: string
          stage_id: string
          steps?: Json | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name?: string
          stage_id?: string
          steps?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cadences_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
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
      departments: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          receive_leads: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          receive_leads?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          receive_leads?: boolean | null
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
      lead_score_answers: {
        Row: {
          answer: string | null
          created_at: string | null
          id: string
          lead_id: string
          question_id: string
          score_contribution: number | null
          user_id: string
        }
        Insert: {
          answer?: string | null
          created_at?: string | null
          id?: string
          lead_id: string
          question_id: string
          score_contribution?: number | null
          user_id: string
        }
        Update: {
          answer?: string | null
          created_at?: string | null
          id?: string
          lead_id?: string
          question_id?: string
          score_contribution?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_score_answers_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_score_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "lead_score_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_score_questions: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          options: Json | null
          position: number | null
          question: string
          type: string | null
          user_id: string
          weight: number | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          options?: Json | null
          position?: number | null
          question: string
          type?: string | null
          user_id: string
          weight?: number | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          options?: Json | null
          position?: number | null
          question?: string
          type?: string | null
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          ai_agent_id: string | null
          ai_context: string | null
          company: string | null
          created_at: string | null
          department_id: string | null
          email: string | null
          full_name: string
          icp_score: number | null
          id: string
          is_human_mode: boolean | null
          job_title: string | null
          lead_score: number | null
          linkedin_url: string | null
          phone: string | null
          pipeline_id: string | null
          provider_source: string | null
          signal_type: string | null
          stage_id: string | null
          status: Database["public"]["Enums"]["lead_status"] | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          ai_agent_id?: string | null
          ai_context?: string | null
          company?: string | null
          created_at?: string | null
          department_id?: string | null
          email?: string | null
          full_name: string
          icp_score?: number | null
          id?: string
          is_human_mode?: boolean | null
          job_title?: string | null
          lead_score?: number | null
          linkedin_url?: string | null
          phone?: string | null
          pipeline_id?: string | null
          provider_source?: string | null
          signal_type?: string | null
          stage_id?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          ai_agent_id?: string | null
          ai_context?: string | null
          company?: string | null
          created_at?: string | null
          department_id?: string | null
          email?: string | null
          full_name?: string
          icp_score?: number | null
          id?: string
          is_human_mode?: boolean | null
          job_title?: string | null
          lead_score?: number | null
          linkedin_url?: string | null
          phone?: string | null
          pipeline_id?: string | null
          provider_source?: string | null
          signal_type?: string | null
          stage_id?: string | null
          status?: Database["public"]["Enums"]["lead_status"] | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_ai_agent_id_fkey"
            columns: ["ai_agent_id"]
            isOneToOne: false
            referencedRelation: "ai_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
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
      organization_members: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      pipeline_automations: {
        Row: {
          action_config: Json | null
          action_type: string
          active: boolean | null
          created_at: string | null
          id: string
          stage_id: string
          trigger: string
          user_id: string
        }
        Insert: {
          action_config?: Json | null
          action_type: string
          active?: boolean | null
          created_at?: string | null
          id?: string
          stage_id: string
          trigger: string
          user_id: string
        }
        Update: {
          action_config?: Json | null
          action_type?: string
          active?: boolean | null
          created_at?: string | null
          id?: string
          stage_id?: string
          trigger?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_automations_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      pipeline_stages: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          pipeline_id: string
          position: number
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          pipeline_id: string
          position: number
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          pipeline_id?: string
          position?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id"]
          },
        ]
      }
      pipelines: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean | null
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          active?: boolean | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          active?: boolean | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          active: boolean | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      templates: {
        Row: {
          approved: boolean | null
          body: string
          category: string | null
          channel: string | null
          created_at: string | null
          id: string
          name: string
          user_id: string
          variables: Json | null
        }
        Insert: {
          approved?: boolean | null
          body: string
          category?: string | null
          channel?: string | null
          created_at?: string | null
          id?: string
          name: string
          user_id: string
          variables?: Json | null
        }
        Update: {
          approved?: boolean | null
          body?: string
          category?: string | null
          channel?: string | null
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
          variables?: Json | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_providers: {
        Row: {
          active: boolean | null
          api_key: string | null
          created_at: string | null
          id: string
          name: string
          type: string | null
          user_id: string
          webhook_url: string | null
        }
        Insert: {
          active?: boolean | null
          api_key?: string | null
          created_at?: string | null
          id?: string
          name: string
          type?: string | null
          user_id: string
          webhook_url?: string | null
        }
        Update: {
          active?: boolean | null
          api_key?: string | null
          created_at?: string | null
          id?: string
          name?: string
          type?: string | null
          user_id?: string
          webhook_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "visualizador" | "gestor" | "editor"
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
      app_role: ["visualizador", "gestor", "editor"],
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
