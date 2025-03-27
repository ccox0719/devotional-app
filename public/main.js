import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
const supabase = createClient(
  'https://sggxzlhpdkqjlepbwdqf.supabase.co',
'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZ3h6bGhwZGtxamxlcGJ3ZHFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3NTUwMzMsImV4cCI6MjA1ODMzMTAzM30.qJ3KaJbiV7MAD_wHQhix3EJCJPWAEMYktAyqVocthwI'
);

// Get today's date formatted like '1/1/2025'
function getTodayDate() {
  const today = new Date();
  return `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
}

// Fetch ESV passage
async function fetchESVText(reference) {
  const response = await fetch(`https://api.esv.org/v3/passage/text/?q=${encodeURIComponent(reference)}&include-verse-numbers=false&include-footnotes=false&include-headings=false`, {
    headers: {
      Authorization: '9c370281d484454ecf50ed82af3c1ab34fe024bb' // Replace with your actual API key
    }
  });

  if (!response.ok) {
    console.error('Failed to fetch ESV passage');
    return '';
  }

  const data = await response.json();
  return data.passages[0] || '';
}

async function loadDevotional() {
  const { data: activePlan, error: activeError } = await supabase
    .from('active_plan')
    .select('plan_id')
    .single();

  if (activeError || !activePlan?.plan_id) {
    document.getElementById('plan-title').innerText = 'No active plan selected.';
    return;
  }

  const { data: plan, error: planError } = await supabase
    .from('devotional_plans')
    .select('*')
    .eq('id', activePlan.plan_id)
    .single();

  if (planError || !plan) {
    document.getElementById('plan-title').innerText = 'Error loading plan.';
    return;
  }

  const todayDate = getTodayDate();
  const todayEntry = plan.entries.find(entry => entry.Date === todayDate);

  if (!todayEntry) {
    document.getElementById('plan-title').innerText = plan.title;
    document.getElementById('plan-subtitle').innerText = plan.subtitle || '';
    document.getElementById('content').innerHTML = `<p>No entry for today (${todayDate})</p>`;
    return;
  }

  const passage = await fetchESVText(todayEntry.Reference || '');

  document.getElementById('plan-title').innerText = plan.title;
  document.getElementById('plan-subtitle').innerText = plan.subtitle || '';
  document.getElementById('content').innerHTML = `<h3>${todayEntry.Reference}</h3><p>${passage}</p>`;
  document.getElementById('question').innerText = todayEntry['Reflective Question'] || '—';
  document.getElementById('prayer').innerText = todayEntry['Prayer Prompt'] || '—';
}

document.addEventListener('DOMContentLoaded', loadDevotional);
