import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  RotateCcw,
  AlertOctagon,
  Clock,
  ClipboardList,
  Flag,
  Filter,
  Calendar,
  History,
  Users,
  Sparkles,
  ArrowUpRight,
  PieChart,
  Activity,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { TASK_STATUS } from '../../services/databaseService';
import { isTaskRecovered } from '../../utils/taskRecoveryUtils';

/**
 * ImpactReportView
 *
 * Renders real-time operational statistics and recovery impact metrics
 * based entirely on live Cloud Firestore documents.
 *
 * @param {object} props
 * @param {Array<object>} props.tasks - Real Firestore tasks collection
 * @param {Array<object>} props.campaigns - Real Firestore campaigns collection
 * @param {Array<object>} props.volunteers - Real Firestore volunteers collection
 * @param {(task: object) => void} props.onViewTaskAudit - Callback to open task audit trail modal
 */
export default function ImpactReportView({
  tasks = [],
  campaigns = [],
  volunteers = [],
  onViewTaskAudit,
}) {
  const [selectedCampaignId, setSelectedCampaignId] = useState('all');

  // Filter tasks by selected campaign
  const filteredTasks = useMemo(() => {
    if (selectedCampaignId === 'all') return tasks;
    return tasks.filter((t) => t.campaignId === selectedCampaignId);
  }, [tasks, selectedCampaignId]);

  // Active campaign metadata if selected
  const activeCampaign = useMemo(() => {
    if (selectedCampaignId === 'all') return null;
    return campaigns.find((c) => c.id === selectedCampaignId) || null;
  }, [campaigns, selectedCampaignId]);

  // Compute live operational metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const total = filteredTasks.length;

    const completed = filteredTasks.filter(
      (t) => t.status === TASK_STATUS.COMPLETED
    ).length;

    const blocked = filteredTasks.filter(
      (t) => t.status === TASK_STATUS.BLOCKED
    ).length;

    const overdue = filteredTasks.filter(
      (t) =>
        t.status === TASK_STATUS.OVERDUE ||
        (t.status !== TASK_STATUS.COMPLETED &&
          t.deadline &&
          new Date(t.deadline) < now)
    ).length;

    const unassigned = filteredTasks.filter(
      (t) => t.status === TASK_STATUS.UNASSIGNED
    ).length;

    const assigned = filteredTasks.filter(
      (t) =>
        t.status === TASK_STATUS.ASSIGNED &&
        !(t.deadline && new Date(t.deadline) < now)
    ).length;

    // Filter recovered tasks
    const recoveredList = filteredTasks.filter(isTaskRecovered);
    const recovered = recoveredList.length;

    // Completion percentage
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Recovery completion rate (recovered tasks that eventually reached completion)
    const recoveredAndCompleted = recoveredList.filter(
      (t) => t.status === TASK_STATUS.COMPLETED
    ).length;

    const recoverySuccessRate =
      recovered > 0
        ? Math.round((recoveredAndCompleted / recovered) * 100)
        : 0;

    return {
      total,
      completed,
      recovered,
      blocked,
      overdue,
      unassigned,
      assigned,
      completionRate,
      recoveredList,
      recoveredAndCompleted,
      recoverySuccessRate,
    };
  }, [filteredTasks]);

  // Aggregate recent recovery history events from recovered tasks
  const recoveryEvents = useMemo(() => {
    const events = [];
    metrics.recoveredList.forEach((task) => {
      if (Array.isArray(task.recoveryHistory)) {
        task.recoveryHistory.forEach((hist) => {
          if (
            (hist.action || '').toLowerCase().includes('recover') ||
            hist.action === 'blocked'
          ) {
            events.push({
              taskId: task.id,
              taskTitle: task.title,
              campaignId: task.campaignId,
              action: hist.action,
              reason: hist.reason || task.lastRecoveryReason || '',
              previousVolunteerName:
                hist.previousVolunteerName || task.previousVolunteerName || 'Previous Responder',
              newVolunteerName:
                hist.newVolunteerName || task.assignedVolunteerName || 'Backup Responder',
              timestamp: hist.timestamp || task.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
              taskObject: task,
            });
          }
        });
      }
    });

    // Sort by timestamp descending
    return events.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    ).slice(0, 8);
  }, [metrics.recoveredList]);

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. HEADER & CAMPAIGN SELECTOR                                        */}
      {/* ==================================================================== */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-900">
                RELAY Impact Report
              </h2>
              <p className="text-xs text-slate-500">
                Live task completion and rapid failover recovery analytics
              </p>
            </div>
          </div>
        </div>

        {/* Campaign Filter Control */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5 shrink-0">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            Select Campaign:
          </label>
          <select
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            className="w-full sm:w-64 px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          >
            <option value="all">All Campaigns (System-wide Overview)</option>
            {campaigns.map((camp) => (
              <option key={camp.id} value={camp.id}>
                {camp.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Campaign Context Banner */}
      {activeCampaign && (
        <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-200 text-blue-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold">{activeCampaign.name}</h3>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-200 text-blue-900">
                Active Initiative
              </span>
            </div>
            {activeCampaign.description && (
              <p className="text-xs text-blue-800/90 mt-1 max-w-2xl leading-relaxed">
                {activeCampaign.description}
              </p>
            )}
          </div>

          <div className="text-xs text-blue-800 shrink-0 flex items-center gap-3">
            {activeCampaign.startDate && (
              <span>
                Started:{' '}
                <strong>
                  {new Date(activeCampaign.startDate).toLocaleDateString()}
                </strong>
              </span>
            )}
            {activeCampaign.endDate && (
              <span>
                Target End:{' '}
                <strong>
                  {new Date(activeCampaign.endDate).toLocaleDateString()}
                </strong>
              </span>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. CORE KPI CARDS (6 METRICS REQUIRED)                                */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Tasks */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Total Tasks
            </span>
            <ClipboardList className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {metrics.total}
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            {selectedCampaignId === 'all' ? 'All campaigns' : 'In this campaign'}
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-200 transition">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Completed
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600">
            {metrics.completed}
          </div>
          <div className="mt-1 text-[10px] text-emerald-700/80">
            Resolved missions
          </div>
        </div>

        {/* Recovered Tasks (CORE METRIC) */}
        <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-2xs hover:border-purple-300 transition bg-purple-50/20">
          <div className="flex items-center justify-between text-purple-700">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Recovered
            </span>
            <RotateCcw className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-purple-700">
            {metrics.recovered}
          </div>
          <div className="mt-1 text-[10px] text-purple-600 font-medium">
            Reassigned failovers
          </div>
        </div>

        {/* Blocked Tasks */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-rose-200 transition">
          <div className="flex items-center justify-between text-rose-700">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Blocked
            </span>
            <AlertOctagon className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-rose-600">
            {metrics.blocked}
          </div>
          <div className="mt-1 text-[10px] text-rose-700/80">
            Halted on-ground
          </div>
        </div>

        {/* Overdue Tasks */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-amber-200 transition">
          <div className="flex items-center justify-between text-amber-700">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Overdue
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-600">
            {metrics.overdue}
          </div>
          <div className="mt-1 text-[10px] text-amber-700/80">
            Passed deadline
          </div>
        </div>

        {/* Completion Percentage */}
        <div className="bg-white p-4 rounded-xl border border-indigo-200 shadow-2xs hover:border-indigo-300 transition bg-indigo-50/20">
          <div className="flex items-center justify-between text-indigo-700">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Completion
            </span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-indigo-700">
            {metrics.completionRate}%
          </div>
          <div className="mt-1 text-[10px] text-indigo-600 font-medium">
            Overall efficiency
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. OPERATIONAL PROGRESS & TASK DISTRIBUTION                         */}
      {/* ==================================================================== */}
      <div className="w-full bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                Operational Progress & Task Distribution
              </h3>
              <p className="text-xs text-slate-500">
                Visual progress of active dispatches and recovery handoffs
              </p>
            </div>
            <span className="text-xs font-bold text-slate-700">
              {metrics.completed} of {metrics.total} Tasks Completed
            </span>
          </div>

          {/* Segmented Multi-Stage Progress Bar */}
          <div>
            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              {metrics.total > 0 ? (
                <>
                  {/* Completed */}
                  {metrics.completed > 0 && (
                    <div
                      style={{
                        width: `${(metrics.completed / metrics.total) * 100}%`,
                      }}
                      className="bg-emerald-500 transition-all duration-500"
                      title={`Completed: ${metrics.completed} (${Math.round((metrics.completed / metrics.total) * 100)}%)`}
                    />
                  )}

                  {/* Active / Assigned */}
                  {metrics.assigned > 0 && (
                    <div
                      style={{
                        width: `${(metrics.assigned / metrics.total) * 100}%`,
                      }}
                      className="bg-blue-500 transition-all duration-500"
                      title={`In Progress: ${metrics.assigned}`}
                    />
                  )}

                  {/* Blocked */}
                  {metrics.blocked > 0 && (
                    <div
                      style={{
                        width: `${(metrics.blocked / metrics.total) * 100}%`,
                      }}
                      className="bg-rose-500 transition-all duration-500"
                      title={`Blocked: ${metrics.blocked}`}
                    />
                  )}

                  {/* Overdue */}
                  {metrics.overdue > 0 && (
                    <div
                      style={{
                        width: `${(metrics.overdue / metrics.total) * 100}%`,
                      }}
                      className="bg-amber-500 transition-all duration-500"
                      title={`Overdue: ${metrics.overdue}`}
                    />
                  )}

                  {/* Unassigned */}
                  {metrics.unassigned > 0 && (
                    <div
                      style={{
                        width: `${(metrics.unassigned / metrics.total) * 100}%`,
                      }}
                      className="bg-slate-300 transition-all duration-500"
                      title={`Unassigned: ${metrics.unassigned}`}
                    />
                  )}
                </>
              ) : (
                <div className="w-full bg-slate-200 text-center text-[10px] text-slate-500 leading-4">
                  No tasks recorded
                </div>
              )}
            </div>

            {/* Progress Bar Legend */}
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-500 shrink-0" />
                <span className="text-slate-600 truncate">
                  Completed ({metrics.completed})
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-blue-500 shrink-0" />
                <span className="text-slate-600 truncate">
                  Active ({metrics.assigned})
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-rose-500 shrink-0" />
                <span className="text-slate-600 truncate">
                  Blocked ({metrics.blocked})
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-amber-500 shrink-0" />
                <span className="text-slate-600 truncate">
                  Overdue ({metrics.overdue})
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-slate-300 shrink-0" />
                <span className="text-slate-600 truncate">
                  Unassigned ({metrics.unassigned})
                </span>
              </div>
            </div>
          </div>

          {/* Comparative Distribution Bar Chart */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Task Breakdown Comparison
            </h4>

            <div className="space-y-2.5">
              {[
                {
                  label: 'Completed Tasks',
                  count: metrics.completed,
                  color: 'bg-emerald-500',
                  textColor: 'text-emerald-700',
                },
                {
                  label: 'Recovered Tasks (Failovers)',
                  count: metrics.recovered,
                  color: 'bg-purple-600',
                  textColor: 'text-purple-700',
                },
                {
                  label: 'Active Dispatches',
                  count: metrics.assigned,
                  color: 'bg-blue-500',
                  textColor: 'text-blue-700',
                },
                {
                  label: 'Blocked on Obstruction',
                  count: metrics.blocked,
                  color: 'bg-rose-500',
                  textColor: 'text-rose-700',
                },
                {
                  label: 'Past Deadline (Overdue)',
                  count: metrics.overdue,
                  color: 'bg-amber-500',
                  textColor: 'text-amber-700',
                },
              ].map((item, idx) => {
                const percentage =
                  metrics.total > 0
                    ? Math.round((item.count / metrics.total) * 100)
                    : 0;

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">
                        {item.label}
                      </span>
                      <span className={`font-bold ${item.textColor}`}>
                        {item.count}{' '}
                        <span className="text-slate-400 font-normal">
                          ({percentage}%)
                        </span>
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${percentage}%` }}
                        className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>



    </div>
  );
}
