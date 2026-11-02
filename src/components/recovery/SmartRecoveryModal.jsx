import React, { useState } from 'react';
import {
  RotateCcw,
  X,
  AlertTriangle,
  Clock,
  Sparkles,
  Shield,
  FileText,
  UserX,
} from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';
import SmartBackupVolunteersList from './SmartBackupVolunteersList';
import { TASK_STATUS } from '../../services/databaseService';

/**
 * SmartRecoveryModal
 *
 * Dedicated modal for Incident Commanders to execute task recovery with
 * transparent backup volunteer recommendations.
 *
 * @param {object} props
 * @param {object} props.task - The blocked or overdue task
 * @param {Array<object>} props.volunteers - Real Firestore volunteers
 * @param {() => void} props.onClose - Close callback
 * @param {(volunteer: object, reason: string) => Promise<void>} props.onAssignBackup
 * @param {(reason: string) => Promise<void>} props.onReleaseToPool
 */
export default function SmartRecoveryModal({
  task,
  volunteers = [],
  onClose,
  onAssignBackup,
  onReleaseToPool,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [customReason, setCustomReason] = useState('');

  if (!task) return null;

  const isBlocked = task.status === TASK_STATUS.BLOCKED;
  const isOverdue = task.status === TASK_STATUS.OVERDUE || (task.deadline && new Date(task.deadline) < new Date());

  const handleAssign = async (volunteer) => {
    setSubmitting(true);
    try {
      const reason = customReason.trim() || `Reassigned to backup volunteer ${volunteer.name || volunteer.displayName || 'Volunteer'}`;
      await onAssignBackup(volunteer, reason);
      onClose();
    } catch (err) {
      alert('Failed to reassign backup volunteer: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRelease = async () => {
    setSubmitting(true);
    try {
      const reason = customReason.trim() || 'Incident Commander released task to open volunteer pool';
      await onReleaseToPool(reason);
      onClose();
    } catch (err) {
      alert('Failed to release task to open pool: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Task Recovery & Backup Dispatch
              </h3>
              <p className="text-xs text-slate-500">
                Transparent volunteer matching for blocked or stalled missions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Task Summary Card */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Mission Under Recovery
              </span>
              <div className="flex items-center gap-1.5">
                <Badge status={task.status} size="sm" />
                <Badge status={task.priority || 'normal'} size="sm">
                  {(task.priority || 'normal').toUpperCase()}
                </Badge>
              </div>
            </div>

            <h4 className="font-bold text-sm text-slate-900">{task.title}</h4>
            {task.description && (
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {task.description}
              </p>
            )}

            {/* Current Blocker / Overdue Banner */}
            {isBlocked && task.blockReason && (
              <div className="mt-2.5 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Reported Blocker:</span> "{task.blockReason}"
                </div>
              </div>
            )}

            {isOverdue && !isBlocked && (
              <div className="mt-2.5 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Overdue:</span> Deadline expired on{' '}
                  {task.deadline ? new Date(task.deadline).toLocaleString() : 'target date'}.
                </div>
              </div>
            )}

            {/* Responder Meta */}
            <div className="mt-2.5 pt-2.5 border-t border-slate-200/80 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400">Current Assignee:</span>{' '}
                <span className="font-semibold text-slate-700">
                  {task.assignedVolunteerName || 'Assigned Responder'}
                </span>
              </div>
              {task.originalVolunteerId && (
                <div>
                  <span className="text-slate-400">Original Volunteer ID:</span>{' '}
                  <span className="font-mono text-slate-700">
                    {task.originalVolunteerId}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Recovery Notes Input (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Recovery Action Note (Optional)
            </label>
            <input
              type="text"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="e.g. Dispatched 4x4 backup unit to bypass flooded access route"
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Smart Backup Volunteers List */}
          <SmartBackupVolunteersList
            task={task}
            volunteers={volunteers}
            onAssign={handleAssign}
            onReleaseToPool={handleRelease}
            assigning={submitting}
            showPoolRelease={true}
          />
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Smart Backup Matching Engine &bull; RELAY Concurrency Guard
          </span>
          <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

