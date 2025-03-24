// /api/upload.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { filename, content } = req.body;

  const { data, error } = await supabase
    .storage
    .from('devotionals')
    .upload(`json/${filename}`, JSON.stringify(content), {
      contentType: 'application/json',
      upsert: true
    });

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ path: data.path });
}
