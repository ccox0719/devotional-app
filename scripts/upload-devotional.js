import Papa from 'https://cdn.jsdelivr.net/npm/papaparse@5.4.1/+esm';

const csvInput = document.getElementById('csvInput');
const uploadBtn = document.getElementById('uploadBtn');
const status = document.getElementById('status');

uploadBtn.addEventListener('click', async () => {
  const file = csvInput.files[0];
  if (!file) {
    status.textContent = 'Please select a CSV file.';
    return;
  }

  status.textContent = 'Parsing CSV...';

  const reader = new FileReader();
  reader.onload = async (e) => {
    const csv = e.target.result;
    const parsed = Papa.parse(csv, {
      header: true,
      skipEmptyLines: true
    });

    const json = parsed.data;
    const filename = `${file.name.replace('.csv', '')}-${Date.now()}.json`;

    // Step 1: Upload to Supabase Storage
    status.textContent = 'Uploading...';
    const uploadRes = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename, content: json })
    });

    const uploadData = await uploadRes.json();
    if (!uploadRes.ok) {
      status.textContent = `Upload failed: ${uploadData.error}`;
      return;
    }

    // Step 2: Set as current devotional
    const selectRes = await fetch('/api/select-devotional', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_path: uploadData.path })
    });

    if (!selectRes.ok) {
      const selectErr = await selectRes.json();
      status.textContent = `Failed to set selected: ${selectErr.error}`;
      return;
    }

    status.textContent = 'Upload successful! Devotional is now active.';
  };

  reader.readAsText(file);
});
