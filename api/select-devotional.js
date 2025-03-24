// /api/select-devotional.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,               // ✅ Corrected env var
  process.env.SUPABASE_SERVICE_ROLE_KEY   // ✅ Using the secure server-side key
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

    // Optional: Do something with Supabase if needed, like fetching metadata

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('[Server Error]', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
