// Centralized scoring configuration for the matching engine.
// Edit this file (and restart) to retune weights, level credits, or caps.

const WEIGHTS = {
  mandatory: 60,
  optional:  10,
  major:     10,
  gpa:       10,
  location:  10,
};

// Numeric value of each proficiency / required level. Higher = more skilled.
const LEVEL_VALUE = {
  beginner:     1,
  intermediate: 2,
  advanced:     3,
};

// Credit awarded when student level vs required level differs.
// Index = (requiredLevel - studentLevel). Negative diffs (student is higher)
// always get full credit and never go through this table.
const LEVEL_CREDIT = {
  0: 1.00,  // exact match or student higher
  1: 0.50,  // 1 level lower than required
  2: 0.25,  // 2 levels lower than required
};
// Anything beyond 2 levels => 0 (treated as missing).

// Major-fit ladder against the major->field map.
const MAJOR_FIT = {
  primary: 10,  // student major's primary field === internship industry
  related: 5,   // internship industry IN student major's related fields
  none:    0,   // unrelated (gated out at Stage 1, but kept for safety)
};

// Tiebreak: when two internships score equally, prefer the one with the
// soonest deadline.
const TIEBREAK = 'deadline-asc';

module.exports = {
  WEIGHTS,
  LEVEL_VALUE,
  LEVEL_CREDIT,
  MAJOR_FIT,
  TIEBREAK,
};
