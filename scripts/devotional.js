const container = document.getElementById('devotional-container');

// Step 1: Get today's date
const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

async function loadDevotional() {
  container.innerHTML = '<p>Loading...</p>';

  // Step 2: Get selected file path from server
  const selectedRes = await fetch('/api/selected-devotional');
  const { file_path } = await selectedRes.json();

  if (!file_path) {
    container.innerHTML = '<p>No devotional selected.</p>';
    return;
  }

  // Step 3: Construct public Supabase Storage URL
  const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || import.meta.env?.NEXT_PUBLIC_SUPABASE_URL;
  const fileUrl = `${supabaseUrl}/storage/v1/object/public/devotionals/${file_path}`;

  // Step 4: Fetch JSON file
  const response = await fetch(fileUrl);
  const json = await response.json();

  // Step 5: Find devotional for today
  const entry = json.find(d => d.date === today);
  if (!entry) {
    container.innerHTML = `<p>No entry found for today (${today}).</p>`;
    return;
  }

  // Step 6: Render devotional
  container.innerHTML = `
    <h2>${entry.title || today}</h2>
    <p><strong>Scripture:</strong> ${entry.scripture || ''}</p>
    <p>${entry.content || ''}</p>
    <hr />
    <p><strong>Reflection:</strong> ${entry.reflection || ''}</p>
    <p><strong>Prayer:</strong> ${entry.prayer || ''}</p>
  `;
}

loadDevotional();
