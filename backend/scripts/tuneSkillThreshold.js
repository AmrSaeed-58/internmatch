// Tunes the cosine-similarity threshold used by skillResolver.findOrCreateSkill.
// Builds a labeled test set of skill-name pairs, computes their similarity, and
// reports precision / recall / F1 at every candidate threshold so we can pick
// the best one.
//
// Usage: node scripts/tuneSkillThreshold.js
require('dotenv').config();
const { generateEmbedding, cosineSimilarity } = require('../src/utils/embeddingService');

// Each pair is (a, b, expectedSame).
// `true`  = the two names should resolve to the same canonical skill.
// `false` = they should remain distinct skills.
const PAIRS = [
  // ── true positives we want to catch ──
  ['JS', 'JavaScript', true],
  ['TS', 'TypeScript', true],
  ['Py', 'Python', true],
  ['ML', 'Machine Learning', true],
  ['AI', 'Artificial Intelligence', true],
  ['NLP', 'Natural Language Processing', true],
  ['K8s', 'Kubernetes', true],
  ['Postgres', 'PostgreSQL', true],
  ['PSQL', 'PostgreSQL', true],
  ['Photoshop', 'Adobe Photoshop', true],
  ['Illustrator', 'Adobe Illustrator', true],
  ['InDesign', 'Adobe InDesign', true],
  ['After Effects', 'Adobe After Effects', true],
  ['Premiere', 'Adobe Premiere Pro', true],
  ['UI Design', 'User Interface Design', true],
  ['UX Design', 'User Experience Design', true],
  ['UX Research', 'User Experience Research', true],
  ['User Interviews', 'UX Research', true],
  ['Usability Testing', 'UX Research', true],
  ['Visual Hierarchy', 'Visual Design Principles', true],
  ['Spark', 'Apache Spark', true],
  ['Kafka', 'Apache Kafka', true],
  ['TF', 'TensorFlow', true],
  ['PyTorch', 'Pytorch', true],
  ['Node', 'Node.js', true],
  ['JavaScript', 'Javscript', true], // typo
  ['Tailwind', 'Tailwind CSS', true],
  ['Excel', 'Microsoft Excel', true],
  ['Word', 'Microsoft Word', true],

  // ── true negatives we must NOT collapse ──
  ['Java', 'JavaScript', false],
  ['React', 'React Native', false],
  ['Vue', 'Vue Native', false],
  ['Angular', 'AngularJS', false], // genuinely different framework families
  ['C', 'C++', false],
  ['C++', 'C#', false],
  ['Photoshop', 'Adobe Illustrator', false],
  ['Figma', 'Sketch', false],
  ['UI Design', 'UX Design', false], // related but distinct disciplines
  ['Machine Learning', 'Deep Learning', false], // overlap, but treated separately
  ['Frontend', 'Backend', false],
  ['SQL', 'NoSQL', false],
  ['MySQL', 'PostgreSQL', false],
  ['Docker', 'Kubernetes', false],
  ['HTML', 'CSS', false],
  ['Python', 'JavaScript', false],
  ['TensorFlow', 'PyTorch', false],
  ['AWS', 'Azure', false],
  ['Project Management', 'Product Management', false],
  ['Data Analysis', 'Data Engineering', false],
  ['Graphic Design', 'Web Design', false],
  ['English', 'Arabic', false],
];

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set — cannot run tuning.');
    process.exit(1);
  }

  console.log(`Embedding ${PAIRS.length * 2} names (${PAIRS.length} pairs)...`);
  const cache = new Map();
  async function embed(name) {
    if (cache.has(name)) return cache.get(name);
    const v = await generateEmbedding(name);
    cache.set(name, v);
    await new Promise((r) => setTimeout(r, 50));
    return v;
  }

  const scored = [];
  for (const [a, b, expected] of PAIRS) {
    const [va, vb] = [await embed(a), await embed(b)];
    if (!va || !vb) {
      console.warn(`  embed failed: "${a}" or "${b}"`);
      continue;
    }
    const sim = cosineSimilarity(va, vb);
    scored.push({ a, b, expected, sim });
  }

  // Pretty-print all pairs sorted by similarity descending, marking expected.
  console.log('\nAll pairs (sorted by similarity):');
  console.log('   sim    expected   a  ↔  b');
  console.log('  -----  --------  ----------');
  for (const p of [...scored].sort((x, y) => y.sim - x.sim)) {
    console.log(
      `  ${p.sim.toFixed(3)}  ${p.expected ? 'SAME    ' : 'DIFFERENT'}  ${p.a}  ↔  ${p.b}`
    );
  }

  // Sweep thresholds in 0.01 steps and report metrics.
  console.log('\nThreshold sweep:');
  console.log('  threshold  precision  recall   F1     misses                                      false-merges');
  console.log('  ---------  ---------  ------  ------ -------------------------------------------- --------------------------------------------');

  let best = null;
  for (let t = 0.70; t <= 0.96; t += 0.01) {
    const T = parseFloat(t.toFixed(2));
    let tp = 0, fp = 0, fn = 0, tn = 0;
    const misses = [];
    const falseMerges = [];
    for (const p of scored) {
      const predictSame = p.sim >= T;
      if (predictSame && p.expected) tp += 1;
      else if (predictSame && !p.expected) { fp += 1; falseMerges.push(`${p.a}↔${p.b}`); }
      else if (!predictSame && p.expected) { fn += 1; misses.push(`${p.a}↔${p.b}`); }
      else tn += 1;
    }
    const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
    const recall    = tp + fn === 0 ? 0 : tp / (tp + fn);
    const f1        = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

    console.log(
      `  ${T.toFixed(2)}       ${precision.toFixed(2)}       ${recall.toFixed(2)}    ${f1.toFixed(2)}   ` +
      `${misses.slice(0, 3).join(', ').padEnd(44)} ${falseMerges.slice(0, 3).join(', ')}`
    );

    if (!best || f1 > best.f1 || (f1 === best.f1 && precision > best.precision)) {
      best = { T, precision, recall, f1, misses, falseMerges };
    }
  }

  console.log('\n────────────────────────────────────────────────');
  console.log(`Best threshold: ${best.T}`);
  console.log(`  precision: ${best.precision.toFixed(3)}`);
  console.log(`  recall:    ${best.recall.toFixed(3)}`);
  console.log(`  F1:        ${best.f1.toFixed(3)}`);
  console.log(`  misses (${best.misses.length}): ${best.misses.join(', ') || 'none'}`);
  console.log(`  false-merges (${best.falseMerges.length}): ${best.falseMerges.join(', ') || 'none'}`);
  console.log('────────────────────────────────────────────────');
  console.log('Set SKILL_SIMILARITY_THRESHOLD in backend/.env to override the default.');

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
