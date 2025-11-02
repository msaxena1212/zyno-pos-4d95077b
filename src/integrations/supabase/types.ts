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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_audit: {
        Row: {
          action_type: string
          created_at: string | null
          id: string
          ip_address: string | null
          module_name: string
          new_value: Json | null
          old_value: Json | null
          resource_id: string | null
          resource_type: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          module_name: string
          new_value?: Json | null
          old_value?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          module_name?: string
          new_value?: Json | null
          old_value?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_audit_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          status: Database["public"]["Enums"]["brand_status"] | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          status?: Database["public"]["Enums"]["brand_status"] | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          status?: Database["public"]["Enums"]["brand_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      offers: {
        Row: {
          approved_by: string | null
          brand_id: string | null
          code: string
          created_at: string | null
          created_by: string | null
          current_usage_count: number | null
          description: string | null
          discount_percentage: number | null
          discount_value: number | null
          eligibility_rules: Json | null
          end_date: string | null
          id: string
          max_discount_cap: number | null
          min_purchase_amount: number | null
          name: string
          start_date: string | null
          status: Database["public"]["Enums"]["offer_status"] | null
          total_usage_limit: number | null
          type: Database["public"]["Enums"]["offer_type"]
          updated_at: string | null
          usage_limit_per_customer: number | null
        }
        Insert: {
          approved_by?: string | null
          brand_id?: string | null
          code: string
          created_at?: string | null
          created_by?: string | null
          current_usage_count?: number | null
          description?: string | null
          discount_percentage?: number | null
          discount_value?: number | null
          eligibility_rules?: Json | null
          end_date?: string | null
          id?: string
          max_discount_cap?: number | null
          min_purchase_amount?: number | null
          name: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["offer_status"] | null
          total_usage_limit?: number | null
          type: Database["public"]["Enums"]["offer_type"]
          updated_at?: string | null
          usage_limit_per_customer?: number | null
        }
        Update: {
          approved_by?: string | null
          brand_id?: string | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          current_usage_count?: number | null
          description?: string | null
          discount_percentage?: number | null
          discount_value?: number | null
          eligibility_rules?: Json | null
          end_date?: string | null
          id?: string
          max_discount_cap?: number | null
          min_purchase_amount?: number | null
          name?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["offer_status"] | null
          total_usage_limit?: number | null
          type?: Database["public"]["Enums"]["offer_type"]
          updated_at?: string | null
          usage_limit_per_customer?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action_type: string
          code: string
          created_at: string | null
          description: string | null
          id: string
          module_name: string
          name: string
        }
        Insert: {
          action_type: string
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          module_name: string
          name: string
        }
        Update: {
          action_type?: string
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          module_name?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          last_login: string | null
          last_name: string | null
          phone: string | null
          status: Database["public"]["Enums"]["user_status"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          first_name?: string | null
          id: string
          last_login?: string | null
          last_name?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_login?: string | null
          last_name?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          conditions: Json | null
          created_at: string | null
          id: string
          permission_id: string | null
          role_id: string | null
        }
        Insert: {
          conditions?: Json | null
          created_at?: string | null
          id?: string
          permission_id?: string | null
          role_id?: string | null
        }
        Update: {
          conditions?: Json | null
          created_at?: string | null
          id?: string
          permission_id?: string | null
          role_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          brand_id: string | null
          code: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          role_level: number | null
          status: Database["public"]["Enums"]["user_status"] | null
          updated_at: string | null
        }
        Insert: {
          brand_id?: string | null
          code: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          role_level?: number | null
          status?: Database["public"]["Enums"]["user_status"] | null
          updated_at?: string | null
        }
        Update: {
          brand_id?: string | null
          code?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          role_level?: number | null
          status?: Database["public"]["Enums"]["user_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roles_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      user_role_assignments: {
        Row: {
          assigned_by: string | null
          assigned_date: string | null
          brand_id: string | null
          end_date: string | null
          id: string
          role_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["user_status"] | null
          user_id: string | null
        }
        Insert: {
          assigned_by?: string | null
          assigned_date?: string | null
          brand_id?: string | null
          end_date?: string | null
          id?: string
          role_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          user_id?: string | null
        }
        Update: {
          assigned_by?: string | null
          assigned_date?: string | null
          brand_id?: string | null
          end_date?: string | null
          id?: string
          role_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["user_status"] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_role_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_role_assignments_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_role_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_role_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_tasks: {
        Row: {
          approval_rule: Json | null
          assigned_to_role_id: string | null
          assigned_to_user_id: string | null
          completed_at: string | null
          created_at: string | null
          due_date: string | null
          escalation_rule: Json | null
          id: string
          status: Database["public"]["Enums"]["workflow_task_status"] | null
          task_name: string
          task_type: Database["public"]["Enums"]["workflow_task_type"]
          updated_at: string | null
          workflow_id: string | null
        }
        Insert: {
          approval_rule?: Json | null
          assigned_to_role_id?: string | null
          assigned_to_user_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          escalation_rule?: Json | null
          id?: string
          status?: Database["public"]["Enums"]["workflow_task_status"] | null
          task_name: string
          task_type: Database["public"]["Enums"]["workflow_task_type"]
          updated_at?: string | null
          workflow_id?: string | null
        }
        Update: {
          approval_rule?: Json | null
          assigned_to_role_id?: string | null
          assigned_to_user_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          escalation_rule?: Json | null
          id?: string
          status?: Database["public"]["Enums"]["workflow_task_status"] | null
          task_name?: string
          task_type?: Database["public"]["Enums"]["workflow_task_type"]
          updated_at?: string | null
          workflow_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_tasks_assigned_to_role_id_fkey"
            columns: ["assigned_to_role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_tasks_assigned_to_user_id_fkey"
            columns: ["assigned_to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: { Args: { user_uuid: string }; Returns: string }
      user_has_permission: {
        Args: { perm_code: string; user_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "manager"
        | "assistant_manager"
        | "supervisor"
        | "cashier"
        | "stock_manager"
        | "finance_officer"
        | "marketing_manager"
        | "support"
      brand_status: "active" | "inactive" | "archived"
      offer_status:
        | "draft"
        | "submitted"
        | "approved"
        | "active"
        | "expired"
        | "archived"
      offer_type:
        | "percentage"
        | "fixed_amount"
        | "bogo"
        | "bundle"
        | "free_item"
        | "tiered"
        | "loyalty"
        | "cashback"
        | "flash"
      user_status: "active" | "inactive" | "suspended"
      workflow_task_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "escalated"
      workflow_task_type:
        | "user_task"
        | "system_task"
        | "approval"
        | "notification"
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
      app_role: [
        "admin",
        "manager",
        "assistant_manager",
        "supervisor",
        "cashier",
        "stock_manager",
        "finance_officer",
        "marketing_manager",
        "support",
      ],
      brand_status: ["active", "inactive", "archived"],
      offer_status: [
        "draft",
        "submitted",
        "approved",
        "active",
        "expired",
        "archived",
      ],
      offer_type: [
        "percentage",
        "fixed_amount",
        "bogo",
        "bundle",
        "free_item",
        "tiered",
        "loyalty",
        "cashback",
        "flash",
      ],
      user_status: ["active", "inactive", "suspended"],
      workflow_task_status: [
        "pending",
        "in_progress",
        "completed",
        "escalated",
      ],
      workflow_task_type: [
        "user_task",
        "system_task",
        "approval",
        "notification",
      ],
    },
  },
} as const
