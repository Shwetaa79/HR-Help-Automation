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
    const { mainCase, related } = await getRelatedCasesByCaseNumber(
      caseNumber,
      cases
    );

    res.json({ mainCase, relatedCases: related });
  } catch (err) {
    console.error("❌ Error in /related route:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
