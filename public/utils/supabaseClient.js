import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// Use the global variables defined in your HTML (make sure they're defined before this script runs)
const supabase = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

export default supabase;
