// Minimal embedding utilities used only by skillResolver.js for synonym
// detection (e.g. recognizing "ReactJS" as the same skill as "React").
//
// The matching engine no longer uses semantic embeddings — it relies on
// deterministic skill-name resolution + the structured signals defined in
// services/matchingEngine.js.

const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004';

async function generateEmbedding(text) {
  if (!process.env.GEMINI_API_KEY) return null;
  try {
    const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (err) {
    console.error('[embeddingService] Gemini embedding failed:', err.message);
    return null;
  }
}

function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

module.exports = {
  generateEmbedding,
  cosineSimilarity,
};
