import { parseCSV } from './csvParser.js';
import supabase from './utils/supabaseClient.js';

document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('csv-upload');
  const titleInput = document.getElementById('title-input');
  const subtitleInput = document.getElementById('subtitle-input');
  const setActiveBtn = document.getElementById('set-active');
  const planList = document.getElementById('plan-list');

  let parsedData = null;
  let uploadedPlanId = null;

  // Handle CSV file selection
  fileInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const text = await file.text();
    parsedData = parseCSV(text);

    if (!parsedData || parsedData.length === 0) {
      alert('❌ Failed to parse CSV. Check formatting.');
      return;
    }

    const title = titleInput.value.trim();
    const subtitle = subtitleInput.value.trim();
    if (!title || !subtitle) {
      alert('Please enter a title and subtitle.');
      return;
    }

    const payload = {
      title,
      subtitle,
      tags: [], // You can add tag input later
      data: parsedData,
    };

    try {
      const response = await fetch('/.netlify/functions/upload-plan', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.error || 'Unknown error.');
      }

      uploadedPlanId = result.id;
      alert(`✅ Uploaded "${title}". Select it below to activate.`);

      loadPlanList();
    } catch (err) {
      console.error(err);
      alert('❌ Upload failed.');
    }
  });

  // Set a plan as active
  setActiveBtn.addEventListener('click', async () => {
    const selected = document.querySelector('input[name="plan"]:checked');
    const planId = selected?.value || uploadedPlanId;

    if (!planId) {
      alert('Please select a plan to activate.');
      return;
    }

    try {
      const response = await fetch('/.netlify/functions/set-active', {
        method: 'POST',
        body: JSON.stringify({ plan_id: planId }),
      });

      if (!response.ok) throw new Error('Failed to set active.');

      alert('✅ Active plan updated.');
    } catch (err) {
      console.error(err);
      alert('❌ Could not set active plan.');
    }
  });

  async function loadPlanList() {
    // NOTE: This still uses anon key on frontend
    const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
    const supabase = createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

    const { data: plans, error } = await supabase.from('devotional_plans').select('id, title');
    if (error) {
      console.error('❌ Failed to load plans', error);
      return;
    }

    planList.innerHTML = '';
    plans.forEach(plan => {
      const li = document.createElement('li');
      li.innerHTML = `
        <label>
          <input type="radio" name="plan" value="${plan.id}" />
          ${plan.title}
        </label>
      `;
      planList.appendChild(li);
    });
  }

  // Load plans on page load
  loadPlanList();
});
