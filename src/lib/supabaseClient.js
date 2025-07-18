import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please connect to Supabase using the "Connect to Supabase" button in the top right.');
  alert('Supabase configuration is missing. Please connect to Supabase first.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);