import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/src/types/database";

// Use environment variables with fallback to hardcoded values for development
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wjhdvjukspfgoojyloks.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqaGR2anVrc3BmZ29vanlsb2tzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMjMwMzUsImV4cCI6MjA3OTc5OTAzNX0.FyAbwNNLik0NSdueHMfpWmPD7lyISxIN88b3h5Vp5dk";

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'supabase.auth.token',
  }
});
