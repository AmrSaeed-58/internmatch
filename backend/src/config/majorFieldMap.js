// Map student majors to a primary field plus related fields. The "field"
// strings here MUST match the values employers pick for `employer.industry`.
//
// Student major lookup is case-insensitive, falls back to a substring match
// against the keys (so "B.Sc. Computer Science" still resolves to Computer
// Science), then to UNKNOWN_MAJOR_DEFAULT.
//
// To extend: add a row whose `primary` is one of the industry strings and
// whose `related` is a list of other industries the student might also be a
// good fit for. Order in `related` doesn't matter.

const FIELDS = {
  TECHNOLOGY:  'Technology',
  ENGINEERING: 'Engineering',
  FINANCE:     'Finance',
  HEALTHCARE:  'Healthcare',
  EDUCATION:   'Education',
  MARKETING:   'Marketing',
  DESIGN:      'Design',
  BUSINESS:    'Business',
};

const MAJOR_FIELD_MAP = {
  // ---- Technology / Computing ----
  'Computer Science':            { primary: FIELDS.TECHNOLOGY, related: [FIELDS.ENGINEERING] },
  'Software Engineering':        { primary: FIELDS.TECHNOLOGY, related: [FIELDS.ENGINEERING] },
  'Information Technology':      { primary: FIELDS.TECHNOLOGY, related: [FIELDS.ENGINEERING, FIELDS.BUSINESS] },
  'Information Systems':         { primary: FIELDS.TECHNOLOGY, related: [FIELDS.BUSINESS] },
  'Data Science':                { primary: FIELDS.TECHNOLOGY, related: [FIELDS.ENGINEERING, FIELDS.FINANCE] },
  'Artificial Intelligence':     { primary: FIELDS.TECHNOLOGY, related: [FIELDS.ENGINEERING] },
  'Cybersecurity':               { primary: FIELDS.TECHNOLOGY, related: [FIELDS.ENGINEERING] },
  'Computer Engineering':        { primary: FIELDS.ENGINEERING, related: [FIELDS.TECHNOLOGY] },

  // ---- Engineering (non-computing) ----
  'Mechanical Engineering':      { primary: FIELDS.ENGINEERING, related: [] },
  'Electrical Engineering':      { primary: FIELDS.ENGINEERING, related: [FIELDS.TECHNOLOGY] },
  'Civil Engineering':           { primary: FIELDS.ENGINEERING, related: [] },
  'Chemical Engineering':        { primary: FIELDS.ENGINEERING, related: [] },
  'Industrial Engineering':      { primary: FIELDS.ENGINEERING, related: [FIELDS.BUSINESS] },
  'Architecture':                { primary: FIELDS.ENGINEERING, related: [FIELDS.DESIGN] },
  'Biomedical Engineering':      { primary: FIELDS.ENGINEERING, related: [FIELDS.HEALTHCARE] },

  // ---- Business / Finance ----
  'Business Administration':     { primary: FIELDS.BUSINESS, related: [FIELDS.MARKETING, FIELDS.FINANCE] },
  'Management':                  { primary: FIELDS.BUSINESS, related: [FIELDS.MARKETING] },
  'Accounting':                  { primary: FIELDS.FINANCE, related: [FIELDS.BUSINESS] },
  'Finance':                     { primary: FIELDS.FINANCE, related: [FIELDS.BUSINESS] },
  'Economics':                   { primary: FIELDS.FINANCE, related: [FIELDS.BUSINESS] },
  'Banking':                     { primary: FIELDS.FINANCE, related: [FIELDS.BUSINESS] },

  // ---- Marketing ----
  'Marketing':                   { primary: FIELDS.MARKETING, related: [FIELDS.BUSINESS, FIELDS.DESIGN] },
  'Public Relations':            { primary: FIELDS.MARKETING, related: [FIELDS.BUSINESS] },
  'Communications':              { primary: FIELDS.MARKETING, related: [FIELDS.BUSINESS, FIELDS.EDUCATION] },
  'Advertising':                 { primary: FIELDS.MARKETING, related: [FIELDS.DESIGN, FIELDS.BUSINESS] },

  // ---- Design ----
  'Graphic Design':              { primary: FIELDS.DESIGN, related: [FIELDS.MARKETING] },
  'Interior Design':             { primary: FIELDS.DESIGN, related: [FIELDS.ENGINEERING] },
  'Fashion Design':              { primary: FIELDS.DESIGN, related: [] },
  'Industrial Design':           { primary: FIELDS.DESIGN, related: [FIELDS.ENGINEERING] },

  // ---- Healthcare ----
  'Medicine':                    { primary: FIELDS.HEALTHCARE, related: [] },
  'Nursing':                     { primary: FIELDS.HEALTHCARE, related: [] },
  'Pharmacy':                    { primary: FIELDS.HEALTHCARE, related: [] },
  'Dentistry':                   { primary: FIELDS.HEALTHCARE, related: [] },
  'Public Health':               { primary: FIELDS.HEALTHCARE, related: [FIELDS.EDUCATION] },
  'Biology':                     { primary: FIELDS.HEALTHCARE, related: [FIELDS.EDUCATION] },

  // ---- Education ----
  'Education':                   { primary: FIELDS.EDUCATION, related: [] },
  'Teaching':                    { primary: FIELDS.EDUCATION, related: [] },
  'Early Childhood Education':   { primary: FIELDS.EDUCATION, related: [] },
};

const UNKNOWN_MAJOR_DEFAULT = { primary: null, related: [] };

function resolveMajorFields(major) {
  if (!major || typeof major !== 'string') return UNKNOWN_MAJOR_DEFAULT;
  const trimmed = major.trim();

  if (MAJOR_FIELD_MAP[trimmed]) return MAJOR_FIELD_MAP[trimmed];

  const lower = trimmed.toLowerCase();
  for (const [key, val] of Object.entries(MAJOR_FIELD_MAP)) {
    if (lower === key.toLowerCase()) return val;
  }
  for (const [key, val] of Object.entries(MAJOR_FIELD_MAP)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) {
      return val;
    }
  }
  return UNKNOWN_MAJOR_DEFAULT;
}

function inFieldIndustries(major) {
  const { primary, related } = resolveMajorFields(major);
  return [primary, ...related].filter(Boolean);
}

module.exports = {
  FIELDS,
  MAJOR_FIELD_MAP,
  resolveMajorFields,
  inFieldIndustries,
};
