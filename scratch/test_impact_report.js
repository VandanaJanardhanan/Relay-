import assert from 'assert';
import { isTaskRecovered } from '../src/utils/taskRecoveryUtils.js';

function testImpactCalculations() {
  console.log('=== RELAY IMPACT REPORT CALCULATION TESTS ===');

  const mockTasks = [
    // 1. Regular completed task (not recovered)
    {
      id: 'task-1',
      campaignId: 'camp-A',
      title: 'Distribute Food Kits',
      status: 'completed',
      assignedVolunteerId: 'vol-1',
      originalVolunteerId: 'vol-1',
      recoveryHistory: [
        { action: 'claimed', newVolunteerId: 'vol-1' },
        { action: 'completed', volunteerId: 'vol-1' }
      ]
    },
    // 2. Recovered task that was completed (blocked -> recovered by vol-2 -> completed)
    {
      id: 'task-2',
      campaignId: 'camp-A',
      title: 'Emergency Medical Dispatch',
      status: 'completed',
      assignedVolunteerId: 'vol-2',
      originalVolunteerId: 'vol-1',
      previousVolunteerId: 'vol-1',
      lastRecoveryReason: 'Access route blocked',
      recoveryHistory: [
        { action: 'claimed', newVolunteerId: 'vol-1' },
        { action: 'blocked', reason: 'Access route blocked' },
        { action: 'recovered_from_blocker', previousVolunteerId: 'vol-1', newVolunteerId: 'vol-2' },
        { action: 'completed', volunteerId: 'vol-2' }
      ]
    },
    // 3. Recovered task currently active (overdue -> recovered by vol-3 -> assigned)
    {
      id: 'task-3',
      campaignId: 'camp-B',
      title: 'Radio Relay Setup',
      status: 'assigned',
      assignedVolunteerId: 'vol-3',
      originalVolunteerId: 'vol-2',
      previousVolunteerId: 'vol-2',
      lastRecoveryReason: 'Overdue recovery failover',
      recoveryHistory: [
        { action: 'claimed', newVolunteerId: 'vol-2' },
        { action: 'recovered_from_overdue', previousVolunteerId: 'vol-2', newVolunteerId: 'vol-3' }
      ]
    },
    // 4. Currently blocked task (not yet recovered)
    {
      id: 'task-4',
      campaignId: 'camp-B',
      title: 'Power Generator Transport',
      status: 'blocked',
      blockReason: 'Engine stall',
      assignedVolunteerId: 'vol-4',
      originalVolunteerId: 'vol-4',
      recoveryHistory: [
        { action: 'claimed', newVolunteerId: 'vol-4' },
        { action: 'blocked', reason: 'Engine stall' }
      ]
    },
    // 5. Overdue task
    {
      id: 'task-5',
      campaignId: 'camp-A',
      title: 'Search Sector 9',
      status: 'overdue',
      deadline: '2020-01-01T00:00:00Z',
      assignedVolunteerId: 'vol-5',
      originalVolunteerId: 'vol-5'
    }
  ];

  // Test isTaskRecovered
  console.log('1. Testing isTaskRecovered identification:');
  assert.strictEqual(isTaskRecovered(mockTasks[0]), false, 'Task 1 should not be recovered');
  assert.strictEqual(isTaskRecovered(mockTasks[1]), true, 'Task 2 should be recovered');
  assert.strictEqual(isTaskRecovered(mockTasks[2]), true, 'Task 3 should be recovered');
  assert.strictEqual(isTaskRecovered(mockTasks[3]), false, 'Task 4 should not be recovered yet');
  assert.strictEqual(isTaskRecovered(mockTasks[4]), false, 'Task 5 should not be recovered yet');
  console.log('   [PASS] Accurately identifies tasks reassigned after blocker or overdue');

  // Test System-Wide Metrics (All Campaigns)
  console.log('2. Testing system-wide metrics (All Campaigns):');
  const total = mockTasks.length; // 5
  const completed = mockTasks.filter(t => t.status === 'completed').length; // 2
  const recoveredList = mockTasks.filter(isTaskRecovered); // 2
  const blocked = mockTasks.filter(t => t.status === 'blocked').length; // 1
  const overdue = mockTasks.filter(t => t.status === 'overdue' || (t.status !== 'completed' && new Date(t.deadline) < new Date())).length; // 1
  const completionPercentage = Math.round((completed / total) * 100); // 40%

  assert.strictEqual(total, 5);
  assert.strictEqual(completed, 2);
  assert.strictEqual(recoveredList.length, 2);
  assert.strictEqual(blocked, 1);
  assert.strictEqual(overdue, 1);
  assert.strictEqual(completionPercentage, 40);
  console.log('   [PASS] System-wide metrics match expected numbers');

  // Test Filtered Metrics for Campaign A
  console.log('3. Testing filtered metrics for Campaign A:');
  const campATasks = mockTasks.filter(t => t.campaignId === 'camp-A');
  const campATotal = campATasks.length; // 3 (task 1, 2, 5)
  const campACompleted = campATasks.filter(t => t.status === 'completed').length; // 2
  const campARecovered = campATasks.filter(isTaskRecovered).length; // 1 (task 2)
  const campABlocked = campATasks.filter(t => t.status === 'blocked').length; // 0
  const campAOverdue = campATasks.filter(t => t.status === 'overdue' || (t.status !== 'completed' && new Date(t.deadline) < new Date())).length; // 1
  const campACompletion = Math.round((campACompleted / campATotal) * 100); // 67%

  assert.strictEqual(campATotal, 3);
  assert.strictEqual(campACompleted, 2);
  assert.strictEqual(campARecovered, 1);
  assert.strictEqual(campABlocked, 0);
  assert.strictEqual(campAOverdue, 1);
  assert.strictEqual(campACompletion, 67);
  console.log('   [PASS] Campaign-specific filter metrics match expected numbers');

  console.log('=== ALL IMPACT REPORT TESTS PASSED! ===');
}

testImpactCalculations();
