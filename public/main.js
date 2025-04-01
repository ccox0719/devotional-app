import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import supabase from './utils/supabaseClient.js';
import { checkAuth, subscribeToAuthChanges } from './auth.js';

async function loadPlan() {
  // 1. Get authenticated user
  const user = await checkAuth();
  if (!user) return;
  console.log('Authenticated user:', user);

  // Listen for auth state changes (optional but recommended)
  subscribeToAuthChanges((event, session) => {
    if (!session) {
      document.getElementById('content').innerText = 'Your session has expired. Please sign in again.';
      window.location.href = 'login.html';
    }
  });

  // 2. Get active plan ID for the current user
  const { data: active, error: activeError } = await supabase
    .from('active_plan')
    .select('plan_id')
    .eq('user_id', user.id)
    .single();
  console.log('Active plan:', active);

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
