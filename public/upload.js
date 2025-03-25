
// scripts/upload.js
import { parseCSV, savePlan, setActivePlan } from '/utils/storage.js';
import supabase from '/supabase/client.js';

document.getElementById('csv-upload').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const title = document.getElementById('title-input').value || 'Untitled';
  const subtitle = document.getElementById('subtitle-input').value || '';

  const text = await file.text();
  const entries = parseCSV(text);
  const plan = { title, subtitle, entries };

  await savePlan(plan);
  alert('Plan saved! Now set it active.');
  window.location.href = 'index.html';
});

document.getElementById('set-active').addEventListener('click', async () => {
  const selected = document.querySelector('li[data-filename].selected');
  if (!selected) {
    alert('Select a plan from the list first.');
    return;
  }

  const filename = selected.getAttribute('data-filename');
  await setActivePlan(filename);
  alert(`"${filename}" set as active plan.`);
  window.location.href = 'index.html';
});