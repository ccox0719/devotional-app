// ✅ Load API Key from `.env`
require("dotenv").config();
const ESV_API_KEY = process.env.ESV_API_KEY;
const ESV_API_URL = "https://api.esv.org/v3/passage/text/";

// ✅ Debugging Log: Check If Key Loads
console.log("🔑 ESV API Key:", ESV_API_KEY ? "Loaded Successfully ✅" : "Not Loaded ❌");
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");  // ✅ Import node-fetch properly

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// ✅ Ensure 'uploads' directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
    console.log("📂 Created 'uploads' directory.");
} else {
    console.log("✅ 'uploads' directory exists.");
}

// ✅ Serve uploaded JSON files
app.use("/uploads", express.static(uploadsDir));

// ✅ Route: Serve `index.html` on root `/`
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ Route: Serve `upload.html` at `/upload`
app.get("/upload", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "upload.html"));
});

// ✅ Route: Get list of uploaded devotionals
app.get("/devotionals", (req, res) => {
    fs.readdir(uploadsDir, (err, files) => {
        if (err) {
            console.error("❌ Error reading devotionals directory:", err);
            return res.status(500).json({ error: "Error reading devotionals directory" });
        }

        const devotionalFiles = files.filter(file => file.endsWith(".json"));
        res.json({ devotionals: devotionalFiles });
    });
});

// ✅ Route: Store selected devotional in `selected.json`
const selectedFilePath = path.join(uploadsDir, "selected.json");

app.post("/select-devotional", (req, res) => {
    try {
        const { fileName } = req.body;
        if (!fileName) return res.status(400).json({ error: "Invalid file name" });

        fs.writeFileSync(selectedFilePath, JSON.stringify({ selected: fileName }));

        console.log(`✅ Selected devotional updated: ${fileName}`);
        res.json({ message: "Selected devotional updated successfully", fileName });
    } catch (error) {
        console.error("❌ Error selecting devotional:", error);
        res.status(500).json({ error: "Failed to update selected devotional" });
    }
});

// ✅ Route: Serve selected devotional JSON file
app.get("/selected-devotional", (req, res) => {
    try {
        if (!fs.existsSync(selectedFilePath)) {
            console.log("⚠️ No devotional selected.");
            return res.json({ selected: null });
        }

        const selectedData = JSON.parse(fs.readFileSync(selectedFilePath, "utf-8"));
        res.json(selectedData);
    } catch (error) {
        console.error("❌ Error retrieving selected devotional:", error);
        res.status(500).json({ error: "Failed to retrieve selected devotional" });
    }
});

// ✅ Route: Serve the selected devotional content
app.get("/devotional-content", (req, res) => {
    try {
        if (!fs.existsSync(selectedFilePath)) {
            return res.status(404).json({ error: "No devotional selected" });
        }

        const selectedData = JSON.parse(fs.readFileSync(selectedFilePath, "utf-8"));
        const devotionalPath = path.join(uploadsDir, selectedData.selected);

        if (!fs.existsSync(devotionalPath)) {
            console.log("⚠️ Selected devotional file not found:", selectedData.selected);
            return res.status(404).json({ error: "Selected devotional file not found" });
        }

        const devotionalData = JSON.parse(fs.readFileSync(devotionalPath, "utf-8"));
        res.json(devotionalData);
    } catch (error) {
        console.error("❌ Error retrieving devotional content:", error);
        res.status(500).json({ error: "Failed to retrieve devotional content" });
    }
});

app.get("/bible", async (req, res) => {
    const passage = req.query.ref;

    console.log("📖 Bible Passage Requested:", passage);

    if (!passage) {
        return res.status(400).json({ error: "Missing passage reference." });
    }

    try {
        const response = await fetch(`${ESV_API_URL}?q=${encodeURIComponent(passage)}`, {
            method: "GET",
            headers: {
                "Authorization": `Token ${ESV_API_KEY}`,
                "Content-Type": "application/json"
            }
        });

        console.log("📡 Sending request to ESV API...");

        if (!response.ok) {
            throw new Error(`ESV API responded with ${response.status}`);
        }

        const data = await response.json();
        console.log("✅ ESV API Response:", data);

        if (!data.passages || data.passages.length === 0) {
            return res.json({ reference: passage, text: "Passage not found." });
        }

        // ✅ Extract passage text
        let passageText = data.passages[0];

        // ✅ Remove **leading reference** (e.g., "John 3:16")
        passageText = passageText.replace(/^.*?\n+/, '');

        // ✅ Remove **duplicate section headings** (ensures only one heading remains)
        passageText = passageText.replace(/^([A-Z][a-z].*?)\n\n+/, '');

        // ✅ Remove **bracketed verse numbers** (e.g., "[16]")
        passageText = passageText.replace(/\[\d+\]/g, '');

        // ✅ Remove **footnote markers** (e.g., "(1)")
        passageText = passageText.replace(/\(\d+\)/g, '');

        // ✅ Remove **"Footnotes" section** (everything after "Footnotes")
        passageText = passageText.replace(/Footnotes.*/s, '');

        // ✅ Trim extra spaces & fix paragraph formatting
        passageText = passageText.replace(/\s+/g, ' ').trim();

        res.json({ reference: passage, text: passageText });

    } catch (error) {
        console.error("❌ Error fetching Bible passage:", error);
        res.status(500).json({ error: "Failed to fetch passage from ESV API" });
    }
});

// ✅ Start Server
app.listen(port, () => {
    console.log(`✅ Server running at http://localhost:${port}`);
});
