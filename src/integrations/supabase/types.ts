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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      artist_earnings: {
        Row: {
          artist_id: string
          artist_payout_cents: number
          created_at: string
          gross_amount_cents: number
          id: string
          paid_at: string | null
          platform_fee_cents: number
          purchase_id: string
          status: Database["public"]["Enums"]["earnings_status"]
          stripe_transfer_id: string | null
        }
        Insert: {
          artist_id: string
          artist_payout_cents: number
          created_at?: string
          gross_amount_cents: number
          id?: string
          paid_at?: string | null
          platform_fee_cents: number
          purchase_id: string
          status?: Database["public"]["Enums"]["earnings_status"]
          stripe_transfer_id?: string | null
        }
        Update: {
          artist_id?: string
          artist_payout_cents?: number
          created_at?: string
          gross_amount_cents?: number
          id?: string
          paid_at?: string | null
          platform_fee_cents?: number
          purchase_id?: string
          status?: Database["public"]["Enums"]["earnings_status"]
          stripe_transfer_id?: string | null
        }
        Relationships: []
      }
      collection_bookmarks: {
        Row: {
          created_at: string
          id: string
          track_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          track_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_bookmarks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount_cents: number
          created_at: string
          description: string
          fee_cents: number | null
          id: string
          reference_id: string | null
          stripe_payment_intent_id: string | null
          type: Database["public"]["Enums"]["credit_transaction_type"]
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          description: string
          fee_cents?: number | null
          id?: string
          reference_id?: string | null
          stripe_payment_intent_id?: string | null
          type: Database["public"]["Enums"]["credit_transaction_type"]
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          description?: string
          fee_cents?: number | null
          id?: string
          reference_id?: string | null
          stripe_payment_intent_id?: string | null
          type?: Database["public"]["Enums"]["credit_transaction_type"]
          user_id?: string
        }
        Relationships: []
      }
      credit_wallets: {
        Row: {
          balance_cents: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance_cents?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance_cents?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      label_roster: {
        Row: {
          artist_id: string
          id: string
          joined_at: string
          label_id: string
          status: string
        }
        Insert: {
          artist_id: string
          id?: string
          joined_at?: string
          label_id: string
          status?: string
        }
        Update: {
          artist_id?: string
          id?: string
          joined_at?: string
          label_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "label_roster_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "label_roster_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "label_roster_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "label_roster_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string
          id: string
          track_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          track_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_genres: {
        Row: {
          genre: string
          id: string
          profile_id: string
        }
        Insert: {
          genre: string
          id?: string
          profile_id: string
        }
        Update: {
          genre?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_genres_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_genres_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banner_image_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          is_verified: boolean | null
          onboarding_completed: boolean | null
          stripe_account_id: string | null
          stripe_account_status: string | null
          stripe_payouts_enabled: boolean | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          banner_image_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          is_verified?: boolean | null
          onboarding_completed?: boolean | null
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          stripe_payouts_enabled?: boolean | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          banner_image_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_verified?: boolean | null
          onboarding_completed?: boolean | null
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          stripe_payouts_enabled?: boolean | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          edition_number: number
          id: string
          price_paid: number
          purchased_at: string
          tip_amount: number | null
          track_id: string
          user_id: string
        }
        Insert: {
          edition_number: number
          id?: string
          price_paid: number
          purchased_at?: string
          tip_amount?: number | null
          track_id: string
          user_id: string
        }
        Update: {
          edition_number?: number
          id?: string
          price_paid?: number
          purchased_at?: string
          tip_amount?: number | null
          track_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["app_role"]
          trial_ends_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["app_role"]
          trial_ends_at: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["app_role"]
          trial_ends_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      track_credits: {
        Row: {
          created_at: string
          id: string
          name: string
          role: string
          track_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          role: string
          track_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          role?: string
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_credits_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      track_features: {
        Row: {
          artist_id: string
          created_at: string
          id: string
          track_id: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          id?: string
          track_id: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          id?: string
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_features_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      track_karaoke: {
        Row: {
          created_at: string
          id: string
          instrumental_url: string
          lyrics: string | null
          track_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          instrumental_url: string
          lyrics?: string | null
          track_id: string
        }
        Update: {
          created_at?: string
          id?: string
          instrumental_url?: string
          lyrics?: string | null
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_karaoke_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: true
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks: {
        Row: {
          artist_id: string
          audio_url: string
          cover_art_url: string | null
          created_at: string
          description: string | null
          display_label_name: string | null
          duration: number | null
          editions_sold: number
          genre: string | null
          has_karaoke: boolean | null
          id: string
          is_draft: boolean | null
          is_explicit: boolean | null
          label_id: string | null
          moods: string[] | null
          price: number
          title: string
          total_editions: number
          updated_at: string
        }
        Insert: {
          artist_id: string
          audio_url: string
          cover_art_url?: string | null
          created_at?: string
          description?: string | null
          display_label_name?: string | null
          duration?: number | null
          editions_sold?: number
          genre?: string | null
          has_karaoke?: boolean | null
          id?: string
          is_draft?: boolean | null
          is_explicit?: boolean | null
          label_id?: string | null
          moods?: string[] | null
          price?: number
          title: string
          total_editions?: number
          updated_at?: string
        }
        Update: {
          artist_id?: string
          audio_url?: string
          cover_art_url?: string | null
          created_at?: string
          description?: string | null
          display_label_name?: string | null
          duration?: number | null
          editions_sold?: number
          genre?: string | null
          has_karaoke?: boolean | null
          id?: string
          is_draft?: boolean | null
          is_explicit?: boolean | null
          label_id?: string | null
          moods?: string[] | null
          price?: number
          title?: string
          total_editions?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracks_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracks_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracks_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tracks_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      profiles_public: {
        Row: {
          avatar_url: string | null
          banner_image_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          id: string | null
          is_verified: boolean | null
          onboarding_completed: boolean | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          banner_image_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          is_verified?: boolean | null
          onboarding_completed?: boolean | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          banner_image_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string | null
          is_verified?: boolean | null
          onboarding_completed?: boolean | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_credits_atomic: {
        Args: { p_amount_cents: number; p_user_id: string }
        Returns: Json
      }
      deduct_credits_atomic: {
        Args: { p_amount_cents: number; p_user_id: string }
        Returns: Json
      }
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
    }
    Enums: {
      app_role: "fan" | "artist" | "label"
      credit_transaction_type: "purchase" | "spend" | "refund"
      earnings_status: "pending" | "paid" | "failed"
      subscription_status: "trialing" | "active" | "canceled" | "past_due"
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
      app_role: ["fan", "artist", "label"],
      credit_transaction_type: ["purchase", "spend", "refund"],
      earnings_status: ["pending", "paid", "failed"],
      subscription_status: ["trialing", "active", "canceled", "past_due"],
    },
  },
} as const
