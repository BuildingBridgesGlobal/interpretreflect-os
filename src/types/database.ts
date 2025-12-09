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
      agent_events: {
        Row: {
          agent: string
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          agent: string
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          agent?: string
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      ai_contexts: {
        Row: {
          created_at: string | null
          id: string
          interaction_id: string
          kind: string
          payload: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          interaction_id: string
          kind: string
          payload?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          interaction_id?: string
          kind?: string
          payload?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_contexts_interaction_id_fkey"
            columns: ["interaction_id"]
            isOneToOne: false
            referencedRelation: "ai_interactions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_interactions: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
          session_id: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
          session_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
          session_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_interactions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_sessions: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          status: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      assignment_debriefs: {
        Row: {
          assignment_id: string
          completed_at: string | null
          created_at: string | null
          created_by: string
          id: string
          status: string | null
          team_summary: string | null
        }
        Insert: {
          assignment_id: string
          completed_at?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          status?: string | null
          team_summary?: string | null
        }
        Update: {
          assignment_id?: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          status?: string | null
          team_summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_debriefs_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: true
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_resources: {
        Row: {
          assignment_id: string
          completed: boolean | null
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          id: string
          resource_key: string
          resource_type: string
        }
        Insert: {
          assignment_id: string
          completed?: boolean | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          id?: string
          resource_key: string
          resource_type: string
        }
        Update: {
          assignment_id?: string
          completed?: boolean | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          id?: string
          resource_key?: string
          resource_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_resources_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_team_members: {
        Row: {
          assignment_id: string
          can_edit_assignment: boolean | null
          can_invite_others: boolean | null
          confirmed_at: string | null
          created_at: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          role: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          assignment_id: string
          can_edit_assignment?: boolean | null
          can_invite_others?: boolean | null
          confirmed_at?: string | null
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          role?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          assignment_id?: string
          can_edit_assignment?: boolean | null
          can_invite_others?: boolean | null
          confirmed_at?: string | null
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          role?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_team_members_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_templates: {
        Row: {
          assignment_type: string
          created_at: string | null
          default_title: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          is_recurring: boolean | null
          is_team_assignment: boolean | null
          last_used_at: string | null
          location_details: string | null
          location_type: string | null
          recurrence_pattern: string | null
          setting: string | null
          team_size: number | null
          template_name: string
          times_used: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assignment_type: string
          created_at?: string | null
          default_title?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_recurring?: boolean | null
          is_team_assignment?: boolean | null
          last_used_at?: string | null
          location_details?: string | null
          location_type?: string | null
          recurrence_pattern?: string | null
          setting?: string | null
          team_size?: number | null
          template_name: string
          times_used?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assignment_type?: string
          created_at?: string | null
          default_title?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_recurring?: boolean | null
          is_team_assignment?: boolean | null
          last_used_at?: string | null
          location_details?: string | null
          location_type?: string | null
          recurrence_pattern?: string | null
          setting?: string | null
          team_size?: number | null
          template_name?: string
          times_used?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      assignments: {
        Row: {
          assignment_type: string | null
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          date: string | null
          debrief_id: string | null
          debriefed: boolean | null
          description: string | null
          duration_minutes: number | null
          emotional_intensity: string | null
          id: string
          is_team_assignment: boolean | null
          location: string | null
          location_details: string | null
          location_type: string | null
          metadata: Json | null
          participants: string | null
          prep_completed_at: string | null
          prep_status: string | null
          research_notes: string | null
          scheduled_at: string | null
          setting: string | null
          special_requirements: string | null
          status: string | null
          team_size: number | null
          time: string | null
          timezone: string | null
          title: string
          updated_at: string | null
          user_id: string
          vocabulary_list: Json | null
        }
        Insert: {
          assignment_type?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          date?: string | null
          debrief_id?: string | null
          debriefed?: boolean | null
          description?: string | null
          duration_minutes?: number | null
          emotional_intensity?: string | null
          id?: string
          is_team_assignment?: boolean | null
          location?: string | null
          location_details?: string | null
          location_type?: string | null
          metadata?: Json | null
          participants?: string | null
          prep_completed_at?: string | null
          prep_status?: string | null
          research_notes?: string | null
          scheduled_at?: string | null
          setting?: string | null
          special_requirements?: string | null
          status?: string | null
          team_size?: number | null
          time?: string | null
          timezone?: string | null
          title: string
          updated_at?: string | null
          user_id: string
          vocabulary_list?: Json | null
        }
        Update: {
          assignment_type?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          date?: string | null
          debrief_id?: string | null
          debriefed?: boolean | null
          description?: string | null
          duration_minutes?: number | null
          emotional_intensity?: string | null
          id?: string
          is_team_assignment?: boolean | null
          location?: string | null
          location_details?: string | null
          location_type?: string | null
          metadata?: Json | null
          participants?: string | null
          prep_completed_at?: string | null
          prep_status?: string | null
          research_notes?: string | null
          scheduled_at?: string | null
          setting?: string | null
          special_requirements?: string | null
          status?: string | null
          team_size?: number | null
          time?: string | null
          timezone?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
          vocabulary_list?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_debrief_id_fkey"
            columns: ["debrief_id"]
            isOneToOne: false
            referencedRelation: "debriefs"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_prices: {
        Row: {
          created_at: string | null
          currency: string | null
          cycle: string
          description: string | null
          display_name: string
          features: Json | null
          id: string
          is_active: boolean | null
          price_cents: number
          stripe_price_id: string
          stripe_product_id: string
          tier: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          cycle: string
          description?: string | null
          display_name: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          price_cents: number
          stripe_price_id: string
          stripe_product_id: string
          tier: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          cycle?: string
          description?: string | null
          display_name?: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          price_cents?: number
          stripe_price_id?: string
          stripe_product_id?: string
          tier?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      billing_prices_old: {
        Row: {
          active: boolean
          created_at: string
          cycle: string
          id: string
          product_id: string
          tier: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          cycle: string
          id: string
          product_id: string
          tier: string
        }
        Update: {
          active?: boolean
          created_at?: string
          cycle?: string
          id?: string
          product_id?: string
          tier?: string
        }
        Relationships: []
      }
      catalyst_messages: {
        Row: {
          content: string
          context: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
          user_id: string
        }
        Insert: {
          content: string
          context?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
          user_id: string
        }
        Update: {
          content?: string
          context?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      community_posts: {
        Row: {
          content: string
          created_at: string | null
          ecci_domains: string[] | null
          id: string
          is_deleted: boolean | null
          is_edited: boolean | null
          post_type: string
          setting_tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          ecci_domains?: string[] | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          post_type?: string
          setting_tags?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          ecci_domains?: string[] | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          post_type?: string
          setting_tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      community_profiles: {
        Row: {
          bio: string | null
          certifications: string[] | null
          created_at: string | null
          display_name: string
          id: string
          is_searchable: boolean | null
          open_to_mentoring: boolean | null
          seeking_mentor: boolean | null
          specialties: string[] | null
          strong_domains: string[] | null
          updated_at: string | null
          user_id: string
          weak_domains: string[] | null
          years_experience: number | null
        }
        Insert: {
          bio?: string | null
          certifications?: string[] | null
          created_at?: string | null
          display_name: string
          id?: string
          is_searchable?: boolean | null
          open_to_mentoring?: boolean | null
          seeking_mentor?: boolean | null
          specialties?: string[] | null
          strong_domains?: string[] | null
          updated_at?: string | null
          user_id: string
          weak_domains?: string[] | null
          years_experience?: number | null
        }
        Update: {
          bio?: string | null
          certifications?: string[] | null
          created_at?: string | null
          display_name?: string
          id?: string
          is_searchable?: boolean | null
          open_to_mentoring?: boolean | null
          seeking_mentor?: boolean | null
          specialties?: string[] | null
          strong_domains?: string[] | null
          updated_at?: string | null
          user_id?: string
          weak_domains?: string[] | null
          years_experience?: number | null
        }
        Relationships: []
      }
      connections: {
        Row: {
          addressee_id: string
          id: string
          requested_at: string | null
          requester_id: string
          responded_at: string | null
          status: string
        }
        Insert: {
          addressee_id: string
          id?: string
          requested_at?: string | null
          requester_id: string
          responded_at?: string | null
          status?: string
        }
        Update: {
          addressee_id?: string
          id?: string
          requested_at?: string | null
          requester_id?: string
          responded_at?: string | null
          status?: string
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          conversation_id: string | null
          id: string
          is_admin: boolean | null
          joined_at: string | null
          last_read_at: string | null
          user_id: string | null
        }
        Insert: {
          conversation_id?: string | null
          id?: string
          is_admin?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          user_id?: string | null
        }
        Update: {
          conversation_id?: string | null
          id?: string
          is_admin?: boolean | null
          joined_at?: string | null
          last_read_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_group: boolean | null
          name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_group?: boolean | null
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_group?: boolean | null
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      credentials: {
        Row: {
          created_at: string | null
          credential_name: string
          credential_type: string
          expiration_date: string | null
          file_url: string | null
          id: string
          issue_date: string | null
          issuing_organization: string | null
          organization_id: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credential_name: string
          credential_type: string
          expiration_date?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string | null
          issuing_organization?: string | null
          organization_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          credential_name?: string
          credential_type?: string
          expiration_date?: string | null
          file_url?: string | null
          id?: string
          issue_date?: string | null
          issuing_organization?: string | null
          organization_id?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "credentials_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credentials_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      debrief_reflections: {
        Row: {
          content: Json
          created_at: string | null
          debrief_id: string
          id: string
          reflection_type: string
          target_user_id: string | null
          updated_at: string | null
          user_id: string
          visibility: string | null
        }
        Insert: {
          content: Json
          created_at?: string | null
          debrief_id: string
          id?: string
          reflection_type: string
          target_user_id?: string | null
          updated_at?: string | null
          user_id: string
          visibility?: string | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          debrief_id?: string
          id?: string
          reflection_type?: string
          target_user_id?: string | null
          updated_at?: string | null
          user_id?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "debrief_reflections_debrief_id_fkey"
            columns: ["debrief_id"]
            isOneToOne: false
            referencedRelation: "assignment_debriefs"
            referencedColumns: ["id"]
          },
        ]
      }
      debrief_skills: {
        Row: {
          debrief_id: string
          score: number | null
          skill_id: string
        }
        Insert: {
          debrief_id: string
          score?: number | null
          skill_id: string
        }
        Update: {
          debrief_id?: string
          score?: number | null
          skill_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "debrief_skills_debrief_id_fkey"
            columns: ["debrief_id"]
            isOneToOne: false
            referencedRelation: "debriefs"
            referencedColumns: ["id"]
          },
        ]
      }
      debriefs: {
        Row: {
          assignment_type: string
          created_at: string | null
          date: string
          full_analysis: string
          headline: string
          id: string
          metadata: Json | null
          performance_score: number | null
          setting: string | null
          updated_at: string | null
          user_id: string
          visibility: string | null
        }
        Insert: {
          assignment_type: string
          created_at?: string | null
          date: string
          full_analysis: string
          headline: string
          id?: string
          metadata?: Json | null
          performance_score?: number | null
          setting?: string | null
          updated_at?: string | null
          user_id: string
          visibility?: string | null
        }
        Update: {
          assignment_type?: string
          created_at?: string | null
          date?: string
          full_analysis?: string
          headline?: string
          id?: string
          metadata?: Json | null
          performance_score?: number | null
          setting?: string | null
          updated_at?: string | null
          user_id?: string
          visibility?: string | null
        }
        Relationships: []
      }
      drill_attempts: {
        Row: {
          attempted_at: string | null
          confidence_level: number | null
          drill_id: string
          id: string
          is_correct: boolean
          response_time_seconds: number | null
          session_id: string | null
          user_answer: string | null
          user_id: string
          user_ranking: Json | null
          user_red_flags: Json | null
        }
        Insert: {
          attempted_at?: string | null
          confidence_level?: number | null
          drill_id: string
          id?: string
          is_correct: boolean
          response_time_seconds?: number | null
          session_id?: string | null
          user_answer?: string | null
          user_id: string
          user_ranking?: Json | null
          user_red_flags?: Json | null
        }
        Update: {
          attempted_at?: string | null
          confidence_level?: number | null
          drill_id?: string
          id?: string
          is_correct?: boolean
          response_time_seconds?: number | null
          session_id?: string | null
          user_answer?: string | null
          user_id?: string
          user_ranking?: Json | null
          user_red_flags?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "drill_attempts_drill_id_fkey"
            columns: ["drill_id"]
            isOneToOne: false
            referencedRelation: "drills"
            referencedColumns: ["id"]
          },
        ]
      }
      drill_categories: {
        Row: {
          category_code: string
          created_at: string | null
          description: string
          display_order: number
          icon_emoji: string | null
          id: string
          is_active: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category_code: string
          created_at?: string | null
          description: string
          display_order: number
          icon_emoji?: string | null
          id?: string
          is_active?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category_code?: string
          created_at?: string | null
          description?: string
          display_order?: number
          icon_emoji?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      drill_recommendations: {
        Row: {
          acted_on_at: string | null
          based_on_metrics: Json | null
          created_at: string | null
          description: string
          dismissed_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          priority: number | null
          reasoning: string | null
          recommendation_type: string
          suggested_category_id: string | null
          suggested_drill_ids: Json | null
          title: string
          user_id: string
        }
        Insert: {
          acted_on_at?: string | null
          based_on_metrics?: Json | null
          created_at?: string | null
          description: string
          dismissed_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          reasoning?: string | null
          recommendation_type: string
          suggested_category_id?: string | null
          suggested_drill_ids?: Json | null
          title: string
          user_id: string
        }
        Update: {
          acted_on_at?: string | null
          based_on_metrics?: Json | null
          created_at?: string | null
          description?: string
          dismissed_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          priority?: number | null
          reasoning?: string | null
          recommendation_type?: string
          suggested_category_id?: string | null
          suggested_drill_ids?: Json | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drill_recommendations_suggested_category_id_fkey"
            columns: ["suggested_category_id"]
            isOneToOne: false
            referencedRelation: "drill_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      drill_sessions: {
        Row: {
          average_confidence: number | null
          category_id: string | null
          completed_at: string | null
          drills_completed: number | null
          drills_correct: number | null
          id: string
          is_completed: boolean | null
          session_type: string
          started_at: string | null
          total_time_seconds: number | null
          user_id: string
        }
        Insert: {
          average_confidence?: number | null
          category_id?: string | null
          completed_at?: string | null
          drills_completed?: number | null
          drills_correct?: number | null
          id?: string
          is_completed?: boolean | null
          session_type: string
          started_at?: string | null
          total_time_seconds?: number | null
          user_id: string
        }
        Update: {
          average_confidence?: number | null
          category_id?: string | null
          completed_at?: string | null
          drills_completed?: number | null
          drills_correct?: number | null
          id?: string
          is_completed?: boolean | null
          session_type?: string
          started_at?: string | null
          total_time_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "drill_sessions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "drill_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      drill_subcategories: {
        Row: {
          category_id: string
          created_at: string | null
          description: string | null
          display_order: number
          id: string
          is_active: boolean | null
          subcategory_code: string
          title: string
          updated_at: string | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          description?: string | null
          display_order: number
          id?: string
          is_active?: boolean | null
          subcategory_code: string
          title: string
          updated_at?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean | null
          subcategory_code?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drill_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "drill_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      drills: {
        Row: {
          context_details: Json | null
          correct_answer: string | null
          correct_best: string | null
          correct_red_flags: Json | null
          correct_worst: string | null
          created_at: string | null
          difficulty_level: number | null
          drill_code: string
          drill_type: string
          estimated_seconds: number | null
          explanation: string
          id: string
          incorrect_feedback: Json | null
          is_active: boolean | null
          learning_points: Json | null
          options: Json | null
          question: string | null
          ranking_items: Json | null
          red_flags: Json | null
          related_ecci_domain: string | null
          related_module_id: string | null
          scenario_text: string
          subcategory_id: string
          tags: Json | null
          updated_at: string | null
        }
        Insert: {
          context_details?: Json | null
          correct_answer?: string | null
          correct_best?: string | null
          correct_red_flags?: Json | null
          correct_worst?: string | null
          created_at?: string | null
          difficulty_level?: number | null
          drill_code: string
          drill_type: string
          estimated_seconds?: number | null
          explanation: string
          id?: string
          incorrect_feedback?: Json | null
          is_active?: boolean | null
          learning_points?: Json | null
          options?: Json | null
          question?: string | null
          ranking_items?: Json | null
          red_flags?: Json | null
          related_ecci_domain?: string | null
          related_module_id?: string | null
          scenario_text: string
          subcategory_id: string
          tags?: Json | null
          updated_at?: string | null
        }
        Update: {
          context_details?: Json | null
          correct_answer?: string | null
          correct_best?: string | null
          correct_red_flags?: Json | null
          correct_worst?: string | null
          created_at?: string | null
          difficulty_level?: number | null
          drill_code?: string
          drill_type?: string
          estimated_seconds?: number | null
          explanation?: string
          id?: string
          incorrect_feedback?: Json | null
          is_active?: boolean | null
          learning_points?: Json | null
          options?: Json | null
          question?: string | null
          ranking_items?: Json | null
          red_flags?: Json | null
          related_ecci_domain?: string | null
          related_module_id?: string | null
          scenario_text?: string
          subcategory_id?: string
          tags?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drills_related_module_id_fkey"
            columns: ["related_module_id"]
            isOneToOne: false
            referencedRelation: "skill_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drills_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "drill_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      ecci_competency_scores: {
        Row: {
          created_at: string | null
          domain: string
          engagement_level: number | null
          id: string
          last_activity_at: string | null
          modules_completed: number | null
          total_time_invested_seconds: number | null
          trend: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          domain: string
          engagement_level?: number | null
          id?: string
          last_activity_at?: string | null
          modules_completed?: number | null
          total_time_invested_seconds?: number | null
          trend?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          domain?: string
          engagement_level?: number | null
          id?: string
          last_activity_at?: string | null
          modules_completed?: number | null
          total_time_invested_seconds?: number | null
          trend?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      elya_conversations: {
        Row: {
          assignment_id: string | null
          created_at: string
          id: string
          is_active: boolean
          message_count: number
          messages: Json
          mode: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assignment_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          message_count?: number
          messages?: Json
          mode?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assignment_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          message_count?: number
          messages?: Json
          mode?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "elya_conversations_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elya_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      elya_prompt_sets: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          module_code: string | null
          prompts: Json
          set_code: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          module_code?: string | null
          prompts: Json
          set_code: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          module_code?: string | null
          prompts?: Json
          set_code?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      free_write_sessions: {
        Row: {
          created_at: string | null
          detected_themes: Json | null
          duration_seconds: number | null
          emotional_arc: string | null
          ended_at: string | null
          id: string
          initial_feeling: string | null
          message_count: number | null
          session_date: string | null
          started_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          detected_themes?: Json | null
          duration_seconds?: number | null
          emotional_arc?: string | null
          ended_at?: string | null
          id?: string
          initial_feeling?: string | null
          message_count?: number | null
          session_date?: string | null
          started_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          detected_themes?: Json | null
          duration_seconds?: number | null
          emotional_arc?: string | null
          ended_at?: string | null
          id?: string
          initial_feeling?: string | null
          message_count?: number | null
          session_date?: string | null
          started_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      interpreter_knowledge: {
        Row: {
          chunk_index: number | null
          content: string
          content_hash: string | null
          content_type: string | null
          created_at: string | null
          difficulty: string | null
          domain: string | null
          embedding: string | null
          id: string
          source_title: string | null
          source_type: string | null
          subdomain: string | null
          total_chunks: number | null
        }
        Insert: {
          chunk_index?: number | null
          content: string
          content_hash?: string | null
          content_type?: string | null
          created_at?: string | null
          difficulty?: string | null
          domain?: string | null
          embedding?: string | null
          id?: string
          source_title?: string | null
          source_type?: string | null
          subdomain?: string | null
          total_chunks?: number | null
        }
        Update: {
          chunk_index?: number | null
          content?: string
          content_hash?: string | null
          content_type?: string | null
          created_at?: string | null
          difficulty?: string | null
          domain?: string | null
          embedding?: string | null
          id?: string
          source_title?: string | null
          source_type?: string | null
          subdomain?: string | null
          total_chunks?: number | null
        }
        Relationships: []
      }
      knowledge_chunks: {
        Row: {
          chunk_index: number
          chunk_text: string
          created_at: string | null
          document_id: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          page_number: number | null
        }
        Insert: {
          chunk_index: number
          chunk_text: string
          created_at?: string | null
          document_id?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          page_number?: number | null
        }
        Update: {
          chunk_index?: number
          chunk_text?: string
          created_at?: string | null
          document_id?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          page_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "knowledge_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_documents: {
        Row: {
          category: string | null
          file_name: string
          file_type: string
          id: string
          is_active: boolean | null
          metadata: Json | null
          page_count: number | null
          title: string
          upload_date: string | null
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          file_name: string
          file_type: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          page_count?: number | null
          title: string
          upload_date?: string | null
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          file_name?: string
          file_type?: string
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          page_count?: number | null
          title?: string
          upload_date?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      learned_preferences: {
        Row: {
          category: string
          confidence: number | null
          created_at: string | null
          description: string
          id: string
          is_active: boolean | null
          learned_from: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category: string
          confidence?: number | null
          created_at?: string | null
          description: string
          id?: string
          is_active?: boolean | null
          learned_from: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          confidence?: number | null
          created_at?: string | null
          description?: string
          id?: string
          is_active?: boolean | null
          learned_from?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      library_entries: {
        Row: {
          created_at: string | null
          debrief_id: string | null
          domain_tags: string[] | null
          entry_date: string
          entry_type: string | null
          id: string
          intensity: string | null
          skill_tags: string[] | null
          title: string
          user_id: string
          workflow_tags: string[] | null
        }
        Insert: {
          created_at?: string | null
          debrief_id?: string | null
          domain_tags?: string[] | null
          entry_date: string
          entry_type?: string | null
          id?: string
          intensity?: string | null
          skill_tags?: string[] | null
          title: string
          user_id: string
          workflow_tags?: string[] | null
        }
        Update: {
          created_at?: string | null
          debrief_id?: string | null
          domain_tags?: string[] | null
          entry_date?: string
          entry_type?: string | null
          id?: string
          intensity?: string | null
          skill_tags?: string[] | null
          title?: string
          user_id?: string
          workflow_tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "library_entries_debrief_id_fkey"
            columns: ["debrief_id"]
            isOneToOne: false
            referencedRelation: "user_debriefs"
            referencedColumns: ["id"]
          },
        ]
      }
      mentorship_suggestions: {
        Row: {
          created_at: string | null
          id: string
          match_score: number | null
          matching_domain: string
          mentee_id: string
          mentor_id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          match_score?: number | null
          matching_domain: string
          mentee_id: string
          mentor_id: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          match_score?: number | null
          matching_domain?: string
          mentee_id?: string
          mentor_id?: string
          status?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string | null
          id: string
          sender_id: string | null
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          sender_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          created_at: string | null
          date: string
          description: string | null
          id: string
          label: string
          metadata: Json | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          label: string
          metadata?: Json | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          label?: string
          metadata?: Json | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          admin_user_id: string | null
          created_at: string | null
          id: string
          name: string
          subscription_tier: string | null
          updated_at: string | null
        }
        Insert: {
          admin_user_id?: string | null
          created_at?: string | null
          id?: string
          name: string
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_user_id?: string | null
          created_at?: string | null
          id?: string
          name?: string
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_flags: {
        Row: {
          created_at: string | null
          debrief_id: string
          description: string
          flag_type: string
          id: string
        }
        Insert: {
          created_at?: string | null
          debrief_id: string
          description: string
          flag_type: string
          id?: string
        }
        Update: {
          created_at?: string | null
          debrief_id?: string
          description?: string
          flag_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_flags_debrief_id_fkey"
            columns: ["debrief_id"]
            isOneToOne: false
            referencedRelation: "debriefs"
            referencedColumns: ["id"]
          },
        ]
      }
      post_bookmarks: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_deleted: boolean | null
          is_edited: boolean | null
          parent_comment_id: string | null
          post_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          is_edited?: boolean | null
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      post_flags: {
        Row: {
          comment_id: string | null
          created_at: string | null
          details: string | null
          flagged_by: string
          id: string
          message_id: string | null
          post_id: string | null
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          comment_id?: string | null
          created_at?: string | null
          details?: string | null
          flagged_by: string
          id?: string
          message_id?: string | null
          post_id?: string | null
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          comment_id?: string | null
          created_at?: string | null
          details?: string | null
          flagged_by?: string
          id?: string
          message_id?: string | null
          post_id?: string | null
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_flags_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_flags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_flags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_sessions: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          id: string
          notes: string | null
          quality_rating: number | null
          session_type: string
          skill_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          quality_rating?: number | null
          session_type: string
          skill_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          quality_rating?: number | null
          session_type?: string
          skill_id?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          billing_cycle: string | null
          bio: string | null
          certification_date: string | null
          challenges_other: string | null
          community_updates: boolean | null
          created_at: string | null
          current_challenges: string[] | null
          current_practices: string[] | null
          data_sharing: string | null
          email: string | null
          email_notifications: boolean | null
          full_name: string | null
          id: string
          is_new_interpreter: boolean | null
          is_student: boolean | null
          linkedin_url: string | null
          open_to_mentoring: boolean | null
          organization_id: string | null
          primary_goal: string | null
          profile_visibility: string | null
          role: string | null
          role_other: string | null
          roles: string[] | null
          settings: string[] | null
          settings_other: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          student_email: string | null
          student_verified_at: string | null
          subscription_ends_at: string | null
          subscription_status: string | null
          subscription_tier: string | null
          training_reminders: boolean | null
          trial_ends_at: string | null
          typical_workload: string | null
          updated_at: string | null
          weekly_reports: boolean | null
          weekly_summary_opt_in: boolean | null
          what_brought_you: string | null
          what_brought_you_other: string | null
          years_experience: string | null
        }
        Insert: {
          billing_cycle?: string | null
          bio?: string | null
          certification_date?: string | null
          challenges_other?: string | null
          community_updates?: boolean | null
          created_at?: string | null
          current_challenges?: string[] | null
          current_practices?: string[] | null
          data_sharing?: string | null
          email?: string | null
          email_notifications?: boolean | null
          full_name?: string | null
          id: string
          is_new_interpreter?: boolean | null
          is_student?: boolean | null
          linkedin_url?: string | null
          open_to_mentoring?: boolean | null
          organization_id?: string | null
          primary_goal?: string | null
          profile_visibility?: string | null
          role?: string | null
          role_other?: string | null
          roles?: string[] | null
          settings?: string[] | null
          settings_other?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          student_email?: string | null
          student_verified_at?: string | null
          subscription_ends_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          training_reminders?: boolean | null
          trial_ends_at?: string | null
          typical_workload?: string | null
          updated_at?: string | null
          weekly_reports?: boolean | null
          weekly_summary_opt_in?: boolean | null
          what_brought_you?: string | null
          what_brought_you_other?: string | null
          years_experience?: string | null
        }
        Update: {
          billing_cycle?: string | null
          bio?: string | null
          certification_date?: string | null
          challenges_other?: string | null
          community_updates?: boolean | null
          created_at?: string | null
          current_challenges?: string[] | null
          current_practices?: string[] | null
          data_sharing?: string | null
          email?: string | null
          email_notifications?: boolean | null
          full_name?: string | null
          id?: string
          is_new_interpreter?: boolean | null
          is_student?: boolean | null
          linkedin_url?: string | null
          open_to_mentoring?: boolean | null
          organization_id?: string | null
          primary_goal?: string | null
          profile_visibility?: string | null
          role?: string | null
          role_other?: string | null
          roles?: string[] | null
          settings?: string[] | null
          settings_other?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          student_email?: string | null
          student_verified_at?: string | null
          subscription_ends_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          training_reminders?: boolean | null
          trial_ends_at?: string | null
          typical_workload?: string | null
          updated_at?: string | null
          weekly_reports?: boolean | null
          weekly_summary_opt_in?: boolean | null
          what_brought_you?: string | null
          what_brought_you_other?: string | null
          years_experience?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_assessments: {
        Row: {
          assessment_type: string | null
          created_at: string | null
          id: string
          level: number
          metadata: Json | null
          skill_id: string
          user_id: string
        }
        Insert: {
          assessment_type?: string | null
          created_at?: string | null
          id?: string
          level: number
          metadata?: Json | null
          skill_id: string
          user_id: string
        }
        Update: {
          assessment_type?: string | null
          created_at?: string | null
          id?: string
          level?: number
          metadata?: Json | null
          skill_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_assessments_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_goals: {
        Row: {
          achieved_at: string | null
          created_at: string | null
          current_level: number | null
          id: string
          metadata: Json | null
          priority: number | null
          skill_id: string
          target_level: number
          user_id: string
        }
        Insert: {
          achieved_at?: string | null
          created_at?: string | null
          current_level?: number | null
          id?: string
          metadata?: Json | null
          priority?: number | null
          skill_id: string
          target_level: number
          user_id: string
        }
        Update: {
          achieved_at?: string | null
          created_at?: string | null
          current_level?: number | null
          id?: string
          metadata?: Json | null
          priority?: number | null
          skill_id?: string
          target_level?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_goals_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_modules: {
        Row: {
          attribution_text: string
          content_application: Json
          content_concept: Json
          content_practice: Json
          created_at: string | null
          description: string | null
          duration_minutes: number
          ecci_domain: string
          elya_prompt_set_id: string | null
          has_video: boolean | null
          id: string
          is_active: boolean | null
          module_code: string
          order_in_series: number
          prerequisites: Json | null
          series_id: string | null
          source_content_url: string | null
          subtitle: string | null
          title: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          attribution_text: string
          content_application: Json
          content_concept: Json
          content_practice: Json
          created_at?: string | null
          description?: string | null
          duration_minutes: number
          ecci_domain: string
          elya_prompt_set_id?: string | null
          has_video?: boolean | null
          id?: string
          is_active?: boolean | null
          module_code: string
          order_in_series: number
          prerequisites?: Json | null
          series_id?: string | null
          source_content_url?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          attribution_text?: string
          content_application?: Json
          content_concept?: Json
          content_practice?: Json
          created_at?: string | null
          description?: string | null
          duration_minutes?: number
          ecci_domain?: string
          elya_prompt_set_id?: string | null
          has_video?: boolean | null
          id?: string
          is_active?: boolean | null
          module_code?: string
          order_in_series?: number
          prerequisites?: Json | null
          series_id?: string | null
          source_content_url?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_modules_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "skill_series"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_reflections: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          messages: Json
          module_id: string
          started_at: string | null
          total_messages: number | null
          updated_at: string | null
          user_id: string
          user_module_progress_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          messages?: Json
          module_id: string
          started_at?: string | null
          total_messages?: number | null
          updated_at?: string | null
          user_id: string
          user_module_progress_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          messages?: Json
          module_id?: string
          started_at?: string | null
          total_messages?: number | null
          updated_at?: string | null
          user_id?: string
          user_module_progress_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_reflections_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "skill_modules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_reflections_user_module_progress_id_fkey"
            columns: ["user_module_progress_id"]
            isOneToOne: false
            referencedRelation: "user_module_progress"
            referencedColumns: ["id"]
          },
        ]
      }
      skill_series: {
        Row: {
          attribution_text: string | null
          created_at: string | null
          description: string | null
          display_order: number
          ecci_domain: string
          estimated_total_minutes: number | null
          icon_emoji: string | null
          id: string
          is_active: boolean | null
          series_code: string
          source_url: string | null
          title: string
          total_modules: number | null
          updated_at: string | null
        }
        Insert: {
          attribution_text?: string | null
          created_at?: string | null
          description?: string | null
          display_order: number
          ecci_domain: string
          estimated_total_minutes?: number | null
          icon_emoji?: string | null
          id?: string
          is_active?: boolean | null
          series_code: string
          source_url?: string | null
          title: string
          total_modules?: number | null
          updated_at?: string | null
        }
        Update: {
          attribution_text?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number
          ecci_domain?: string
          estimated_total_minutes?: number | null
          icon_emoji?: string | null
          id?: string
          is_active?: boolean | null
          series_code?: string
          source_url?: string | null
          title?: string
          total_modules?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      skills: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          domain: string
          id: string
          level_descriptors: Json | null
          name: string
          professional_impact: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          domain: string
          id?: string
          level_descriptors?: Json | null
          name: string
          professional_impact?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          domain?: string
          id?: string
          level_descriptors?: Json | null
          name?: string
          professional_impact?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      team_prep_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          metadata: Json | null
          prep_room_id: string
          role: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          prep_room_id: string
          role: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          prep_room_id?: string
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_prep_messages_prep_room_id_fkey"
            columns: ["prep_room_id"]
            isOneToOne: false
            referencedRelation: "team_prep_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      team_prep_rooms: {
        Row: {
          assignment_id: string
          checklist_state: Json | null
          created_at: string | null
          id: string
          shared_notes: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assignment_id: string
          checklist_state?: Json | null
          created_at?: string | null
          id?: string
          shared_notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assignment_id?: string
          checklist_state?: Json | null
          created_at?: string | null
          id?: string
          shared_notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_prep_rooms_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: true
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      training_assignments: {
        Row: {
          assigned_at: string | null
          assigned_reason: string
          completed_at: string | null
          id: string
          metadata: Json | null
          priority: number | null
          training_module_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_reason: string
          completed_at?: string | null
          id?: string
          metadata?: Json | null
          priority?: number | null
          training_module_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_reason?: string
          completed_at?: string | null
          id?: string
          metadata?: Json | null
          priority?: number | null
          training_module_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_assignments_training_module_id_fkey"
            columns: ["training_module_id"]
            isOneToOne: false
            referencedRelation: "training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      training_completions: {
        Row: {
          completed_at: string | null
          duration_minutes: number | null
          id: string
          metadata: Json | null
          score: number | null
          training_module_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          duration_minutes?: number | null
          id?: string
          metadata?: Json | null
          score?: number | null
          training_module_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          duration_minutes?: number | null
          id?: string
          metadata?: Json | null
          score?: number | null
          training_module_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_completions_training_module_id_fkey"
            columns: ["training_module_id"]
            isOneToOne: false
            referencedRelation: "training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      training_module_skills: {
        Row: {
          skill_id: string
          training_module_id: string
        }
        Insert: {
          skill_id: string
          training_module_id: string
        }
        Update: {
          skill_id?: string
          training_module_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_module_skills_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_module_skills_training_module_id_fkey"
            columns: ["training_module_id"]
            isOneToOne: false
            referencedRelation: "training_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      training_modules: {
        Row: {
          content: Json | null
          created_at: string | null
          description: string | null
          difficulty: string
          duration: number
          format: string
          id: string
          setting: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          description?: string | null
          difficulty: string
          duration: number
          format: string
          id?: string
          setting?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          description?: string | null
          difficulty?: string
          duration?: number
          format?: string
          id?: string
          setting?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_category_stats: {
        Row: {
          accuracy: number | null
          category_id: string
          created_at: string | null
          drills_attempted: number | null
          drills_correct: number | null
          id: string
          last_practiced_at: string | null
          proficiency_level: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          category_id: string
          created_at?: string | null
          drills_attempted?: number | null
          drills_correct?: number | null
          id?: string
          last_practiced_at?: string | null
          proficiency_level?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accuracy?: number | null
          category_id?: string
          created_at?: string | null
          drills_attempted?: number | null
          drills_correct?: number | null
          id?: string
          last_practiced_at?: string | null
          proficiency_level?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_category_stats_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "drill_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_debriefs: {
        Row: {
          ai_summary: string | null
          assignment_date: string
          assignment_title: string
          created_at: string | null
          domain_tags: string[] | null
          feeling: string | null
          go_deeper_prompts: Json | null
          id: string
          intensity_level: string | null
          key_insight: string | null
          skills_used: string[] | null
          updated_at: string | null
          user_id: string
          voice_recording_url: string | null
          voice_transcript: string | null
        }
        Insert: {
          ai_summary?: string | null
          assignment_date: string
          assignment_title: string
          created_at?: string | null
          domain_tags?: string[] | null
          feeling?: string | null
          go_deeper_prompts?: Json | null
          id?: string
          intensity_level?: string | null
          key_insight?: string | null
          skills_used?: string[] | null
          updated_at?: string | null
          user_id: string
          voice_recording_url?: string | null
          voice_transcript?: string | null
        }
        Update: {
          ai_summary?: string | null
          assignment_date?: string
          assignment_title?: string
          created_at?: string | null
          domain_tags?: string[] | null
          feeling?: string | null
          go_deeper_prompts?: Json | null
          id?: string
          intensity_level?: string | null
          key_insight?: string | null
          skills_used?: string[] | null
          updated_at?: string | null
          user_id?: string
          voice_recording_url?: string | null
          voice_transcript?: string | null
        }
        Relationships: []
      }
      user_drill_stats: {
        Row: {
          average_response_time_seconds: number | null
          created_at: string | null
          current_streak_days: number | null
          id: string
          last_practice_date: string | null
          longest_streak_days: number | null
          overall_accuracy: number | null
          overconfidence_rate: number | null
          readiness_score: number | null
          total_drills_attempted: number | null
          total_drills_correct: number | null
          total_practice_time_seconds: number | null
          underconfidence_rate: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          average_response_time_seconds?: number | null
          created_at?: string | null
          current_streak_days?: number | null
          id?: string
          last_practice_date?: string | null
          longest_streak_days?: number | null
          overall_accuracy?: number | null
          overconfidence_rate?: number | null
          readiness_score?: number | null
          total_drills_attempted?: number | null
          total_drills_correct?: number | null
          total_practice_time_seconds?: number | null
          underconfidence_rate?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          average_response_time_seconds?: number | null
          created_at?: string | null
          current_streak_days?: number | null
          id?: string
          last_practice_date?: string | null
          longest_streak_days?: number | null
          overall_accuracy?: number | null
          overconfidence_rate?: number | null
          readiness_score?: number | null
          total_drills_attempted?: number | null
          total_drills_correct?: number | null
          total_practice_time_seconds?: number | null
          underconfidence_rate?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_module_progress: {
        Row: {
          application_completed: boolean | null
          completed_at: string | null
          concept_completed: boolean | null
          created_at: string | null
          id: string
          module_id: string
          practice_completed: boolean | null
          practice_notes: string | null
          reflection_completed: boolean | null
          reflection_text: string | null
          started_at: string | null
          status: string | null
          time_spent_seconds: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          application_completed?: boolean | null
          completed_at?: string | null
          concept_completed?: boolean | null
          created_at?: string | null
          id?: string
          module_id: string
          practice_completed?: boolean | null
          practice_notes?: string | null
          reflection_completed?: boolean | null
          reflection_text?: string | null
          started_at?: string | null
          status?: string | null
          time_spent_seconds?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          application_completed?: boolean | null
          completed_at?: string | null
          concept_completed?: boolean | null
          created_at?: string | null
          id?: string
          module_id?: string
          practice_completed?: boolean | null
          practice_notes?: string | null
          reflection_completed?: boolean | null
          reflection_text?: string | null
          started_at?: string | null
          status?: string | null
          time_spent_seconds?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_module_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "skill_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notes: {
        Row: {
          content: string
          created_at: string | null
          id: string
          metadata: Json | null
          note_type: string
          related_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          note_type: string
          related_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          note_type?: string
          related_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_patterns: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          description: string
          evidence: Json | null
          first_detected_at: string | null
          frequency: number | null
          id: string
          is_active: boolean | null
          last_updated_at: string | null
          pattern_type: string
          recommendation: string | null
          related_domains: string[] | null
          title: string
          trend: string | null
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          description: string
          evidence?: Json | null
          first_detected_at?: string | null
          frequency?: number | null
          id?: string
          is_active?: boolean | null
          last_updated_at?: string | null
          pattern_type: string
          recommendation?: string | null
          related_domains?: string[] | null
          title: string
          trend?: string | null
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          description?: string
          evidence?: Json | null
          first_detected_at?: string | null
          frequency?: number | null
          id?: string
          is_active?: boolean | null
          last_updated_at?: string | null
          pattern_type?: string
          recommendation?: string | null
          related_domains?: string[] | null
          title?: string
          trend?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_series_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          modules_completed: number | null
          series_id: string
          started_at: string | null
          status: string | null
          total_modules: number
          total_time_spent_seconds: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          modules_completed?: number | null
          series_id: string
          started_at?: string | null
          status?: string | null
          total_modules: number
          total_time_spent_seconds?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          modules_completed?: number | null
          series_id?: string
          started_at?: string | null
          status?: string | null
          total_modules?: number
          total_time_spent_seconds?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_series_progress_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "skill_series"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_reports: {
        Row: {
          assignments_by_domain: Json | null
          ceu_hours: number | null
          created_at: string | null
          drift_level: string | null
          drift_signals: string[] | null
          drift_trend: string | null
          emailed_at: string | null
          id: string
          insights: Json | null
          skills_developed: string[] | null
          skills_needs_work: string[] | null
          total_assignments: number | null
          updated_at: string | null
          user_id: string
          week_ending: string
        }
        Insert: {
          assignments_by_domain?: Json | null
          ceu_hours?: number | null
          created_at?: string | null
          drift_level?: string | null
          drift_signals?: string[] | null
          drift_trend?: string | null
          emailed_at?: string | null
          id?: string
          insights?: Json | null
          skills_developed?: string[] | null
          skills_needs_work?: string[] | null
          total_assignments?: number | null
          updated_at?: string | null
          user_id: string
          week_ending: string
        }
        Update: {
          assignments_by_domain?: Json | null
          ceu_hours?: number | null
          created_at?: string | null
          drift_level?: string | null
          drift_signals?: string[] | null
          drift_trend?: string | null
          emailed_at?: string | null
          id?: string
          insights?: Json | null
          skills_developed?: string[] | null
          skills_needs_work?: string[] | null
          total_assignments?: number | null
          updated_at?: string | null
          user_id?: string
          week_ending?: string
        }
        Relationships: []
      }
      wellness_checkins: {
        Row: {
          assignment_id: string | null
          assignment_type: string | null
          created_at: string | null
          feeling: string
          hours_worked_this_week: number | null
          id: string
          is_post_debrief: boolean | null
          notes: string | null
          rest_days_this_month: number | null
          user_id: string
        }
        Insert: {
          assignment_id?: string | null
          assignment_type?: string | null
          created_at?: string | null
          feeling: string
          hours_worked_this_week?: number | null
          id?: string
          is_post_debrief?: boolean | null
          notes?: string | null
          rest_days_this_month?: number | null
          user_id: string
        }
        Update: {
          assignment_id?: string | null
          assignment_type?: string | null
          created_at?: string | null
          feeling?: string
          hours_worked_this_week?: number | null
          id?: string
          is_post_debrief?: boolean | null
          notes?: string | null
          rest_days_this_month?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wellness_checkins_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      posts_with_details: {
        Row: {
          author_experience: number | null
          author_is_mentor: boolean | null
          author_name: string | null
          author_strong_domains: string[] | null
          comments_count: number | null
          content: string | null
          created_at: string | null
          ecci_domains: string[] | null
          id: string | null
          is_deleted: boolean | null
          is_edited: boolean | null
          likes_count: number | null
          post_type: string | null
          setting_tags: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
      wellness_insights: {
        Row: {
          checkin_date: string | null
          checkin_notes: string | null
          detected_themes: Json | null
          emotional_arc: string | null
          feeling: string | null
          free_write_messages: number | null
          free_write_session_id: string | null
          user_id: string | null
        }
        Relationships: []
      }
      wellness_stats: {
        Row: {
          avg_hours_worked: number | null
          avg_rest_days: number | null
          calm_count: number | null
          check_in_date: string | null
          drained_count: number | null
          energized_count: number | null
          okay_count: number | null
          overwhelmed_count: number | null
          total_checkins: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      apply_subscription_update: {
        Args: {
          p_customer_id: string
          p_cycle: string
          p_status: string
          p_subscription_id: string
          p_tier: string
          p_trial_end: string
          p_user_id: string
        }
        Returns: undefined
      }
      are_users_connected: {
        Args: { user1_id: string; user2_id: string }
        Returns: boolean
      }
      calculate_readiness_score: {
        Args: { p_user_id: string }
        Returns: number
      }
      create_group_chat: {
        Args: { group_name_param: string; member_ids: string[] }
        Returns: string
      }
      find_mentorship_matches: {
        Args: { for_user_id: string }
        Returns: {
          match_score: number
          matching_domain: string
          mentor_id: string
          mentor_name: string
        }[]
      }
      get_or_create_dm: { Args: { other_user_id: string }; Returns: string }
      get_organization_credential_stats: {
        Args: { org_id: string }
        Returns: {
          active_count: number
          expired_count: number
          expiring_soon_count: number
          total_credentials: number
        }[]
      }
      get_organization_credentials: {
        Args: { org_id: string }
        Returns: {
          credential_id: string
          credential_name: string
          credential_type: string
          expiration_date: string
          file_url: string
          issue_date: string
          status: string
          user_email: string
          user_id: string
          user_name: string
        }[]
      }
      get_post_stats: {
        Args: { post_id_param: string }
        Returns: {
          comments_count: number
          likes_count: number
        }[]
      }
      get_price_for_user: {
        Args: { p_cycle: string; p_tier: string; p_user_id: string }
        Returns: {
          description: string
          display_name: string
          price_cents: number
          price_id: string
          should_apply_student_discount: boolean
          stripe_price_id: string
        }[]
      }
      get_unread_count: {
        Args: { conv_id: string; for_user_id: string }
        Returns: number
      }
      is_admin: { Args: never; Returns: boolean }
      is_student_eligible: { Args: { profile_id: string }; Returns: boolean }
      search_interpreter_knowledge: {
        Args: {
          filter_difficulty?: string
          filter_domain?: string
          filter_subdomain?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          domain: string
          id: string
          similarity: number
          source_title: string
          subdomain: string
        }[]
      }
      search_knowledge: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          chunk_text: string
          document_id: string
          document_title: string
          id: string
          page_number: number
          similarity: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
