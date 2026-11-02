import React from 'react';
import {
  UserCheck,
  AlertTriangle,
  RotateCcw,
  Clock,
  Users,
} from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';

/**
 * SmartBackupVolunteersList
 *
 * Displays available registered volunteers for task recovery dispatch.
 * Skills have been removed per project specifications.
 */
export default function SmartBackupVolunteersList({
  task,
  volunteers = [],
  onAssign,
  onReleaseToPool,
  assigning = false,
  showPoolRelease = true,
}) {
  const currentAssigneeId = task?.assignedVolunteerId;
  const currentAssigneeIds = Array.isArray(task?.assignedVolunteerIds)
    ? task.assignedVolunteerIds
    : currentAssigneeId
    ? [currentAssigneeId]
    : [];

  // Filter available volunteers who are not currently assigned to this task
  const availableResponders = volunteers.filter((vol) => {
    if (!vol || !vol.uid) return false;
    if (currentAssigneeIds.includes(vol.uid)) return false;
    const availability = (vol.availability || 'available').toLowerCase();
    return availability === 'available';
  });

  return (
    <div className="space-y-4">
      {/* Available Responders List */}
      {availableResponders.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-1">
            <span className="flex items-center gap-1.5 text-slate-700">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              Available Responders ({availableResponders.length})
            </span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {availableResponders.map((vol) => (
              <div
                key={vol.uid}
                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-slate-900">
                      {vol.name || vol.displayName || 'Volunteer'}
                    </span>
                    <Badge status="available" size="sm">
                      AVAILABLE
                    </Badge>
                  </div>

                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    {vol.email}
                  </div>
                </div>

                {/* Request Backup Button */}
                <Button
                  variant="primary"
                  size="sm"
                  loading={assigning}
                  icon={UserCheck}
                  onClick={() => onAssign(vol)}
                  className="shrink-0"
                >
                  Request Backup
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Empty State: No volunteers available */
        <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-center">
          <AlertTriangle className="w-5 h-5 text-amber-600 mx-auto mb-1.5" />
          <div className="text-xs font-bold text-amber-900">
            No Other Available Volunteers Found
          </div>
          <p className="text-[11px] text-amber-800 mt-1 max-w-sm mx-auto">
            All registered responders are currently busy, offline, or already assigned to this dispatch.
          </p>
        </div>
      )}

      {/* Alternative Action: Release to Open Volunteer Pool */}
      {showPoolRelease && onReleaseToPool && (
        <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="text-[11px] text-slate-500">
            Or release this task back to the open pool for any eligible peer responder to claim:
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={RotateCcw}
            onClick={onReleaseToPool}
            className="shrink-0"
          >
            Release to Open Pool (Unassign)
          </Button>
        </div>
      )}
    </div>
  );
}
