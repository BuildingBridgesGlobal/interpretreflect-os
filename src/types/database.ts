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
      admin_notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          read: boolean | null
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean | null
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean | null
          type?: string
        }
        Relationships: []
      }
      affirmation_favorites: {
        Row: {
          affirmation_id: number
          created_at: string
          id: number
          user_id: string
        }
        Insert: {
          affirmation_id: number
          created_at?: string
          id?: never
          user_id: string
        }
        Update: {
          affirmation_id?: number
          created_at?: string
          id?: never
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affirmation_favorites_affirmation_id_fkey"
            columns: ["affirmation_id"]
            isOneToOne: false
            referencedRelation: "affirmations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affirmation_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      affirmations: {
        Row: {
          affirmation_type: string | null
          content: string | null
          created_at: string | null
          id: number
          user_id: string
        }
        Insert: {
          affirmation_type?: string | null
          content?: string | null
          created_at?: string | null
          id?: never
          user_id: string
        }
        Update: {
          affirmation_type?: string | null
          content?: string | null
          created_at?: string | null
          id?: never
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affirmations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      agent_events: {
        Row: {
          agent: string
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          agent: string
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          agent?: string
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_events_user_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "agent_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          created_at: string
          event_name: string
          event_props: Json
          id: string
          occurred_at: string | null
          session_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_name: string
          event_props?: Json
          id?: string
          occurred_at?: string | null
          session_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_name?: string
          event_props?: Json
          id?: string
          occurred_at?: string | null
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      analytics_sessions: {
        Row: {
          created_at: string
          ended_at: string | null
          id: number
          session_id: string
          started_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: never
          session_id: string
          started_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: never
          session_id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      analytics_users: {
        Row: {
          attributes: Json
          created_at: string
          email_hash: string | null
          user_id: string
        }
        Insert: {
          attributes?: Json
          created_at?: string
          email_hash?: string | null
          user_id: string
        }
        Update: {
          attributes?: Json
          created_at?: string
          email_hash?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      anonymized_reflections: {
        Row: {
          context_type: string | null
          created_at: string | null
          id: string
          metrics: Json
          reflection_category: string
          session_hash: string
          user_hash: string
        }
        Insert: {
          context_type?: string | null
          created_at?: string | null
          id?: string
          metrics?: Json
          reflection_category: string
          session_hash: string
          user_hash: string
        }
        Update: {
          context_type?: string | null
          created_at?: string | null
          id?: string
          metrics?: Json
          reflection_category?: string
          session_hash?: string
          user_hash?: string
        }
        Relationships: []
      }
      app_users: {
        Row: {
          created_at: string | null
          id: string
          org_id: string
          role: string
        }
        Insert: {
          created_at?: string | null
          id: string
          org_id: string
          role?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          org_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_users_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      asl_dictionary: {
        Row: {
          created_at: string
          definition: string | null
          examples: string[] | null
          id: string
          source: string | null
          synonyms: string[] | null
          term: string
        }
        Insert: {
          created_at?: string
          definition?: string | null
          examples?: string[] | null
          id?: string
          source?: string | null
          synonyms?: string[] | null
          term: string
        }
        Update: {
          created_at?: string
          definition?: string | null
          examples?: string[] | null
          id?: string
          source?: string | null
          synonyms?: string[] | null
          term?: string
        }
        Relationships: []
      }
      assignments: {
        Row: {
          ai_modalities: string[] | null
          ai_used: boolean | null
          created_at: string | null
          duration_minutes: number | null
          ended_at: string | null
          id: string
          modality: Database["public"]["Enums"]["assignment_modality"]
          participants: string[] | null
          setting: Database["public"]["Enums"]["assignment_setting"]
          stakes: Database["public"]["Enums"]["assignment_stakes"]
          started_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_modalities?: string[] | null
          ai_used?: boolean | null
          created_at?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          modality: Database["public"]["Enums"]["assignment_modality"]
          participants?: string[] | null
          setting: Database["public"]["Enums"]["assignment_setting"]
          stakes: Database["public"]["Enums"]["assignment_stakes"]
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_modalities?: string[] | null
          ai_used?: boolean | null
          created_at?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          modality?: Database["public"]["Enums"]["assignment_modality"]
          participants?: string[] | null
          setting?: Database["public"]["Enums"]["assignment_setting"]
          stakes?: Database["public"]["Enums"]["assignment_stakes"]
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      attestation_receipts: {
        Row: {
          artifact_hash: string | null
          created_at: string
          id: number
          issued_at: string
          payload: Json | null
          receipt_id: string
          user_id: string
          verifier_url: string | null
        }
        Insert: {
          artifact_hash?: string | null
          created_at?: string
          id?: never
          issued_at?: string
          payload?: Json | null
          receipt_id: string
          user_id: string
          verifier_url?: string | null
        }
        Update: {
          artifact_hash?: string | null
          created_at?: string
          id?: never
          issued_at?: string
          payload?: Json | null
          receipt_id?: string
          user_id?: string
          verifier_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attestation_receipts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      baseline_checks: {
        Row: {
          capacity_reserve: number | null
          check_date: string
          cognitive_load: number | null
          created_at: string | null
          id: string
          notes: string | null
          performance_readiness: number | null
          recovery_quality: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          capacity_reserve?: number | null
          check_date?: string
          cognitive_load?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          performance_readiness?: number | null
          recovery_quality?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          capacity_reserve?: number | null
          check_date?: string
          cognitive_load?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          performance_readiness?: number | null
          recovery_quality?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "baseline_checks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      body_checkins: {
        Row: {
          body_areas: Json | null
          created_at: string | null
          energy_level: number | null
          id: string
          mood_level: number | null
          notes: string | null
          overall_feeling: number | null
          tension_level: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          body_areas?: Json | null
          created_at?: string | null
          energy_level?: number | null
          id?: string
          mood_level?: number | null
          notes?: string | null
          overall_feeling?: number | null
          tension_level?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          body_areas?: Json | null
          created_at?: string | null
          energy_level?: number | null
          id?: string
          mood_level?: number | null
          notes?: string | null
          overall_feeling?: number | null
          tension_level?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "body_checkins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      burnout_alert_thresholds: {
        Row: {
          alert_enabled: boolean
          created_at: string
          critical_threshold: number
          id: string
          updated_at: string
          user_id: string
          warning_threshold: number
        }
        Insert: {
          alert_enabled?: boolean
          created_at?: string
          critical_threshold?: number
          id?: string
          updated_at?: string
          user_id: string
          warning_threshold?: number
        }
        Update: {
          alert_enabled?: boolean
          created_at?: string
          critical_threshold?: number
          id?: string
          updated_at?: string
          user_id?: string
          warning_threshold?: number
        }
        Relationships: [
          {
            foreignKeyName: "burnout_alert_thresholds_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      burnout_alerts: {
        Row: {
          acknowledged: boolean
          acknowledged_at: string | null
          alert_date: string
          burnout_index: number
          created_at: string
          id: string
          severity: string
          user_id: string
        }
        Insert: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          alert_date?: string
          burnout_index: number
          created_at?: string
          id?: string
          severity: string
          user_id: string
        }
        Update: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          alert_date?: string
          burnout_index?: number
          created_at?: string
          id?: string
          severity?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "burnout_alerts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      burnout_assessments: {
        Row: {
          assessment_date: string
          context_details: Json | null
          context_id: string | null
          context_type: string | null
          created_at: string
          difficult_session: boolean | null
          emotional_demand: string | null
          emotional_leakage: number
          energy_tank: number
          had_breaks: boolean | null
          id: string
          performance_signal: number
          recovery_speed: number
          risk_level: string
          team_support: boolean | null
          tomorrow_readiness: number
          total_score: number
          updated_at: string
          user_id: string
          workload_intensity: string | null
        }
        Insert: {
          assessment_date?: string
          context_details?: Json | null
          context_id?: string | null
          context_type?: string | null
          created_at?: string
          difficult_session?: boolean | null
          emotional_demand?: string | null
          emotional_leakage: number
          energy_tank: number
          had_breaks?: boolean | null
          id?: string
          performance_signal: number
          recovery_speed: number
          risk_level: string
          team_support?: boolean | null
          tomorrow_readiness: number
          total_score: number
          updated_at?: string
          user_id: string
          workload_intensity?: string | null
        }
        Update: {
          assessment_date?: string
          context_details?: Json | null
          context_id?: string | null
          context_type?: string | null
          created_at?: string
          difficult_session?: boolean | null
          emotional_demand?: string | null
          emotional_leakage?: number
          energy_tank?: number
          had_breaks?: boolean | null
          id?: string
          performance_signal?: number
          recovery_speed?: number
          risk_level?: string
          team_support?: boolean | null
          tomorrow_readiness?: number
          total_score?: number
          updated_at?: string
          user_id?: string
          workload_intensity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "burnout_assessments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      burnout_recommendations: {
        Row: {
          active: boolean
          category_id: string
          description: string
          id: string
          max_burnout_index: number
          min_burnout_index: number
          priority: number
          title: string
        }
        Insert: {
          active?: boolean
          category_id: string
          description: string
          id?: string
          max_burnout_index: number
          min_burnout_index: number
          priority?: number
          title: string
        }
        Update: {
          active?: boolean
          category_id?: string
          description?: string
          id?: string
          max_burnout_index?: number
          min_burnout_index?: number
          priority?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "burnout_recommendations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "recommendation_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      catalyst_conversations: {
        Row: {
          ai_model_used: string | null
          conversation_type: string | null
          created_at: string | null
          id: string
          last_message_at: string | null
          messages: Json | null
          related_reflect_ids: string[] | null
          title: string | null
          topics_discussed: string[] | null
          user_id: string
        }
        Insert: {
          ai_model_used?: string | null
          conversation_type?: string | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          messages?: Json | null
          related_reflect_ids?: string[] | null
          title?: string | null
          topics_discussed?: string[] | null
          user_id: string
        }
        Update: {
          ai_model_used?: string | null
          conversation_type?: string | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          messages?: Json | null
          related_reflect_ids?: string[] | null
          title?: string | null
          topics_discussed?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalyst_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "active_subscribers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catalyst_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ceu_activity_log: {
        Row: {
          activity_name: string
          activity_type: string
          completed_at: string | null
          created_at: string | null
          enrollment_id: string
          id: string
          metadata: Json | null
          reflection_id: string | null
          started_at: string | null
          time_spent_minutes: number | null
          user_id: string
        }
        Insert: {
          activity_name: string
          activity_type: string
          completed_at?: string | null
          created_at?: string | null
          enrollment_id: string
          id?: string
          metadata?: Json | null
          reflection_id?: string | null
          started_at?: string | null
          time_spent_minutes?: number | null
          user_id: string
        }
        Update: {
          activity_name?: string
          activity_type?: string
          completed_at?: string | null
          created_at?: string | null
          enrollment_id?: string
          id?: string
          metadata?: Json | null
          reflection_id?: string | null
          started_at?: string | null
          time_spent_minutes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ceu_activity_log_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "ceu_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ceu_activity_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ceu_certificate_year_seq: {
        Row: {
          last_value: number
          year: number
        }
        Insert: {
          last_value?: number
          year: number
        }
        Update: {
          last_value?: number
          year?: number
        }
        Relationships: []
      }
      ceu_completions: {
        Row: {
          attested_at: string | null
          attested_by: string | null
          category: string
          certificate_generated_at: string | null
          certificate_number: string | null
          certificate_url: string | null
          ceu_awarded: number
          completion_date: string | null
          completion_day: string | null
          completion_evidence: Json | null
          contact_hours: number
          created_at: string | null
          enrollment_id: string
          id: string
          learning_objectives_met: Json
          program_id: string
          ps_subcategory: string | null
          reported_at: string | null
          reported_to_rid: boolean | null
          rid_number: string
          sponsor_name: string | null
          sponsor_rid_number: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attested_at?: string | null
          attested_by?: string | null
          category: string
          certificate_generated_at?: string | null
          certificate_number?: string | null
          certificate_url?: string | null
          ceu_awarded: number
          completion_date?: string | null
          completion_day?: string | null
          completion_evidence?: Json | null
          contact_hours: number
          created_at?: string | null
          enrollment_id: string
          id?: string
          learning_objectives_met: Json
          program_id: string
          ps_subcategory?: string | null
          reported_at?: string | null
          reported_to_rid?: boolean | null
          rid_number: string
          sponsor_name?: string | null
          sponsor_rid_number?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attested_at?: string | null
          attested_by?: string | null
          category?: string
          certificate_generated_at?: string | null
          certificate_number?: string | null
          certificate_url?: string | null
          ceu_awarded?: number
          completion_date?: string | null
          completion_day?: string | null
          completion_evidence?: Json | null
          contact_hours?: number
          created_at?: string | null
          enrollment_id?: string
          id?: string
          learning_objectives_met?: Json
          program_id?: string
          ps_subcategory?: string | null
          reported_at?: string | null
          reported_to_rid?: boolean | null
          rid_number?: string
          sponsor_name?: string | null
          sponsor_rid_number?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ceu_completions_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "ceu_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ceu_completions_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "ceu_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ceu_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ceu_enrollments: {
        Row: {
          completion_date: string | null
          created_at: string | null
          enrolled_at: string | null
          enrolled_day: string | null
          id: string
          metadata: Json | null
          program_id: string
          progress: Json | null
          rid_number: string | null
          status: string | null
          total_time_minutes: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completion_date?: string | null
          created_at?: string | null
          enrolled_at?: string | null
          enrolled_day?: string | null
          id?: string
          metadata?: Json | null
          program_id: string
          progress?: Json | null
          rid_number?: string | null
          status?: string | null
          total_time_minutes?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completion_date?: string | null
          created_at?: string | null
          enrolled_at?: string | null
          enrolled_day?: string | null
          id?: string
          metadata?: Json | null
          program_id?: string
          progress?: Json | null
          rid_number?: string | null
          status?: string | null
          total_time_minutes?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ceu_enrollments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "ceu_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ceu_enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ceu_programs: {
        Row: {
          bundle_type: string | null
          category: string | null
          ceu_value: number
          created_at: string | null
          description: string
          estimated_hours: number
          id: string
          is_active: boolean | null
          learning_objectives: Json
          price_cents: number
          program_code: string
          ps_subcategory: string | null
          required_reflections: Json | null
          stripe_price_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          bundle_type?: string | null
          category?: string | null
          ceu_value: number
          created_at?: string | null
          description: string
          estimated_hours: number
          id?: string
          is_active?: boolean | null
          learning_objectives: Json
          price_cents?: number
          program_code: string
          ps_subcategory?: string | null
          required_reflections?: Json | null
          stripe_price_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          bundle_type?: string | null
          category?: string | null
          ceu_value?: number
          created_at?: string | null
          description?: string
          estimated_hours?: number
          id?: string
          is_active?: boolean | null
          learning_objectives?: Json
          price_cents?: number
          program_code?: string
          ps_subcategory?: string | null
          required_reflections?: Json | null
          stripe_price_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      comm_events: {
        Row: {
          created_at: string
          email: string
          event_type: string
          id: string
          metadata: Json | null
          occurred_at: string
          source: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          event_type: string
          id?: string
          metadata?: Json | null
          occurred_at?: string
          source?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          occurred_at?: string
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comm_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      consent_flags: {
        Row: {
          id: string
          key: string
          updated_at: string
          user_id: string
          value: boolean
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          user_id: string
          value?: boolean
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          user_id?: string
          value?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "consent_flags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      context_metrics: {
        Row: {
          context_type: string
          id: string
          last_updated: string | null
          metrics: Json
          user_id: string | null
        }
        Insert: {
          context_type: string
          id?: string
          last_updated?: string | null
          metrics: Json
          user_id?: string | null
        }
        Update: {
          context_type?: string
          id?: string
          last_updated?: string | null
          metrics?: Json
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "context_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      credential_events: {
        Row: {
          artifact_hash: string
          artifact_ref: string
          artifact_type: string
          id: string
          issued_at: string | null
          user_id: string
          verifier_url: string | null
        }
        Insert: {
          artifact_hash: string
          artifact_ref: string
          artifact_type: string
          id?: string
          issued_at?: string | null
          user_id: string
          verifier_url?: string | null
        }
        Update: {
          artifact_hash?: string
          artifact_ref?: string
          artifact_type?: string
          id?: string
          issued_at?: string | null
          user_id?: string
          verifier_url?: string | null
        }
        Relationships: []
      }
      daily_activity: {
        Row: {
          activities_completed: string[]
          activity_date: string
          created_at: string
          id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          activities_completed?: string[]
          activity_date: string
          created_at?: string
          id?: never
          updated_at?: string
          user_id: string
        }
        Update: {
          activities_completed?: string[]
          activity_date?: string
          created_at?: string
          id?: never
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      daily_burnout_checks: {
        Row: {
          assessment_date: string | null
          burnout_index: number | null
          burnout_risk_score: number | null
          check_date: string
          created_at: string
          emotional_exhaustion: number | null
          emotional_leakage: Database["public"]["Enums"]["emotional_state"]
          emotional_score: number
          energy_level: number | null
          energy_score: number
          energy_tank: Database["public"]["Enums"]["energy_level"]
          id: string
          motivation_level: number | null
          notes: string | null
          performance_score: number
          performance_signal: Database["public"]["Enums"]["performance_impact"]
          readiness_score: number
          recovery_score: number
          recovery_speed: Database["public"]["Enums"]["recovery_speed"]
          stress_level: number | null
          tomorrow_readiness: Database["public"]["Enums"]["readiness_level"]
          user_id: string
          work_satisfaction: number | null
        }
        Insert: {
          assessment_date?: string | null
          burnout_index?: number | null
          burnout_risk_score?: number | null
          check_date?: string
          created_at?: string
          emotional_exhaustion?: number | null
          emotional_leakage: Database["public"]["Enums"]["emotional_state"]
          emotional_score: number
          energy_level?: number | null
          energy_score: number
          energy_tank: Database["public"]["Enums"]["energy_level"]
          id?: string
          motivation_level?: number | null
          notes?: string | null
          performance_score: number
          performance_signal: Database["public"]["Enums"]["performance_impact"]
          readiness_score: number
          recovery_score: number
          recovery_speed: Database["public"]["Enums"]["recovery_speed"]
          stress_level?: number | null
          tomorrow_readiness: Database["public"]["Enums"]["readiness_level"]
          user_id: string
          work_satisfaction?: number | null
        }
        Update: {
          assessment_date?: string | null
          burnout_index?: number | null
          burnout_risk_score?: number | null
          check_date?: string
          created_at?: string
          emotional_exhaustion?: number | null
          emotional_leakage?: Database["public"]["Enums"]["emotional_state"]
          emotional_score?: number
          energy_level?: number | null
          energy_score?: number
          energy_tank?: Database["public"]["Enums"]["energy_level"]
          id?: string
          motivation_level?: number | null
          notes?: string | null
          performance_score?: number
          performance_signal?: Database["public"]["Enums"]["performance_impact"]
          readiness_score?: number
          recovery_score?: number
          recovery_speed?: Database["public"]["Enums"]["recovery_speed"]
          stress_level?: number | null
          tomorrow_readiness?: Database["public"]["Enums"]["readiness_level"]
          user_id?: string
          work_satisfaction?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_burnout_checks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      daily_burnout_metrics: {
        Row: {
          burnout_score: number | null
          created_at: string | null
          energy_level: number | null
          id: string
          metric_date: string
          notes: string | null
          recovery_score: number | null
          stress_level: number | null
          updated_at: string | null
          user_id: string
          workload_score: number | null
        }
        Insert: {
          burnout_score?: number | null
          created_at?: string | null
          energy_level?: number | null
          id?: string
          metric_date: string
          notes?: string | null
          recovery_score?: number | null
          stress_level?: number | null
          updated_at?: string | null
          user_id: string
          workload_score?: number | null
        }
        Update: {
          burnout_score?: number | null
          created_at?: string | null
          energy_level?: number | null
          id?: string
          metric_date?: string
          notes?: string | null
          recovery_score?: number | null
          stress_level?: number | null
          updated_at?: string | null
          user_id?: string
          workload_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_burnout_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      daily_snapshots: {
        Row: {
          affirmation_id: number | null
          burnout_drift: number | null
          created_at: string
          domain_stress: Json | null
          id: string
          load_score: number | null
          notes: string | null
          performance_score: number | null
          snapshot_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          affirmation_id?: number | null
          burnout_drift?: number | null
          created_at?: string
          domain_stress?: Json | null
          id?: string
          load_score?: number | null
          notes?: string | null
          performance_score?: number | null
          snapshot_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          affirmation_id?: number | null
          burnout_drift?: number | null
          created_at?: string
          domain_stress?: Json | null
          id?: string
          load_score?: number | null
          notes?: string | null
          performance_score?: number | null
          snapshot_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_snapshots_affirmation_id_fkey"
            columns: ["affirmation_id"]
            isOneToOne: false
            referencedRelation: "affirmations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      document_embeddings: {
        Row: {
          chunk_index: number
          content_snippet: string | null
          created_at: string
          document_id: string
          embedding: string
          id: string
        }
        Insert: {
          chunk_index?: number
          content_snippet?: string | null
          created_at?: string
          document_id: string
          embedding: string
          id?: string
        }
        Update: {
          chunk_index?: number
          content_snippet?: string | null
          created_at?: string
          document_id?: string
          embedding?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_embeddings_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: string | null
          created_at: string
          domain: string | null
          id: string
          metadata: Json | null
          title: string
          url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          metadata?: Json | null
          title: string
          url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          metadata?: Json | null
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      ecci_domains: {
        Row: {
          description: string | null
          id: number
          key: string
          name: string
        }
        Insert: {
          description?: string | null
          id: number
          key: string
          name: string
        }
        Update: {
          description?: string | null
          id?: number
          key?: string
          name?: string
        }
        Relationships: []
      }
      elya_conversation_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          message_type: string | null
          metadata: Json | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          message_type?: string | null
          metadata?: Json | null
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          message_type?: string | null
          metadata?: Json | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "elya_conversation_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "active_subscribers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "elya_conversation_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      elya_conversations: {
        Row: {
          content: string
          created_at: string | null
          id: string
          message_id: string
          metadata: Json | null
          sender: string
          session_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          message_id: string
          metadata?: Json | null
          sender: string
          session_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          message_id?: string
          metadata?: Json | null
          sender?: string
          session_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "elya_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      email_events: {
        Row: {
          created_at: string | null
          encharge_event_id: string | null
          event_type: string
          id: string
          metadata: Json | null
          sent_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          encharge_event_id?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          sent_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          encharge_event_id?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          sent_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      email_subscriptions: {
        Row: {
          channel: string
          created_at: string | null
          email: string
          id: number
          source: string | null
          status: string
          subscribed_at: string | null
          unsubscribed_at: string | null
          updated_at: string | null
        }
        Insert: {
          channel?: string
          created_at?: string | null
          email: string
          id?: never
          source?: string | null
          status?: string
          subscribed_at?: string | null
          unsubscribed_at?: string | null
          updated_at?: string | null
        }
        Update: {
          channel?: string
          created_at?: string | null
          email?: string
          id?: never
          source?: string | null
          status?: string
          subscribed_at?: string | null
          unsubscribed_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      emotion_tags: {
        Row: {
          created_at: string
          entry_id: string
          id: string
          intensity: number | null
          tag: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_id: string
          id?: string
          intensity?: number | null
          tag: string
          user_id: string
        }
        Update: {
          created_at?: string
          entry_id?: string
          id?: string
          intensity?: number | null
          tag?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emotion_tags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      emotional_contagion_patterns: {
        Row: {
          affected_hash: string
          context_type: string | null
          correlation_strength: number | null
          day_of_week: number | null
          detected_at: string | null
          emotion_category: string
          id: string
          source_hash: string
          spread_velocity: number | null
          team_hash: string
          team_size_bracket: string | null
          time_lag: unknown
          time_of_day: string | null
          workload_intensity: string | null
        }
        Insert: {
          affected_hash: string
          context_type?: string | null
          correlation_strength?: number | null
          day_of_week?: number | null
          detected_at?: string | null
          emotion_category: string
          id?: string
          source_hash: string
          spread_velocity?: number | null
          team_hash: string
          team_size_bracket?: string | null
          time_lag?: unknown
          time_of_day?: string | null
          workload_intensity?: string | null
        }
        Update: {
          affected_hash?: string
          context_type?: string | null
          correlation_strength?: number | null
          day_of_week?: number | null
          detected_at?: string | null
          emotion_category?: string
          id?: string
          source_hash?: string
          spread_velocity?: number | null
          team_hash?: string
          team_size_bracket?: string | null
          time_lag?: unknown
          time_of_day?: string | null
          workload_intensity?: string | null
        }
        Relationships: []
      }
      eri_snapshots: {
        Row: {
          assignment_count: number
          assignment_window: number
          computed_at: string
          eri_band: Database["public"]["Enums"]["eri_band"]
          eri_score: number | null
          id: string
          user_id: string
        }
        Insert: {
          assignment_count?: number
          assignment_window?: number
          computed_at?: string
          eri_band?: Database["public"]["Enums"]["eri_band"]
          eri_score?: number | null
          id?: string
          user_id: string
        }
        Update: {
          assignment_count?: number
          assignment_window?: number
          computed_at?: string
          eri_band?: Database["public"]["Enums"]["eri_band"]
          eri_score?: number | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eri_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      escalation_events: {
        Row: {
          admin_notes: string | null
          created_at: string
          detected_at: string
          detected_keywords: string[]
          id: number
          message_excerpt: string | null
          requires_admin_review: boolean
          reviewed_at: string | null
          reviewed_by_admin: string | null
          risk_level: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          detected_at?: string
          detected_keywords: string[]
          id?: number
          message_excerpt?: string | null
          requires_admin_review?: boolean
          reviewed_at?: string | null
          reviewed_by_admin?: string | null
          risk_level: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          detected_at?: string
          detected_keywords?: string[]
          id?: number
          message_excerpt?: string | null
          requires_admin_review?: boolean
          reviewed_at?: string | null
          reviewed_by_admin?: string | null
          risk_level?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "escalation_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "active_subscribers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalation_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_definitions: {
        Row: {
          description: string | null
          event_name: string
          required_props: Json
          updated_at: string | null
        }
        Insert: {
          description?: string | null
          event_name: string
          required_props?: Json
          updated_at?: string | null
        }
        Update: {
          description?: string | null
          event_name?: string
          required_props?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      failed_payments: {
        Row: {
          amount: number | null
          attempt_count: number | null
          created_at: string | null
          currency: string | null
          failure_reason: string | null
          id: string
          next_retry_date: string | null
          recovered: boolean | null
          recovered_at: string | null
          stripe_customer_id: string | null
          stripe_invoice_id: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          attempt_count?: number | null
          created_at?: string | null
          currency?: string | null
          failure_reason?: string | null
          id?: string
          next_retry_date?: string | null
          recovered?: boolean | null
          recovered_at?: string | null
          stripe_customer_id?: string | null
          stripe_invoice_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          attempt_count?: number | null
          created_at?: string | null
          currency?: string | null
          failure_reason?: string | null
          id?: string
          next_retry_date?: string | null
          recovered?: boolean | null
          recovered_at?: string | null
          stripe_customer_id?: string | null
          stripe_invoice_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "failed_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      feature_requests: {
        Row: {
          context_url: string | null
          created_at: string
          feature_request: string
          id: string
          sentiment: string | null
          source: string
          tags: string[]
          timestamp: string
        }
        Insert: {
          context_url?: string | null
          created_at?: string
          feature_request: string
          id?: string
          sentiment?: string | null
          source: string
          tags?: string[]
          timestamp: string
        }
        Update: {
          context_url?: string | null
          created_at?: string
          feature_request?: string
          id?: string
          sentiment?: string | null
          source?: string
          tags?: string[]
          timestamp?: string
        }
        Relationships: []
      }
      feedback_logs: {
        Row: {
          agent_name: string
          created_at: string
          id: string
          journal_id: string | null
          request: Json
          response: Json
          user_id: string
        }
        Insert: {
          agent_name?: string
          created_at?: string
          id?: string
          journal_id?: string | null
          request?: Json
          response?: Json
          user_id: string
        }
        Update: {
          agent_name?: string
          created_at?: string
          id?: string
          journal_id?: string | null
          request?: Json
          response?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_logs_journal_id_fkey"
            columns: ["journal_id"]
            isOneToOne: false
            referencedRelation: "journal_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      growth_insights: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          insight_type: string | null
          metadata: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          insight_type?: string | null
          metadata?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          insight_type?: string | null
          metadata?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "growth_insights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      interpreter_teaming_profiles: {
        Row: {
          bio: string | null
          communication_style: string
          content_comfort: string
          created_at: string | null
          experience_level: string
          fun_fact: string | null
          id: string
          platform_experience: Json | null
          preferred_teaming_style: string
          specialties: string[] | null
          stress_response: string
          support_needs: string[] | null
          support_offers: string[] | null
          support_style: string
          teaming_preferences: Json | null
          turn_rotation_preference: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bio?: string | null
          communication_style: string
          content_comfort: string
          created_at?: string | null
          experience_level: string
          fun_fact?: string | null
          id?: string
          platform_experience?: Json | null
          preferred_teaming_style: string
          specialties?: string[] | null
          stress_response: string
          support_needs?: string[] | null
          support_offers?: string[] | null
          support_style: string
          teaming_preferences?: Json | null
          turn_rotation_preference: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bio?: string | null
          communication_style?: string
          content_comfort?: string
          created_at?: string | null
          experience_level?: string
          fun_fact?: string | null
          id?: string
          platform_experience?: Json | null
          preferred_teaming_style?: string
          specialties?: string[] | null
          stress_response?: string
          support_needs?: string[] | null
          support_offers?: string[] | null
          support_style?: string
          teaming_preferences?: Json | null
          turn_rotation_preference?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interpreter_teaming_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      journal_logs: {
        Row: {
          content: string
          created_at: string
          id: string
          started_at: string
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          started_at?: string
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          started_at?: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      journaling_entries: {
        Row: {
          assignment_id: string | null
          body: string
          created_at: string | null
          ecci_domain_ids: number[] | null
          id: string
          tags: string[] | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assignment_id?: string | null
          body: string
          created_at?: string | null
          ecci_domain_ids?: number[] | null
          id?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assignment_id?: string | null
          body?: string
          created_at?: string | null
          ecci_domain_ids?: number[] | null
          id?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journaling_entries_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignment_eri"
            referencedColumns: ["assignment_id"]
          },
          {
            foreignKeyName: "journaling_entries_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journaling_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      knowledge_feedback: {
        Row: {
          created_at: string
          document_id: string | null
          feedback: string | null
          id: string
          rating: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          feedback?: string | null
          id?: string
          rating?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string | null
          feedback?: string | null
          id?: string
          rating?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_feedback_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_graph: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          relation: string
          source_node: string
          target_node: string
          weight: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          relation: string
          source_node: string
          target_node: string
          weight?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          relation?: string
          source_node?: string
          target_node?: string
          weight?: number | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          analysis: Json | null
          content: string
          created_at: string | null
          id: number
          user_id: string
        }
        Insert: {
          analysis?: Json | null
          content: string
          created_at?: string | null
          id?: never
          user_id: string
        }
        Update: {
          analysis?: Json | null
          content?: string
          created_at?: string | null
          id?: never
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      metrics_daily: {
        Row: {
          dims: Json | null
          dims_k: string
          metric_date: string
          metric_name: string
          value: number
        }
        Insert: {
          dims?: Json | null
          dims_k?: string
          metric_date: string
          metric_name: string
          value: number
        }
        Update: {
          dims?: Json | null
          dims_k?: string
          metric_date?: string
          metric_name?: string
          value?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          message: string
          read_at: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message: string
          read_at?: string | null
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string
          read_at?: string | null
          title?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      onboarding_profiles: {
        Row: {
          answers: Json | null
          completed_at: string | null
          created_at: string
          current_step: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string
          current_step?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          created_at?: string
          current_step?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      onboarding_progress: {
        Row: {
          completed_at: string | null
          completed_steps: Json | null
          created_at: string | null
          current_step: number | null
          elya_introduced: boolean | null
          first_tool_used: boolean | null
          id: string
          notification_preferences_set: boolean | null
          profile_completed: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          completed_steps?: Json | null
          created_at?: string | null
          current_step?: number | null
          elya_introduced?: boolean | null
          first_tool_used?: boolean | null
          id?: string
          notification_preferences_set?: boolean | null
          profile_completed?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          completed_steps?: Json | null
          created_at?: string | null
          current_step?: number | null
          elya_introduced?: boolean | null
          first_tool_used?: boolean | null
          id?: string
          notification_preferences_set?: boolean | null
          profile_completed?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      organization_alerts: {
        Row: {
          action_items: string[] | null
          alert_type: string
          created_at: string | null
          digest_sent_at: string | null
          id: string
          is_included_in_digest: boolean | null
          is_read: boolean | null
          message: string
          metrics: Json | null
          organization_id: string
          severity: string
          title: string
        }
        Insert: {
          action_items?: string[] | null
          alert_type: string
          created_at?: string | null
          digest_sent_at?: string | null
          id?: string
          is_included_in_digest?: boolean | null
          is_read?: boolean | null
          message: string
          metrics?: Json | null
          organization_id: string
          severity: string
          title: string
        }
        Update: {
          action_items?: string[] | null
          alert_type?: string
          created_at?: string | null
          digest_sent_at?: string | null
          id?: string
          is_included_in_digest?: boolean | null
          is_read?: boolean | null
          message?: string
          metrics?: Json | null
          organization_id?: string
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_alerts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string | null
          organization_id: string
          role: string | null
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          organization_id: string
          role?: string | null
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string | null
          organization_id?: string
          role?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "organization_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          consent_date: string | null
          consent_given: boolean | null
          consent_version: string | null
          id: string
          is_active: boolean | null
          joined_at: string | null
          left_at: string | null
          organization_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          consent_date?: string | null
          consent_given?: boolean | null
          consent_version?: string | null
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          left_at?: string | null
          organization_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          consent_date?: string | null
          consent_given?: boolean | null
          consent_version?: string | null
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          left_at?: string | null
          organization_id?: string
          role?: string | null
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
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      organization_metrics_cache: {
        Row: {
          active_members: number | null
          avg_burnout_score: number | null
          avg_confidence_level: number | null
          computed_at: string | null
          date: string
          high_burnout_count: number | null
          id: string
          low_confidence_count: number | null
          metrics_detail: Json | null
          organization_id: string
          total_members: number | null
          total_reflections: number | null
          total_stress_resets: number | null
        }
        Insert: {
          active_members?: number | null
          avg_burnout_score?: number | null
          avg_confidence_level?: number | null
          computed_at?: string | null
          date: string
          high_burnout_count?: number | null
          id?: string
          low_confidence_count?: number | null
          metrics_detail?: Json | null
          organization_id: string
          total_members?: number | null
          total_reflections?: number | null
          total_stress_resets?: number | null
        }
        Update: {
          active_members?: number | null
          avg_burnout_score?: number | null
          avg_confidence_level?: number | null
          computed_at?: string | null
          date?: string
          high_burnout_count?: number | null
          id?: string
          low_confidence_count?: number | null
          metrics_detail?: Json | null
          organization_id?: string
          total_members?: number | null
          total_reflections?: number | null
          total_stress_resets?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_metrics_cache_organization_id_fkey"
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
          custom_pricing: number | null
          id: string
          is_active: boolean | null
          name: string
          primary_contact_email: string | null
          primary_contact_name: string | null
          settings: Json | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_tier: string | null
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          custom_pricing?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          settings?: Json | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_tier?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          custom_pricing?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          settings?: Json | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_tier?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      orgs: {
        Row: {
          id: string
          name: string
          plan_id: string
          retention_days_override: number | null
        }
        Insert: {
          id?: string
          name: string
          plan_id?: string
          retention_days_override?: number | null
        }
        Update: {
          id?: string
          name?: string
          plan_id?: string
          retention_days_override?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orgs_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      pabbly_webhook_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          processed_at: string | null
          processing_status: string | null
          retry_count: number | null
          webhook_payload: Json
          workflow_name: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          processed_at?: string | null
          processing_status?: string | null
          retry_count?: number | null
          webhook_payload: Json
          workflow_name: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          processed_at?: string | null
          processing_status?: string | null
          retry_count?: number | null
          webhook_payload?: Json
          workflow_name?: string
        }
        Relationships: []
      }
      password_reset_codes: {
        Row: {
          code: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
          used: boolean | null
          used_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          used?: boolean | null
          used_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          used?: boolean | null
          used_at?: string | null
        }
        Relationships: []
      }
      password_reset_queue: {
        Row: {
          created_at: string
          email: string
          id: string
          requested_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          requested_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          requested_by?: string | null
          status?: string
        }
        Relationships: []
      }
      pattern_insights: {
        Row: {
          confidence_level: number | null
          id: string
          month_of: string
          pattern_code: string
          user_hash: string
        }
        Insert: {
          confidence_level?: number | null
          id?: string
          month_of: string
          pattern_code: string
          user_hash: string
        }
        Update: {
          confidence_level?: number | null
          id?: string
          month_of?: string
          pattern_code?: string
          user_hash?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          id: string
          retention_days: number
        }
        Insert: {
          id: string
          retention_days: number
        }
        Update: {
          id?: string
          retention_days?: number
        }
        Relationships: []
      }
      practice_sessions: {
        Row: {
          created_at: string
          duration_minutes: number | null
          id: number
          notes: string | null
          quality_rating: number | null
          session_type: string
          skill_id: number | null
          skill_key: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          id?: never
          notes?: string | null
          quality_rating?: number | null
          session_type: string
          skill_id?: number | null
          skill_key?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          id?: never
          notes?: string | null
          quality_rating?: number | null
          session_type?: string
          skill_id?: number | null
          skill_key?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_sessions_skill_fk"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_sessions_user_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "practice_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      pre_assignment_preps: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      pre_assignment_team_syncs: {
        Row: {
          agenda: Json
          assignment_id: string
          created_at: string | null
          created_by: string
          id: string
          meeting_link: string | null
          notes: string | null
          scheduled_for: string
          status: string
          team_members: Json
          updated_at: string | null
        }
        Insert: {
          agenda?: Json
          assignment_id: string
          created_at?: string | null
          created_by: string
          id?: string
          meeting_link?: string | null
          notes?: string | null
          scheduled_for: string
          status?: string
          team_members?: Json
          updated_at?: string | null
        }
        Update: {
          agenda?: Json
          assignment_id?: string
          created_at?: string | null
          created_by?: string
          id?: string
          meeting_link?: string | null
          notes?: string | null
          scheduled_for?: string
          status?: string
          team_members?: Json
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pre_assignment_team_syncs_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignment_eri"
            referencedColumns: ["assignment_id"]
          },
          {
            foreignKeyName: "pre_assignment_team_syncs_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_assignment_team_syncs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      privacy_audit_logs: {
        Row: {
          action_type: string
          compliance_check: Json | null
          id: string
          occurred_at: string | null
        }
        Insert: {
          action_type: string
          compliance_check?: Json | null
          id?: string
          occurred_at?: string | null
        }
        Update: {
          action_type?: string
          compliance_check?: Json | null
          id?: string
          occurred_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          accessibility_settings: Json | null
          avatar_url: string | null
          cancellation_date: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string | null
          credentials: string[] | null
          dismissed_onboarding_tips: string[] | null
          email: string | null
          encharge_subscriber_id: string | null
          experience_years: number | null
          full_name: string | null
          high_contrast: boolean | null
          id: string
          is_admin: boolean | null
          language_preference: string | null
          language_preferences: string[] | null
          larger_text: boolean | null
          last_payment_error: string | null
          last_payment_failed_at: string | null
          lifetime_value: number | null
          marketing_consent: boolean | null
          modalities: string[] | null
          onboarding_completed: boolean | null
          onboarding_step: number | null
          payment_failed_date: string | null
          payment_retry_count: number | null
          primary_domains: string[] | null
          privacy_consent_accepted_at: string | null
          privacy_settings: Json | null
          privacy_version: string | null
          profile_photo_url: string | null
          pronouns: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_amount: number | null
          subscription_cancel_at_period_end: boolean | null
          subscription_current_period_end: string | null
          subscription_current_period_start: string | null
          subscription_end_date: string | null
          subscription_interval: string | null
          subscription_plan: string | null
          subscription_price_id: string | null
          subscription_status: string | null
          subscription_tier: string | null
          terms_accepted_at: string | null
          terms_version: string | null
          timezone: string | null
          trial_end_date: string | null
          trial_ends_at: string | null
          trial_started_at: string | null
          updated_at: string | null
          weekly_hours: number | null
          win_back_offer_sent_at: string | null
        }
        Insert: {
          accessibility_settings?: Json | null
          avatar_url?: string | null
          cancellation_date?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          credentials?: string[] | null
          dismissed_onboarding_tips?: string[] | null
          email?: string | null
          encharge_subscriber_id?: string | null
          experience_years?: number | null
          full_name?: string | null
          high_contrast?: boolean | null
          id: string
          is_admin?: boolean | null
          language_preference?: string | null
          language_preferences?: string[] | null
          larger_text?: boolean | null
          last_payment_error?: string | null
          last_payment_failed_at?: string | null
          lifetime_value?: number | null
          marketing_consent?: boolean | null
          modalities?: string[] | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          payment_failed_date?: string | null
          payment_retry_count?: number | null
          primary_domains?: string[] | null
          privacy_consent_accepted_at?: string | null
          privacy_settings?: Json | null
          privacy_version?: string | null
          profile_photo_url?: string | null
          pronouns?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_amount?: number | null
          subscription_cancel_at_period_end?: boolean | null
          subscription_current_period_end?: string | null
          subscription_current_period_start?: string | null
          subscription_end_date?: string | null
          subscription_interval?: string | null
          subscription_plan?: string | null
          subscription_price_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          timezone?: string | null
          trial_end_date?: string | null
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string | null
          weekly_hours?: number | null
          win_back_offer_sent_at?: string | null
        }
        Update: {
          accessibility_settings?: Json | null
          avatar_url?: string | null
          cancellation_date?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          credentials?: string[] | null
          dismissed_onboarding_tips?: string[] | null
          email?: string | null
          encharge_subscriber_id?: string | null
          experience_years?: number | null
          full_name?: string | null
          high_contrast?: boolean | null
          id?: string
          is_admin?: boolean | null
          language_preference?: string | null
          language_preferences?: string[] | null
          larger_text?: boolean | null
          last_payment_error?: string | null
          last_payment_failed_at?: string | null
          lifetime_value?: number | null
          marketing_consent?: boolean | null
          modalities?: string[] | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          payment_failed_date?: string | null
          payment_retry_count?: number | null
          primary_domains?: string[] | null
          privacy_consent_accepted_at?: string | null
          privacy_settings?: Json | null
          privacy_version?: string | null
          profile_photo_url?: string | null
          pronouns?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_amount?: number | null
          subscription_cancel_at_period_end?: boolean | null
          subscription_current_period_end?: string | null
          subscription_current_period_start?: string | null
          subscription_end_date?: string | null
          subscription_interval?: string | null
          subscription_plan?: string | null
          subscription_price_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          timezone?: string | null
          trial_end_date?: string | null
          trial_ends_at?: string | null
          trial_started_at?: string | null
          updated_at?: string | null
          weekly_hours?: number | null
          win_back_offer_sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      quick_reflect_entries: {
        Row: {
          ai_insights: Json | null
          assignment_id: string | null
          assignment_type: string | null
          challenges: string | null
          cognitive_load_after: number | null
          cognitive_load_before: number | null
          created_at: string | null
          duration_minutes: number | null
          id: string
          modality: string | null
          performance_rating: number | null
          successes: string | null
          updated_at: string | null
          user_id: string
          vocab: string | null
        }
        Insert: {
          ai_insights?: Json | null
          assignment_id?: string | null
          assignment_type?: string | null
          challenges?: string | null
          cognitive_load_after?: number | null
          cognitive_load_before?: number | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          modality?: string | null
          performance_rating?: number | null
          successes?: string | null
          updated_at?: string | null
          user_id: string
          vocab?: string | null
        }
        Update: {
          ai_insights?: Json | null
          assignment_id?: string | null
          assignment_type?: string | null
          challenges?: string | null
          cognitive_load_after?: number | null
          cognitive_load_before?: number | null
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          modality?: string | null
          performance_rating?: number | null
          successes?: string | null
          updated_at?: string | null
          user_id?: string
          vocab?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quick_reflect_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      quick_reflections: {
        Row: {
          assignment_id: string
          created_at: string | null
          eri_assign_raw: number | null
          eri_assign_score: number | null
          id: string
          post_ai_impact_score: number | null
          post_ai_issue_tags: string[] | null
          post_cognitive_load_score: number
          post_cultural_friction_score: number
          post_cultural_friction_tags: string[] | null
          post_emotional_load_score: number
          post_key_learning_tags: string[] | null
          post_key_learning_text: string | null
          post_meaning_challenge_score: number
          post_meaning_challenge_tags: string[] | null
          post_performance_confidence_score: number
          post_recovery_actions: string[] | null
          post_recovery_other: string | null
          post_reflection_depth_self_score: number
          post_rolespace_challenge_score: number
          post_rolespace_challenge_tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assignment_id: string
          created_at?: string | null
          eri_assign_raw?: number | null
          eri_assign_score?: number | null
          id?: string
          post_ai_impact_score?: number | null
          post_ai_issue_tags?: string[] | null
          post_cognitive_load_score: number
          post_cultural_friction_score: number
          post_cultural_friction_tags?: string[] | null
          post_emotional_load_score: number
          post_key_learning_tags?: string[] | null
          post_key_learning_text?: string | null
          post_meaning_challenge_score: number
          post_meaning_challenge_tags?: string[] | null
          post_performance_confidence_score: number
          post_recovery_actions?: string[] | null
          post_recovery_other?: string | null
          post_reflection_depth_self_score: number
          post_rolespace_challenge_score: number
          post_rolespace_challenge_tags?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assignment_id?: string
          created_at?: string | null
          eri_assign_raw?: number | null
          eri_assign_score?: number | null
          id?: string
          post_ai_impact_score?: number | null
          post_ai_issue_tags?: string[] | null
          post_cognitive_load_score?: number
          post_cultural_friction_score?: number
          post_cultural_friction_tags?: string[] | null
          post_emotional_load_score?: number
          post_key_learning_tags?: string[] | null
          post_key_learning_text?: string | null
          post_meaning_challenge_score?: number
          post_meaning_challenge_tags?: string[] | null
          post_performance_confidence_score?: number
          post_recovery_actions?: string[] | null
          post_recovery_other?: string | null
          post_reflection_depth_self_score?: number
          post_rolespace_challenge_score?: number
          post_rolespace_challenge_tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quick_reflections_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: true
            referencedRelation: "assignment_eri"
            referencedColumns: ["assignment_id"]
          },
          {
            foreignKeyName: "quick_reflections_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: true
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quick_reflections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      readiness_checks: {
        Row: {
          assignment_id: string
          created_at: string | null
          id: string
          pre_ai_confidence_score: number | null
          pre_ai_involvement_expected: Database["public"]["Enums"]["ai_involvement_expected"]
          pre_cognitive_readiness_score: number
          pre_context_familiarity_score: number
          pre_emotional_state_label: string | null
          pre_emotional_state_score: number
          pre_focus_ecci_domains: number[] | null
          pre_focus_free_text: string | null
          pre_role_clarity_score: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assignment_id: string
          created_at?: string | null
          id?: string
          pre_ai_confidence_score?: number | null
          pre_ai_involvement_expected?: Database["public"]["Enums"]["ai_involvement_expected"]
          pre_cognitive_readiness_score: number
          pre_context_familiarity_score: number
          pre_emotional_state_label?: string | null
          pre_emotional_state_score: number
          pre_focus_ecci_domains?: number[] | null
          pre_focus_free_text?: string | null
          pre_role_clarity_score: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assignment_id?: string
          created_at?: string | null
          id?: string
          pre_ai_confidence_score?: number | null
          pre_ai_involvement_expected?: Database["public"]["Enums"]["ai_involvement_expected"]
          pre_cognitive_readiness_score?: number
          pre_context_familiarity_score?: number
          pre_emotional_state_label?: string | null
          pre_emotional_state_score?: number
          pre_focus_ecci_domains?: number[] | null
          pre_focus_free_text?: string | null
          pre_role_clarity_score?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "readiness_checks_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: true
            referencedRelation: "assignment_eri"
            referencedColumns: ["assignment_id"]
          },
          {
            foreignKeyName: "readiness_checks_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: true
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "readiness_checks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      recommendation_categories: {
        Row: {
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          description?: string | null
          icon?: string | null
          id: string
          name: string
        }
        Update: {
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      recovery_habits: {
        Row: {
          created_at: string | null
          description: string | null
          effectiveness: number | null
          frequency: string | null
          habit_type: string
          id: string
          last_practiced: string | null
          streak_days: number | null
          total_practices: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          effectiveness?: number | null
          frequency?: string | null
          habit_type: string
          id?: string
          last_practiced?: string | null
          streak_days?: number | null
          total_practices?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          effectiveness?: number | null
          frequency?: string | null
          habit_type?: string
          id?: string
          last_practiced?: string | null
          streak_days?: number | null
          total_practices?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recovery_habits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      reflection_entries: {
        Row: {
          created_at: string
          data: Json
          entry_kind: string
          id: number
          reflection_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          entry_kind: string
          id?: never
          reflection_id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          entry_kind?: string
          id?: never
          reflection_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reflection_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      reflection_entries_new: {
        Row: {
          assignment_type: string | null
          content_preview: string | null
          created_at: string
          data: Json
          emotions: string[] | null
          emotions_json: Json | null
          energy_level: number | null
          entry_kind: string
          id: number
          language_pair: string | null
          modality: string | null
          reflection_id: string | null
          stress_level_after: number | null
          stress_level_before: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assignment_type?: string | null
          content_preview?: string | null
          created_at?: string
          data?: Json
          emotions?: string[] | null
          emotions_json?: Json | null
          energy_level?: number | null
          entry_kind: string
          id?: never
          language_pair?: string | null
          modality?: string | null
          reflection_id?: string | null
          stress_level_after?: number | null
          stress_level_before?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assignment_type?: string | null
          content_preview?: string | null
          created_at?: string
          data?: Json
          emotions?: string[] | null
          emotions_json?: Json | null
          energy_level?: number | null
          entry_kind?: string
          id?: never
          language_pair?: string | null
          modality?: string | null
          reflection_id?: string | null
          stress_level_after?: number | null
          stress_level_before?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reflection_entries_new_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      reflection_events: {
        Row: {
          created_at: string
          id: string
          meta: Json
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          meta?: Json
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          meta?: Json
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reflection_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      reflection_prompts: {
        Row: {
          agent_recommendation: string
          created_at: string
          id: string
          intensity_level: string
          prompt: string
          tags: string[]
          theme: string
        }
        Insert: {
          agent_recommendation?: string
          created_at?: string
          id?: string
          intensity_level: string
          prompt: string
          tags?: string[]
          theme: string
        }
        Update: {
          agent_recommendation?: string
          created_at?: string
          id?: string
          intensity_level?: string
          prompt?: string
          tags?: string[]
          theme?: string
        }
        Relationships: []
      }
      reflections: {
        Row: {
          answers: Json
          content: Json | null
          created_at: string
          id: string
          metadata: Json | null
          reflection_type: string
          session_id: string | null
          status: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          answers: Json
          content?: Json | null
          created_at?: string
          id?: string
          metadata?: Json | null
          reflection_type: string
          session_id?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          answers?: Json
          content?: Json | null
          created_at?: string
          id?: string
          metadata?: Json | null
          reflection_type?: string
          session_id?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reflections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      reflections_lookup: {
        Row: {
          created_at: string
          id: string
        }
        Insert: {
          created_at: string
          id: string
        }
        Update: {
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      skill_assessments: {
        Row: {
          created_at: string
          id: string
          level: number
          skill_id: number
          source: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          level: number
          skill_id: number
          source?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: number
          skill_id?: number
          source?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_assessments_skill_fk"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_assessments_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_assessments_user_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "skill_assessments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      skill_builder_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          module_code: string
          progress: Json
          started_at: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          module_code: string
          progress?: Json
          started_at?: string | null
          status: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          module_code?: string
          progress?: Json
          started_at?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_builder_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      skill_goals: {
        Row: {
          created_at: string
          id: string
          skill_id: number
          source: string | null
          target_level: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          skill_id: number
          source?: string | null
          target_level: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          skill_id?: number
          source?: string | null
          target_level?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_goals_skill_fk"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_goals_skill_id_fkey"
            columns: ["skill_id"]
            isOneToOne: false
            referencedRelation: "skills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_goals_user_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "skill_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      skills: {
        Row: {
          id: number
          name: string
          slug: string | null
        }
        Insert: {
          id?: number
          name: string
          slug?: string | null
        }
        Update: {
          id?: number
          name?: string
          slug?: string | null
        }
        Relationships: []
      }
      stress_reset_logs: {
        Row: {
          created_at: string
          duration_minutes: number | null
          id: number
          notes: string | null
          stress_level_after: number | null
          stress_level_before: number | null
          tool_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          id?: never
          notes?: string | null
          stress_level_after?: number | null
          stress_level_before?: number | null
          tool_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          id?: never
          notes?: string | null
          stress_level_after?: number | null
          stress_level_before?: number | null
          tool_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stress_reset_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      subscription_audit_log: {
        Row: {
          created_at: string | null
          created_by: string | null
          event_type: string
          id: string
          metadata: Json | null
          new_status: string | null
          old_status: string | null
          source: string | null
          stripe_customer_id: string | null
          stripe_event_id: string | null
          stripe_subscription_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          new_status?: string | null
          old_status?: string | null
          source?: string | null
          stripe_customer_id?: string | null
          stripe_event_id?: string | null
          stripe_subscription_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          new_status?: string | null
          old_status?: string | null
          source?: string | null
          stripe_customer_id?: string | null
          stripe_event_id?: string | null
          stripe_subscription_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      subscription_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          subscription_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          subscription_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          subscription_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      subscription_reconciliation: {
        Row: {
          check_date: string
          created_at: string | null
          email: string | null
          id: string
          mismatch_type: string | null
          resolution_notes: string | null
          resolution_status: string | null
          resolved_at: string | null
          resolved_by: string | null
          stripe_status: string | null
          supabase_status: string | null
          user_id: string | null
        }
        Insert: {
          check_date?: string
          created_at?: string | null
          email?: string | null
          id?: string
          mismatch_type?: string | null
          resolution_notes?: string | null
          resolution_status?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          stripe_status?: string | null
          supabase_status?: string | null
          user_id?: string | null
        }
        Update: {
          check_date?: string
          created_at?: string | null
          email?: string | null
          id?: string
          mismatch_type?: string | null
          resolution_notes?: string | null
          resolution_status?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          stripe_status?: string | null
          supabase_status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_reconciliation_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_amount: number | null
          plan_name: string | null
          price_id: string | null
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id: string
          plan_amount?: number | null
          plan_name?: string | null
          price_id?: string | null
          status: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_amount?: number | null
          plan_name?: string | null
          price_id?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      support_activities: {
        Row: {
          activity_date: string
          activity_type: string
          created_at: string
          duration_minutes: number | null
          id: string
          label: string | null
          metadata: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_date: string
          activity_type: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          label?: string | null
          metadata?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_date?: string
          activity_type?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          label?: string | null
          metadata?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      team_emotional_climate: {
        Row: {
          cohesion_score: number | null
          contagion_risk: number | null
          created_at: string | null
          dominant_emotion: string
          emotional_diversity: number | null
          id: string
          measurement_period: string
          resilience_score: number | null
          team_hash: string
          trend_direction: string | null
          volatility_index: number | null
        }
        Insert: {
          cohesion_score?: number | null
          contagion_risk?: number | null
          created_at?: string | null
          dominant_emotion: string
          emotional_diversity?: number | null
          id?: string
          measurement_period: string
          resilience_score?: number | null
          team_hash: string
          trend_direction?: string | null
          volatility_index?: number | null
        }
        Update: {
          cohesion_score?: number | null
          contagion_risk?: number | null
          created_at?: string | null
          dominant_emotion?: string
          emotional_diversity?: number | null
          id?: string
          measurement_period?: string
          resilience_score?: number | null
          team_hash?: string
          trend_direction?: string | null
          volatility_index?: number | null
        }
        Relationships: []
      }
      technique_usage: {
        Row: {
          created_at: string | null
          id: string
          technique_id: string
          technique_name: string
          timestamp: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          technique_id: string
          technique_name: string
          timestamp?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          technique_id?: string
          technique_name?: string
          timestamp?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "technique_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      technique_usage_sessions: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string
          duration_seconds: number | null
          effectiveness_category: string | null
          effectiveness_rating: number | null
          effectiveness_score: number | null
          id: string
          notes: string | null
          session_context: Json | null
          started_at: string
          stress_after: number | null
          stress_before: number | null
          technique: string
          technique_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          effectiveness_category?: string | null
          effectiveness_rating?: number | null
          effectiveness_score?: number | null
          id?: string
          notes?: string | null
          session_context?: Json | null
          started_at: string
          stress_after?: number | null
          stress_before?: number | null
          technique: string
          technique_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          effectiveness_category?: string | null
          effectiveness_rating?: number | null
          effectiveness_score?: number | null
          id?: string
          notes?: string | null
          session_context?: Json | null
          started_at?: string
          stress_after?: number | null
          stress_before?: number | null
          technique?: string
          technique_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "technique_usage_sessions_technique_id_fkey"
            columns: ["technique_id"]
            isOneToOne: false
            referencedRelation: "techniques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technique_usage_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      techniques: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          duration_minutes_recommended: number | null
          id: string
          is_active: boolean | null
          name: string
          research_sources: string[] | null
          tags: string[] | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          duration_minutes_recommended?: number | null
          id: string
          is_active?: boolean | null
          name: string
          research_sources?: string[] | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          duration_minutes_recommended?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          research_sources?: string[] | null
          tags?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      techniques_usage: {
        Row: {
          completed: boolean | null
          created_at: string
          duration: number | null
          id: number
          technique_name: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string
          duration?: number | null
          id?: never
          technique_name?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string
          duration?: number | null
          id?: never
          technique_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "techniques_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      terminology_glossaries: {
        Row: {
          created_at: string
          definition: string | null
          domain: string | null
          id: string
          language: string | null
          source: string | null
          synonyms: string[] | null
          term: string
        }
        Insert: {
          created_at?: string
          definition?: string | null
          domain?: string | null
          id?: string
          language?: string | null
          source?: string | null
          synonyms?: string[] | null
          term: string
        }
        Update: {
          created_at?: string
          definition?: string | null
          domain?: string | null
          id?: string
          language?: string | null
          source?: string | null
          synonyms?: string[] | null
          term?: string
        }
        Relationships: []
      }
      terms_acceptances: {
        Row: {
          accepted_at: string
          created_at: string
          id: number
          ip_address: string | null
          privacy_content_hash: string | null
          privacy_version: string
          terms_content_hash: string | null
          terms_version: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          created_at?: string
          id?: never
          ip_address?: string | null
          privacy_content_hash?: string | null
          privacy_version: string
          terms_content_hash?: string | null
          terms_version: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          created_at?: string
          id?: never
          ip_address?: string | null
          privacy_content_hash?: string | null
          privacy_version?: string
          terms_content_hash?: string | null
          terms_version?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "terms_acceptances_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      trial_conversions: {
        Row: {
          conversion_plan: string | null
          conversion_revenue: number | null
          converted_at: string | null
          created_at: string | null
          features_used: string[] | null
          id: string
          trial_ended_at: string | null
          trial_engagement_score: number | null
          trial_started_at: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          conversion_plan?: string | null
          conversion_revenue?: number | null
          converted_at?: string | null
          created_at?: string | null
          features_used?: string[] | null
          id?: string
          trial_ended_at?: string | null
          trial_engagement_score?: number | null
          trial_started_at: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          conversion_plan?: string | null
          conversion_revenue?: number | null
          converted_at?: string | null
          created_at?: string | null
          features_used?: string[] | null
          id?: string
          trial_ended_at?: string | null
          trial_engagement_score?: number | null
          trial_started_at?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trial_conversions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ui_preferences: {
        Row: {
          compassion_mode: boolean
          consent: Json
          theme: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          compassion_mode?: boolean
          consent?: Json
          theme?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          compassion_mode?: boolean
          consent?: Json
          theme?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ui_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_context_summary: {
        Row: {
          avg_confidence_level: number | null
          avg_energy_level: number | null
          avg_stress_level: number | null
          burnout_risk_level: string | null
          common_assignment_types: string[] | null
          common_challenges: string[] | null
          communication_style: string | null
          context_score: number | null
          created_at: string | null
          effective_interventions: string[] | null
          effective_strategies: string[] | null
          id: string
          interpreter_experience_level: string | null
          known_triggers: string[] | null
          last_activity_date: string | null
          last_reflection_date: string | null
          preferred_support_types: string[] | null
          preferred_teaming_style: string | null
          recent_emotions: string[] | null
          recent_stress_patterns: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avg_confidence_level?: number | null
          avg_energy_level?: number | null
          avg_stress_level?: number | null
          burnout_risk_level?: string | null
          common_assignment_types?: string[] | null
          common_challenges?: string[] | null
          communication_style?: string | null
          context_score?: number | null
          created_at?: string | null
          effective_interventions?: string[] | null
          effective_strategies?: string[] | null
          id?: string
          interpreter_experience_level?: string | null
          known_triggers?: string[] | null
          last_activity_date?: string | null
          last_reflection_date?: string | null
          preferred_support_types?: string[] | null
          preferred_teaming_style?: string | null
          recent_emotions?: string[] | null
          recent_stress_patterns?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avg_confidence_level?: number | null
          avg_energy_level?: number | null
          avg_stress_level?: number | null
          burnout_risk_level?: string | null
          common_assignment_types?: string[] | null
          common_challenges?: string[] | null
          communication_style?: string | null
          context_score?: number | null
          created_at?: string | null
          effective_interventions?: string[] | null
          effective_strategies?: string[] | null
          id?: string
          interpreter_experience_level?: string | null
          known_triggers?: string[] | null
          last_activity_date?: string | null
          last_reflection_date?: string | null
          preferred_support_types?: string[] | null
          preferred_teaming_style?: string | null
          recent_emotions?: string[] | null
          recent_stress_patterns?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_context_summary_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_growth_metrics: {
        Row: {
          created_at: string | null
          ethical_awareness_score: number | null
          growth_mindset_score: number | null
          last_assessment: string | null
          overall_progress: number | null
          preparedness_score: number | null
          resilience_score: number | null
          role_clarity_score: number | null
          self_awareness_level: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          ethical_awareness_score?: number | null
          growth_mindset_score?: number | null
          last_assessment?: string | null
          overall_progress?: number | null
          preparedness_score?: number | null
          resilience_score?: number | null
          role_clarity_score?: number | null
          self_awareness_level?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          ethical_awareness_score?: number | null
          growth_mindset_score?: number | null
          last_assessment?: string | null
          overall_progress?: number | null
          preparedness_score?: number | null
          resilience_score?: number | null
          role_clarity_score?: number | null
          self_awareness_level?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_growth_metrics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_interventions: {
        Row: {
          completed_at: string | null
          effectiveness_rating: number | null
          id: string
          notes: string | null
          recommendation_id: string
          started_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          effectiveness_rating?: number | null
          id?: string
          notes?: string | null
          recommendation_id: string
          started_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          effectiveness_rating?: number | null
          id?: string
          notes?: string | null
          recommendation_id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_interventions_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "burnout_recommendations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_interventions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_milestones: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          milestone_id: string
          progress: number | null
          title: string
          unlocked: boolean
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          milestone_id: string
          progress?: number | null
          title: string
          unlocked?: boolean
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          milestone_id?: string
          progress?: number | null
          title?: string
          unlocked?: boolean
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_milestones_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          accessibility_settings: Json | null
          assignments_reset_date: string | null
          assignments_used_this_month: number | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          profile_photo_url: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string | null
          subscription_tier: string | null
          updated_at: string | null
        }
        Insert: {
          accessibility_settings?: Json | null
          assignments_reset_date?: string | null
          assignments_used_this_month?: number | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          profile_photo_url?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Update: {
          accessibility_settings?: Json | null
          assignments_reset_date?: string | null
          assignments_used_this_month?: number | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          profile_photo_url?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_streaks: {
        Row: {
          compassion_breaks_used: number
          current_streak: number
          last_reflection_date: string | null
          longest_streak: number
          streak_start_date: string | null
          total_reflections: number
          updated_at: string
          user_id: string
        }
        Insert: {
          compassion_breaks_used?: number
          current_streak?: number
          last_reflection_date?: string | null
          longest_streak?: number
          streak_start_date?: string | null
          total_reflections?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          compassion_breaks_used?: number
          current_streak?: number
          last_reflection_date?: string | null
          longest_streak?: number
          streak_start_date?: string | null
          total_reflections?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_stress_patterns: {
        Row: {
          assignment_stress_profiles: Json | null
          avg_stress_overall: number | null
          created_at: string | null
          id: string
          last_computed_at: string | null
          median_stress_overall: number | null
          modality_stress_profiles: Json | null
          protocol_effectiveness: Json | null
          temporal_patterns: Json | null
          total_reflections: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assignment_stress_profiles?: Json | null
          avg_stress_overall?: number | null
          created_at?: string | null
          id?: string
          last_computed_at?: string | null
          median_stress_overall?: number | null
          modality_stress_profiles?: Json | null
          protocol_effectiveness?: Json | null
          temporal_patterns?: Json | null
          total_reflections?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assignment_stress_profiles?: Json | null
          avg_stress_overall?: number | null
          created_at?: string | null
          id?: string
          last_computed_at?: string | null
          median_stress_overall?: number | null
          modality_stress_profiles?: Json | null
          protocol_effectiveness?: Json | null
          temporal_patterns?: Json | null
          total_reflections?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_stress_patterns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "active_subscribers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_stress_patterns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          payload: Json | null
          processed: boolean | null
          source: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          processed?: boolean | null
          source: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          processed?: boolean | null
          source?: string
        }
        Relationships: []
      }
      wellness_metrics: {
        Row: {
          burnout_score: number | null
          confidence_score: number | null
          energy_level: number | null
          growth_trajectory: boolean | null
          high_stress_pattern: boolean | null
          id: string
          recovery_needed: boolean | null
          stress_level: number | null
          user_hash: string
          week_of: string
        }
        Insert: {
          burnout_score?: number | null
          confidence_score?: number | null
          energy_level?: number | null
          growth_trajectory?: boolean | null
          high_stress_pattern?: boolean | null
          id?: string
          recovery_needed?: boolean | null
          stress_level?: number | null
          user_hash: string
          week_of: string
        }
        Update: {
          burnout_score?: number | null
          confidence_score?: number | null
          energy_level?: number | null
          growth_trajectory?: boolean | null
          high_stress_pattern?: boolean | null
          id?: string
          recovery_needed?: boolean | null
          stress_level?: number | null
          user_hash?: string
          week_of?: string
        }
        Relationships: []
      }
      zero_knowledge_proofs: {
        Row: {
          expires_at: string | null
          generated_at: string | null
          id: string
          proof_hash: string
          proof_type: string
          validates_criteria: Json
        }
        Insert: {
          expires_at?: string | null
          generated_at?: string | null
          id?: string
          proof_hash: string
          proof_type: string
          validates_criteria: Json
        }
        Update: {
          expires_at?: string | null
          generated_at?: string | null
          id?: string
          proof_hash?: string
          proof_type?: string
          validates_criteria?: Json
        }
        Relationships: []
      }
    }
    Views: {
      active_subscribers: {
        Row: {
          current_period_end: string | null
          email: string | null
          id: string | null
          profile_status: string | null
          subscription_status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      assignment_eri: {
        Row: {
          ai_strain_score: number | null
          assignment_id: string | null
          base_strain_score: number | null
          ended_at: string | null
          eri_assign_raw: number | null
          eri_assign_score: number | null
          post_ai_impact_score: number | null
          post_cognitive_load_score: number | null
          post_cultural_friction_score: number | null
          post_emotional_load_score: number | null
          post_meaning_challenge_score: number | null
          post_recovery_actions: string[] | null
          post_reflection_depth_self_score: number | null
          post_rolespace_challenge_score: number | null
          post_strain_score: number | null
          pre_ai_confidence_score: number | null
          pre_ai_involvement_expected:
            | Database["public"]["Enums"]["ai_involvement_expected"]
            | null
          pre_cognitive_readiness_score: number | null
          pre_context_familiarity_score: number | null
          pre_emotional_state_score: number | null
          pre_readiness_score: number | null
          pre_role_clarity_score: number | null
          recovery_reflection_score: number | null
          started_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      body_awareness_sessions: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          id: number | null
          notes: string | null
          session_type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: number | null
          notes?: string | null
          session_type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: number | null
          notes?: string | null
          session_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "practice_sessions_user_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "practice_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      body_check_ins: {
        Row: {
          body_areas: Json | null
          created_at: string | null
          energy_level: number | null
          id: string | null
          mood_level: number | null
          notes: string | null
          overall_feeling: number | null
          tension_level: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          body_areas?: Json | null
          created_at?: string | null
          energy_level?: number | null
          id?: string | null
          mood_level?: number | null
          notes?: string | null
          overall_feeling?: number | null
          tension_level?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          body_areas?: Json | null
          created_at?: string | null
          energy_level?: number | null
          id?: string | null
          mood_level?: number | null
          notes?: string | null
          overall_feeling?: number | null
          tension_level?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "body_checkins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      boundaries_sessions: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          id: number | null
          notes: string | null
          session_type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: number | null
          notes?: string | null
          session_type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: number | null
          notes?: string | null
          session_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "practice_sessions_user_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "practice_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      code_switch_sessions: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          id: number | null
          notes: string | null
          session_type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: number | null
          notes?: string | null
          session_type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: number | null
          notes?: string | null
          session_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "practice_sessions_user_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "practice_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      emotional_proximity_sessions: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          id: number | null
          notes: string | null
          session_type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: number | null
          notes?: string | null
          session_type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: number | null
          notes?: string | null
          session_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "practice_sessions_user_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "practice_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      gi_body_checkins: {
        Row: {
          checkins: number | null
          day: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "body_checkins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      gi_burnout_daily: {
        Row: {
          avg_burnout: number | null
          day: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_burnout_checks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      gi_recovery_balance: {
        Row: {
          avg_effectiveness: number | null
          recovery_balance_index: number | null
          user_id: string | null
          weekly_adherence_pct: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recovery_habits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      gi_reflections_summary: {
        Row: {
          day: string | null
          reflections_count: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reflections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      gi_reset_toolkit: {
        Row: {
          avg_relief: number | null
          user_id: string | null
          uses: number | null
          week: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stress_reset_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      gi_stress_energy: {
        Row: {
          avg_energy: number | null
          avg_stress: number | null
          day: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_burnout_checks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      gi_teamwork: {
        Row: {
          agreements_fidelity: number | null
          created_at: string | null
          turn_taking_balance: number | null
          user_id: string | null
        }
        Insert: {
          agreements_fidelity?: never
          created_at?: string | null
          turn_taking_balance?: never
          user_id?: string | null
        }
        Update: {
          agreements_fidelity?: never
          created_at?: string | null
          turn_taking_balance?: never
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reflection_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      gi_teamwork_v2: {
        Row: {
          agreements_fidelity: number | null
          created_at: string | null
          entry_kind: string | null
          rn: number | null
          team_effectiveness: number | null
          top_drift_area: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reflection_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      gi_values_focus: {
        Row: {
          created_at: string | null
          gray_zone_focus: string | null
          top_active_value: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          gray_zone_focus?: never
          top_active_value?: never
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          gray_zone_focus?: never
          top_active_value?: never
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reflection_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      payment_issues: {
        Row: {
          email: string | null
          last_payment_error: string | null
          last_payment_failed_at: string | null
          payment_retry_count: number | null
          subscription_status: string | null
        }
        Relationships: []
      }
      performance_analytics: {
        Row: {
          avg_cognitive_load_last_7d: number | null
          metric_date: string | null
          reflections_last_7d: number | null
          sessions_last_7d: number | null
          user_id: string | null
        }
        Relationships: []
      }
      recent_cancellations: {
        Row: {
          cancellation_date: string | null
          cancellation_reason: string | null
          email: string | null
          lifetime_value: number | null
          subscription_end_date: string | null
          subscription_status: string | null
        }
        Relationships: []
      }
      reflection_entries_emotions: {
        Row: {
          created_at: string | null
          emotions: string[] | null
          id: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          emotions?: never
          id?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          emotions?: never
          id?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reflection_entries_new_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      subscription_analytics: {
        Row: {
          cancellations: number | null
          retries: number | null
          subscription_status: string | null
          users: number | null
        }
        Relationships: []
      }
      subscription_status_summary: {
        Row: {
          profile_status: string | null
          subscription_plan: string | null
          subscription_status: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_ceu_summary: {
        Row: {
          completions: Json | null
          last_completion_date: string | null
          total_ceus_earned: number | null
          total_completions: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ceu_completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_eri: {
        Row: {
          assignment_count: number | null
          eri_band: Database["public"]["Enums"]["eri_band"] | null
          eri_score_avg: number | null
          eri_score_rounded: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_growth_stats: {
        Row: {
          days_active: number | null
          days_since_joined: number | null
          last_activity: string | null
          reflection_types_used: number | null
          total_reflections: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reflection_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          compassion_mode: boolean | null
          consent: Json | null
          theme: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          compassion_mode?: boolean | null
          consent?: Json | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          compassion_mode?: boolean | null
          consent?: Json | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ui_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_reflection_stats: {
        Row: {
          current_streak: number | null
          last_reflection: string | null
          total_reflections: number | null
          unique_days: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reflections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_stress_daily: {
        Row: {
          assignment_type_count: number | null
          assignment_types: string[] | null
          avg_improvement: number | null
          avg_stress_after: number | null
          avg_stress_before: number | null
          date: string | null
          last_updated_at: string | null
          max_stress: number | null
          min_stress: number | null
          reflection_count: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reflection_entries_new_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      v_feature_requests_by_source_30d: {
        Row: {
          request_count: number | null
          source: string | null
        }
        Relationships: []
      }
      v_feature_requests_by_source_90d: {
        Row: {
          request_count: number | null
          source: string | null
        }
        Relationships: []
      }
      v_feature_requests_daily_counts: {
        Row: {
          day: string | null
          request_count: number | null
        }
        Relationships: []
      }
      v_feature_requests_daily_counts_12mo: {
        Row: {
          day: string | null
          request_count: number | null
        }
        Relationships: []
      }
      v_feature_requests_monthly_counts_12mo: {
        Row: {
          month: string | null
          request_count: number | null
        }
        Relationships: []
      }
      v_feature_requests_sentiment_30d: {
        Row: {
          count: number | null
          tag: string | null
        }
        Relationships: []
      }
      v_feature_requests_sentiment_90d: {
        Row: {
          count: number | null
          tag: string | null
        }
        Relationships: []
      }
      v_feature_requests_top_tags_30d: {
        Row: {
          cnt: number | null
          tag: string | null
        }
        Relationships: []
      }
      v_feature_requests_top_tags_90d: {
        Row: {
          cnt: number | null
          tag: string | null
        }
        Relationships: []
      }
      v_techniques_daily_rollup: {
        Row: {
          avg_effectiveness: number | null
          avg_stress_after: number | null
          avg_stress_before: number | null
          day: string | null
          duration_seconds: number | null
          sessions: number | null
          technique_name: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "technique_usage_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      v_techniques_latest: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          duration_seconds: number | null
          effectiveness_rating: number | null
          id: string | null
          notes: string | null
          rn: number | null
          session_context: Json | null
          started_at: string | null
          stress_after: number | null
          stress_before: number | null
          technique: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "technique_usage_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
      v_techniques_totals: {
        Row: {
          avg_effectiveness: number | null
          first_session_at: string | null
          last_session_at: string | null
          technique_name: string | null
          total_duration_seconds: number | null
          total_sessions: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "technique_usage_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "performance_analytics"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Functions: {
      _normalize_stripe_status: { Args: { status_in: string }; Returns: string }
      analyze_burnout_patterns: {
        Args: { p_timeframe?: unknown }
        Returns: Json
      }
      analyze_contagion_research_data:
        | { Args: { p_days?: number; p_team_hash: string }; Returns: Json }
        | { Args: { p_timeframe?: unknown }; Returns: Json }
        | { Args: never; Returns: Json }
        | { Args: { p_org_id: string; p_since: string }; Returns: Json }
      analyze_contagion_research_data_secure: {
        Args: { p_timeframe?: unknown }
        Returns: Json
      }
      assess_team_burnout_risk: { Args: { p_org_id: string }; Returns: Json }
      calculate_reflection_streak: {
        Args: { p_user_id: string }
        Returns: number
      }
      check_trial_status: { Args: { user_id: string }; Returns: Json }
      cleanup_old_webhook_logs: { Args: never; Returns: undefined }
      compute_user_stress_patterns: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      create_user_hash: {
        Args: { salt: string; user_id: string }
        Returns: string
      }
      current_user_id: { Args: never; Returns: string }
      detect_emotional_contagion:
        | { Args: { input_data: Json }; Returns: Json }
        | {
            Args: { p_team_hash: string; p_time_window?: unknown }
            Returns: {
              average_time_lag: unknown
              contagion_rate: number
              emotion: string
              risk_level: string
              source_user: string
              spread_count: number
            }[]
          }
        | { Args: { p_entry_id: string }; Returns: number }
      detect_emotional_contagion_v2: {
        Args: { p_team_hash: string; p_time_window: unknown }
        Returns: {
          average_time_lag: unknown
          contagion_rate: number
          emotion: string
          risk_level: string
          source_user: string
          spread_count: number
        }[]
      }
      detect_sentiment: { Args: { input_data: Json }; Returns: Json }
      detect_toxicity: { Args: { input_data: Json }; Returns: Json }
      enroll_user_in_program: {
        Args: {
          p_enrolled_at: string
          p_program_code: string
          p_rid_number: string
          p_user_id: string
        }
        Returns: {
          completion_date: string | null
          created_at: string | null
          enrolled_at: string | null
          enrolled_day: string | null
          id: string
          metadata: Json | null
          program_id: string
          progress: Json | null
          rid_number: string | null
          status: string | null
          total_time_minutes: number | null
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "ceu_enrollments"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      finalize_ceu_completion: {
        Args: {
          p_completion_date: string
          p_completion_evidence: Json
          p_contact_hours: number
          p_enrollment_id: string
          p_learning_objectives_met: Json
          p_user_id: string
        }
        Returns: {
          attested_at: string | null
          attested_by: string | null
          category: string
          certificate_generated_at: string | null
          certificate_number: string | null
          certificate_url: string | null
          ceu_awarded: number
          completion_date: string | null
          completion_day: string | null
          completion_evidence: Json | null
          contact_hours: number
          created_at: string | null
          enrollment_id: string
          id: string
          learning_objectives_met: Json
          program_id: string
          ps_subcategory: string | null
          reported_at: string | null
          reported_to_rid: boolean | null
          rid_number: string
          sponsor_name: string | null
          sponsor_rid_number: string | null
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "ceu_completions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      generate_certificate_number: { Args: never; Returns: string }
      generate_compliance_report: {
        Args: { date_from: string; date_to: string; org_id: string }
        Returns: Json
      }
      generate_emotional_weather_map:
        | { Args: { p_team_hash: string }; Returns: Json }
        | { Args: { p_date: string; p_org_id: string }; Returns: Json }
        | { Args: { user_id: string }; Returns: Json }
        | { Args: { p_date: string; p_org_id: string }; Returns: Json }
      generate_emotional_weather_map_secure: {
        Args: { p_date?: string; p_org_id?: string }
        Returns: Json
      }
      get_activities_simple: { Args: { p_user_id: string }; Returns: number }
      get_total_activities: {
        Args: { p_user_id: string }
        Returns: {
          assessment_count: number
          reflection_count: number
          technique_count: number
          total_activities: number
        }[]
      }
      get_user_streak: { Args: { p_user_id: string }; Returns: number }
      handle_encharge_event: {
        Args: { encharge_id?: string; event_type: string; user_email: string }
        Returns: Json
      }
      identify_positive_influencers: {
        Args: { p_days: number; p_team_hash: string }
        Returns: {
          influence_score: number
          influencer_hash: string
          positive_spread_count: number
          recommended_action: string
        }[]
      }
      issue_credential_event: {
        Args: {
          p_payload: Json
          p_ref: string
          p_type: string
          p_user: string
          p_verifier?: string
        }
        Returns: string
      }
      jsonb_text_array: { Args: { j: Json }; Returns: string[] }
      log_ceu_activity: {
        Args: {
          p_activity_name: string
          p_activity_type: string
          p_completed_at: string
          p_enrollment_id: string
          p_metadata: Json
          p_started_at: string
          p_time_spent_minutes: number
          p_user_id: string
        }
        Returns: {
          activity_name: string
          activity_type: string
          completed_at: string | null
          created_at: string | null
          enrollment_id: string
          id: string
          metadata: Json | null
          reflection_id: string | null
          started_at: string | null
          time_spent_minutes: number | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "ceu_activity_log"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      log_payment_failure: {
        Args: {
          p_amount: number
          p_attempt_count: number
          p_invoice_id: string
          p_next_retry?: string
          p_reason: string
          p_stripe_customer_id: string
        }
        Returns: Json
      }
      match_documents: {
        Args: {
          filter_domain?: string
          match_count?: number
          query_embedding: string
        }
        Returns: {
          content_snippet: string
          document_id: string
          similarity: number
          title: string
          url: string
        }[]
      }
      norm_1_5: { Args: { score: number }; Returns: number }
      predict_burnout_risk: { Args: { p_user_id: string }; Returns: Json }
      predict_burnout_risk_zkwv: {
        Args: { p_user_hash: string }
        Returns: Json
      }
      purge_old_reflections: { Args: never; Returns: undefined }
      record_terms_acceptance: {
        Args: {
          p_ip_address?: string
          p_privacy_hash?: string
          p_privacy_version: string
          p_terms_hash?: string
          p_terms_version: string
          p_user_agent?: string
        }
        Returns: Json
      }
      refresh_user_stress_daily_rpc: { Args: never; Returns: undefined }
      reset_monthly_assignments: { Args: never; Returns: undefined }
      search_asl_signs: {
        Args: { limit_count?: number; q: string }
        Returns: {
          definition: string
          id: string
          synonyms: string[]
          term: string
        }[]
      }
      secure_fn: { Args: { arg1: string; arg2: string }; Returns: boolean }
      start_user_trial: { Args: { user_id: string }; Returns: Json }
      update_profile_from_stripe: {
        Args: {
          p_cancel_at_period_end?: boolean
          p_current_period_end?: string
          p_current_period_start?: string
          p_customer_id: string
          p_email?: string
          p_event_type: string
          p_interval?: string
          p_plan_amount?: number
          p_plan_name?: string
          p_price_id?: string
          p_status?: string
          p_subscription_id?: string
        }
        Returns: undefined
      }
      update_subscription_status: {
        Args: {
          p_email: string
          p_end_date?: string
          p_status: string
          p_stripe_customer_id?: string
          p_stripe_subscription_id?: string
        }
        Returns: Json
      }
      verify_wellness_threshold: {
        Args: {
          threshold_type: string
          threshold_value: number
          user_hash_input: string
        }
        Returns: boolean
      }
    }
    Enums: {
      ai_involvement_expected: "yes" | "no" | "unsure"
      assignment_modality: "onsite" | "vri" | "vrs" | "hybrid" | "other"
      assignment_setting:
        | "medical"
        | "legal"
        | "vrs"
        | "vri"
        | "k12"
        | "post_secondary"
        | "mental_health"
        | "community"
        | "other"
      assignment_stakes: "routine" | "sensitive" | "high_stakes" | "crisis"
      emotional_state:
        | "controlled"
        | "minor_signs"
        | "noticeable"
        | "significant"
        | "overwhelming"
      energy_level:
        | "full_tank"
        | "three_quarters"
        | "half_tank"
        | "quarter_tank"
        | "empty"
      eri_band: "stable" | "watch" | "at_risk" | "insufficient_data"
      performance_impact:
        | "peak"
        | "normal"
        | "slight_decrease"
        | "significant_decrease"
        | "severe_decrease"
      readiness_level:
        | "fully_ready"
        | "mostly_ready"
        | "uncertain"
        | "need_support"
        | "need_break"
      recovery_speed: "instant" | "quick" | "medium" | "slow" | "very_slow"
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
      ai_involvement_expected: ["yes", "no", "unsure"],
      assignment_modality: ["onsite", "vri", "vrs", "hybrid", "other"],
      assignment_setting: [
        "medical",
        "legal",
        "vrs",
        "vri",
        "k12",
        "post_secondary",
        "mental_health",
        "community",
        "other",
      ],
      assignment_stakes: ["routine", "sensitive", "high_stakes", "crisis"],
      emotional_state: [
        "controlled",
        "minor_signs",
        "noticeable",
        "significant",
        "overwhelming",
      ],
      energy_level: [
        "full_tank",
        "three_quarters",
        "half_tank",
        "quarter_tank",
        "empty",
      ],
      eri_band: ["stable", "watch", "at_risk", "insufficient_data"],
      performance_impact: [
        "peak",
        "normal",
        "slight_decrease",
        "significant_decrease",
        "severe_decrease",
      ],
      readiness_level: [
        "fully_ready",
        "mostly_ready",
        "uncertain",
        "need_support",
        "need_break",
      ],
      recovery_speed: ["instant", "quick", "medium", "slow", "very_slow"],
    },
  },
} as const
