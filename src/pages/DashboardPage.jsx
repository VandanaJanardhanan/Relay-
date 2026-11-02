import React from 'react';
import {
  Users,
  ClipboardList,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Filter,
  Plus,
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { currentUser, isFirebaseConfigured } = useAuth();

  // Hackathon starter operational data preview (ready to bind to Cloud Firestore in next step)
  const stats = [
    {
      title: 'Active Volunteers',
      value: '24',
      change: '+6 ready',
      icon: Users,
      badge: 'active',
    },
    {
      title: 'Dispatched Tasks',
      value: '18',
      change: '12 on-track',
      icon: ClipboardList,
      badge: 'in-progress',
    },
    {
      title: 'Tasks in Recovery',
      value: '3',
      change: 'Needs re-dispatch',
      icon: RotateCcw,
      badge: 'recovering',
    },
    {
      title: 'Resolved Today',
      value: '42',
      change: '98% success',
      icon: CheckCircle,
      badge: 'completed',
    },
  ];

  const tasks = [
    {
      id: 'TSK-104',
      title: 'Emergency Medical Kit Delivery to Sector 4',
      volunteer: 'Sarah Jenkins',
      priority: 'urgent',
      status: 'recovering',
      timeElapsed: '28m (stalled)',
      recoveryAction: 'Volunteer delayed: Auto-reassigning to standby medic',
    },
    {
      id: 'TSK-103',
      title: 'Shelter Supply Staging & Registration',
      volunteer: 'David Miller',
      priority: 'high',
      status: 'in-progress',
      timeElapsed: '14m active',
      recoveryAction: 'Check-in healthy',
    },
    {
      id: 'TSK-102',
      title: 'Generator Fuel Transport - West Pavilion',
      volunteer: 'Alex Chen',
      priority: 'urgent',
      status: 'active',
      timeElapsed: '8m active',
      recoveryAction: 'En route to checkpoint',
    },
    {
      id: 'TSK-101',
      title: 'Crowd Direction & Water Station Setup',
      volunteer: 'Elena Rostova',
      priority: 'normal',
      status: 'completed',
      timeElapsed: '45m total',
      recoveryAction: 'Completed & logged',
    },
    {
      id: 'TSK-100',
      title: 'Perimeter Check & Radio Check-In',
      volunteer: 'Marcus Vance',
      priority: 'normal',
      status: 'pending',
      timeElapsed: 'Queued',
      recoveryAction: 'Awaiting responder assignment',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Operational Command Hub
            </h1>
            <Badge status={isFirebaseConfigured ? 'active' : 'pending'}>
              {isFirebaseConfigured ? 'Firestore Online' : 'Local Standby'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time volunteer monitoring, dispatch allocation, and failover recovery queue.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={Filter}
            onClick={() => alert('Filter options will be available when Firestore live stream connects.')}
          >
            Filter
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => alert('New task dialog will be linked in the next phase.')}
          >
            Dispatch Task
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-blue-200 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {stat.title}
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-slate-900">{stat.value}</span>
                <Badge status={stat.badge} size="sm">
                  {stat.change}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Operations Table Card */}
      <Card
        title="Live Dispatches & Recovery Protocol"
        subtitle="Tasks actively monitored for stalled progress and automatic responder failover"
        icon={ClipboardList}
        action={
          <span className="text-xs text-slate-400 font-medium">
            5 tracked dispatches
          </span>
        }
      >
        <div className="overflow-x-auto -mx-6 -mb-6">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-y border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-6">Task ID & Title</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Assigned Volunteer</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-6 text-right">Recovery Protocol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-50/60 transition">
                  <td className="py-4 px-6">
                    <div className="font-semibold text-slate-900">{task.title}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{task.id}</div>
                  </td>
                  <td className="py-4 px-4">
                    <Badge status={task.priority} size="sm">
                      {task.priority.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-medium text-slate-700">{task.volunteer}</div>
                  </td>
                  <td className="py-4 px-4">
                    <Badge status={task.status} size="sm" />
                  </td>
                  <td className="py-4 px-4 text-slate-500 font-mono">
                    {task.timeElapsed}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className="text-[11px] font-medium text-slate-600 block">
                      {task.recoveryAction}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

