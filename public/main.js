import { supabase } from './client.js';
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
  document.getElementById('plan-title').innerText = `${plan.title} — ${todayEntry.Reference}`;
  document.getElementById('content').innerText = passage;
  document.getElementById('question').innerText = todayEntry['Reflective Question'] || '—';
  document.getElementById('prayer').innerText = todayEntry['Prayer Prompt'] || '—';
}

loadPlan();
