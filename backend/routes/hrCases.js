// backend/routes/hrCases.js
import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { getRelatedCasesByCaseNumber } from "../ai/similarity.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

router.get("/related/:caseNumber", async (req, res) => {
  try {
    const filePath = path.join(__dirname, "../mockData.json");
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

export default router;
