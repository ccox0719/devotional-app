import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import supabase from './utils/supabaseClient.js';
import { checkAuth, subscribeToAuthChanges } from './auth.js';

const apiKey = '9328c9005b4622bc622b4f55a75a90a20e69003f'; // Replace with your actual key securely

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
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const day = today.getDate().toString().padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;
  
  async function fetchBiblePassage(reference) {
    const apiUrl = `https://api.esv.org/v3/passage/text/?q=${encodeURIComponent(reference)}`;
    try {
      const response = await fetch(apiUrl, {
        headers: { "Authorization": `Token ${apiKey}` }
      });
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      return data.passages ? data.passages[0].trim() : "Passage not found";
    } catch (error) {
      console.error("Error fetching Bible passage:", error.message);
      return "Error fetching passage. Please try again.";
    }
  }
  
  // 4. Match today's entry (assumes plan.data entries have a "Date" field in "YYYY-MM-DD" format)
  const todayEntry = plan.data.find(entry => entry.Date === formattedDate);

  if (!todayEntry) {
    document.getElementById('content').innerText = `No devotional for ${formattedDate}.`;
    return;
  }

  // 5. Display it using fetchBiblePassage (note: function name corrected)
  const passage = await fetchBiblePassage(todayEntry.Reference || '');

  // Set the plan title (without the reference)
  document.getElementById('plan-title').innerText = plan.title;
  const contentEl = document.getElementById('content');
  contentEl.innerHTML = '';

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
