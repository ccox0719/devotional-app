import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import supabase from './utils/supabaseClient.js';
import { checkAuth, subscribeToAuthChanges } from './auth.js';

const apiKey = '9328c9005b4622bc622b4f55a75a90a20e69003f'; // Replace with your actual key securely

// Utility function to format a Date as YYYY-MM-DD
function formatDate(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Fetch Bible passage from the ESV API using global apiKey
async function fetchBiblePassage(reference) {
  const apiUrl = `https://api.esv.org/v3/passage/text/?q=${encodeURIComponent(reference)}&include-verse-numbers=false&include-footnotes=false&include-headings=false&include-subheadings=false`;
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

// Define caching functions if desired (not integrated into loadPlan below)
async function getDevotionalPlan(activePlanId) {
  const todayKey = `devotionalPlan-${formatDate(new Date())}`;
  const cachedPlan = localStorage.getItem(todayKey);
  if (cachedPlan) {
    return JSON.parse(cachedPlan);
  }
  const { data: plan, error } = await supabase
    .from('devotional_plans')
    .select('title, subtitle, data')
    .eq('id', activePlanId)
    .single();
  if (plan && !error) {
    localStorage.setItem(todayKey, JSON.stringify(plan));
    return plan;
  }
  return null;
}

async function getBiblePassage(reference) {
  if (!reference) return "";
  const passageKey = `biblePassage-${encodeURIComponent(reference)}-${formatDate(new Date())}`;
  const cachedPassage = localStorage.getItem(passageKey);
  if (cachedPassage) return cachedPassage;

  const passage = await fetchBiblePassage(reference);
  localStorage.setItem(passageKey, passage);
  return passage;
}

async function loadPlan() {
  // Cache DOM elements
  const contentEl = document.getElementById('content');
  const planTitleEl = document.getElementById('plan-title');
  const planSubtitleEl = document.getElementById('plan-subtitle');
  const questionEl = document.getElementById('question');
  const prayerEl = document.getElementById('prayer');

  // 1. Get authenticated user
  const user = await checkAuth();
  if (!user) return;

  // Listen for auth state changes
  subscribeToAuthChanges((event, session) => {
    if (!session) {
      contentEl.innerText = 'Your session has expired. Please sign in again.';
      window.location.href = 'login.html';
    }
  });
  document.addEventListener("DOMContentLoaded", () => {
    const installBtn = document.getElementById("install-button");
    
    // Always show the install button, regardless of standalone mode
    installBtn.style.display = "block";
  
    window.addEventListener("beforeinstallprompt", (e) => {
      console.log("[PWA] beforeinstallprompt event fired");
      e.preventDefault();
      // No condition; always show the install button
      installBtn.style.display = "block";
  
      installBtn.addEventListener("click", () => {
        console.log("[PWA] User clicked install button");
        e.prompt();
        e.userChoice.then((choiceResult) => {
          console.log(`[PWA] User choice: ${choiceResult.outcome}`);
        });
      });
    });
  });
  
  
  // 2. Get active plan ID for the current user
  const { data: active, error: activeError } = await supabase
    .from('active_plan')
    .select('plan_id')
    .eq('user_id', user.id)
    .single();

  const menuButton = document.querySelector('.menu-button');
  if (menuButton) {
    menuButton.addEventListener('click', () => {
      window.location.href = 'upload.html';
    });
  }

  if (activeError || !active) {
    contentEl.innerText = 'No active plan found.';
    return;
  }

  // 3. Load the plan data
  const { data: plan, error: planError } = await supabase
    .from('devotional_plans')
    .select('title, subtitle, data')
    .eq('id', active.plan_id)
    .single();
  if (planError || !plan) {
    contentEl.innerText = 'Error loading devotional.';
    return;
  }

  // Update title and subtitle
  planTitleEl.innerText = plan.title;
  planSubtitleEl.innerText = plan.subtitle;

  // Define today's date in YYYY-MM-DD format
  const todayFormatted = formatDate(new Date());

  // Update the date badge element dynamically
  const dateBadgeEl = document.getElementById('date-badge');
  if (dateBadgeEl) {
    const today = new Date();
    const day = today.getDate();
    const month = today.toLocaleString('default', { month: 'short' }).toUpperCase();
    dateBadgeEl.innerHTML = `<span class="date-number">${day}</span><br><span class="date-month">${month}</span>`;
  }

  // 4. Find today's entry (assumes plan.data entries have a "Date" field in "YYYY-MM-DD" format)
  const todayEntry = plan.data.find(entry => entry.Date === todayFormatted);
  if (!todayEntry) {
    contentEl.innerText = `No devotional for ${todayFormatted}.`;
    return;
  }

  // 5. Fetch the Bible passage for today's entry
  const passage = await fetchBiblePassage(todayEntry.Reference || '');

  // Clear previous content and display the Bible passage as a psalm
  contentEl.innerHTML = '';
  const passageText = document.createElement('pre');
  passageText.className = 'devotional-text';
  passageText.textContent = passage;
  contentEl.appendChild(passageText);

  // Set question and prayer
  questionEl.innerText = todayEntry['Reflective Question'] || '—';
  prayerEl.innerText = todayEntry['Prayer Prompt'] || '—';
}
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/serviceworker.js')
    .then(() => console.log('Service Worker registered'))
    .catch((err) => console.error('Service Worker registration failed', err));
}

loadPlan().then(() => {
  import('./theme.js')
    .catch(error => console.error('Error loading theme module:', error));
});