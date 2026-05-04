const { GoogleGenerativeAI } = require('@google/generative-ai');
const crypto = require('crypto');
const pool = require('../config/db');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004';

async function generateEmbedding(text) {
  if (!process.env.GEMINI_API_KEY) return null;
  try {
    const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
    const result = await model.embedContent(text);
    return result.embedding.values; // Float64Array or number[]
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

async function buildStudentText(studentUserId) {
  const [rows] = await pool.execute(
    `SELECT s.bio, s.university, s.major, s.graduation_year, s.gpa,
            u.full_name, r.extracted_text
     FROM student s
     JOIN users u ON u.user_id = s.user_id
     LEFT JOIN resume r ON r.resume_id = s.primary_resume_id
     WHERE s.user_id = ?`,
    [String(studentUserId)]
  );
  if (rows.length === 0) return '';
  const p = rows[0];

  const [skills] = await pool.execute(
    `SELECT s.display_name, hs.proficiency_level
     FROM has_skill hs JOIN skill s ON s.skill_id = hs.skill_id
     WHERE hs.student_user_id = ?`,
    [String(studentUserId)]
  );

  const parts = [
    p.full_name,
    p.university && `University: ${p.university}`,
    p.major && `Major: ${p.major}`,
    p.gpa && `GPA: ${p.gpa}`,
    p.bio,
    skills.length > 0 && `Skills: ${skills.map((s) => `${s.display_name} (${s.proficiency_level})`).join(', ')}`,
    p.extracted_text && `Resume: ${p.extracted_text.substring(0, 2000)}`,
  ];

  return parts.filter(Boolean).join('. ');
}

async function buildInternshipText(internshipId) {
  const [rows] = await pool.execute(
    `SELECT i.title, i.description, i.location, i.work_type,
            e.company_name, e.industry
     FROM internship i
     JOIN employer e ON e.user_id = i.employer_user_id
     WHERE i.internship_id = ?`,
    [String(internshipId)]
  );
  if (rows.length === 0) return '';
  const i = rows[0];

  const [skills] = await pool.execute(
    `SELECT s.display_name, rs.required_level, rs.is_mandatory
     FROM requires_skill rs JOIN skill s ON s.skill_id = rs.skill_id
     WHERE rs.internship_id = ?`,
    [String(internshipId)]
  );

  const parts = [
    i.title,
    i.company_name && `Company: ${i.company_name}`,
    i.industry && `Industry: ${i.industry}`,
    i.description,
    i.location && `Location: ${i.location}`,
    i.work_type && `Work type: ${i.work_type}`,
    skills.length > 0 && `Required skills: ${skills.map((s) => `${s.display_name} (${s.required_level}, ${s.is_mandatory ? 'mandatory' : 'optional'})`).join(', ')}`,
  ];

  return parts.filter(Boolean).join('. ');
}

function hashText(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

async function updateStudentEmbedding(studentUserId) {
  try {
    const text = await buildStudentText(studentUserId);
    if (!text) return;

    const textHash = hashText(text);

    // Skip if hash unchanged
    const [existing] = await pool.execute(
      'SELECT source_text_hash FROM student_embedding WHERE student_user_id = ?',
      [String(studentUserId)]
    );
    if (existing.length > 0 && existing[0].source_text_hash === textHash) return;

    const embedding = await generateEmbedding(text);
    if (!embedding) return;

    await pool.execute(
      `INSERT INTO student_embedding (student_user_id, embedding, source_text_hash, model_name, dimensions)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE embedding = VALUES(embedding), source_text_hash = VALUES(source_text_hash),
         model_name = VALUES(model_name), dimensions = VALUES(dimensions)`,
      [String(studentUserId), JSON.stringify(embedding), textHash, EMBEDDING_MODEL, embedding.length]
    );
  } catch (err) {
    console.error('[embeddingService] updateStudentEmbedding failed:', err.message);
  }
}

async function updateInternshipEmbedding(internshipId) {
  try {
    const text = await buildInternshipText(internshipId);
    if (!text) return;

    const textHash = hashText(text);

    const [existing] = await pool.execute(
      'SELECT source_text_hash FROM internship_embedding WHERE internship_id = ?',
      [String(internshipId)]
    );
    if (existing.length > 0 && existing[0].source_text_hash === textHash) return;

    const embedding = await generateEmbedding(text);
    if (!embedding) return;

    await pool.execute(
      `INSERT INTO internship_embedding (internship_id, embedding, source_text_hash, model_name, dimensions)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE embedding = VALUES(embedding), source_text_hash = VALUES(source_text_hash),
         model_name = VALUES(model_name), dimensions = VALUES(dimensions)`,
      [String(internshipId), JSON.stringify(embedding), textHash, EMBEDDING_MODEL, embedding.length]
    );
  } catch (err) {
    console.error('[embeddingService] updateInternshipEmbedding failed:', err.message);
  }
}

async function getStudentEmbedding(studentUserId) {
  const [rows] = await pool.execute(
    'SELECT embedding FROM student_embedding WHERE student_user_id = ?',
    [String(studentUserId)]
  );
  if (rows.length === 0) return null;
  const parsed = typeof rows[0].embedding === 'string' ? JSON.parse(rows[0].embedding) : rows[0].embedding;
  return parsed;
}

async function getInternshipEmbedding(internshipId) {
  const [rows] = await pool.execute(
    'SELECT embedding FROM internship_embedding WHERE internship_id = ?',
    [String(internshipId)]
  );
  if (rows.length === 0) return null;
  const parsed = typeof rows[0].embedding === 'string' ? JSON.parse(rows[0].embedding) : rows[0].embedding;
  return parsed;
}

async function computeSemanticScore(studentUserId, internshipId) {
  const [studentEmb, internshipEmb] = await Promise.all([
    getStudentEmbedding(studentUserId),
    getInternshipEmbedding(internshipId),
  ]);
  if (!studentEmb || !internshipEmb) return null;
  const sim = cosineSimilarity(studentEmb, internshipEmb);
  // Normalize from [-1, 1] to [0, 100]
  return Math.round(Math.max(0, sim) * 100);
}

module.exports = {
  generateEmbedding,
  cosineSimilarity,
  updateStudentEmbedding,
  updateInternshipEmbedding,
  getStudentEmbedding,
  getInternshipEmbedding,
  computeSemanticScore,
};
