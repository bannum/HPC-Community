import { createClient } from "@supabase/supabase-js";

// These come from your Supabase project settings (Project Settings > API).
// Put the real values in .env.local — see .env.local.example.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
