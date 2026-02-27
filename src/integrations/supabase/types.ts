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
      activity_feed: {
        Row: {
          artist_id: string
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          title: string
          type: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          title: string
          type: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      admin_home_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      ai_feature_flags: {
        Row: {
          created_at: string
          enabled: boolean
          feature_key: string
          id: string
          metadata: Json | null
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          feature_key: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          created_at?: string
          enabled?: boolean
          feature_key?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      albums: {
        Row: {
          artist_id: string
          cover_art_url: string | null
          created_at: string
          description: string | null
          genre: string | null
          id: string
          is_draft: boolean
          label_id: string | null
          release_type: string
          title: string
          total_price: number | null
          updated_at: string
        }
        Insert: {
          artist_id: string
          cover_art_url?: string | null
          created_at?: string
          description?: string | null
          genre?: string | null
          id?: string
          is_draft?: boolean
          label_id?: string | null
          release_type: string
          title: string
          total_price?: number | null
          updated_at?: string
        }
        Update: {
          artist_id?: string
          cover_art_url?: string | null
          created_at?: string
          description?: string | null
          genre?: string | null
          id?: string
          is_draft?: boolean
          label_id?: string | null
          release_type?: string
          title?: string
          total_price?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      analytics_cache: {
        Row: {
          computed_at: string
          data: Json
          entity_id: string
          entity_type: string
          id: string
        }
        Insert: {
          computed_at?: string
          data?: Json
          entity_id: string
          entity_type?: string
          id?: string
        }
        Update: {
          computed_at?: string
          data?: Json
          entity_id?: string
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      announcement_reactions: {
        Row: {
          announcement_id: string
          created_at: string
          emoji: string
          id: string
          user_id: string
        }
        Insert: {
          announcement_id: string
          created_at?: string
          emoji: string
          id?: string
          user_id: string
        }
        Update: {
          announcement_id?: string
          created_at?: string
          emoji?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reactions_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          artist_id: string
          audience_filter: Json | null
          body: string
          created_at: string
          cta_label: string | null
          cta_url: string | null
          id: string
          image_url: string | null
          is_highlighted: boolean
          title: string
        }
        Insert: {
          artist_id: string
          audience_filter?: Json | null
          body: string
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          id?: string
          image_url?: string | null
          is_highlighted?: boolean
          title: string
        }
        Update: {
          artist_id?: string
          audience_filter?: Json | null
          body?: string
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          id?: string
          image_url?: string | null
          is_highlighted?: boolean
          title?: string
        }
        Relationships: []
      }
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
      artist_stores: {
        Row: {
          artist_id: string
          created_at: string
          id: string
          platform_fee_percentage: number
          seller_agreement_accepted: boolean
          seller_agreement_accepted_at: string | null
          store_status: string
          updated_at: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          id?: string
          platform_fee_percentage?: number
          seller_agreement_accepted?: boolean
          seller_agreement_accepted_at?: string | null
          store_status?: string
          updated_at?: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          id?: string
          platform_fee_percentage?: number
          seller_agreement_accepted?: boolean
          seller_agreement_accepted_at?: string | null
          store_status?: string
          updated_at?: string
        }
        Relationships: []
      }
      artist_superfan_settings: {
        Row: {
          artist_id: string
          created_at: string
          custom_level_names: Json | null
          id: string
          loyalty_enabled: boolean
          message_price_credits: number | null
          messaging_enabled: boolean | null
          public_leaderboard: boolean
          response_window_hours: number | null
          show_founding_fans: boolean
          show_top_supporters: boolean
          updated_at: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          custom_level_names?: Json | null
          id?: string
          loyalty_enabled?: boolean
          message_price_credits?: number | null
          messaging_enabled?: boolean | null
          public_leaderboard?: boolean
          response_window_hours?: number | null
          show_founding_fans?: boolean
          show_top_supporters?: boolean
          updated_at?: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          custom_level_names?: Json | null
          id?: string
          loyalty_enabled?: boolean
          message_price_credits?: number | null
          messaging_enabled?: boolean | null
          public_leaderboard?: boolean
          response_window_hours?: number | null
          show_founding_fans?: boolean
          show_top_supporters?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      badge_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
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
      dj_leaderboard: {
        Row: {
          artist_id: string
          computed_at: string
          id: string
          listener_count: number
          period: string
          rank: number
          reaction_count: number
          session_count: number
        }
        Insert: {
          artist_id: string
          computed_at?: string
          id?: string
          listener_count?: number
          period?: string
          rank?: number
          reaction_count?: number
          session_count?: number
        }
        Update: {
          artist_id?: string
          computed_at?: string
          id?: string
          listener_count?: number
          period?: string
          rank?: number
          reaction_count?: number
          session_count?: number
        }
        Relationships: []
      }
      dj_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dj_reactions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "dj_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      dj_session_listeners: {
        Row: {
          counted: boolean
          created_at: string
          id: string
          listened_seconds: number
          session_id: string
          user_id: string
        }
        Insert: {
          counted?: boolean
          created_at?: string
          id?: string
          listened_seconds?: number
          session_id: string
          user_id: string
        }
        Update: {
          counted?: boolean
          created_at?: string
          id?: string
          listened_seconds?: number
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dj_session_listeners_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "dj_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      dj_session_spotify: {
        Row: {
          created_at: string
          session_id: string
          spotify_embed_url: string
          spotify_url_raw: string
        }
        Insert: {
          created_at?: string
          session_id: string
          spotify_embed_url: string
          spotify_url_raw: string
        }
        Update: {
          created_at?: string
          session_id?: string
          spotify_embed_url?: string
          spotify_url_raw?: string
        }
        Relationships: [
          {
            foreignKeyName: "dj_session_spotify_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "dj_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      dj_session_tracks: {
        Row: {
          added_at: string
          embed_type: string
          embed_url: string | null
          id: string
          position: number
          session_id: string
          track_id: string | null
        }
        Insert: {
          added_at?: string
          embed_type?: string
          embed_url?: string | null
          id?: string
          position?: number
          session_id: string
          track_id?: string | null
        }
        Update: {
          added_at?: string
          embed_type?: string
          embed_url?: string | null
          id?: string
          position?: number
          session_id?: string
          track_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dj_session_tracks_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "dj_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dj_session_tracks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      dj_sessions: {
        Row: {
          artist_id: string
          cover_image_url: string | null
          created_at: string
          description: string | null
          gating: string
          id: string
          max_seats: number | null
          pinned_track_ids: Json | null
          refund_policy: string | null
          scheduled_at: string | null
          session_type: string
          sort_mode: string
          status: string
          submission_guidelines: string | null
          submission_price_cents: number
          submissions_enabled: boolean
          title: string
          updated_at: string
          weekly_submission_cap: number | null
        }
        Insert: {
          artist_id: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          gating?: string
          id?: string
          max_seats?: number | null
          pinned_track_ids?: Json | null
          refund_policy?: string | null
          scheduled_at?: string | null
          session_type?: string
          sort_mode?: string
          status?: string
          submission_guidelines?: string | null
          submission_price_cents?: number
          submissions_enabled?: boolean
          title: string
          updated_at?: string
          weekly_submission_cap?: number | null
        }
        Update: {
          artist_id?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          gating?: string
          id?: string
          max_seats?: number | null
          pinned_track_ids?: Json | null
          refund_policy?: string | null
          scheduled_at?: string | null
          session_type?: string
          sort_mode?: string
          status?: string
          submission_guidelines?: string | null
          submission_price_cents?: number
          submissions_enabled?: boolean
          title?: string
          updated_at?: string
          weekly_submission_cap?: number | null
        }
        Relationships: []
      }
      dj_submissions: {
        Row: {
          amount_cents: number
          created_at: string
          featured_at: string | null
          id: string
          min_feature_until: string | null
          platform_fee_cents: number
          session_id: string
          status: string
          stripe_payment_intent_id: string | null
          submitter_id: string
          track_id: string | null
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          featured_at?: string | null
          id?: string
          min_feature_until?: string | null
          platform_fee_cents?: number
          session_id: string
          status?: string
          stripe_payment_intent_id?: string | null
          submitter_id: string
          track_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          featured_at?: string | null
          id?: string
          min_feature_until?: string | null
          platform_fee_cents?: number
          session_id?: string
          status?: string
          stripe_payment_intent_id?: string | null
          submitter_id?: string
          track_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dj_submissions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "dj_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dj_submissions_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      dj_tiers: {
        Row: {
          artist_id: string
          badge_name: string | null
          current_tier: number
          id: string
          lifetime_listeners: number
          max_slots: number
          updated_at: string
        }
        Insert: {
          artist_id: string
          badge_name?: string | null
          current_tier?: number
          id?: string
          lifetime_listeners?: number
          max_slots?: number
          updated_at?: string
        }
        Update: {
          artist_id?: string
          badge_name?: string | null
          current_tier?: number
          id?: string
          lifetime_listeners?: number
          max_slots?: number
          updated_at?: string
        }
        Relationships: []
      }
      drop_waitlists: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drop_waitlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "store_products"
            referencedColumns: ["id"]
          },
        ]
      }
      fan_loyalty: {
        Row: {
          artist_id: string
          created_at: string
          fan_id: string
          id: string
          level: string
          points: number
          show_public: boolean
          updated_at: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          fan_id: string
          id?: string
          level?: string
          points?: number
          show_public?: boolean
          updated_at?: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          fan_id?: string
          id?: string
          level?: string
          points?: number
          show_public?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      featured_content: {
        Row: {
          content_id: string
          content_type: Database["public"]["Enums"]["featured_content_type"]
          created_at: string
          created_by: string
          display_location: string
          ends_at: string | null
          id: string
          is_active: boolean
          priority: number
          starts_at: string | null
          updated_at: string
        }
        Insert: {
          content_id: string
          content_type: Database["public"]["Enums"]["featured_content_type"]
          created_at?: string
          created_by: string
          display_location: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          priority?: number
          starts_at?: string | null
          updated_at?: string
        }
        Update: {
          content_id?: string
          content_type?: Database["public"]["Enums"]["featured_content_type"]
          created_at?: string
          created_by?: string
          display_location?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          priority?: number
          starts_at?: string | null
          updated_at?: string
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
      go_dj_listens: {
        Row: {
          id: string
          listened_at: string
          session_id: string
          user_id: string | null
        }
        Insert: {
          id?: string
          listened_at?: string
          session_id: string
          user_id?: string | null
        }
        Update: {
          id?: string
          listened_at?: string
          session_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "go_dj_listens_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "go_dj_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      go_dj_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          enabled_at: string | null
          id: string
          is_enabled: boolean
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          enabled_at?: string | null
          id?: string
          is_enabled?: boolean
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          enabled_at?: string | null
          id?: string
          is_enabled?: boolean
          user_id?: string
        }
        Relationships: []
      }
      go_dj_reactions: {
        Row: {
          created_at: string
          id: string
          reaction: string
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reaction: string
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reaction?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "go_dj_reactions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "go_dj_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      go_dj_segments: {
        Row: {
          created_at: string
          ducking_db: number
          ducking_enabled: boolean
          fade_in_sec: number
          fade_out_sec: number
          id: string
          order_index: number
          overlay_end_sec: number | null
          overlay_start_sec: number | null
          segment_type: string
          session_id: string
          track_id: string | null
          trim_end_sec: number | null
          trim_start_sec: number
          voice_clip_id: string | null
          voice_volume: number
        }
        Insert: {
          created_at?: string
          ducking_db?: number
          ducking_enabled?: boolean
          fade_in_sec?: number
          fade_out_sec?: number
          id?: string
          order_index?: number
          overlay_end_sec?: number | null
          overlay_start_sec?: number | null
          segment_type: string
          session_id: string
          track_id?: string | null
          trim_end_sec?: number | null
          trim_start_sec?: number
          voice_clip_id?: string | null
          voice_volume?: number
        }
        Update: {
          created_at?: string
          ducking_db?: number
          ducking_enabled?: boolean
          fade_in_sec?: number
          fade_out_sec?: number
          id?: string
          order_index?: number
          overlay_end_sec?: number | null
          overlay_start_sec?: number | null
          segment_type?: string
          session_id?: string
          track_id?: string | null
          trim_end_sec?: number | null
          trim_start_sec?: number
          voice_clip_id?: string | null
          voice_volume?: number
        }
        Relationships: [
          {
            foreignKeyName: "go_dj_segments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "go_dj_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "go_dj_segments_voice_clip_id_fkey"
            columns: ["voice_clip_id"]
            isOneToOne: false
            referencedRelation: "go_dj_voice_clips"
            referencedColumns: ["id"]
          },
        ]
      }
      go_dj_sessions: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string | null
          dj_user_id: string
          duration_sec: number | null
          id: string
          mix_audio_url: string | null
          mode: string
          status: string
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          dj_user_id: string
          duration_sec?: number | null
          id?: string
          mix_audio_url?: string | null
          mode?: string
          status?: string
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          dj_user_id?: string
          duration_sec?: number | null
          id?: string
          mix_audio_url?: string | null
          mode?: string
          status?: string
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      go_dj_voice_clips: {
        Row: {
          created_at: string
          dj_user_id: string
          duration_sec: number
          file_url: string
          id: string
          label: string
          session_id: string | null
        }
        Insert: {
          created_at?: string
          dj_user_id: string
          duration_sec?: number
          file_url: string
          id?: string
          label?: string
          session_id?: string | null
        }
        Update: {
          created_at?: string
          dj_user_id?: string
          duration_sec?: number
          file_url?: string
          id?: string
          label?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "go_dj_voice_clips_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "go_dj_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      job_queue: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          error: string | null
          id: string
          job_type: string
          max_attempts: number
          payload: Json
          started_at: string | null
          status: string
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          job_type: string
          max_attempts?: number
          payload?: Json
          started_at?: string | null
          status?: string
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          job_type?: string
          max_attempts?: number
          payload?: Json
          started_at?: string | null
          status?: string
        }
        Relationships: []
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
      message_credits: {
        Row: {
          balance: number
          created_at: string
          fan_id: string
          id: string
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          fan_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          fan_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      message_threads: {
        Row: {
          artist_id: string
          created_at: string
          credit_cost: number
          expires_at: string
          fan_id: string
          id: string
          message: string
          refunded: boolean
          replied_at: string | null
          reply: string | null
          sent_at: string
          status: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          credit_cost?: number
          expires_at?: string
          fan_id: string
          id?: string
          message: string
          refunded?: boolean
          replied_at?: string | null
          reply?: string | null
          sent_at?: string
          status?: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          credit_cost?: number
          expires_at?: string
          fan_id?: string
          id?: string
          message?: string
          refunded?: boolean
          replied_at?: string | null
          reply?: string | null
          sent_at?: string
          status?: string
        }
        Relationships: []
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
      playlist_collaborators: {
        Row: {
          accepted_at: string | null
          id: string
          invited_at: string
          invited_by: string
          playlist_id: string
          role: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          id?: string
          invited_at?: string
          invited_by: string
          playlist_id: string
          role?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          id?: string
          invited_at?: string
          invited_by?: string
          playlist_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_collaborators_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_folders: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      playlist_tracks: {
        Row: {
          added_at: string
          id: string
          playlist_id: string
          position: number
          track_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          playlist_id: string
          position?: number
          track_id: string
        }
        Update: {
          added_at?: string
          id?: string
          playlist_id?: string
          position?: number
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlist_tracks_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_tracks_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          folder_id: string | null
          id: string
          is_collaborative: boolean
          is_public: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          folder_id?: string | null
          id?: string
          is_collaborative?: boolean
          is_public?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          folder_id?: string | null
          id?: string
          is_collaborative?: boolean
          is_public?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlists_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "playlist_folders"
            referencedColumns: ["id"]
          },
        ]
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
          display_name_font: string | null
          id: string
          is_verified: boolean | null
          onboarding_completed: boolean | null
          social_links: Json | null
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
          display_name_font?: string | null
          id: string
          is_verified?: boolean | null
          onboarding_completed?: boolean | null
          social_links?: Json | null
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
          display_name_font?: string | null
          id?: string
          is_verified?: boolean | null
          onboarding_completed?: boolean | null
          social_links?: Json | null
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
      push_tokens: {
        Row: {
          created_at: string
          device_id: string | null
          id: string
          is_active: boolean
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          id?: string
          is_active?: boolean
          platform: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string | null
          id?: string
          is_active?: boolean
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          action: string
          id: string
          request_count: number
          user_id: string
          window_start: string
        }
        Insert: {
          action: string
          id?: string
          request_count?: number
          user_id: string
          window_start?: string
        }
        Update: {
          action?: string
          id?: string
          request_count?: number
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string | null
          id: string
          reason: string
          reported_id: string
          reported_type: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reported_id: string
          reported_type: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reported_id?: string
          reported_type?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: []
      }
      store_orders: {
        Row: {
          amount_cents: number
          artist_id: string
          buyer_email: string | null
          buyer_id: string
          buyer_name: string | null
          created_at: string
          download_count: number | null
          edition_number: number | null
          id: string
          max_downloads: number | null
          platform_fee_cents: number
          product_id: string
          shipping_address: Json | null
          status: string
          stripe_payment_intent_id: string | null
          tracking_number: string | null
        }
        Insert: {
          amount_cents: number
          artist_id: string
          buyer_email?: string | null
          buyer_id: string
          buyer_name?: string | null
          created_at?: string
          download_count?: number | null
          edition_number?: number | null
          id?: string
          max_downloads?: number | null
          platform_fee_cents: number
          product_id: string
          shipping_address?: Json | null
          status?: string
          stripe_payment_intent_id?: string | null
          tracking_number?: string | null
        }
        Update: {
          amount_cents?: number
          artist_id?: string
          buyer_email?: string | null
          buyer_id?: string
          buyer_name?: string | null
          created_at?: string
          download_count?: number | null
          edition_number?: number | null
          id?: string
          max_downloads?: number | null
          platform_fee_cents?: number
          product_id?: string
          shipping_address?: Json | null
          status?: string
          stripe_payment_intent_id?: string | null
          tracking_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "store_products"
            referencedColumns: ["id"]
          },
        ]
      }
      store_products: {
        Row: {
          artist_id: string
          audio_url: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          inventory_limit: number | null
          inventory_sold: number
          is_active: boolean
          is_early_release: boolean
          is_exclusive: boolean
          is_featured: boolean | null
          max_per_account: number | null
          parent_product_id: string | null
          price_cents: number
          scheduled_release_at: string | null
          shipping_price_cents: number | null
          status: string
          title: string
          type: string
          updated_at: string
          variants: Json | null
          visibility: string | null
          visibility_expires_at: string | null
        }
        Insert: {
          artist_id: string
          audio_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          inventory_limit?: number | null
          inventory_sold?: number
          is_active?: boolean
          is_early_release?: boolean
          is_exclusive?: boolean
          is_featured?: boolean | null
          max_per_account?: number | null
          parent_product_id?: string | null
          price_cents: number
          scheduled_release_at?: string | null
          shipping_price_cents?: number | null
          status?: string
          title: string
          type: string
          updated_at?: string
          variants?: Json | null
          visibility?: string | null
          visibility_expires_at?: string | null
        }
        Update: {
          artist_id?: string
          audio_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          inventory_limit?: number | null
          inventory_sold?: number
          is_active?: boolean
          is_early_release?: boolean
          is_exclusive?: boolean
          is_featured?: boolean | null
          max_per_account?: number | null
          parent_product_id?: string | null
          price_cents?: number
          scheduled_release_at?: string | null
          shipping_price_cents?: number | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
          variants?: Json | null
          visibility?: string | null
          visibility_expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_products_parent_product_id_fkey"
            columns: ["parent_product_id"]
            isOneToOne: false
            referencedRelation: "store_products"
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
      superfan_memberships: {
        Row: {
          artist_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          monthly_price_cents: number
          perks: Json
          updated_at: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          monthly_price_cents?: number
          perks?: Json
          updated_at?: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          monthly_price_cents?: number
          perks?: Json
          updated_at?: string
        }
        Relationships: []
      }
      superfan_messages: {
        Row: {
          artist_id: string
          created_at: string
          fan_id: string
          id: string
          is_hidden: boolean | null
          is_pinned: boolean | null
          message: string
          message_type: string | null
          sender_id: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          fan_id: string
          id?: string
          is_hidden?: boolean | null
          is_pinned?: boolean | null
          message: string
          message_type?: string | null
          sender_id: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          fan_id?: string
          id?: string
          is_hidden?: boolean | null
          is_pinned?: boolean | null
          message?: string
          message_type?: string | null
          sender_id?: string
        }
        Relationships: []
      }
      superfan_subscribers: {
        Row: {
          artist_id: string
          created_at: string
          fan_id: string
          id: string
          lifetime_spent_cents: number
          membership_id: string
          status: string
          stripe_subscription_id: string | null
          subscribed_at: string
          tier_level: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          fan_id: string
          id?: string
          lifetime_spent_cents?: number
          membership_id: string
          status?: string
          stripe_subscription_id?: string | null
          subscribed_at?: string
          tier_level?: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          fan_id?: string
          id?: string
          lifetime_spent_cents?: number
          membership_id?: string
          status?: string
          stripe_subscription_id?: string | null
          subscribed_at?: string
          tier_level?: string
        }
        Relationships: [
          {
            foreignKeyName: "superfan_subscribers_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "superfan_memberships"
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
      track_registrations: {
        Row: {
          audio_hash: string
          country: string | null
          created_at: string
          id: string
          recording_id: string
          rights_confirmed: boolean
          track_id: string
          upload_timestamp: string
          uploaded_by: string
        }
        Insert: {
          audio_hash: string
          country?: string | null
          created_at?: string
          id?: string
          recording_id?: string
          rights_confirmed?: boolean
          track_id: string
          upload_timestamp?: string
          uploaded_by: string
        }
        Update: {
          audio_hash?: string
          country?: string | null
          created_at?: string
          id?: string
          recording_id?: string
          rights_confirmed?: boolean
          track_id?: string
          upload_timestamp?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "track_registrations_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks: {
        Row: {
          album_id: string | null
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
          preview_duration: number
          price: number
          title: string
          total_editions: number
          track_number: number | null
          updated_at: string
        }
        Insert: {
          album_id?: string | null
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
          preview_duration?: number
          price?: number
          title: string
          total_editions?: number
          track_number?: number | null
          updated_at?: string
        }
        Update: {
          album_id?: string | null
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
          preview_duration?: number
          price?: number
          title?: string
          total_editions?: number
          track_number?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tracks_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "albums"
            referencedColumns: ["id"]
          },
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
      trending_cache: {
        Row: {
          cache_key: string
          computed_at: string
          data: Json
          expires_at: string
          id: string
        }
        Insert: {
          cache_key?: string
          computed_at?: string
          data?: Json
          expires_at?: string
          id?: string
        }
        Update: {
          cache_key?: string
          computed_at?: string
          data?: Json
          expires_at?: string
          id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          artist_id: string | null
          awarded_at: string
          badge_key: string
          badge_type: string
          created_at: string
          id: string
          is_public: boolean
          metadata: Json | null
          product_id: string | null
          tier: string
          user_id: string
        }
        Insert: {
          artist_id?: string | null
          awarded_at?: string
          badge_key: string
          badge_type: string
          created_at?: string
          id?: string
          is_public?: boolean
          metadata?: Json | null
          product_id?: string | null
          tier?: string
          user_id: string
        }
        Update: {
          artist_id?: string | null
          awarded_at?: string
          badge_key?: string
          badge_type?: string
          created_at?: string
          id?: string
          is_public?: boolean
          metadata?: Json | null
          product_id?: string | null
          tier?: string
          user_id?: string
        }
        Relationships: []
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
      webhook_events: {
        Row: {
          id: string
          processed_at: string
          type: string
        }
        Insert: {
          id: string
          processed_at?: string
          type: string
        }
        Update: {
          id?: string
          processed_at?: string
          type?: string
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
          display_name_font: string | null
          id: string | null
          is_verified: boolean | null
          onboarding_completed: boolean | null
          social_links: Json | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          banner_image_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          display_name_font?: string | null
          id?: string | null
          is_verified?: boolean | null
          onboarding_completed?: boolean | null
          social_links?: Json | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          banner_image_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          display_name_font?: string | null
          id?: string | null
          is_verified?: boolean | null
          onboarding_completed?: boolean | null
          social_links?: Json | null
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
      check_rate_limit: {
        Args: {
          p_action: string
          p_max_requests: number
          p_user_id: string
          p_window_seconds?: number
        }
        Returns: Json
      }
      cleanup_rate_limits: { Args: never; Returns: undefined }
      decrement_inventory_atomic: {
        Args: { p_product_id: string; p_quantity?: number }
        Returns: Json
      }
      deduct_credits_atomic: {
        Args: { p_amount_cents: number; p_user_id: string }
        Returns: Json
      }
      generate_recording_id: { Args: never; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_admin_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_playlist_collaborator: {
        Args: { _playlist_id: string; _user_id: string }
        Returns: boolean
      }
      is_playlist_owner: {
        Args: { _playlist_id: string; _user_id: string }
        Returns: boolean
      }
      restore_inventory_atomic: {
        Args: { p_product_id: string; p_quantity?: number }
        Returns: Json
      }
    }
    Enums: {
      app_role: "fan" | "artist" | "label" | "admin"
      credit_transaction_type: "purchase" | "spend" | "refund"
      earnings_status: "pending" | "paid" | "failed"
      featured_content_type: "artist" | "label" | "track" | "album"
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
      app_role: ["fan", "artist", "label", "admin"],
      credit_transaction_type: ["purchase", "spend", "refund"],
      earnings_status: ["pending", "paid", "failed"],
      featured_content_type: ["artist", "label", "track", "album"],
      subscription_status: ["trialing", "active", "canceled", "past_due"],
    },
  },
} as const
