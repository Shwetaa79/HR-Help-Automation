// backend/ai/similarity.js
import { pipeline } from "@xenova/transformers";

let embedder = null;
const embedCache = new Map(); // cache text -> embedding (Float32Array)

/**
 * Initialize embedding model
 */
export async function initModel() {
  if (embedder) return;
  console.log("🧠 Loading embedding model (Xenova/all-MiniLM-L6-v2) ...");
  embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  console.log("✅ Embedding model loaded");
}

/**
 * Get sentence embedding (pooled mean + normalized)
 */
export async function getEmbedding(text) {
  if (!embedder) throw new Error("Model not initialized. Call initModel() first.");
  const key = text.trim().toLowerCase();
  if (embedCache.has(key)) return embedCache.get(key);

  // get embedding
  const output = await embedder(text, { pooling: "mean", normalize: true });

  // Ensure we flatten to a Float32Array
  let vec = output.data ? Array.from(output.data) : Array.from(output[0].data);
  embedCache.set(key, vec);
  return vec;
}

/**
 * Compute cosine similarity between two vectors
 */
function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  const dot = a.reduce((acc, v, i) => acc + v * b[i], 0);
  const magA = Math.sqrt(a.reduce((acc, v) => acc + v * v, 0));
  const magB = Math.sqrt(b.reduce((acc, v) => acc + v * v, 0));
  return magA && magB ? dot / (magA * magB) : 0;
}

export async function getRelatedCasesByCaseNumber(caseNumber, cases, topK = 5) {
  if (!embedder) throw new Error("Model not initialized. Call initModel() first.");

  const found = cases.find(
    (c) => c.caseNumber.toLowerCase() === caseNumber.toLowerCase()
  );
  if (!found) return { mainCase: null, related: [] };

  const mainText = `${found.shortDescription} ${found.longDescription}`;
  const mainVec = await getEmbedding(mainText);

  const scored = await Promise.all(
    cases
      .filter((c) => c.caseNumber !== found.caseNumber)
      .map(async (c) => {
        const text = `${c.shortDescription} ${c.longDescription}`;
        const vec = await getEmbedding(text);
        const sim = cosineSimilarity(mainVec, vec);
        const relevance = isNaN(sim) ? 0 : Math.round(sim * 100);
        return { ...c, similarity: sim, relevance };
      })
  );

  scored.sort((a, b) => b.similarity - a.similarity);
  return { mainCase: found, related: scored.slice(0, topK) };
}
