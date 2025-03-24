import Papa from "https://cdn.jsdelivr.net/npm/papaparse@5.4.1/+esm";

const uploadInput = document.getElementById("csvUpload");
const status = document.getElementById("status");

uploadInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  status.textContent = "Uploading...";

  Papa.parse(file, {
    header: true,
    complete: async (results) => {
      const json = results.data;
      const filename = `devotional-${Date.now()}.json`;

      try {
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename, content: json }),
        });

        if (!uploadRes.ok) throw new Error("Upload failed");

        const selectRes = await fetch("/api/select-devotional", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file_path: `json/${filename}` }),
        });

        if (!selectRes.ok) throw new Error("Selection failed");

        status.textContent = "✅ Upload & selection successful!";
      } catch (err) {
        console.error(err);
        status.textContent = "❌ Upload failed: " + err.message;
      }
    },
    error: (err) => {
      console.error("PapaParse error:", err);
      status.textContent = "❌ CSV parse failed.";
    }
  });
});
