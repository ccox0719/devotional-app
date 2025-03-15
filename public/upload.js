document.addEventListener("DOMContentLoaded", function () {
    console.log("📤 Upload Page Loaded!");

    const fileInput = document.getElementById("csvFileInput");
    const uploadButton = document.getElementById("uploadJsonButton");
    const jsonOutput = document.getElementById("jsonOutput");
    const devotionalList = document.getElementById("devotionalList");
    const selectButton = document.getElementById("selectDevotional");

    if (!fileInput || !uploadButton || !jsonOutput || !devotionalList || !selectButton) {
        console.error("❌ Missing one or more elements in upload.html");
        return;
    }

    console.log("✅ All required elements found!");

    // ✅ Automatically Convert CSV on Upload
    fileInput.addEventListener("change", () => {
        if (!fileInput.files.length) return;

        const file = fileInput.files[0];
        const reader = new FileReader();

        reader.onload = (e) => {
            const csvData = e.target.result;
            Papa.parse(csvData, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    console.log("✅ CSV Parsed:", results);

                    const devotionals = results.data.map(row => ({
                        date: new Date(row["Date"]).toISOString().split("T")[0],
                        reference: row["Reference"],
                        passage: row["Passage"] || "No passage available",  
                        prompts: {
                            reflective: row["Reflective Question"],
                            prayer: row["Prayer Prompt"]
                        }
                    }));

                    const project = {
                        title: document.getElementById("projectTitle").value,
                        description: document.getElementById("projectDescription").value,
                        tags: document.getElementById("projectTags").value.split(",").map(tag => tag.trim())
                    };

                    jsonOutput.value = JSON.stringify({ project, devotionals }, null, 2);
                },
                error: (err) => alert("Error parsing CSV: " + err)
            });
        };

        reader.readAsText(file);
    });
        // ✅ Route: Upload JSON file to `uploads/`
        app.post("/upload", (req, res) => {
            try {
                const fileName = `devotional-${Date.now()}.json`; // ✅ Unique file name
                const filePath = path.join(uploadsDir, fileName);

                fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2));

                console.log("✅ JSON successfully uploaded:", fileName);
                res.json({ success: true, fileName });
            } catch (error) {
                console.error("❌ Error saving JSON:", error);
                res.status(500).json({ error: "Server error saving JSON" });
            }

    // ✅ Upload JSON File
    uploadButton.addEventListener("click", async () => {
        const jsonString = jsonOutput.value;
        if (!jsonString) {
            alert("No data to upload. Please select a CSV file first.");
            return;
        }

        try {
            const response = await fetch("/upload", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: jsonString
            });

            if (!response.ok) throw new Error(`Server responded with status ${response.status}`);

            const data = await response.json();
            console.log("✅ Upload successful:", data);
            alert("✅ Devotional plan uploaded successfully!");
        } catch (error) {
            console.error("❌ Error uploading JSON:", error.message);
            alert("❌ Error uploading JSON. Check the console for details.");
        }
    });

    // ✅ Load Available Devotionals
    async function loadDevotionalOptions() {
        try {
            const response = await fetch("/devotionals");
            if (!response.ok) throw new Error("Failed to fetch devotionals.");
            
            const data = await response.json();
            devotionalList.innerHTML = "";
    
            // Loop over each devotional file name
            for (const file of data.devotionals) {
                // Exclude the "selected.json" file
                if (file === "selected.json") continue;
    
                try {
                    // Fetch the JSON content for the current devotional file
                    const res = await fetch(`/uploads/${file}`);
                    if (!res.ok) throw new Error(`Failed to load ${file}`);
                    
                    const devotionalData = await res.json();
                    // Use the project title if it exists, otherwise fall back to the filename
                    const title = (devotionalData.project && devotionalData.project.title) || file;
                    
                    const option = document.createElement("option");
                    option.value = file;
                    option.textContent = title;
                    devotionalList.appendChild(option);
                } catch (error) {
                    console.error("Error fetching devotional file", file, error);
                    // Fallback: create an option using the filename
                    const option = document.createElement("option");
                    option.value = file;
                    option.textContent = file;
                    devotionalList.appendChild(option);
                }
            }
        } catch (error) {
            console.error("❌ Error fetching devotional list:", error);
        }
    }
    

    // ✅ Set a Devotional as Active
    selectButton.addEventListener("click", async () => {
        const selectedFile = devotionalList.value;
        if (!selectedFile) {
            alert("Please select a devotional!");
            return;
        }

        try {
            const response = await fetch("/select-devotional", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fileName: selectedFile })
            });

            if (response.ok) {
                alert("✅ Devotional selected successfully!");
            } else {
                alert("❌ Error selecting devotional.");
            }
        } catch (error) {
            console.error("❌ Error selecting devotional:", error);
            alert("❌ Failed to update selection.");
        }
    });

    loadDevotionalOptions();
});

