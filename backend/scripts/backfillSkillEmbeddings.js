// One-shot: embed every skill row that doesn't already have an embedding.
// Run once after the migration: node scripts/backfillSkillEmbeddings.js
require('dotenv').config();
const pool = require('../src/config/db');
const { generateEmbedding } = require('../src/utils/embeddingService');

async function main() {
  const [rows] = await pool.execute(
    'SELECT skill_id, display_name FROM skill WHERE name_embedding IS NULL ORDER BY skill_id'
  );
  if (rows.length === 0) {
    console.log('All skills already have embeddings.');
    process.exit(0);
  }
  console.log(`Embedding ${rows.length} skill(s)...`);

  // Free tier is 100 req/min for embeddings — pace at ~80/min (≈ 750ms apart)
  // and retry once on 429 with a 60s sleep.
  let done = 0;
  let failed = 0;
  for (const row of rows) {
    let emb = await generateEmbedding(row.display_name);
    if (!emb) {
      // back off and retry once
      console.warn(`  rate-limited at #${row.skill_id} — sleeping 65s`);
      await new Promise((r) => setTimeout(r, 65000));
      emb = await generateEmbedding(row.display_name);
    }
    if (!emb) {
      console.warn(`  skipped #${row.skill_id} "${row.display_name}"`);
      failed += 1;
      continue;
    }
    await pool.execute(
      'UPDATE skill SET name_embedding = ? WHERE skill_id = ?',
      [JSON.stringify(emb), row.skill_id]
    );
    done += 1;
    if (done % 25 === 0) console.log(`  ...${done}/${rows.length}`);
    await new Promise((r) => setTimeout(r, 750));
  }

  console.log(`Done. Embedded ${done}, failed ${failed}.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
