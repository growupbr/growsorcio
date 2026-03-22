import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
	import.meta.env.VITE_SUPABASE_URL ||
	'https://rzgmzkmrhfyhwmiacwwm.supabase.co';
const supabaseAnonKey =
	import.meta.env.VITE_SUPABASE_ANON_KEY ||
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6Z216a21yaGZ5aHdtaWFjd3dtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTM3NjgsImV4cCI6MjA4OTA2OTc2OH0.lPNxlx1oma4rAxsoHG7aaB-a_53pPAHwFI8DRum5b5I';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
