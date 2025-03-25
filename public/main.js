
// scripts/main.js
import { getEntryForDate } from '/utils/getentry.js';
import { getActivePlan } from '/utils/storage.js';

document.addEventListener('DOMContentLoaded', async () => {
  let fileName = new URLSearchParams(window.location.search).get('plan');

  if (!fileName) {
    fileName = await getActivePlan();
    if (!fileName) {
      document.getElementById('content').innerText = 'No active plan found. Go to Upload page.';
      return;
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const entry = await getEntryForDate(fileName, today);

  if (entry) {
    document.getElementById('plan-title').innerText = entry.title || '';
    document.getElementById('plan-subtitle').innerText = entry.subtitle || '';
    document.getElementById('date-badge').innerHTML = formatDateBadge(today);
    document.getElementById('content').innerText = entry.content;
    document.getElementById('question').innerText = entry.question;
    document.getElementById('prayer').innerText = entry.prayer;
  } else {
    document.getElementById('content').innerText = 'No entry for today.';
  }
});

function formatDateBadge(dateStr) {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();
  return `${day}<br><span>${month}</span>`;
}
