import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function handler(event) {
  console.log("📨 Received request:", event.httpMethod);

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  try {
    console.log("🌍 SUPABASE_URL:", process.env.SUPABASE_URL);
    console.log("🔐 SERVICE_KEY starts with:", process.env.SUPABASE_SERVICE_KEY?.slice(0, 8));
    console.log("🧾 Raw body:", event.body);

    const body = JSON.parse(event.body);
    const { title, subtitle, tags, data } = body;

    console.log("✅ Parsed:", { title, subtitle, tags, data: Array.isArray(data) ? `Array of ${data.length}` : 'Invalid' });

    if (!title || !subtitle || !Array.isArray(data)) {
      console.error("❌ Invalid fields in body");
      return {
        statusCode: 400,
        body: 'Missing or invalid fields: title, subtitle, data[]',
      };
    }

    const { data: insertResult, error } = await supabase
      .from('devotional_plans')
      .insert([{ title, subtitle, tags, data }])
      .select();

    if (error || !insertResult || insertResult.length === 0) {
      console.error("❌ Supabase insert error:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Insert failed', details: error }),
      };
    }

    console.log("✅ Plan inserted with ID:", insertResult[0].id);

    return {
      statusCode: 200,
      body: JSON.stringify({ id: insertResult[0].id }),
    };
  } catch (err) {
    console.error("💥 JSON parse or unexpected error:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Unexpected error', details: err.message }),
    };
  }
}
