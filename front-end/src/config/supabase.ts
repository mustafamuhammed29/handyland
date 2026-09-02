/**
 * front-end/src/config/supabase.ts
 * Supabase client for frontend
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false,  // Don't persist - use HttpOnly cookies
        autoRefreshToken: false,  // Backend handles refresh
        detectSessionInUrl: false,  // No URL session detection
        flowType: 'implicit'  // Use implicit flow for OAuth
    }
});

export default supabase;
