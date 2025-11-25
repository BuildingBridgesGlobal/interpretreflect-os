import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/src/types/database";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = url && anon ? createClient<Database>(url, anon) : null;
