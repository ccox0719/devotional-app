// /api/selected-devotional.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const { data, error } = await supabase
    .from('selected_devotional')
    .select('file_path')
    .eq('id', 1)
    .single();

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ file_path: data.file_path });
}
