import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function handler(event) {
  console.log("Received GET request for active plan");

  const { user_id } = event.queryStringParameters || {};

  if (!user_id) {
    return { statusCode: 400, body: 'Missing user_id' };
  }

  const { data, error } = await supabase
    .from('active_plan')
    .select('plan_id')
    .eq('user_id', user_id)
    .order('updated_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error("Error fetching active plan:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }

  if (!data || data.length === 0) {
    return { statusCode: 404, body: 'Active plan not found' };
  }

  return { statusCode: 200, body: JSON.stringify({ plan_id: data[0].plan_id }) };
}
