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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      dispense_sessions: {
        Row: {
          created_at: string
          id: string
          machine_id: string
          national_id: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          machine_id: string
          national_id?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          machine_id?: string
          national_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "dispense_sessions_national_id_fkey"
            columns: ["national_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["national_id"]
          },
        ]
      }
      quotas: {
        Row: {
          created_at: string
          effective_from: string
          id: string
          national_id: string
          note: string | null
          quota_kg: number
        }
        Insert: {
          created_at?: string
          effective_from?: string
          id?: string
          national_id: string
          note?: string | null
          quota_kg: number
        }
        Update: {
          created_at?: string
          effective_from?: string
          id?: string
          national_id?: string
          note?: string | null
          quota_kg?: number
        }
        Relationships: []
      }
      transactions: {
        Row: {
          changed_kg: number
          id: string
          session_id: string | null
          source_id: string
          target_id: string | null
          timestamp: string
        }
        Insert: {
          changed_kg: number
          id?: string
          session_id?: string | null
          source_id: string
          target_id?: string | null
          timestamp?: string
        }
        Update: {
          changed_kg?: number
          id?: string
          session_id?: string | null
          source_id?: string
          target_id?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "dispense_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["national_id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          id: string
          name: string
          national_id: string
          remaining_quota_kg: number
          role: Database["public"]["Enums"]["role"]
          total_quota_kg: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          national_id: string
          remaining_quota_kg?: number
          role?: Database["public"]["Enums"]["role"]
          total_quota_kg?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          national_id?: string
          remaining_quota_kg?: number
          role?: Database["public"]["Enums"]["role"]
          total_quota_kg?: number
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
      role: "farmer" | "admin"
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
      role: ["farmer", "admin"],
    },
  },
} as const
