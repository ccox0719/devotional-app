<<<<<<< HEAD
=======
<<<<<<< HEAD
import supabase from '../supabase/client.js'
=======
>>>>>>> 4fbd151
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
      'https://sggxzlhpdkqjlepbwdqf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZ3h6bGhwZGtxamxlcGJ3ZHFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3NTUwMzMsImV4cCI6MjA1ODMzMTAzM30.qJ3KaJbiV7MAD_wHQhix3EJCJPWAEMYktAyqVocthwI'
);
<<<<<<< HEAD
=======
>>>>>>> ed346ec (Your commit message)
>>>>>>> 4fbd151

export async function savePlan(plan) {
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
    const { data, error } = await supabase
      .from('active_plan')
      .upsert({ filename }, { onConflict: 'id' });
  
    if (error) throw new Error('Failed to set active plan: ' + error.message);
    return data;
  }
  export async function getActivePlan() {
    const { data, error } = await supabase
      .from('active_plan')
      .select('filename')
      .order('updated_at', { ascending: false })
      .limit(1);
  
    if (error || !data || data.length === 0) return null;
    return data[0].filename;
  }  