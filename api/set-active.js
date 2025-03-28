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
    const { plan_id } = JSON.parse(event.body);

    if (!plan_id) {
      console.error("Missing plan_id in request body");
      return { statusCode: 400, body: 'Missing plan_id' };
    }

    // Perform the upsert: assuming your table active_plan has columns "id" and "plan_id"
    const { error } = await supabase
      .from('active_plan')
      .upsert({ id: 'singleton', plan_id });

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
