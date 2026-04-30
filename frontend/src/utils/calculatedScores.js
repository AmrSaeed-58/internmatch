// Per-user localStorage cache for student-initiated cross-sector match scores.
// Recommendations and the internships list only auto-compute scores for the
// student's own industry; for other industries the student manually triggers
// "Calculate Match". We persist those results so they survive a page refresh.
//
// Schema (per user):
//   { [internshipId]: { score: number, calculatedAt: ISO string } }
//
// Cache is capped at MAX_ENTRIES; LRU-evicted by calculatedAt when exceeded.

const MAX_ENTRIES = 200;

function key(userId) {
  return `internmatch:calcScores:${userId || 'anon'}`;
}

function readAll(userId) {
  try {
    const raw = localStorage.getItem(key(userId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeAll(userId, data) {
  try {
    localStorage.setItem(key(userId), JSON.stringify(data));
  } catch {
    /* quota exceeded — silently drop */
  }
}

export function getCachedScore(userId, internshipId) {
  const all = readAll(userId);
  return all[internshipId]?.score ?? null;
}

export function getCachedEntry(userId, internshipId) {
  return readAll(userId)[internshipId] || null;
}

export function saveCachedScore(userId, internshipId, score) {
  const all = readAll(userId);
  all[internshipId] = { score, calculatedAt: new Date().toISOString() };

  // Evict oldest entries if we exceed the cap
  const entries = Object.entries(all);
  if (entries.length > MAX_ENTRIES) {
    entries.sort((a, b) =>
      new Date(b[1].calculatedAt) - new Date(a[1].calculatedAt)
    );
    const trimmed = Object.fromEntries(entries.slice(0, MAX_ENTRIES));
    writeAll(userId, trimmed);
    return;
  }

  writeAll(userId, all);
}

export function clearCachedScores(userId) {
  try {
    localStorage.removeItem(key(userId));
  } catch {
    /* ignore */
  }
}
