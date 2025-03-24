// /api/upload.js
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const { filename, content } = req.body;

  if (!filename || !content) {
    return res.status(400).json({ error: 'Missing filename or content' });
  }

  const { data, error } = await supabaseAdmin
    .storage
    .from('devotionals')
    .upload(`json/${filename}`, JSON.stringify(content), {
      contentType: 'application/json',
      upsert: true
    });

  if (error) {
    console.error('[Supabase Storage Error]', error);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ path: data.path });
}
