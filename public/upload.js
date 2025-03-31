import { parseCSV } from './csvParser.js';
import supabase from './utils/supabaseClient.js';

document.addEventListener('DOMContentLoaded', async () => {
  // DOM fully loaded – no authentication check

  // Select DOM elements
  const uploadButton = document.getElementById('upload-plan');
  const titleInput = document.getElementById('title-input');
  const subtitleInput = document.getElementById('subtitle-input');
  const tagsInput = document.getElementById('tags-input');
  const accentColorPicker = document.getElementById('accent-color-picker');
  const logoInput = document.getElementById('logo-upload');
  const csvInput = document.getElementById('csv-upload');
  const logoPreview = document.getElementById('logo-preview');
  const setActiveBtn = document.getElementById('set-active');
  const planList = document.getElementById('plan-list');

  let uploadedPlanId = null;

  // Logo file preview
  if (logoInput && logoPreview) {
    logoInput.addEventListener('change', function () {
      const file = this.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function (e) {
        logoPreview.src = e.target.result;
        logoPreview.style.display = 'block';
        console.log("Logo preview loaded");
      };
      reader.readAsDataURL(file);
    });
  } else {
    console.warn("Logo upload or preview element not found.");
  }

  // CSV file change listener (for logging purposes only)
  csvInput.addEventListener('change', async (event) => {
    const csvFile = event.target.files[0];
    if (!csvFile) return;
    const text = await csvFile.text();
    const parsedData = parseCSV(text);
    if (!parsedData || parsedData.length === 0) {
      alert('❌ Failed to parse CSV. Check formatting.');
    } else {
      console.log('✅ CSV parsed and ready for upload.');
    }
  });

  // Upload plan when the button is clicked
  uploadButton.addEventListener('click', async () => {
    uploadButton.disabled = true;
    uploadButton.textContent = 'Uploading...';

    try {
      const title = titleInput.value.trim();
      const subtitle = subtitleInput.value.trim();
      const tags = tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      const accentColor = accentColorPicker.value;
      const logoFile = logoInput.files[0];
      const csvFile = csvInput.files[0];

      if (!title || !subtitle || !csvFile) {
        alert('Please enter title, subtitle, and upload a CSV file.');
        uploadButton.disabled = false;
        uploadButton.textContent = 'Upload Plan';
        return;
      }

      let logoUrl = null;
      if (logoFile) {
        if (logoFile.size > 1024 * 1024) { // Ensure logo is under 1MB
          alert('Logo file must be under 1MB.');
          uploadButton.disabled = false;
          uploadButton.textContent = 'Upload Plan';
          return;
        }
        logoUrl = await uploadLogo(logoFile);
      }

      const csvText = await csvFile.text();
      const data = parseCSV(csvText);

      // Insert plan without authentication details
      const { data: insertData, error: insertError } = await supabase
        .from('devotional_plans')
        .insert({
          title,
          subtitle,
          tags,
          accentColor,
          logo_url: logoUrl,
          data
        });

      if (insertError) {
        throw insertError;
      }

      const insertedPlan = insertData[0];
      alert(`✅ Plan uploaded successfully! Plan ID: ${insertedPlan.id}`);

      // Reset form fields
      titleInput.value = '';
      subtitleInput.value = '';
      tagsInput.value = '';
      accentColorPicker.value = '#f97316';
      logoInput.value = '';
      csvInput.value = '';
      logoPreview.src = '';
      uploadedPlanId = insertedPlan.id;

      loadPlanList();
    } catch (err) {
      console.error('Upload error:', err);
      alert('Something went wrong during upload.');
    } finally {
      uploadButton.disabled = false;
      uploadButton.textContent = 'Upload Plan';
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
      // Upsert the active plan without user authentication info
      const { data: upsertData, error: upsertError } = await supabase
        .from('active_plan')
        .upsert({
          plan_id: planId
        });
      if (upsertError) {
        throw upsertError;
      }
      alert('✅ Active plan updated.');
    } catch (err) {
      console.error(err);
      alert('❌ Could not set active plan.');
    }
  });

  async function loadPlanList() {
    // Load all plans without filtering by user
    const { data: plans, error } = await supabase
      .from('devotional_plans')
      .select('id, title');
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

  loadPlanList();
});