// /api/select-devotional.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { file_path } = req.body;

  const { error } = await supabase
    .from('selected_devotional')
    .update({ file_path, updated_at: new Date().toISOString() })
    .eq('id', 1);

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ message: 'Selected devotional updated.' });
}
