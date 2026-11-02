import assert from 'assert';

// Test Smart Backup Matching and Recovery Assignment
async function runTests() {
  console.log('=== RELAY SMART BACKUP VOLUNTEERS TEST SUITE ===');

  const {
    skillMatches,
    getSmartBackupVolunteers,
    checkVolunteerSuitability,
  } = await import('../src/utils/volunteerMatching.js');

  // Test 1: Skill normalization and compound matching
  console.log('1. Testing skillMatches:');
  assert.strictEqual(skillMatches('First Aid', 'First Aid'), true);
  assert.strictEqual(skillMatches('first aid', 'FIRST AID'), true);
  assert.strictEqual(skillMatches('First Aid', 'First Aid & CPR'), true);
  assert.strictEqual(skillMatches('Emergency Driving', 'Driving'), true);
  assert.strictEqual(skillMatches('Logistics', 'Patrol'), false);
  console.log('   [PASS] Skill matching and normalization verified');

  // Test 2: Matching Rules Validation
  console.log('2. Testing getSmartBackupVolunteers matching rules:');
  const task = {
    id: 'task-relief-01',
    title: 'Deploy Medical Shelter to Sector 7',
    requiredSkills: ['First Aid', 'Emergency Driving', 'Search & Rescue'],
    assignedVolunteerId: 'vol-blocked-current',
    status: 'blocked',
    blockReason: 'Bridge out on route 9'
  };

  const mockVolunteers = [
    // Assigned to this task -> MUST BE EXCLUDED (Rule 2)
    {
      uid: 'vol-blocked-current',
      name: 'Current Blocked Volunteer',
      availability: 'available',
      skills: ['First Aid', 'Emergency Driving']
    },
    // Offline/Busy -> MUST BE EXCLUDED (Rule 1)
    {
      uid: 'vol-busy',
      name: 'Busy Medic',
      availability: 'busy',
      skills: ['First Aid', 'Emergency Driving', 'Search & Rescue']
    },
    {
      uid: 'vol-offline',
      name: 'Offline Driver',
      availability: 'offline',
      skills: ['Emergency Driving']
    },
    // Available with 3/3 matching skills -> RANK 1 (Rule 3)
    {
      uid: 'vol-top-match',
      name: 'Maya Lin',
      availability: 'available',
      skills: ['First Aid & CPR', 'Emergency Driving', 'Search & Rescue', 'Radio Communications']
    },
    // Available with 2/3 matching skills -> RANK 2 (Rule 3)
    {
      uid: 'vol-mid-match',
      name: 'Carlos Ruiz',
      availability: 'available',
      skills: ['First Aid', 'Emergency Driving']
    },
    // Available with 1/3 matching skills -> RANK 3 (Rule 3)
    {
      uid: 'vol-single-match',
      name: 'Aisha Patel',
      availability: 'available',
      skills: ['First Aid']
    },
    // Available with 0 matching skills -> GENERAL STANDBY (Rule 4)
    {
      uid: 'vol-standby-1',
      name: 'Bob Johnson',
      availability: 'available',
      skills: ['Food Distribution', 'Crowd Management']
    },
    {
      uid: 'vol-standby-2',
      name: 'Zoe Vance',
      availability: 'available',
      skills: ['Translation']
    }
  ];

  const result = getSmartBackupVolunteers(task, mockVolunteers);

  // Total eligible: 5 (excluded current assignee and 2 busy/offline)
  assert.strictEqual(result.totalEligible, 5, 'Total eligible count must exclude assigned and non-available');

  // Suitable matches count: 3 (Maya, Carlos, Aisha)
  assert.strictEqual(result.suitableMatches.length, 3, 'Must have 3 suitable matches');

  // Rank 1: Maya Lin (3 matches)
  assert.strictEqual(result.suitableMatches[0].name, 'Maya Lin');
  assert.strictEqual(result.suitableMatches[0].matchCount, 3);
  assert.strictEqual(result.suitableMatches[0].isExactMatch, true);
  assert.strictEqual(result.suitableMatches[0].matchPercentage, 100);

  // Rank 2: Carlos Ruiz (2 matches)
  assert.strictEqual(result.suitableMatches[1].name, 'Carlos Ruiz');
  assert.strictEqual(result.suitableMatches[1].matchCount, 2);
  assert.strictEqual(result.suitableMatches[1].isPartialMatch, true);

  // Rank 3: Aisha Patel (1 match)
  assert.strictEqual(result.suitableMatches[2].name, 'Aisha Patel');
  assert.strictEqual(result.suitableMatches[2].matchCount, 1);

  // General Standby: 2 (Bob, Zoe) - appear below suitable matches (Rule 4)
  assert.strictEqual(result.generalStandby.length, 2);
  assert.strictEqual(result.generalStandby[0].name, 'Bob Johnson');
  assert.strictEqual(result.generalStandby[1].name, 'Zoe Vance');
  assert.strictEqual(result.generalStandby[0].matchCount, 0);

  console.log('   [PASS] Suitable matches ranked ahead of general standby');
  console.log('   [PASS] Excluded assigned volunteer and non-available volunteers');

  // Test 3: checkVolunteerSuitability for Volunteer Dashboard
  console.log('3. Testing checkVolunteerSuitability:');
  const volunteerSuitability1 = checkVolunteerSuitability(task, { skills: ['First Aid', 'Emergency Driving'] });
  assert.strictEqual(volunteerSuitability1.isMatch, true);
  assert.strictEqual(volunteerSuitability1.matchCount, 2);

  const volunteerSuitability2 = checkVolunteerSuitability(task, { skills: ['Cooking'] });
  assert.strictEqual(volunteerSuitability2.isMatch, false);
  assert.strictEqual(volunteerSuitability2.matchCount, 0);
  console.log('   [PASS] Volunteer suitability check verified');

  console.log('=== ALL TESTS PASSED SUCCESSFULLY! ===');
}

runTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
