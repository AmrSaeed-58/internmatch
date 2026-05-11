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
  OTHER:       'Other',
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
  'Machine Learning':            { primary: FIELDS.TECHNOLOGY, related: [FIELDS.ENGINEERING, FIELDS.FINANCE] },
  'Game Development':            { primary: FIELDS.TECHNOLOGY, related: [FIELDS.DESIGN] },
  'Computer Engineering':        { primary: FIELDS.ENGINEERING, related: [FIELDS.TECHNOLOGY] },

  // ---- Engineering (non-computing) ----
  'Mechanical Engineering':      { primary: FIELDS.ENGINEERING, related: [] },
  'Electrical Engineering':      { primary: FIELDS.ENGINEERING, related: [FIELDS.TECHNOLOGY] },
  'Civil Engineering':           { primary: FIELDS.ENGINEERING, related: [] },
  'Chemical Engineering':        { primary: FIELDS.ENGINEERING, related: [] },
  'Industrial Engineering':      { primary: FIELDS.ENGINEERING, related: [FIELDS.BUSINESS] },
  'Architecture':                { primary: FIELDS.ENGINEERING, related: [FIELDS.DESIGN] },
  'Biomedical Engineering':      { primary: FIELDS.ENGINEERING, related: [FIELDS.HEALTHCARE] },
  'Aerospace Engineering':       { primary: FIELDS.ENGINEERING, related: [FIELDS.TECHNOLOGY] },
  'Environmental Engineering':   { primary: FIELDS.ENGINEERING, related: [FIELDS.HEALTHCARE] },
  'Materials Engineering':       { primary: FIELDS.ENGINEERING, related: [FIELDS.TECHNOLOGY] },
  'Petroleum Engineering':       { primary: FIELDS.ENGINEERING, related: [] },
  'Mechatronics Engineering':    { primary: FIELDS.ENGINEERING, related: [FIELDS.TECHNOLOGY] },

  // ---- Mathematics & Sciences ----
  'Mathematics':                 { primary: FIELDS.TECHNOLOGY, related: [FIELDS.FINANCE, FIELDS.EDUCATION] },
  'Statistics':                  { primary: FIELDS.FINANCE, related: [FIELDS.TECHNOLOGY, FIELDS.BUSINESS] },
  'Physics':                     { primary: FIELDS.ENGINEERING, related: [FIELDS.EDUCATION, FIELDS.TECHNOLOGY] },
  'Chemistry':                   { primary: FIELDS.HEALTHCARE, related: [FIELDS.ENGINEERING, FIELDS.EDUCATION] },
  'Biochemistry':                { primary: FIELDS.HEALTHCARE, related: [FIELDS.EDUCATION] },
  'Biotechnology':               { primary: FIELDS.HEALTHCARE, related: [FIELDS.TECHNOLOGY] },
  'Environmental Science':       { primary: FIELDS.HEALTHCARE, related: [FIELDS.EDUCATION, FIELDS.ENGINEERING] },
  'Geology':                     { primary: FIELDS.ENGINEERING, related: [FIELDS.EDUCATION] },
  'Astronomy':                   { primary: FIELDS.EDUCATION, related: [FIELDS.ENGINEERING] },

  // ---- Business / Finance ----
  'Business Administration':     { primary: FIELDS.BUSINESS, related: [FIELDS.MARKETING, FIELDS.FINANCE] },
  'Management':                  { primary: FIELDS.BUSINESS, related: [FIELDS.MARKETING] },
  'Accounting':                  { primary: FIELDS.FINANCE, related: [FIELDS.BUSINESS] },
  'Finance':                     { primary: FIELDS.FINANCE, related: [FIELDS.BUSINESS] },
  'Economics':                   { primary: FIELDS.FINANCE, related: [FIELDS.BUSINESS] },
  'Banking':                     { primary: FIELDS.FINANCE, related: [FIELDS.BUSINESS] },
  'Human Resources':             { primary: FIELDS.BUSINESS, related: [FIELDS.EDUCATION] },
  'Supply Chain Management':     { primary: FIELDS.BUSINESS, related: [FIELDS.ENGINEERING] },
  'Entrepreneurship':            { primary: FIELDS.BUSINESS, related: [FIELDS.MARKETING, FIELDS.FINANCE] },
  'International Business':      { primary: FIELDS.BUSINESS, related: [FIELDS.MARKETING, FIELDS.FINANCE] },
  'Actuarial Science':           { primary: FIELDS.FINANCE, related: [FIELDS.TECHNOLOGY] },

  // ---- Marketing ----
  'Marketing':                   { primary: FIELDS.MARKETING, related: [FIELDS.BUSINESS, FIELDS.DESIGN] },
  'Public Relations':            { primary: FIELDS.MARKETING, related: [FIELDS.BUSINESS] },
  'Communications':              { primary: FIELDS.MARKETING, related: [FIELDS.BUSINESS, FIELDS.EDUCATION] },
  'Advertising':                 { primary: FIELDS.MARKETING, related: [FIELDS.DESIGN, FIELDS.BUSINESS] },
  'Journalism':                  { primary: FIELDS.MARKETING, related: [FIELDS.EDUCATION] },
  'Media Studies':               { primary: FIELDS.MARKETING, related: [FIELDS.DESIGN] },
  'Film & Television':           { primary: FIELDS.MARKETING, related: [FIELDS.DESIGN] },

  // ---- Design ----
  'Graphic Design':              { primary: FIELDS.DESIGN, related: [FIELDS.MARKETING] },
  'Interior Design':             { primary: FIELDS.DESIGN, related: [FIELDS.ENGINEERING] },
  'Fashion Design':              { primary: FIELDS.DESIGN, related: [] },
  'Industrial Design':           { primary: FIELDS.DESIGN, related: [FIELDS.ENGINEERING] },
  'Fine Arts':                   { primary: FIELDS.DESIGN, related: [FIELDS.EDUCATION] },
  'Music':                       { primary: FIELDS.DESIGN, related: [FIELDS.EDUCATION, FIELDS.MARKETING] },
  'Theater':                     { primary: FIELDS.DESIGN, related: [FIELDS.EDUCATION, FIELDS.MARKETING] },
  'Photography':                 { primary: FIELDS.DESIGN, related: [FIELDS.MARKETING] },
  'Animation':                   { primary: FIELDS.DESIGN, related: [FIELDS.TECHNOLOGY, FIELDS.MARKETING] },

  // ---- Healthcare ----
  'Medicine':                    { primary: FIELDS.HEALTHCARE, related: [] },
  'Nursing':                     { primary: FIELDS.HEALTHCARE, related: [] },
  'Pharmacy':                    { primary: FIELDS.HEALTHCARE, related: [] },
  'Dentistry':                   { primary: FIELDS.HEALTHCARE, related: [] },
  'Public Health':               { primary: FIELDS.HEALTHCARE, related: [FIELDS.EDUCATION] },
  'Biology':                     { primary: FIELDS.HEALTHCARE, related: [FIELDS.EDUCATION] },
  'Physical Therapy':            { primary: FIELDS.HEALTHCARE, related: [] },
  'Veterinary Medicine':         { primary: FIELDS.HEALTHCARE, related: [] },
  'Nutrition':                   { primary: FIELDS.HEALTHCARE, related: [FIELDS.EDUCATION] },
  'Medical Laboratory Sciences': { primary: FIELDS.HEALTHCARE, related: [FIELDS.TECHNOLOGY] },

  // ---- Law, Social Sciences & Humanities ----
  'Law':                         { primary: FIELDS.OTHER, related: [FIELDS.BUSINESS] },
  'Political Science':           { primary: FIELDS.OTHER, related: [FIELDS.BUSINESS, FIELDS.EDUCATION] },
  'International Relations':     { primary: FIELDS.BUSINESS, related: [FIELDS.OTHER, FIELDS.MARKETING] },
  'Sociology':                   { primary: FIELDS.EDUCATION, related: [FIELDS.HEALTHCARE, FIELDS.MARKETING] },
  'Psychology':                  { primary: FIELDS.HEALTHCARE, related: [FIELDS.EDUCATION, FIELDS.BUSINESS] },
  'Anthropology':                { primary: FIELDS.EDUCATION, related: [FIELDS.MARKETING] },
  'History':                     { primary: FIELDS.EDUCATION, related: [FIELDS.MARKETING] },
  'Philosophy':                  { primary: FIELDS.EDUCATION, related: [FIELDS.BUSINESS] },
  'Linguistics':                 { primary: FIELDS.EDUCATION, related: [FIELDS.MARKETING, FIELDS.TECHNOLOGY] },
  'English Literature':          { primary: FIELDS.EDUCATION, related: [FIELDS.MARKETING] },
  'Social Work':                 { primary: FIELDS.HEALTHCARE, related: [FIELDS.EDUCATION, FIELDS.OTHER] },

  // ---- Education ----
  'Education':                   { primary: FIELDS.EDUCATION, related: [] },
  'Teaching':                    { primary: FIELDS.EDUCATION, related: [] },
  'Early Childhood Education':   { primary: FIELDS.EDUCATION, related: [] },

  // ---- Other professional ----
  'Hospitality Management':      { primary: FIELDS.BUSINESS, related: [FIELDS.MARKETING] },
  'Tourism':                     { primary: FIELDS.BUSINESS, related: [FIELDS.MARKETING] },
  'Culinary Arts':               { primary: FIELDS.BUSINESS, related: [FIELDS.OTHER] },
  'Agriculture':                 { primary: FIELDS.OTHER, related: [FIELDS.HEALTHCARE, FIELDS.ENGINEERING] },
  'Urban Planning':              { primary: FIELDS.ENGINEERING, related: [FIELDS.DESIGN, FIELDS.BUSINESS] },
  'Other':                       { primary: FIELDS.OTHER, related: [] },
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
