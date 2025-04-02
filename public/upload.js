import { parseCSV } from './csvParser.js';
import supabase from './utils/supabaseClient.js';
import { checkAuth, subscribeToAuthChanges } from './auth.js';

console.log('upload.js loaded'); // Log at file load

// Function to upload logo to the "logos" storage bucket and return its public URL.
async function uploadLogo(file) {
  // Create a unique filename
  const fileName = `${Date.now()}_${file.name}`;

  // Upload the file to the "logos" storage bucket.
  const { data, error } = await supabase.storage
    .from('logos')
    .upload(fileName, file);

  if (error) {
    console.error("Error uploading logo:", error);
    throw error;
  }
  console.log('uploadLogo is defined:', uploadLogo);

  // Retrieve the public URL of the uploaded file.
  const { publicURL, error: urlError } = supabase.storage
    .from('logos')
    .getPublicUrl(fileName);

  if (urlError) {
    console.error("Error getting public URL:", urlError);
    throw urlError;
  }

  return publicURL;
}

document.addEventListener('DOMContentLoaded', async () => {
  const user = await checkAuth();
  if (!user) return; // Redirection is handled in checkAuth

  // Listen for auth state changes (optional but recommended)
  subscribeToAuthChanges((event, session) => {
    if (!session) {
      alert('Your session has expired. Please sign in again.');
      window.location.href = 'login.html';
    }
  });

  // Select DOM elements
  const titleInput = document.getElementById('title-input');
  const subtitleInput = document.getElementById('subtitle-input');
  const tagsInput = document.getElementById('tags-input');
  const accentColorPicker = document.getElementById('accent-color-picker');
  const logoInput = document.getElementById('logo-upload');
  const csvInput = document.getElementById('csv-upload');
  const logoPreview = document.getElementById('logo-preview');
  const uploadButton = document.getElementById('upload-plan');
  const planList = document.getElementById('plan-list');
  const setActiveBtn = document.getElementById('set-active');

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

    // Get file references
    const logoFile = logoInput.files[0];
    const csvFile = csvInput.files[0];
    let logoUrl = null;

    // Upload logo if available and valid
    if (logoFile) {
      if (logoFile.size > 1024 * 1024) { // Ensure logo is under 1MB
        alert('Logo file must be under 1MB.');
        uploadButton.disabled = false;
        uploadButton.textContent = 'Upload Plan';
        return;
      }
      console.log('Before calling uploadLogo, uploadLogo =', uploadLogo);
      logoUrl = await uploadLogo(logoFile);
    }

    try {
      const title = titleInput.value.trim();
      const subtitle = subtitleInput.value.trim();
      const tags = tagsInput.value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      const accentColor = accentColorPicker.value;

      if (!title || !subtitle || !csvFile) {
        alert('Please enter title, subtitle, and upload a CSV file.');
        uploadButton.disabled = false;
        uploadButton.textContent = 'Upload Plan';
        return;
      }

      const csvText = await csvFile.text();
      const data = parseCSV(csvText);

      // Build the row object to be inserted
      const newRow = {
        title,
        subtitle,
        tags,
        accentColor,
        logo_url: logoUrl,
        data,
        user_id: user.id
      };
      // Log the row to be inserted for debugging
      console.log('Row to insert:', newRow);

      const { data: insertData, error: insertError } = await supabase
        .from('devotional_plans')
        .insert(newRow)
        .select('*')
        .single();

      // Log the response from the insert
      console.log('Insert response:', { insertData, insertError });

      if (insertError) {
        throw insertError;
      }
      console.log('user.id:', user.id);
      // Since .single() returns the row as an object, no need for [0]
      const insertedPlan = insertData;
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
    console.log('Selected planId:', planId);
    if (!planId) {
      alert('Please select a plan to activate.');
      return;
    }
    try {
      // Upsert the active plan with user_id using conflict resolution on user_id
      const { data: upsertData, error: upsertError } = await supabase
        .from('active_plan')
        .upsert({
          user_id: user.id,
          plan_id: planId
        }, { onConflict: 'user_id' })
        .select('*');
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
    // Load all plans filtered by user_id
    const { data: plans, error } = await supabase
      .from('devotional_plans')
      .select('id, title')
      .eq('user_id', user.id);
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