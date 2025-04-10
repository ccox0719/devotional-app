import { parseCSV } from './csvParser.js';
import supabase from './utils/supabaseClient.js';
import { checkAuth, subscribeToAuthChanges } from './auth.js';

console.log('upload.js loaded'); // Log at file load
function normalizeSvgColors(svgText) {
  return svgText.replace(/fill="(#[^"]+|black|#000000)"/gi, 'fill="currentColor"');
}

async function uploadLogo(file) {
  const isSvg = file.name.toLowerCase().endsWith('.svg');

  if (isSvg) {
    const rawSvg = await file.text(); // ✅ read original text
    const svgText = normalizeSvgColors(rawSvg); // ✅ fix fill colors
    console.log("🐇 Normalized SVG:", svgText); // ✅ confirm fix
    return { isSvg: true, content: svgText };
  }

  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `logos/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('logos')
    .upload(filePath, file, {
      contentType: file.type,
      upsert: true
    });

  if (uploadError) {
    console.error("❌ Error uploading logo:", uploadError);
    throw uploadError;
  }

  const { data: publicData } = supabase.storage
    .from('logos')
    .getPublicUrl(filePath);

  return { isSvg: false, content: publicData.publicUrl };
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
  uploadButton.addEventListener('click', async () => {
    uploadButton.disabled = true;
    uploadButton.textContent = 'Uploading...';
  
    try {
      const logoFile = logoInput.files[0];
      const csvFile = csvInput.files[0];
      const title = titleInput.value.trim();
      const subtitle = subtitleInput.value.trim();
      const tags = tagsInput.value.split(',').map(tag => tag.trim()).filter(Boolean);
      const accentColor = accentColorPicker.value;
  
      if (!title || !subtitle || !csvFile) {
        alert('Please enter title, subtitle, and upload a CSV file.');
        return;
      }
  
      const csvText = await csvFile.text();
      const delimiter = csvFile.name.toLowerCase().endsWith('.tsv') ? '\t' : ',';
      const parsedData = parseCSV(csvText, delimiter);
  
      const newRow = {
        title,
        subtitle,
        tags,
        accentColor,
        data: parsedData,
        user_id: user.id
      };
  
      if (logoFile) {
        if (logoFile.size > 1024 * 1024) {
          alert('Logo file must be under 1MB.');
          return;
        }
  
        const logoResult = await uploadLogo(logoFile);
        if (logoResult.isSvg) {
          newRow.logo_svg = logoResult.content;
        } else {
          newRow.logo_url = logoResult.content;
        }
      }
  
      const { data: insertData, error: insertError } = await supabase
        .from('devotional_plans')
        .insert(newRow)
        .select('*')
        .single();
  
      if (insertError) throw insertError;
  
      alert(`✅ Plan uploaded successfully! Plan ID: ${insertData.id}`);
      uploadedPlanId = insertData.id;
  
      // Reset form
      titleInput.value = '';
      subtitleInput.value = '';
      tagsInput.value = '';
      accentColorPicker.value = '#f97316';
      logoInput.value = '';
      csvInput.value = '';
      logoPreview.src = '';
  
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
      window.location.href = 'index.html'; // Redirect to main.html after success
    } catch (err) {
      console.error(err);
      alert('❌ Could not set active plan.');
    }
  });
  const selectTab = document.getElementById('select-tab');
  const uploadTab = document.getElementById('upload-tab');
  const selectSection = document.getElementById('select-section');
  const uploadSection = document.getElementById('upload-section');
  
  selectTab.addEventListener('click', () => {
    selectTab.classList.add('active');
    uploadTab.classList.remove('active');
    selectSection.style.display = 'block';
    uploadSection.style.display = 'none';
  });
  
  uploadTab.addEventListener('click', () => {
    uploadTab.classList.add('active');
    selectTab.classList.remove('active');
    uploadSection.style.display = 'block';
    selectSection.style.display = 'none';
  });
  
  async function loadPlanList() {
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
        <hr style="margin: 0.5rem 0; border: 0; border-top: 1px solid #ccc;" />
      `;
      planList.appendChild(li);
    });
  }
  
  loadPlanList();
});