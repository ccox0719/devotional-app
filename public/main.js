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
  const contentEl = document.getElementById('content');
  const planTitleEl = document.getElementById('plan-title');
  const planSubtitleEl = document.getElementById('plan-subtitle');

  const user = await checkAuth();
  if (!user) return;

  subscribeToAuthChanges((event, session) => {
    if (!session) {
      contentEl.innerText = 'Your session has expired. Please sign in again.';
      window.location.href = 'login.html';
    }
  });

  const { data: active, error: activeError } = await supabase
    .from('active_plan')
    .select('plan_id')
    .eq('user_id', user.id)
    .single();

  if (activeError || !active) {
    contentEl.innerText = 'No active plan found.';
    return;
  }

  const { data: plan, error: planError } = await supabase
  .from('devotional_plans')
  .select('title, subtitle, data, accentColor, logo_url, logo_svg')
  .eq('id', active.plan_id)
  .single();

if (planError || !plan) {
  contentEl.innerText = 'Error loading devotional.';
  return;
}

// Apply accent color if available
const defaultAccent = '#f97316';
const logoEl = document.getElementById('plan-logo');

// Accent color
const accent = plan.accentColor || defaultAccent;
document.documentElement.style.setProperty('--accent', accent);

// Update browser chrome color for PWA
const metaThemeColor = document.querySelector('meta[name="theme-color"]');
if (metaThemeColor) {
  metaThemeColor.setAttribute("content", accent);
}


// Logo handling (inline SVG or fallback)
if (logoEl) {
  if (plan.logo_svg) {
    logoEl.innerHTML = plan.logo_svg;
    logoEl.style.display = 'block';
  } else if (plan.logo_url) {
    logoEl.innerHTML = `<img src="${plan.logo_url}" style="max-width:100px;" />`;
    logoEl.style.display = 'block';
  } else {
    logoEl.innerHTML = '';
    logoEl.style.display = 'none';
  }
}

  if (planError || !plan) {
    contentEl.innerText = 'Error loading devotional.';
    return;
  }

  const planData = typeof plan.data === 'string' ? JSON.parse(plan.data) : plan.data;

  planTitleEl.innerText = plan.title;
  planSubtitleEl.innerText = plan.subtitle;

  const today = new Date().toISOString().split('T')[0];
  console.log("TODAY:", today);
  console.log("Available Dates:", planData.map(e => e.Date));

  let todayEntry = planData.find(entry => {
    const match = entry.Date === today;
    if (match) console.log("Matched entry:", entry);
    return match;
  });

  if (!todayEntry) {
    console.warn("No devotional found for", today);
    contentEl.innerText = 'No devotional found for today.';
    return;
  }

// ✅ Update the date badge
const dateBadgeEl = document.getElementById('date-badge');
if (dateBadgeEl && todayEntry.Date) {
  const [year, month, day] = todayEntry.Date.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const displayDay = dateObj.getDate();
  const displayMonth = dateObj.toLocaleString('default', { month: 'short' }).toUpperCase();

  dateBadgeEl.innerHTML = `
      ${displayDay}
      <span>${displayMonth}</span>
    `;

}
  const passage = await fetchBiblePassage(todayEntry.Reference || '');
  contentEl.innerHTML = '';
  const passageText = document.createElement('pre');
  passageText.className = 'devotional-text';
  passageText.textContent = passage;
  contentEl.appendChild(passageText);

  const qList = document.getElementById('questions-list');
  const pList = document.getElementById('prayers-list');
  qList.innerHTML = '';
  pList.innerHTML = '';

// Render Questions with dividers (only if there are multiple)
(todayEntry.questions || []).forEach((q, i, arr) => {
  const li = document.createElement('li');
  li.textContent = q;
  qList.appendChild(li);

  // Add a divider if it's not the last question
  if (i < arr.length - 1) {
    const divider = document.createElement('hr');
    divider.className = 'inline-divider'; // Styling class for dividers
    qList.appendChild(divider);
  }
});

// Render Prayers with dividers (only if there are multiple)
(todayEntry.prayers || []).forEach((p, i, arr) => {
  const li = document.createElement('li');
  li.textContent = p;
  pList.appendChild(li);
  if (i < arr.length - 1) {
    const divider = document.createElement('hr');
    divider.className = 'inline-divider';
    pList.appendChild(divider);
  }
});


  const menuButton = document.querySelector('.menu-button');
  if (menuButton) {
    menuButton.addEventListener('click', () => {
      window.location.href = `upload.html?v=${Date.now()}`;
    });
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/serviceworker.js')
      .then(() => console.log('Service Worker registered'))
      .catch((err) => console.error('Service Worker registration failed', err));
  }
}



// Call it once, then load theme
document.addEventListener("DOMContentLoaded", () => {
  loadPlan().then(() => {
    import('./theme.js')
      .catch(error => console.error('Error loading theme module:', error));
  });
});

