import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import supabase from './utils/supabaseClient.js';
import { checkAuth } from './auth.js';

export async function savePlan(plan) {
  const user = await checkAuth();
  if (!user) return;

  const fileName = plan.title.toLowerCase().replace(/\s+/g, '-') + '.json';

  const { error } = await supabase.storage
    .from('devotionals')
    .upload(`plans/${fileName}`, new Blob([JSON.stringify(plan)], { type: 'application/json' }), {
      upsert: true,
    });

  if (error) {
    throw new Error('Failed to upload plan to Supabase: ' + error.message);
  }

  return fileName;
}

export async function loadPlanById(fileName) {
  const user = await checkAuth();
  if (!user) return;

  const { data, error } = await supabase.storage
    .from('devotionals')
    .download(`plans/${fileName}`);

  if (error) {
    throw new Error('Failed to load plan from Supabase: ' + error.message);
  }

  const text = await data.text();
  return JSON.parse(text);
}

export function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');

  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((key, i) => {
      obj[key.trim()] = values[i]?.trim();
    });
    return obj;
  });
}

export async function setActivePlan(filename) {
  const user = await checkAuth();
  if (!user) return;

  const { data, error } = await supabase
    .from('active_plan')
    .upsert({ filename }, { onConflict: 'id' });

  if (error) throw new Error('Failed to set active plan: ' + error.message);
  return data;
}

export async function getActivePlan() {
  const user = await checkAuth();
  if (!user) return null;

  const { data, error } = await supabase
    .from('active_plan')
    .select('filename')
    .order('updated_at', { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) return null;
  return data[0].filename;
}