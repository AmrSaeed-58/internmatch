const pool = require('../config/db');
const { normalizeSkillName } = require('./normalizeSkill');
const { generateEmbedding, cosineSimilarity } = require('./embeddingService');

// Threshold above which two skill names are treated as the same skill.
// 0.81 was the highest-precision setting (zero false merges) on the labeled
// test set in scripts/tuneSkillThreshold.js. Lower values catch more synonyms
// but start collapsing distinct skills like React/React Native at 0.74-.
const SIMILARITY_THRESHOLD = parseFloat(
  process.env.SKILL_SIMILARITY_THRESHOLD || '0.81'
);

// In-memory cache of all skill embeddings so we don't re-parse JSON on every
// insert. Invalidated whenever we insert a new skill row through this module.
let skillCache = null;

async function loadSkillCache(executor) {
  const [rows] = await executor.execute(
    'SELECT skill_id, display_name, normalized_name, category, name_embedding FROM skill'
  );
  skillCache = rows.map((r) => ({
    skillId: r.skill_id,
    displayName: r.display_name,
    normalizedName: r.normalized_name,
    category: r.category,
    embedding: r.name_embedding
      ? (typeof r.name_embedding === 'string' ? JSON.parse(r.name_embedding) : r.name_embedding)
      : null,
  }));
}

function invalidateCache() {
  skillCache = null;
}

async function getCache(executor) {
  if (!skillCache) await loadSkillCache(executor);
  return skillCache;
}

/**
 * Find an existing skill that semantically matches `name`, or create a new one.
 * Resolution order:
 *   1. Exact normalized-name match (free, deterministic).
 *   2. Cosine similarity ≥ threshold against existing skill embeddings.
 *   3. Insert as a brand-new skill with its own embedding stored.
 *
 * `executor` may be a pool or a transactional connection. The embedding step
 * uses the global pool (read-only), but the INSERT respects the executor.
 *
 * @returns {Promise<{ skillId: number, displayName: string, isNew: boolean, matchedVia: 'exact' | 'semantic' | 'created', similarity?: number }>}
 */
async function findOrCreateSkill(executor, rawName, category = 'other') {
  if (!rawName || typeof rawName !== 'string') {
    throw new Error('findOrCreateSkill: rawName is required');
  }
  const displayName = rawName.trim();
  const normalized = normalizeSkillName(displayName);

  // ── Step 1: exact normalized match ──
  const [exactRows] = await executor.execute(
    'SELECT skill_id, display_name FROM skill WHERE normalized_name = ?',
    [normalized]
  );
  if (exactRows.length > 0) {
    return {
      skillId: exactRows[0].skill_id,
      displayName: exactRows[0].display_name,
      isNew: false,
      matchedVia: 'exact',
    };
  }

  // ── Step 2: semantic match against existing skill embeddings ──
  const newEmbedding = await generateEmbedding(displayName);
  if (newEmbedding) {
    const cache = await getCache(executor);
    let bestMatch = null;
    for (const s of cache) {
      if (!s.embedding) continue;
      const sim = cosineSimilarity(newEmbedding, s.embedding);
      if (sim >= SIMILARITY_THRESHOLD && (!bestMatch || sim > bestMatch.sim)) {
        bestMatch = { skill: s, sim };
      }
    }
    if (bestMatch) {
      return {
        skillId: bestMatch.skill.skillId,
        displayName: bestMatch.skill.displayName,
        isNew: false,
        matchedVia: 'semantic',
        similarity: bestMatch.sim,
      };
    }
  }

  // ── Step 3: insert as a new skill (with embedding cached on the row) ──
  const [inserted] = await executor.execute(
    'INSERT INTO skill (display_name, normalized_name, category, name_embedding) VALUES (?, ?, ?, ?)',
    [displayName, normalized, category, newEmbedding ? JSON.stringify(newEmbedding) : null]
  );
  invalidateCache();
  return {
    skillId: inserted.insertId,
    displayName,
    isNew: true,
    matchedVia: 'created',
  };
}

module.exports = {
  findOrCreateSkill,
  invalidateCache,
  SIMILARITY_THRESHOLD,
  // Exported for the tuning script.
  _internal: { loadSkillCache, getCache },
};
