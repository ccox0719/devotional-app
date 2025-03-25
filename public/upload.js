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

  const { data, error } = await supabase.from('devotional_plans').insert([
    {
      title,
      subtitle,
      data: parsedData,
      tags: tagArray,
    },
  ]);

  if (error) {
    console.error('❌ Supabase insert error:', error);
    alert('❌ Failed to upload plan. See console for details.');
  } else {
    alert(`✅ Plan "${title}" uploaded successfully!`);
    console.log('📦 Supabase insert success:', data);
  }
});
