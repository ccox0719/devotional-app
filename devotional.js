document.addEventListener("DOMContentLoaded", async () => {
    console.log("📖 Devotional script loaded!");
    let currentDate = new Date();

    async function fetchPassage(reference) {
        console.log(`📖 Fetching full passage for: ${reference}`);
        try {
            const response = await fetch(`/bible?ref=${encodeURIComponent(reference)}&include-verse-numbers=false`);
            if (!response.ok) throw new Error("❌ Failed to fetch passage from ESV API.");
            const data = await response.json();
            console.log("✅ API Response:", data); 

            if (!data.text) {
                console.warn("⚠️ API returned no passage text!");
                return "No passage available";
            }
            return data.text;
        } catch (error) {
            console.error("❌ Error fetching passage:", error);
            return "No passage available";
        }
    }

    async function loadDevotional(date) {
        console.log(`📂 Loading devotional for: ${date.toISOString().split("T")[0]}`);
    
        // ✅ Update the date display in the date box
        function updateDateBox(date) {
            const dayElement = document.querySelector(".day");
            const monthElement = document.querySelector(".month");
    
            if (dayElement && monthElement) {
                dayElement.textContent = date.getDate(); // ✅ Sets numeric day (e.g., 13)
                monthElement.textContent = date.toLocaleString("en-US", { month: "short" }).toUpperCase(); // ✅ Formats to "MAR"
            } else {
                console.warn("⚠️ Date elements missing in HTML.");
            }
        }
    
        // ✅ Call function to update date
        updateDateBox(date);
    
        // ✅ Format and update the date display (existing logic)
        function formatDateDisplay(date) {
            return date.toLocaleDateString("en-US", { month: 'long', day: 'numeric' });
        }
    
        const dateElement = document.getElementById("current-date");
        if (dateElement) {
            dateElement.textContent = formatDateDisplay(date);
        } else {
            console.warn("⚠️ Missing #current-date element in index.html");
        }
    
        try {
            // ✅ Fetch selected devotional file
            const response = await fetch("/selected-devotional");
            if (!response.ok) throw new Error("❌ Failed to get selected devotional.");
            const data = await response.json();
    
            if (!data.selected) {
                console.log("⚠️ No devotional selected.");
                return;
            }
            const devotionalFile = data.selected;
            console.log(`📥 Selected Devotional: ${devotionalFile}`);
    
            // ✅ Load devotional content
            const devotionalResponse = await fetch(`/uploads/${devotionalFile}`);
            if (!devotionalResponse.ok) throw new Error("❌ Failed to load devotional content.");
            const devotionalData = await devotionalResponse.json();
            console.log("✅ Devotional JSON Loaded:", devotionalData);
    
            // ✅ Update project title & description
            if (devotionalData.project) {
                const titleElement = document.getElementById("project-title");
                if (titleElement) {
                    titleElement.textContent = devotionalData.project.title || "Untitled Project";
                }
                const descriptionElement = document.getElementById("project-description");
                if (descriptionElement) {
                    descriptionElement.textContent = devotionalData.project.description || "No description available.";
                }
                console.log("✅ Project Data Loaded:", devotionalData.project);
            } else {
                console.warn("⚠️ Project data missing from devotional JSON.");
            }
    
            // ✅ Update the page title if available
            if (devotionalData.project && devotionalData.project.title) {
                document.title = devotionalData.project.title.trim();
                console.log(`📝 Page Title Set To: ${document.title}`);
            } else {
                console.warn("⚠️ No title found in JSON, using default.");
                document.title = "Daily Devotional"; 
            }
    
            // ✅ Find the correct devotional entry for today
            const formattedDate = date.toISOString().split("T")[0];
            const study = devotionalData.devotionals.find(entry => entry.date === formattedDate) || {
                reference: "No study found for this date.",
                passage: "No passage available.",
                prompts: {
                    reflective: "No reflective question available.",
                    prayer: "No prayer prompt available."
                }
            };
    
            // ✅ Fetch the full passage using the reference from the study
            study.passage = await fetchPassage(study.reference);
    
            // ✅ Update the reference element
            const referenceElement = document.getElementById("reference");
            if (referenceElement) {
                referenceElement.textContent = study.reference || "No reference available";
            } else {
                console.warn("⚠️ Missing #reference element in index.html");
            }
    
            // ✅ Update the passage element
            const passageElement = document.getElementById("passage");
            if (passageElement) {
                passageElement.textContent = study.passage;
            } else {
                console.warn("⚠️ Missing #passage element in index.html");
            }
    
            // ✅ Update the reflective prompt
            const reflectionElement = document.getElementById("reflection");
            if (reflectionElement) {
                reflectionElement.textContent = study.prompts.reflective || "No reflective question available";
            }
    
            // ✅ Update the prayer prompt
            const prayerElement = document.getElementById("prayer");
            if (prayerElement) {
                prayerElement.textContent = study.prompts.prayer || "No prayer prompt available";
            }
    
            console.log("✅ Devotional Loaded:", study);
        } catch (error) {
            console.error("❌ Error loading devotional:", error);
        }
    }
    

    // Dark Mode Toggle Setup
    const darkToggle = document.getElementById("darkModeToggle");
    if (!darkToggle) {
        console.error("❌ Dark Mode Toggle Button Not Found!");
    } else {
        if (localStorage.getItem("darkMode") === "enabled") {
            document.body.classList.add("dark-mode");
            console.log("🌙 Dark Mode was enabled from storage");
        }
    
        darkToggle.addEventListener("click", () => {
            document.body.classList.toggle("dark-mode");
            if (document.body.classList.contains("dark-mode")) {
                localStorage.setItem("darkMode", "enabled");
                console.log("🌙 Dark Mode Enabled");
            } else {
                localStorage.removeItem("darkMode");
                console.log("☀️ Light Mode Disabled");
            }
        });
        console.log("✅ Dark mode script loaded successfully!");
    }

    // Edit Button Functionality
    const editButton = document.getElementById("editButton");
    if (editButton) {
        editButton.addEventListener("click", function () {
            window.location.href = "upload.html";
        });
    }

    // Navigation Buttons for previous and next day
    document.getElementById("prev-day")?.addEventListener("click", () => {
        currentDate.setDate(currentDate.getDate() - 1);
        loadDevotional(currentDate);
    });
    document.getElementById("next-day")?.addEventListener("click", () => {
        currentDate.setDate(currentDate.getDate() + 1);
        loadDevotional(currentDate);
    });

    // Load today's devotional when the page loads
    loadDevotional(currentDate);
});
