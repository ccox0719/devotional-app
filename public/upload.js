import { parseCSV } from './csvParser.js';
import supabase from './utils/supabaseClient.js';
import { checkAuth, subscribeToAuthChanges } from './auth.js';

console.log('upload.js loaded');

function normalizeSvgColors(svgText) {
  return svgText.replace(/fill="(#[^"]+|black|#000000)"/gi, 'fill="currentColor"');
}

if (window._uploadJsLoaded) {
  console.log("upload.js already loaded, skipping duplicate execution.");
  return;
} else {
  window._uploadJsLoaded = true;
}

async function uploadLogo(file) {
  const isSvg = file.name.toLowerCase().endsWith('.svg');
  if (isSvg) {
    const rawSvg = await file.text();
    const svgText = normalizeSvgColors(rawSvg);
    console.log("🐇 Normalized SVG:", svgText);
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
  const { data: publicData } = supabase.storage.from('logos').getPublicUrl(filePath);
  return { isSvg: false, content: publicData.publicUrl };
}

document.addEventListener('DOMContentLoaded', async () => {
  const user = await checkAuth();
  if (!user) return;

  subscribeToAuthChanges((event, session) => {
    if (!session) {
      alert('Your session has expired. Please sign in again.');
      window.location.href = 'login.html';
    }
  });

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

  const selectTab = document.getElementById('select-tab');
  const uploadTab = document.getElementById('upload-tab');
  const selectSection = document.getElementById('select-section');
  const uploadSection = document.getElementById('upload-section');

  let uploadedPlanId = null;

if (!setActiveBtn.dataset.listenerAttached) {
  setActiveBtn.dataset.listenerAttached = "true";
  setActiveBtn.addEventListener('click', async () => {
    const selected = document.querySelector('input[name="plan"]:checked');
    const planId = selected?.value || uploadedPlanId;
    if (!planId) {
      alert('Please select a plan to activate.');
      return;
    }

    try {
      const { data: upsertData, error: upsertError } = await supabase
        .from('active_plan')
        .upsert({ user_id: user.id, plan_id: planId }, { onConflict: 'user_id' })
        .select('*');
      if (upsertError) throw upsertError;
      alert('✅ Active plan updated.');
      window.location.href = 'index.html';
    } catch (err) {
      console.error(err);
      alert('❌ Could not set active plan.');
    }
  });
}

  if (!uploadButton.dataset.listenerAttached) {
    uploadButton.dataset.listenerAttached = "true";
    uploadButton.addEventListener('click', async (e) => {
      e.preventDefault();
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
          title, subtitle, tags, accentColor, data: parsedData, user_id: user.id
        };

        if (logoFile) {
          if (logoFile.size > 1024 * 1024) {
            alert('Logo file must be under 1MB.');
            return;
          }

          const logoResult = await uploadLogo(logoFile);
          if (logoResult.isSvg) newRow.logo_svg = logoResult.content;
          else newRow.logo_url = logoResult.content;
        }

        console.log('📝 Final row to insert:', newRow);
        const { data: insertData, error: insertError } = await supabase
          .from('devotional_plans').insert(newRow).select('*').single();

        if (insertError) throw insertError;

        alert(`✅ Plan uploaded successfully! Plan ID: ${insertData.id}`);
        uploadedPlanId = insertData.id;
        csvStatus.textContent = `✅ "${csvFile.name}" uploaded successfully.`;
      csvStatus.style.color = 'limegreen';
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
  }
  const csvStatus = document.getElementById('csv-status');

  csvInput.addEventListener('change', () => {
    const file = csvInput.files[0];
    if (file) {
      csvStatus.textContent = `📄 "${file.name}" selected.`;
      csvStatus.style.color = 'orange';
    } else {
      csvStatus.textContent = '';
    }
  });
  const csvFile = csvInput.files[0];
  if (!setActiveBtn.dataset.listenerAttached) {
    setActiveBtn.dataset.listenerAttached = "true";
    setActiveBtn.addEventListener('click', async () => {
      const selected = document.querySelector('input[name="plan"]:checked');
      const planId = selected?.value || uploadedPlanId;
      if (!planId) return alert('Please select a plan to activate.');

      try {
        const { data, error } = await supabase
          .from('active_plan')
          .upsert({ user_id: user.id, plan_id: planId }, { onConflict: 'user_id' })
          .select('*');
        if (error) throw error;
        alert('✅ Active plan updated.');
        window.location.href = 'index.html';
      } catch (err) {
        console.error(err);
        alert('❌ Could not set active plan.');
      }
    });
  }

  if (selectTab && !selectTab.dataset.listenerAttached) {
    selectTab.dataset.listenerAttached = "true";
    selectTab.addEventListener('click', () => {
      selectTab.classList.add('active');
      uploadTab.classList.remove('active');
      selectSection.style.display = 'block';
      uploadSection.style.display = 'none';
    });
  }

  if (uploadTab && !uploadTab.dataset.listenerAttached) {
    uploadTab.dataset.listenerAttached = "true";
    uploadTab.addEventListener('click', () => {
      uploadTab.classList.add('active');
      selectTab.classList.remove('active');
      uploadSection.style.display = 'block';
      selectSection.style.display = 'none';
    });
  }

  uploadTab.classList.add('active');
  selectTab.classList.remove('active');
  uploadSection.style.display = 'block';
  selectSection.style.display = 'none';

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