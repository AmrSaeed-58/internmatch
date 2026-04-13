export function computeProfileStrength(profile, skills = []) {
  if (!profile) return 0;
  let score = 0;
  if (profile.fullName) score += 10;
  if (profile.university) score += 10;
  if (profile.major) score += 10;
  if (profile.graduationYear) score += 5;
  if (profile.gpa) score += 5;
  if (profile.bio) score += 10;
  if (profile.phone) score += 5;
  if (profile.location) score += 5;
  if (profile.linkedinUrl) score += 10;
  if (profile.resume) score += 20;
  if (skills.length > 0) score += Math.min(10, skills.length * 2);
  return Math.min(100, score);
}
