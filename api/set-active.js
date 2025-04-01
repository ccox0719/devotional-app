// set-active.js
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();
console.log("Using SUPABASE_SERVICE_KEY:", process.env.SUPABASE_SERVICE_KEY?.slice(0, 10), '...');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function handler(event) {
  console.log("Set-active function triggered. Method:", event.httpMethod);

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    console.log("Raw request body:", event.body);
    const body = JSON.parse(event.body);
    const { user_id, plan_id } = body;

    if (!user_id || !plan_id) {
      console.error("Missing user_id or plan_id in request body");
      return { statusCode: 400, body: 'Missing user_id or plan_id' };
    }

    console.log("Setting active plan:", { user_id, plan_id });

    const { data: upsertData, error } = await supabase
      .from('active_plan')
      .upsert({ user_id, plan_id }, { onConflict: 'user_id' })
      .select('*');

    if (error) {
      console.error("Supabase upsert error:", error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to update active plan', details: error.message }),
      };
    }

    console.log("Active plan updated successfully");
    return { statusCode: 200, body: 'Active plan updated' };
  } catch (err) {
    console.error("Unexpected error in set-active:", err.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error', details: err.message }),
    };
  }
}
