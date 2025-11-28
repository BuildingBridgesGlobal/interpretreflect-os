import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/src/types/database";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://wjhdvjukspfgoojyloks.supabase.co";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqaGR2anVrc3BmZ29vanlsb2tzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyMjMwMzUsImV4cCI6MjA3OTc5OTAzNX0.FyAbwNNLik0NSdueHMfpWmPD7lyISxIN88b3h5Vp5dk";

// Debug logging
console.log("Supabase Client Debug:", {
  url,
  anonKey: anon ? `${anon.substring(0, 20)}...` : undefined,
  hasUrl: !!url,
  hasAnon: !!anon,
});

// Validate that URL is actually a valid HTTP/HTTPS URL, not just a placeholder
const isValidUrl = (str: string | undefined): boolean => {
  if (!str) {
    console.log("URL validation failed: no URL provided");
    return false;
  }
  try {
    const parsed = new URL(str);
    const isValid = parsed.protocol === "http:" || parsed.protocol === "https:";
    console.log("URL validation:", { url: str, isValid });
    return isValid;
  } catch (e) {
    console.log("URL validation failed with error:", e);
    return false;
  }
};

const urlValid = isValidUrl(url);
const anonValid = anon && anon !== "your-anon-key";
console.log("Creating Supabase client:", { urlValid, anonValid, willCreateClient: urlValid && anonValid });

export const supabase = urlValid && anonValid ? createClient<Database>(url!, anon) : null;
