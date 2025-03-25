import { parseCSV } from './csvParser.js';
import { supabase } from './client.js';

const fileInput = document.getElementById('csv-upload');
const setActiveButton = document.getElementById('set-active');
const titleInput = document.getElementById('title-input');
const subtitleInput = document.getElementById('subtitle-input');
const tagsInput = document.getElementById('tags-input');

let parsedData = null;
let uploadedFileName = null;

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
    .insert([
      {
        title,
        subtitle,
        data: parsedData,
        tags: tagArray,
      },
    ])
    .select(); // Return the inserted row
  
  if (insertError || !insertResult || insertResult.length === 0) {
    console.error('❌ Supabase insert error:', insertError);
    alert('❌ Failed to upload plan. See console for details.');
    return;
  }
  
  // ✅ Get the new plan ID
// After inserting new plan
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
  window.location.href = 'index.html';
  
});
