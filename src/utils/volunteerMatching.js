/**
 * RELAY - Smart Backup Volunteer Matching Engine
 *
 * Simple, transparent, and deterministic matching algorithm using real Firestore profiles.
 *
 * Matching Rules:
 * 1. Volunteer must be available (availability === 'available').
 * 2. Volunteer must not already be assigned to the task (uid !== task.assignedVolunteerId).
 * 3. Volunteers with matching required skills appear first (sorted by matchCount descending).
 * 4. Volunteers without matching skills appear below suitable matches (General Standby).
 *
 * No AI/ML/external APIs or hardcoded suggestions.
 */

/**
 * Case-insensitive normalized skill comparison with compound substring support
 * e.g. "First Aid" matches "First Aid & CPR"
 *
 * @param {string} taskSkill
 * @param {string} volSkill
 * @returns {boolean}
 */
export function skillMatches(taskSkill, volSkill) {
  if (!taskSkill || !volSkill) return false;
  const s1 = String(taskSkill).toLowerCase().trim();
  const s2 = String(volSkill).toLowerCase().trim();
  if (s1 === s2) return true;
  return s1.includes(s2) || s2.includes(s1);
}

/**
 * Computes transparent backup volunteer recommendations for a blocked or overdue task
 *
 * @param {object} task - Task document
 * @param {Array<object>} volunteers - Real Firestore volunteer profiles
 * @returns {{
 *   suitableMatches: Array<object>,
 *   generalStandby: Array<object>,
 *   allSuggestions: Array<object>,
 *   totalEligible: number,
 *   hasSkillMatches: boolean
 * }}
 */
export function getSmartBackupVolunteers(task, volunteers = []) {
  if (!task || !Array.isArray(volunteers)) {
    return {
      suitableMatches: [],
      generalStandby: [],
      allSuggestions: [],
      totalEligible: 0,
      hasSkillMatches: false,
    };
  }

  const rawRequiredSkills = Array.isArray(task.requiredSkills)
    ? task.requiredSkills
    : typeof task.requiredSkills === 'string' && task.requiredSkills
    ? task.requiredSkills.split(',').map((s) => s.trim())
    : [];

  const taskRequiredSkills = rawRequiredSkills
    .map((s) => String(s).trim())
    .filter(Boolean);

  const currentAssigneeId = task.assignedVolunteerId;

  // Rule 1: Volunteer must be available
  // Rule 2: Volunteer must not already be assigned to the task
  const eligibleVolunteers = volunteers.filter((vol) => {
    if (!vol || !vol.uid) return false;

    // Must not already be assigned to the task
    if (vol.uid === currentAssigneeId) return false;

    // Must be marked as available
    const availability = (vol.availability || 'available').toLowerCase();
    return availability === 'available';
  });

  // Calculate skill matches for each eligible responder
  const scored = eligibleVolunteers.map((vol) => {
    const volSkills = Array.isArray(vol.skills)
      ? vol.skills.map((s) => String(s).trim()).filter(Boolean)
      : [];

    const matchedRequiredSkills = [];
    const unmatchedRequiredSkills = [];

    taskRequiredSkills.forEach((reqSkill) => {
      const isMatched = volSkills.some((vSkill) => skillMatches(reqSkill, vSkill));
      if (isMatched) {
        matchedRequiredSkills.push(reqSkill);
      } else {
        unmatchedRequiredSkills.push(reqSkill);
      }
    });

    // Other capabilities the volunteer possesses
    const otherSkills = volSkills.filter(
      (vSkill) => !matchedRequiredSkills.some((mSkill) => skillMatches(mSkill, vSkill))
    );

    const matchCount = matchedRequiredSkills.length;
    const totalRequired = taskRequiredSkills.length;
    const isExactMatch = totalRequired > 0 && matchCount === totalRequired;
    const isPartialMatch = totalRequired > 0 && matchCount > 0 && matchCount < totalRequired;
    const isGeneralStandby = totalRequired > 0 && matchCount === 0;

    return {
      volunteer: vol,
      uid: vol.uid,
      name: vol.name || vol.displayName || vol.email || 'Responder',
      email: vol.email || '',
      availability: vol.availability || 'available',
      skills: volSkills,
      matchedSkills: matchedRequiredSkills,
      otherSkills: otherSkills,
      unmatchedRequiredSkills: unmatchedRequiredSkills,
      matchCount: matchCount,
      totalRequired: totalRequired,
      matchPercentage: totalRequired > 0 ? Math.round((matchCount / totalRequired) * 100) : 100,
      isExactMatch,
      isPartialMatch,
      isGeneralStandby,
      // If task has required skills, suitable match requires at least 1 matching skill.
      // If task has no required skills, all available responders are suitable.
      isSuitableMatch: totalRequired === 0 ? true : matchCount > 0,
    };
  });

  // Rule 3: Volunteers with matching required skills appear first
  // Sorted by matchCount descending, then alphabetically by name
  scored.sort((a, b) => {
    if (b.matchCount !== a.matchCount) {
      return b.matchCount - a.matchCount;
    }
    return a.name.localeCompare(b.name);
  });

  const suitableMatches = scored.filter((v) => v.isSuitableMatch);
  const generalStandby = scored.filter((v) => !v.isSuitableMatch);

  return {
    suitableMatches,
    generalStandby,
    allSuggestions: scored,
    totalEligible: eligibleVolunteers.length,
    hasSkillMatches: suitableMatches.length > 0,
  };
}

/**
 * Checks a specific volunteer's suitability for a task
 * Used to highlight ideal recovery missions for the logged-in volunteer on the recovery page.
 *
 * @param {object} task
 * @param {object} volunteerProfile
 * @returns {{
 *   isMatch: boolean,
 *   isExactMatch: boolean,
 *   matchedSkills: Array<string>,
 *   matchCount: number,
 *   totalRequired: number,
 *   matchPercentage: number
 * }}
 */
export function checkVolunteerSuitability(task, volunteerProfile) {
  if (!task || !volunteerProfile) {
    return {
      isMatch: false,
      isExactMatch: false,
      matchedSkills: [],
      matchCount: 0,
      totalRequired: 0,
      matchPercentage: 0,
    };
  }

  const rawRequiredSkills = Array.isArray(task.requiredSkills)
    ? task.requiredSkills
    : typeof task.requiredSkills === 'string' && task.requiredSkills
    ? task.requiredSkills.split(',').map((s) => s.trim())
    : [];

  const taskRequiredSkills = rawRequiredSkills
    .map((s) => String(s).trim())
    .filter(Boolean);

  const volSkills = Array.isArray(volunteerProfile.skills)
    ? volunteerProfile.skills.map((s) => String(s).trim()).filter(Boolean)
    : [];

  const matchedSkills = taskRequiredSkills.filter((reqSkill) =>
    volSkills.some((vSkill) => skillMatches(reqSkill, vSkill))
  );

  const matchCount = matchedSkills.length;
  const totalRequired = taskRequiredSkills.length;
  const matchPercentage = totalRequired > 0 ? Math.round((matchCount / totalRequired) * 100) : 100;

  return {
    isMatch: totalRequired === 0 ? true : matchCount > 0,
    isExactMatch: totalRequired > 0 && matchCount === totalRequired,
    matchedSkills,
    matchCount,
    totalRequired,
    matchPercentage,
  };
}

