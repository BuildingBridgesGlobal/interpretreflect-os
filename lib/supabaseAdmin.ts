import { createClient } from "@supabase/supabase-js";

// Hardcoded values to ensure consistency between localhost and production
// These match the values in .env.local
const supabaseUrl = "https://wjhdvjukspfgoojyloks.supabase.co";
const supabaseServiceRoleKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqaGR2anVrc3BmZ29vanlsb2tzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDIyMzAzNSwiZXhwIjoyMDc5Nzk5MDM1fQ.ABHJ3r9ahUS-HB0M8ojjrludAvLnZkHD52-YZtjYWtE";

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
