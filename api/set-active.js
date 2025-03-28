// netlify/functions/set-active.js
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { plan_id } = JSON.parse(event.body);

  if (!plan_id) {
    return { statusCode: 400, body: 'Missing plan_id' };
  }

  const { error } = await supabase
    .from('active_plan')
    .upsert({ id: 'singleton', plan_id });

  if (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Upsert failed', details: error }),
    };
  }

  return { statusCode: 200, body: 'Active plan updated' };
}
