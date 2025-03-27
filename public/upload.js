import { parseCSV } from './csvParser.js';
<<<<<<< HEAD
import { supabase } from './client.js';
=======
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
      'https://sggxzlhpdkqjlepbwdqf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNnZ3h6bGhwZGtxamxlcGJ3ZHFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3NTUwMzMsImV4cCI6MjA1ODMzMTAzM30.qJ3KaJbiV7MAD_wHQhix3EJCJPWAEMYktAyqVocthwI'
);
<link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville&family=Montserrat:wght@700&display=swap" rel="stylesheet" />
>>>>>>> ed346ec (Your commit message)

const fileInput = document.getElementById('csv-upload');
const setActiveButton = document.getElementById('set-active');
const titleInput = document.getElementById('title-input');
const subtitleInput = document.getElementById('subtitle-input');
const tagsInput = document.getElementById('tags-input');
const dropdown = document.getElementById('plan-dropdown');
const activateBtn = document.getElementById('activate-plan');

let parsedData = null;
let uploadedFileName = null;

// Handle file upload and parse CSV
fileInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  uploadedFileName = file.name;
  document.querySelector('.upload-button').textContent = '📤 ' + uploadedFileName;

  const text = await file.text();
  parsedData = parseCSV(text);

  if (!parsedData || parsedData.length === 0) {
    alert('❌ Failed to parse CSV. Please check the format.');
  } else {
    console.log('✅ CSV parsed successfully:', parsedData);
  }
});

// Handle uploading new plan
setActiveButton.addEventListener('click', async () => {
  const title = titleInput.value.trim();
  const subtitle = subtitleInput.value.trim();
  const tags = tagsInput.value;

  if (!parsedData) {
    alert('Please upload a CSV file first.');
    return;
  }
  if (!title || !subtitle) {
    alert('Please enter a title and subtitle.');
    return;
  }

  const tagArray = tags
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const { data: insertResult, error: insertError } = await supabase
    .from('devotional_plans')
    .insert([{ title, subtitle, data: parsedData, tags: tagArray }])
    .select();

  if (insertError || !insertResult || insertResult.length === 0) {
    console.error('❌ Supabase insert error:', insertError);
    alert('❌ Failed to upload plan.');
    return;
  }

  const planId = insertResult[0].id;
  const { error: activeError } = await supabase
    .from('active_plan')
    .upsert({ id: 'singleton', plan_id: planId });

  if (activeError) {
    console.error('❌ Failed to set active plan:', activeError);
    alert('❌ Could not update active plan.');
    return;
  }

  alert(`✅ Plan "${title}" uploaded and set as active.`);
  loadPlansDropdown(); // Refresh dropdown
});

// Load all plans into the dropdown
async function loadPlansDropdown() {
  dropdown.innerHTML = '<option>Loading...</option>';

  const { data: plans, error: fetchError } = await supabase
    .from('devotional_plans')
    .select('id, title');

  const { data: active, error: activeError } = await supabase
    .from('active_plan')
    .select('plan_id')
    .single();

  if (fetchError || !plans) {
    dropdown.innerHTML = '<option>Error loading plans</option>';
    console.error(fetchError);
    return;
  }

  dropdown.innerHTML = '';
  plans.forEach(plan => {
    const option = document.createElement('option');
    option.value = plan.id;
    option.textContent = plan.title;
    if (active?.plan_id === plan.id) {
      option.selected = true;
    }
    dropdown.appendChild(option);
  });
}

// Handle switching the active plan
activateBtn.addEventListener('click', async () => {
  const selectedId = dropdown.value;
  const { error } = await supabase
    .from('active_plan')
    .upsert({ id: 'singleton', plan_id: selectedId });

  if (error) {
    alert('❌ Failed to set active plan.');
    console.error(error);
  } else {
    alert('✅ Active plan updated.');
  }
});

// Run on page load
loadPlansDropdown();
