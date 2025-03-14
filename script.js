document.addEventListener("DOMContentLoaded", () => {
  console.log("Script loaded successfully.");

  const url = "devotionals.json"; // Ensure the file path matches your setup
  let currentDate = new Date();
  let currentContent = {};

  // Helper function to format the date as Month Day (st, nd, rd, th)
  function formatDateWithSuffix(date) {
    const day = date.getDate();
    let suffix = "th";

    if (day === 1 || day === 21 || day === 31) {
      suffix = "st";
    } else if (day === 2 || day === 22) {
      suffix = "nd";
    } else if (day === 3 || day === 23) {
      suffix = "rd";
    }

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const month = monthNames[date.getMonth()];

    return `${month} ${day}${suffix}`;
  }

  // Function to sanitize text (fixes encoding issues)
  function sanitizeText(text) {
    if (!text) return ""; // Handle empty cases

    return text
      .replace(/^\s*[\u200B-\u200F\uFEFF]/g, "") // Remove hidden characters at the start
      .replace(/\u2019/g, "'")  // Curly apostrophe → Straight apostrophe
      .replace(/\u2013|\u2014/g, "-")  // En-dash/Em-dash → Hyphen
      .replace(/\u201C/g, '"')  // Left curly quote → Straight double quote
      .replace(/\u201D/g, '"')  // Right curly quote → Straight double quote
      .replace(/\u2026/g, "...")  // Ellipsis → Three dots
      .trim(); // Remove leading/trailing spaces
  }
  async function fetchBiblePassage(reference) {
    const apiUrl = `https://api.esv.org/v3/passage/text/?q=${encodeURIComponent(reference)}`;
    const apiKey = ESV_API_KEY;  // ✅ Securely use API key from `.env`

    try {
        const response = await fetch(apiUrl, {
            headers: { "Authorization": `Token ${apiKey}` }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.passages ? data.passages[0].trim() : "Passage not found";

    } catch (error) {
        console.error("Error fetching Bible passage:", error.message);
        return "Error fetching passage. Please try again.";
    }
}



function loadDevotional(date) {
  console.log("Loading devotional for date:", date);

  fetch(url)
    .then(response => response.json())
    .then(async (data) => {  // ✅ Mark function as async since we'll use await
      var devotionalsArray = data.devotionals || [];
      const simpleFormattedDate = date.toISOString().split("T")[0];
      console.log("Formatted Date:", simpleFormattedDate);

      const study = devotionalsArray.find(entry => entry.date === simpleFormattedDate) || {
        reference: "No study found for this date.",
        prompts: {
          reflective: "No reflective question available.",
          prayer: "No prayer prompt available."
        }
      };

      currentContent = study;

      // ✅ Fetch passage dynamically from the ESV API
      let passageText = "Loading passage...";
      if (study.reference && study.reference !== "No study found for this date.") {
          passageText = await fetchBiblePassage(study.reference); // Fetch passage from API
      } else {
          passageText = "No passage available.";
      }

      // ✅ Populate the HTML elements with sanitized data
      document.getElementById("reference").textContent = sanitizeText(study.reference);
      document.getElementById("passage").textContent = sanitizeText(passageText);  // ✅ Use fetched passage
      document.getElementById("reflection").textContent = sanitizeText(study.prompts.reflective);
      document.getElementById("prayer").textContent = sanitizeText(study.prompts.prayer);

      // ✅ Display the formatted current date
      document.getElementById("current-date").textContent = formatDateWithSuffix(date);

      // Optional: Update project-level metadata if desired
      if (data.project && data.project.title) {
          // document.getElementById("project-title").textContent = data.project.title;
      }
    })
    .catch(error => console.error("Error loading devotional:", error));
}


  // Navigation Buttons
  document.getElementById("prev-day")?.addEventListener("click", () => {
    currentDate.setDate(currentDate.getDate() - 1);
    loadDevotional(currentDate);
  });

  document.getElementById("next-day")?.addEventListener("click", () => {
    currentDate.setDate(currentDate.getDate() + 1);
    loadDevotional(currentDate);
  });

  // Initial Page Load
  loadDevotional(currentDate);
});
