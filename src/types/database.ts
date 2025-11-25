export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          email: string;
          full_name: string | null;
          display_name: string | null;
          avatar_url: string | null;
          role: 'interpreter' | 'agency_admin' | 'admin';
          subscription_tier:
            | 'free'
            | 'professional'
            | 'professional_plus'
            | 'team'
            | 'agency'
            | 'enterprise';
          subscription_status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'inactive';
          onboarding_completed: boolean;
          settings: Json;
        };
        Insert: {
          id: string;
          created_at?: string;
          updated_at?: string;
          email: string;
          full_name?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: 'interpreter' | 'agency_admin' | 'admin';
          subscription_tier?:
            | 'free'
            | 'professional'
            | 'professional_plus'
            | 'team'
            | 'agency'
            | 'enterprise';
          subscription_status?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'inactive';
          onboarding_completed?: boolean;
          settings?: Json;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          email?: string;
          full_name?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: 'interpreter' | 'agency_admin' | 'admin';
          subscription_tier?:
            | 'free'
            | 'professional'
            | 'professional_plus'
            | 'team'
            | 'agency'
            | 'enterprise';
          subscription_status?: 'active' | 'trialing' | 'past_due' | 'canceled' | 'inactive';
          onboarding_completed?: boolean;
          settings?: Json;
        };
      };
      check_ins: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          check_in_type: 'morning' | 'pre_assignment' | 'post_assignment' | 'evening' | 'quick';
          emotional_load: number;
          physical_load: number;
          cognitive_load: number;
          overall_load: number;
          energy_level: number;
          notes: string | null;
          metadata: Json;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          check_in_type: 'morning' | 'pre_assignment' | 'post_assignment' | 'evening' | 'quick';
          emotional_load: number;
          physical_load: number;
          cognitive_load: number;
          overall_load?: number;
          energy_level: number;
          notes?: string | null;
          metadata?: Json;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          check_in_type?: 'morning' | 'pre_assignment' | 'post_assignment' | 'evening' | 'quick';
          emotional_load?: number;
          physical_load?: number;
          cognitive_load?: number;
          overall_load?: number;
          energy_level?: number;
          notes?: string | null;
          metadata?: Json;
        };
      };
      reflections: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          user_id: string;
          assignment_id: string | null;
          reflection_type: 'quick' | 'standard' | 'deep' | 'ethics';
          title: string;
          content: Json;
          ecci_components: Json;
          ceu_eligible: boolean;
          ceu_value: number | null;
          ceu_submitted: boolean;
          ceu_approved: boolean;
          status: 'draft' | 'completed' | 'submitted' | 'approved';
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id: string;
          assignment_id?: string | null;
          reflection_type: 'quick' | 'standard' | 'deep' | 'ethics';
          title: string;
          content: Json;
          ecci_components?: Json;
          ceu_eligible?: boolean;
          ceu_value?: number | null;
          ceu_submitted?: boolean;
          ceu_approved?: boolean;
          status?: 'draft' | 'completed' | 'submitted' | 'approved';
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
          assignment_id?: string | null;
          reflection_type?: 'quick' | 'standard' | 'deep' | 'ethics';
          title?: string;
          content?: Json;
          ecci_components?: Json;
          ceu_eligible?: boolean;
          ceu_value?: number | null;
          ceu_submitted?: boolean;
          ceu_approved?: boolean;
          status?: 'draft' | 'completed' | 'submitted' | 'approved';
        };
      };
      skills: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          user_id: string;
          skill_category: string;
          skill_name: string;
          current_level: number;
          target_level: number;
          evidence: Json;
          last_practiced: string | null;
          practice_count: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id: string;
          skill_category: string;
          skill_name: string;
          current_level?: number;
          target_level?: number;
          evidence?: Json;
          last_practiced?: string | null;
          practice_count?: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
          skill_category?: string;
          skill_name?: string;
          current_level?: number;
          target_level?: number;
          evidence?: Json;
          last_practiced?: string | null;
          practice_count?: number;
        };
      };
      assignments: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          user_id: string;
          title: string;
          setting: string;
          date: string;
          start_time: string;
          end_time: string;
          status: 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
          prep_completed: boolean;
          reflection_completed: boolean;
          anticipated_challenges: Json;
          actual_challenges: Json;
          notes: string | null;
          metadata: Json;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id: string;
          title: string;
          setting: string;
          date: string;
          start_time: string;
          end_time: string;
          status?: 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
          prep_completed?: boolean;
          reflection_completed?: boolean;
          anticipated_challenges?: Json;
          actual_challenges?: Json;
          notes?: string | null;
          metadata?: Json;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
          title?: string;
          setting?: string;
          date?: string;
          start_time?: string;
          end_time?: string;
          status?: 'upcoming' | 'in_progress' | 'completed' | 'cancelled';
          prep_completed?: boolean;
          reflection_completed?: boolean;
          anticipated_challenges?: Json;
          actual_challenges?: Json;
          notes?: string | null;
          metadata?: Json;
        };
      };
    };
    Views: { [key: string]: never };
    Functions: { [key: string]: never };
    Enums: { [key: string]: never };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type CheckIn = Database['public']['Tables']['check_ins']['Row'];
export type Reflection = Database['public']['Tables']['reflections']['Row'];
export type Skill = Database['public']['Tables']['skills']['Row'];
export type Assignment = Database['public']['Tables']['assignments']['Row'];
