import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

window.SUPABASE_URL = 'https://sggxzlhpdkqjlepbwdqf.supabase.co';
window.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZ3h6bGhwZGtxamxlcGJ3ZHFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3NTUwMzMsImV4cCI6MjA1ODMzMTAzM30.qJ3KaJbiV7MAD_wHQhix3EJCJPWAEMYktAyqVocthwI';
const supabase = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

async function fetchESVText(reference) {
  const response = await fetch(
    `https://api.esv.org/v3/passage/text/?q=${encodeURIComponent(reference)}&include-verse-numbers=false&include-footnotes=false&include-headings=false&include-passage-references=false&indent-paragraphs=0`,
    {
      headers: {
      Authorization: '9328c9005b4622bc622b4f55a75a90a20e69003f'
    }
  });
  const json = await response.json();
  return json.passages?.[0] || 'Scripture not found.';
}
async function loadPlan() {
  // 1. Get active plan ID
  const { data: active, error: activeError } = await supabase
    .from('active_plan')
    .select('plan_id')
    .single();

  if (activeError || !active) {
    document.getElementById('content').innerText = 'No active plan found.';
    return;
  }

  // 2. Load the plan data
  const { data: plan, error: planError } = await supabase
    .from('devotional_plans')
    .select('title, subtitle, data')
    .eq('id', active.plan_id)
    .single();

  if (planError || !plan) {
    document.getElementById('content').innerText = 'Error loading devotional.';
    return;
  }

  document.getElementById('plan-title').innerText = plan.title;
  document.getElementById('plan-subtitle').innerText = plan.subtitle;

  const today = new Date();
  const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
  
  // 4. Match today's entry
  const todayEntry = plan.data.find(entry => entry.Date === formattedDate);

  if (!todayEntry) {
    document.getElementById('content').innerText = `No devotional for ${formattedDate}.`;
    return;
  }

  // 5. Display it
  const passage = await fetchESVText(todayEntry.Reference || '');

  // Set the plan title (without the reference)
  document.getElementById('plan-title').innerText = plan.title;
  
  // Clear previous content
  const contentEl = document.getElementById('content');
  contentEl.innerHTML = '';
  
  // Create and insert the reference heading
  const referenceHeading = document.createElement('div');
  referenceHeading.className = 'passage-reference';
  referenceHeading.innerText = todayEntry.Reference || '';
  contentEl.appendChild(referenceHeading);
  
  // Insert the passage as a new paragraph
  const passageText = document.createElement('div');
  passageText.className = 'devotional-text';
  passageText.innerHTML = passage; // allows formatting from API
  contentEl.appendChild(passageText);
  
  // Set question and prayer
  document.getElementById('question').innerText = todayEntry['Reflective Question'] || '—';
  document.getElementById('prayer').innerText = todayEntry['Prayer Prompt'] || '—';
  
}

loadPlan();
