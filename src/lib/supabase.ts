import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	const msg =
		'Missing Supabase environment variables. Create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (see .env.example).';
	console.error(msg, { supabaseUrl, supabaseAnonKey });
	throw new Error(msg);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
