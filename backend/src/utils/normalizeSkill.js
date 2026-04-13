const canonicalAliases = require('./skillAliases.json');

/**
 * Normalize a skill name for deduplication.
 * Uses canonical alias map first, then safe generic normalization.
 * Does NOT blanket-strip all special characters (preserves C++/C#/F# distinction).
 * @param {string} input - Raw skill name
 * @returns {string} Normalized skill name
 */
function normalizeSkillName(input) {
  const lowered = input.trim().toLowerCase();

  if (canonicalAliases[lowered]) {
    return canonicalAliases[lowered];
  }

  // Safe generic: remove spaces, dots, hyphens, underscores, slashes
  // Preserve + and # (meaningful in C++, C#, F#) — but those are handled above
  return lowered.replace(/[\s.\-_/]/g, '');
}

module.exports = { normalizeSkillName };
