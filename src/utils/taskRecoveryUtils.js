/**
 * RELAY - Task Recovery Detection & Metrics Utilities
 */

/**
 * Determines whether a task counts as recovered:
 * Count a task as recovered if it was reassigned after becoming blocked or overdue.
 *
 * @param {object} task
 * @returns {boolean}
 */
export function isTaskRecovered(task) {
  if (!task) return false;

  // 1. Audit trail checks: contains a recovery action or reassignment handoff
  const hasHistoryRecovery =
    Array.isArray(task.recoveryHistory) &&
    task.recoveryHistory.some((h) => {
      const action = (h.action || '').toLowerCase();
      return (
        action.includes('recover') ||
        (h.previousVolunteerId &&
          h.newVolunteerId &&
          h.previousVolunteerId !== h.newVolunteerId)
      );
    });

  // 2. Metadata tags preserved during smart recovery
  const hasRecoveryMetadata = Boolean(
    task.previousVolunteerId ||
    task.lastRecoveryReason ||
    (task.originalVolunteerId &&
      task.assignedVolunteerId &&
      task.originalVolunteerId !== task.assignedVolunteerId)
  );

  return Boolean(hasHistoryRecovery || hasRecoveryMetadata);
}

