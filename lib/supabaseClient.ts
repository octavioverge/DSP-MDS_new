
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    const missing = [];
    if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!supabaseAnonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');

    // Warn instead of throw during build to allow static generation if possible, 
    // or throw with more info.
    // For now, throwing is safer to ensure configuration is correct.
    throw new Error(`Missing Supabase environment variables: ${missing.join(', ')}`);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
