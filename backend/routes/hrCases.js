// backend/routes/hrCases.js
import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { getRelatedCasesByCaseNumber } from "../ai/similarity.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Base route to list all cases
router.get("/", async (req, res) => {
  try {
    const filePath = path.join(__dirname, "../data.json");
    console.log("Attempting to read file:", filePath);
    const data = await fs.readFile(filePath, "utf8");
    const cases = JSON.parse(data);
    res.json({ cases: cases.slice(0, 10) }); // Return first 10 cases
  } catch (err) {
    console.error("❌ Error in base route:", err);
    res.status(500).json({ error: err.message });
  }
});

router.get("/related/:caseNumber", async (req, res) => {
  try {
    const filePath = path.join(__dirname, "../data.json");
    const data = await fs.readFile(filePath, "utf8");
    const cases = JSON.parse(data);

    const { caseNumber } = req.params;
    const searchCaseNumber = caseNumber.toUpperCase();
    const mainCase = cases.find(c => c.ticket_id === searchCaseNumber);
    
    if (!mainCase) {
      return res.status(404).json({ error: "Case not found" });
    }

    // Format main case for frontend
    const formattedMainCase = {
      caseNumber: mainCase.ticket_id,
      shortDescription: mainCase.short_desc,
      longDescription: mainCase.long_desc,
      personAffected: mainCase.reported_for,
      status: mainCase.status,
      priority: mainCase.priority,
      category: mainCase.category,
      assignedGroup: mainCase.assigned_group,
      createdAt: mainCase.created_at,
      submittedBy: mainCase.submitted_by,
      tags: mainCase.tags
    };

    // Get related cases using AI
    const { related } = await getRelatedCasesByCaseNumber(searchCaseNumber, cases);

    // Format related cases
    const formattedRelated = related.map(c => ({
      caseNumber: c.ticket_id,
      shortDescription: c.short_desc,
      longDescription: c.long_desc,
      personAffected: c.reported_for,
      status: c.status,
      priority: c.priority,
      category: c.category,
      assignedGroup: c.assigned_group,
      createdAt: c.created_at,
      submittedBy: c.submitted_by,
      tags: c.tags,
      relevance: c.relevance
    }));

    res.json({ mainCase: formattedMainCase, relatedCases: formattedRelated });
  } catch (err) {
    console.error("❌ Error in /related route:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Return full case details (including solution) by case number
router.get("/:caseNumber", async (req, res) => {
  try {
    const filePath = path.join(__dirname, "../data.json");
    const data = await fs.readFile(filePath, "utf8");
    const cases = JSON.parse(data);

    const { caseNumber } = req.params;
    const searchCaseNumber = caseNumber.toUpperCase();
    const found = cases.find((c) => c.ticket_id === searchCaseNumber);
    if (!found) return res.status(404).json({ error: "Case not found" });

    res.json({ case: found });
  } catch (err) {
    console.error("❌ Error in GET /:caseNumber:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Add or update solution and status for a case and persist to JSON file
router.post("/:caseNumber/solution", async (req, res) => {
  try {
    const { solution_text, status } = req.body;
    if (typeof solution_text !== "string") {
      return res.status(400).json({ error: "solution_text must be a string" });
    }
    if (status && !["Open", "In Progress", "Closed Complete"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const filePath = path.join(__dirname, "../data.json");
    const data = await fs.readFile(filePath, "utf8");
    const cases = JSON.parse(data);

    const { caseNumber } = req.params;
    const searchCaseNumber = caseNumber.toUpperCase();
    const idx = cases.findIndex((c) => c.ticket_id === searchCaseNumber);
    if (idx === -1) return res.status(404).json({ error: "Case not found" });

    // Update solution and status
    cases[idx].solution_text = solution_text;
    if (status) {
      cases[idx].status = status;
    }
    cases[idx].updated_at = new Date().toISOString();

    // Persist back to file (atomic-ish: write to temp then rename)
    const tmpPath = filePath + ".tmp";
    await fs.writeFile(tmpPath, JSON.stringify(cases, null, 2), "utf8");
    await fs.rename(tmpPath, filePath);

    res.json({ case: cases[idx] });
  } catch (err) {
    console.error("❌ Error in POST /:caseNumber/solution:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;


