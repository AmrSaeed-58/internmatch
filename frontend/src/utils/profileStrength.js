// Mirrors backend computeProfileBonus weights so the UI matches what's used for matching.
// Mandatory signup fields (full name, university, major, graduation year) are excluded
// since they're always present and don't differentiate profiles.
//
// Weights (sum 100):
//   resume:       30
//   skills:       25 (5 per skill, max 5)
//   bio:          15 (≥ 30 chars to count)
//   linkedin_url: 10
//   gpa:           5
//   phone:         5
//   location:      5
//   github_url:    5
export function computeProfileStrength(profile, skills = []) {
  if (!profile) return 0;
  let score = 0;
  if (profile.resume || profile.primaryResumeId) score += 30;
  if (profile.bio && profile.bio.trim().length >= 30) score += 15;
  if (profile.linkedinUrl) score += 10;
  if (profile.gpa) score += 5;
  if (profile.phone) score += 5;
  if (profile.location) score += 5;
  if (profile.githubUrl) score += 5;
  score += Math.min(25, (skills?.length || 0) * 5);
  return Math.min(100, score);
}

// Returns missing items the user could complete to improve their profile.
// Sorted descending by point value.
export function getProfileGaps(profile, skills = []) {
  if (!profile) return [];
  const gaps = [];
  if (!(profile.resume || profile.primaryResumeId)) {
    gaps.push({ label: 'Upload your resume', points: 30, key: 'resume' });
  }
  const skillCount = skills?.length || 0;
  if (skillCount < 5) {
    gaps.push({
      label: skillCount === 0 ? 'Add at least 5 skills' : `Add ${5 - skillCount} more skill${5 - skillCount === 1 ? '' : 's'}`,
      points: (5 - skillCount) * 5,
      key: 'skills',
    });
  }
  if (!profile.bio || profile.bio.trim().length < 30) {
    gaps.push({ label: 'Write a bio (30+ characters)', points: 15, key: 'bio' });
  }
  if (!profile.linkedinUrl) gaps.push({ label: 'Add LinkedIn profile', points: 10, key: 'linkedin' });
  if (!profile.gpa) gaps.push({ label: 'Add your GPA', points: 5, key: 'gpa' });
  if (!profile.phone) gaps.push({ label: 'Add phone number', points: 5, key: 'phone' });
  if (!profile.location) gaps.push({ label: 'Add your location', points: 5, key: 'location' });
  if (!profile.githubUrl) gaps.push({ label: 'Add GitHub profile', points: 5, key: 'github' });
  return gaps.sort((a, b) => b.points - a.points);
}
