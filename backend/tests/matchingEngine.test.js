// Self-contained tests for the matching engine. Run with:
//   node tests/matchingEngine.test.js
//
// No test framework required. Uses node:assert/strict and a tiny harness.

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { score, _internal } = require('../src/services/matchingEngine');
const { FIELDS, MAJOR_FIELD_MAP, resolveMajorFields } = require('../src/config/majorFieldMap');
const { computeMandatoryCap } = _internal;

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    process.stdout.write(`  ok  ${name}\n`);
  } catch (err) {
    failed++;
    failures.push({ name, err });
    process.stdout.write(`  FAIL ${name}\n    ${err.message}\n`);
  }
}

function group(label, fn) {
  process.stdout.write(`\n${label}\n`);
  fn();
}

// --- helpers --------------------------------------------------------------
function student({ skills = [], gpa = null, city = 'Amman', country = 'Jordan', major = 'Computer Science' } = {}) {
  return { user_id: 1, major, gpa, city, country, skills };
}

function internship({
  mandatorySkills = [], optionalSkills = [],
  industry = 'Technology', city = 'Amman', country = 'Jordan',
  work_type = 'on-site', minimum_gpa = null, deadline = null,
} = {}) {
  return {
    internship_id: 1, industry, city, country, work_type, minimum_gpa, deadline,
    mandatorySkills, optionalSkills,
  };
}

function readFrontendArray(name) {
  const file = path.join(__dirname, '../../frontend/src/utils/academicData.js');
  const text = fs.readFileSync(file, 'utf8');
  const body = text.split(`export const ${name} = [`)[1].split('];')[0];
  return [...body.matchAll(/'([^']+)'/g)].map((m) => m[1]);
}

function skill(id, level = 'intermediate', name = `s${id}`) {
  return { skill_id: id, display_name: name, required_level: level };
}

function studentSkill(id, level = 'intermediate') {
  return { skill_id: id, proficiency_level: level };
}

// =========================================================================
group('Mandatory skill scoring (60 pts total)', () => {
  test('all mandatory skills matched at level -> full 60', () => {
    const r = score({
      student: student({ skills: [studentSkill(1), studentSkill(2)] }),
      internship: internship({ mandatorySkills: [skill(1), skill(2)] }),
    });
    assert.equal(r.breakdown.mandatory.score, 60);
  });

  test('one mandatory skill 1-level low -> half credit on that skill', () => {
    const r = score({
      student: student({ skills: [studentSkill(1, 'beginner'), studentSkill(2)] }),
      internship: internship({ mandatorySkills: [skill(1, 'intermediate'), skill(2)] }),
    });
    // 30 (skill 2 full) + 15 (skill 1 half) = 45
    assert.equal(r.breakdown.mandatory.score, 45);
  });

  test('one mandatory skill 2-levels low -> 25% credit', () => {
    const r = score({
      student: student({ skills: [studentSkill(1, 'beginner')] }),
      internship: internship({ mandatorySkills: [skill(1, 'advanced')] }),
    });
    assert.equal(r.breakdown.mandatory.score, 15); // 60 * 0.25
  });

  test('student level higher than required -> full credit', () => {
    const r = score({
      student: student({ skills: [studentSkill(1, 'advanced')] }),
      internship: internship({ mandatorySkills: [skill(1, 'beginner')] }),
    });
    assert.equal(r.breakdown.mandatory.score, 60);
  });

  test('missing mandatory skill -> 0 credit on that skill', () => {
    const r = score({
      student: student({ skills: [] }),
      internship: internship({ mandatorySkills: [skill(1)] }),
    });
    assert.equal(r.breakdown.mandatory.score, 0);
  });
});

group('Optional skill scoring (10 pts total)', () => {
  test('no optional skills defined -> neutral 10 pts', () => {
    const r = score({
      student: student({ skills: [studentSkill(1)] }),
      internship: internship({ mandatorySkills: [skill(1)] }),
    });
    assert.equal(r.breakdown.optional.score, 10);
  });

  test('all optional skills matched -> full 10', () => {
    const r = score({
      student: student({ skills: [studentSkill(1), studentSkill(2)] }),
      internship: internship({
        mandatorySkills: [skill(1)],
        optionalSkills: [skill(2)],
      }),
    });
    assert.equal(r.breakdown.optional.score, 10);
  });

  test('half optional matched -> 5', () => {
    const r = score({
      student: student({ skills: [studentSkill(1), studentSkill(2)] }),
      internship: internship({
        mandatorySkills: [skill(1)],
        optionalSkills: [skill(2), skill(3)],
      }),
    });
    assert.equal(r.breakdown.optional.score, 5);
  });
});

group('Major scoring (10 pts)', () => {
  test('CS student vs Technology industry -> 10 (primary match)', () => {
    const r = score({
      student: student({ major: 'Computer Science', skills: [studentSkill(1)] }),
      internship: internship({ mandatorySkills: [skill(1)], industry: 'Technology' }),
    });
    assert.equal(r.breakdown.major.score, 10);
    assert.equal(r.breakdown.major.fit, 'primary');
  });

  test('CS student vs Engineering industry -> 5 (related)', () => {
    const r = score({
      student: student({ major: 'Computer Science', skills: [studentSkill(1)] }),
      internship: internship({ mandatorySkills: [skill(1)], industry: 'Engineering' }),
    });
    assert.equal(r.breakdown.major.score, 5);
    assert.equal(r.breakdown.major.fit, 'related');
  });

  test('Business student vs Technology industry -> 0 (no match)', () => {
    const r = score({
      student: student({ major: 'Business Administration', skills: [studentSkill(1)] }),
      internship: internship({ mandatorySkills: [skill(1)], industry: 'Technology' }),
    });
    assert.equal(r.breakdown.major.score, 0);
  });
});

group('Major field map coverage', () => {
  test('every selectable frontend major resolves to a primary field', () => {
    const majors = readFrontendArray('MAJORS');
    const unmapped = majors.filter((m) => !resolveMajorFields(m).primary);
    assert.deepEqual(unmapped, []);
  });

  test('every mapped primary/related field is a selectable employer industry', () => {
    const industries = new Set(readFrontendArray('INDUSTRIES'));
    const invalid = [];

    for (const [major, fields] of Object.entries(MAJOR_FIELD_MAP)) {
      if (!industries.has(fields.primary)) invalid.push(`${major}: primary=${fields.primary}`);
      for (const related of fields.related) {
        if (!industries.has(related)) invalid.push(`${major}: related=${related}`);
      }
    }

    for (const field of Object.values(FIELDS)) {
      if (!industries.has(field)) invalid.push(`FIELDS value not selectable: ${field}`);
    }

    assert.deepEqual(invalid, []);
  });
});

group('GPA scoring (10 pts)', () => {
  test('no minimum_gpa -> full 10', () => {
    const r = score({
      student: student({ gpa: 3.0, skills: [studentSkill(1)] }),
      internship: internship({ mandatorySkills: [skill(1)] }),
    });
    assert.equal(r.breakdown.gpa.score, 10);
  });

  test('student gpa above minimum -> full 10', () => {
    const r = score({
      student: student({ gpa: 3.5, skills: [studentSkill(1)] }),
      internship: internship({ mandatorySkills: [skill(1)], minimum_gpa: 3.0 }),
    });
    assert.equal(r.breakdown.gpa.score, 10);
  });

  test('student gpa below minimum -> proportional', () => {
    const r = score({
      student: student({ gpa: 2.7, skills: [studentSkill(1)] }),
      internship: internship({ mandatorySkills: [skill(1)], minimum_gpa: 3.0 }),
    });
    assert.equal(r.breakdown.gpa.score, 9); // 2.7/3.0 * 10
  });

  test('student gpa null with minimum set -> full 10', () => {
    const r = score({
      student: student({ gpa: null, skills: [studentSkill(1)] }),
      internship: internship({ mandatorySkills: [skill(1)], minimum_gpa: 3.0 }),
    });
    assert.equal(r.breakdown.gpa.score, 10);
  });
});

group('Location scoring (10 pts) — work-mode aware', () => {
  test('remote -> always 10, no alert', () => {
    const r = score({
      student: student({ city: 'Aqaba', country: 'Jordan', skills: [studentSkill(1)] }),
      internship: internship({ mandatorySkills: [skill(1)], work_type: 'remote', city: 'Amman', country: 'Jordan' }),
    });
    assert.equal(r.breakdown.location.score, 10);
    assert.equal(r.alerts.length, 0);
  });

  test('on-site same city same country -> 10, no alert', () => {
    const r = score({
      student: student({ city: 'Amman', country: 'Jordan', skills: [studentSkill(1)] }),
      internship: internship({ mandatorySkills: [skill(1)], work_type: 'on-site' }),
    });
    assert.equal(r.breakdown.location.score, 10);
    assert.equal(r.alerts.length, 0);
  });

  test('on-site different city same country -> 5, alert present', () => {
    const r = score({
      student: student({ city: 'Aqaba', country: 'Jordan', skills: [studentSkill(1)] }),
      internship: internship({ mandatorySkills: [skill(1)], work_type: 'on-site', city: 'Amman', country: 'Jordan' }),
    });
    assert.equal(r.breakdown.location.score, 5);
    assert.equal(r.alerts.length, 1);
  });

  test('hybrid different city same country -> 5, no alert', () => {
    const r = score({
      student: student({ city: 'Zarqa', country: 'Jordan', skills: [studentSkill(1)] }),
      internship: internship({ mandatorySkills: [skill(1)], work_type: 'hybrid', city: 'Amman', country: 'Jordan' }),
    });
    assert.equal(r.breakdown.location.score, 5);
    assert.equal(r.alerts.length, 0);
  });

  test('on-site different country -> 0, alert + cap 50', () => {
    const r = score({
      student: student({ city: 'Dubai', country: 'UAE', skills: [studentSkill(1)] }),
      internship: internship({ mandatorySkills: [skill(1)], work_type: 'on-site', city: 'Amman', country: 'Jordan' }),
    });
    assert.equal(r.breakdown.location.score, 0);
    assert.equal(r.alerts.length, 1);
    assert.equal(r.finalScore, 50); // capped
  });

  test('hybrid different country -> 0, alert + cap 50', () => {
    const r = score({
      student: student({ city: 'Cairo', country: 'Egypt', skills: [studentSkill(1)] }),
      internship: internship({ mandatorySkills: [skill(1)], work_type: 'hybrid', city: 'Amman', country: 'Jordan' }),
    });
    assert.equal(r.breakdown.location.score, 0);
    assert.equal(r.alerts.length, 1);
    assert.equal(r.finalScore, 50);
  });
});

group('Count-based mandatory caps', () => {
  test('N=1, m=0 (level-only gap) -> NO cap', () => {
    assert.equal(computeMandatoryCap(0, 1), null);
  });

  test('N=1, m=1 -> cap 50', () => {
    assert.equal(computeMandatoryCap(1, 1).value, 50);
  });

  test('N=2, m=1 -> cap 60', () => {
    assert.equal(computeMandatoryCap(1, 2).value, 60);
  });

  test('N=2, m=2 -> cap 50 (majority)', () => {
    assert.equal(computeMandatoryCap(2, 2).value, 50);
  });

  test('N=3, m=1 -> NO cap', () => {
    assert.equal(computeMandatoryCap(1, 3), null);
  });

  test('N=3, m=2 -> cap 50 (majority)', () => {
    assert.equal(computeMandatoryCap(2, 3).value, 50);
  });

  test('N=4, m=2 -> cap 60 (exactly half)', () => {
    assert.equal(computeMandatoryCap(2, 4).value, 60);
  });

  test('N=4, m=3 -> cap 50 (majority)', () => {
    assert.equal(computeMandatoryCap(3, 4).value, 50);
  });

  test('N=1 with skill at 1 level lower -> raw drops to 30/60 mandatory but NO cap fires', () => {
    const r = score({
      student: student({ skills: [studentSkill(1, 'beginner')], gpa: null }),
      internship: internship({ mandatorySkills: [skill(1, 'intermediate')] }),
    });
    // mandatory=30, optional=10, major=10, gpa=10, location=10 -> 70, no cap
    assert.equal(r.finalScore, 70);
  });

  test('N=2, both at 1 level lower -> NO cap (was capped before refinement)', () => {
    const r = score({
      student: student({
        skills: [studentSkill(1, 'beginner'), studentSkill(2, 'beginner')],
      }),
      internship: internship({
        mandatorySkills: [skill(1, 'intermediate'), skill(2, 'intermediate')],
      }),
    });
    // mandatory=30, optional=10, major=10, gpa=10, location=10 -> 70, no cap
    assert.equal(r.finalScore, 70);
  });
});

group('Multiple caps interaction', () => {
  test('mandatory cap + country cap -> take min (50)', () => {
    const r = score({
      student: student({
        skills: [studentSkill(1), studentSkill(2)],
        city: 'Cairo', country: 'Egypt',
      }),
      internship: internship({
        mandatorySkills: [skill(1)],
        work_type: 'on-site', country: 'Jordan',
      }),
    });
    // mandatory all matched (m=0), so only country cap applies = 50
    assert.equal(r.finalScore, 50);
  });
});

group('Perfect match', () => {
  test('all signals perfect -> 100', () => {
    const r = score({
      student: student({
        skills: [studentSkill(1), studentSkill(2)],
        gpa: 3.5, city: 'Amman', country: 'Jordan',
        major: 'Computer Science',
      }),
      internship: internship({
        mandatorySkills: [skill(1), skill(2)],
        optionalSkills: [],
        industry: 'Technology',
        city: 'Amman', country: 'Jordan', work_type: 'on-site',
        minimum_gpa: 3.0,
      }),
    });
    assert.equal(r.finalScore, 100);
  });
});

group('Breakdown shape', () => {
  test('breakdown has all five signal blocks + alerts + capsApplied', () => {
    const r = score({
      student: student({ skills: [studentSkill(1)] }),
      internship: internship({ mandatorySkills: [skill(1)] }),
    });
    assert.ok(r.breakdown.mandatory);
    assert.ok(r.breakdown.optional);
    assert.ok(r.breakdown.major);
    assert.ok(r.breakdown.gpa);
    assert.ok(r.breakdown.location);
    assert.ok(Array.isArray(r.breakdown.alerts));
    assert.ok(Array.isArray(r.breakdown.capsApplied));
  });
});

// =========================================================================
process.stdout.write(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) {
  process.exit(1);
}
