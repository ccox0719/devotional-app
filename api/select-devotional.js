// /api/select-devotional.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,   // <-- Problem 1
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { filename } = req.body;

    if (!filename) {
      return res.status(400).json({ error: 'Missing filename' });
    }

    // Do your Supabase logic here (e.g., log, fetch, etc.)

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('[Server Error]', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
