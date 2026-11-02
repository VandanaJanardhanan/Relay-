import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Shield,
  ClipboardList,
  Users,
  RotateCcw,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Radio,
  Sparkles,
  ArrowRight,
  Filter,
  X,
  Plus,
  Flag,
  BarChart3,
  Calendar,
  Search,
  UserCheck,
  AlertOctagon,
  Trash2,
  Edit,
  ExternalLink,
  ChevronRight,
  Check,
  History,
  MapPin,
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import SmartBackupVolunteersList from '../components/recovery/SmartBackupVolunteersList';
import SmartRecoveryModal from '../components/recovery/SmartRecoveryModal';
import ImpactReportView from '../components/impact/ImpactReportView';
import { getSmartBackupVolunteers } from '../utils/volunteerMatching';
import { useAuth } from '../context/AuthContext';
import {
  subscribeToTasks,
  subscribeToCampaigns,
  subscribeToVolunteers,
  createTask,
  updateTask,
  deleteTask,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  seedSampleCampaigns,
  recoverTask,
  assignVolunteerToTask,
  createNotification,
  completeTask,
  TASK_STATUS,
} from '../services/databaseService';

export default function OrganizerDashboardPage({ section = 'dashboard' }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Synchronize section from URL path or prop
  const currentSection = useMemo(() => {
    if (location.pathname.includes('/organizer/recovery')) return 'recovery';
    if (location.pathname.includes('/organizer/campaigns')) return 'campaigns';
    if (location.pathname.includes('/organizer/tasks')) return 'tasks';
    if (location.pathname.includes('/organizer/volunteers')) return 'volunteers';
    if (location.pathname.includes('/organizer/impact')) return 'impact';
    return section || 'dashboard';
  }, [location.pathname, section]);

  const [activeSection, setActiveSection] = useState(currentSection);

  useEffect(() => {
    setActiveSection(currentSection);
  }, [currentSection]);

  const handleSectionChange = (newSec) => {
    setActiveSection(newSec);
    if (newSec === 'dashboard') navigate('/organizer/dashboard');
    else if (newSec === 'recovery') navigate('/organizer/recovery');
    else if (newSec === 'campaigns') navigate('/organizer/campaigns');
    else if (newSec === 'tasks') navigate('/organizer/tasks');
    else if (newSec === 'volunteers') navigate('/organizer/volunteers');
    else if (newSec === 'impact') navigate('/organizer/impact');
  };

  // Firestore real-time state
  const [tasks, setTasks] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Registered volunteers (strictly volunteers from users collection)
  const registeredVolunteers = useMemo(() => {
    return volunteers.filter((v) => (v.role || '').toLowerCase() === 'volunteer');
  }, [volunteers]);

  // Filter states
  const [statusFilter, setStatusFilter] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [deadlineFilter, setDeadlineFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Dialogs state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [showVolunteersModal, setShowVolunteersModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [assignModalTask, setAssignModalTask] = useState(null);
  const [viewHistoryTask, setViewHistoryTask] = useState(null);
  const [recoveryModalTask, setRecoveryModalTask] = useState(null);
  const [recoveryAssigningId, setRecoveryAssigningId] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null); // { title, message, onConfirm, type }

  // Form states - Task
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskCampaignId, setTaskCampaignId] = useState('');
  const [taskDeadline, setTaskDeadline] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskLocation, setTaskLocation] = useState('');
  const [taskVolunteersNeeded, setTaskVolunteersNeeded] = useState(1);
  const [taskSkills, setTaskSkills] = useState('');
  const [taskMaterials, setTaskMaterials] = useState('');
  const [taskAssigneeId, setTaskAssigneeId] = useState('');

  // Form states - Campaign (Create Campaign Modal)
  const [campaignName, setCampaignName] = useState('');
  const [campaignDesc, setCampaignDesc] = useState('');
  const [campaignCategory, setCampaignCategory] = useState('Community Support');
  const [campaignDate, setCampaignDate] = useState('');
  const [campaignEndDate, setCampaignEndDate] = useState('');
  const [campaignLocation, setCampaignLocation] = useState('');
  const [campaignStatus, setCampaignStatus] = useState('active');
  const [campaignFormError, setCampaignFormError] = useState('');
  const [campaignTasks, setCampaignTasks] = useState([]);

  // Draft Task Builder (Inside Campaign Modal)
  const [draftTaskTitle, setDraftTaskTitle] = useState('');
  const [draftTaskDesc, setDraftTaskDesc] = useState('');
  const [draftTaskPriority, setDraftTaskPriority] = useState('High');
  const [draftTaskLocation, setDraftTaskLocation] = useState('');
  const [draftTaskDeadlineDate, setDraftTaskDeadlineDate] = useState('');
  const [draftTaskDeadlineTime, setDraftTaskDeadlineTime] = useState('10:00');
  const [draftTaskVolunteersNeeded, setDraftTaskVolunteersNeeded] = useState(1);
  const [draftTaskSkills, setDraftTaskSkills] = useState('');
  const [draftTaskMaterials, setDraftTaskMaterials] = useState('');
  const [editingTaskIndex, setEditingTaskIndex] = useState(null);
  const [isAddingTask, setIsAddingTask] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // Subscribe to live Firestore collections
  useEffect(() => {
    setLoading(true);

    const unsubTasks = subscribeToTasks((liveTasks) => {
      setTasks(liveTasks);
      setLoading(false);
    });

    const unsubCampaigns = subscribeToCampaigns((liveCampaigns) => {
      setCampaigns(liveCampaigns);
      if (liveCampaigns.length > 0 && !taskCampaignId) {
        setTaskCampaignId(liveCampaigns[0].id);
      }
    });

    const unsubVolunteers = subscribeToVolunteers((liveVolunteers) => {
      setVolunteers(liveVolunteers);
    });

    return () => {
      unsubTasks();
      unsubCampaigns();
      unsubVolunteers();
    };
  }, []);

  // Set default deadline to tomorrow in datetime-local format
  useEffect(() => {
    const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
    tomorrow.setMinutes(tomorrow.getMinutes() - tomorrow.getTimezoneOffset());
    setTaskDeadline(tomorrow.toISOString().slice(0, 16));

    const todayStr = new Date().toISOString().slice(0, 10);
    setCampaignDate(todayStr);
  }, []);

  // --------------------------------------------------------------------------
  // Summary Metrics Calculations
  // --------------------------------------------------------------------------
  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === TASK_STATUS.COMPLETED).length;
    const active = tasks.filter((t) => t.status === TASK_STATUS.ASSIGNED).length;
    const blocked = tasks.filter((t) => t.status === TASK_STATUS.BLOCKED).length;

    // Overdue: status is overdue OR deadline is in the past for non-completed tasks
    const now = new Date();
    const overdue = tasks.filter((t) => {
      if (t.status === TASK_STATUS.COMPLETED) return false;
      if (t.status === TASK_STATUS.OVERDUE) return true;
      if (t.deadline && new Date(t.deadline) < now) return true;
      return false;
    }).length;

    const unassigned = tasks.filter((t) => t.status === TASK_STATUS.UNASSIGNED).length;

    return { total, completed, active, blocked, overdue, unassigned };
  }, [tasks]);

  // Tasks requiring immediate attention (Blocked, Overdue, or Withdrawn Volunteer)
  // High priority tasks are sorted first
  const attentionTasks = useMemo(() => {
    const now = new Date();
    const priorityWeight = { urgent: 0, high: 1, medium: 2, normal: 2, low: 3 };
    const list = tasks.filter((t) => {
      if (t.status === TASK_STATUS.COMPLETED || t.status === 'cancelled') return false;
      return (
        t.status === TASK_STATUS.BLOCKED ||
        t.status === TASK_STATUS.OVERDUE ||
        (t.deadline && new Date(t.deadline) < now) ||
        (t.withdrawnVolunteerId && t.status === TASK_STATUS.UNASSIGNED)
      );
    });

    return list.sort((a, b) => {
      const pA = priorityWeight[(a.priority || '').toLowerCase()] ?? 2;
      const pB = priorityWeight[(b.priority || '').toLowerCase()] ?? 2;
      return pA - pB;
    });
  }, [tasks]);

  // --------------------------------------------------------------------------
  // Task Filtering
  // --------------------------------------------------------------------------
  const filteredTasks = useMemo(() => {
    const now = new Date();
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const endOfWeek = new Date();
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    return tasks.filter((task) => {
      // 1. Status Filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'overdue') {
          const isOverdue =
            task.status === TASK_STATUS.OVERDUE ||
            (task.status !== TASK_STATUS.COMPLETED && task.deadline && new Date(task.deadline) < now);
          if (!isOverdue) return false;
        } else if (task.status !== statusFilter) {
          return false;
        }
      }

      // 2. Campaign Filter
      if (campaignFilter !== 'all' && task.campaignId !== campaignFilter) {
        return false;
      }

      // 3. Deadline Filter
      if (deadlineFilter !== 'all' && task.deadline) {
        const taskDate = new Date(task.deadline);
        if (deadlineFilter === 'overdue') {
          if (taskDate >= now || task.status === TASK_STATUS.COMPLETED) return false;
        } else if (deadlineFilter === 'today') {
          if (taskDate < now || taskDate > endOfToday) return false;
        } else if (deadlineFilter === 'week') {
          if (taskDate < now || taskDate > endOfWeek) return false;
        }
      }

      // 4. Search Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title?.toLowerCase().includes(query);
        const matchesDesc = task.description?.toLowerCase().includes(query);
        const matchesVolunteer = task.assignedVolunteerName?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesVolunteer) return false;
      }

      return true;
    });
  }, [tasks, statusFilter, campaignFilter, deadlineFilter, searchQuery]);

  // --------------------------------------------------------------------------
  // Action Handlers
  // --------------------------------------------------------------------------

  // 1. Seed Sample Campaigns & Tasks (Clean-Up Drive, Food Distribution, Support Visit)
  const handleSeedMission = async () => {
    if (!currentUser) return;
    try {
      setSubmitting(true);
      const created = await seedSampleCampaigns(currentUser.uid);
      if (created.length === 0) {
        alert('All 3 sample campaigns already exist in Firestore (Community Clean-Up Drive, Food and Essentials Distribution, Community Support Visit).');
      } else {
        alert(`Successfully published ${created.length} sample campaign(s) and their respective tasks!`);
      }
    } catch (err) {
      alert('Seed failed: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Standalone Task Submit (Quick Dispatch)
  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!taskTitle.trim() || !currentUser) return;

    setSubmitting(true);
    try {
      const skillsArray = taskSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      let targetCampaignId = taskCampaignId;
      if (!targetCampaignId && campaigns.length === 0) {
        const newCamp = await createCampaign({
          name: 'General Response Campaign',
          description: 'Emergency response operations hub.',
          organizerId: currentUser.uid,
          location: taskLocation || 'Relief Operations Hub',
        });
        targetCampaignId = newCamp.id;
      }

      const assignedVol = volunteers.find((v) => v.uid === taskAssigneeId);

      await createTask({
        campaignId: targetCampaignId || 'general',
        title: taskTitle,
        description: taskDescription,
        deadline: taskDeadline ? new Date(taskDeadline).toISOString() : null,
        requiredSkills: skillsArray,
        priority: taskPriority.toLowerCase(),
        location: taskLocation,
        volunteersNeeded: Number(taskVolunteersNeeded) || 1,
        requiredMaterials: taskMaterials,
        createdBy: currentUser.uid,
        assignedVolunteerId: assignedVol ? assignedVol.uid : null,
        assignedVolunteerName: assignedVol ? (assignedVol.name || assignedVol.displayName || assignedVol.email) : null,
      });

      setTaskTitle('');
      setTaskDescription('');
      setTaskLocation('');
      setTaskDeadline('');
      setTaskVolunteersNeeded(1);
      setTaskSkills('');
      setTaskMaterials('');
      setTaskAssigneeId('');
      setIsTaskModalOpen(false);
    } catch (err) {
      alert('Failed to publish task: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Draft Task Builder Helpers (for Campaign Modal)
  const resetDraftTask = () => {
    setDraftTaskTitle('');
    setDraftTaskDesc('');
    setDraftTaskPriority('High');
    setDraftTaskLocation(campaignLocation || '');
    setDraftTaskDeadlineDate(campaignDate || '');
    setDraftTaskDeadlineTime('10:00');
    setDraftTaskVolunteersNeeded(1);
    setDraftTaskSkills('');
    setDraftTaskMaterials('');
    setEditingTaskIndex(null);
    setIsAddingTask(false);
  };

  const handleSaveDraftTask = () => {
    if (!draftTaskTitle.trim()) {
      alert('Please enter a task title');
      return;
    }

    const newTask = {
      title: draftTaskTitle.trim(),
      description: draftTaskDesc.trim(),
      priority: draftTaskPriority,
      location: draftTaskLocation.trim() || campaignLocation.trim(),
      deadlineDate: draftTaskDeadlineDate || campaignDate || new Date().toISOString().slice(0, 10),
      deadlineTime: draftTaskDeadlineTime || '12:00',
      volunteersNeeded: Number(draftTaskVolunteersNeeded) || 1,
      requiredSkills: draftTaskSkills ? draftTaskSkills.split(',').map((s) => s.trim()).filter(Boolean) : [],
      requiredMaterials: draftTaskMaterials.trim(),
    };

    if (editingTaskIndex !== null) {
      setCampaignTasks((prev) => {
        const updated = [...prev];
        updated[editingTaskIndex] = newTask;
        return updated;
      });
    } else {
      setCampaignTasks((prev) => [...prev, newTask]);
    }

    resetDraftTask();
  };

  const handleEditDraftTask = (index) => {
    const t = campaignTasks[index];
    setDraftTaskTitle(t.title);
    setDraftTaskDesc(t.description || '');
    setDraftTaskPriority(t.priority || 'High');
    setDraftTaskLocation(t.location || '');
    setDraftTaskDeadlineDate(t.deadlineDate || '');
    setDraftTaskDeadlineTime(t.deadlineTime || '10:00');
    setDraftTaskVolunteersNeeded(t.volunteersNeeded || 1);
    setDraftTaskSkills(Array.isArray(t.requiredSkills) ? t.requiredSkills.join(', ') : t.requiredSkills || '');
    setDraftTaskMaterials(t.requiredMaterials || '');
    setEditingTaskIndex(index);
    setIsAddingTask(true);
  };

  const handleDeleteDraftTask = (index) => {
    setCampaignTasks((prev) => prev.filter((_, i) => i !== index));
    if (editingTaskIndex === index) {
      resetDraftTask();
    }
  };

  // 3. Campaign Submit (Create or Edit with Multiple Tasks)
  const handleSaveCampaign = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setCampaignFormError('');

    if (!campaignName.trim()) {
      setCampaignFormError('Campaign title is required.');
      return;
    }
    if (!campaignDesc.trim()) {
      setCampaignFormError('Campaign description is required.');
      return;
    }
    if (!campaignLocation.trim()) {
      setCampaignFormError('Campaign location / meeting point is required.');
      return;
    }
    if (campaignDate && campaignEndDate) {
      const start = new Date(campaignDate).getTime();
      const end = new Date(campaignEndDate).getTime();
      if (!isNaN(start) && !isNaN(end) && end < start) {
        setCampaignFormError('End date cannot be earlier than start date.');
        return;
      }
    }
    if (!currentUser) {
      setCampaignFormError('Authenticated organizer session required.');
      return;
    }

    setSubmitting(true);
    try {
      const startDateIso = campaignDate ? new Date(campaignDate).toISOString() : new Date().toISOString();
      const endDateIso = campaignEndDate ? new Date(campaignEndDate).toISOString() : null;

      if (editingCampaign) {
        await updateCampaign(editingCampaign.id, {
          name: campaignName.trim(),
          description: campaignDesc.trim(),
          category: campaignCategory,
          startDate: startDateIso,
          endDate: endDateIso,
          location: campaignLocation.trim(),
          status: campaignStatus,
        });

        // Publish any newly added tasks under this campaign
        for (const t of campaignTasks) {
          let taskDeadlineIso = null;
          if (t.deadlineDate) {
            const timeStr = t.deadlineTime || '12:00';
            taskDeadlineIso = new Date(`${t.deadlineDate}T${timeStr}:00`).toISOString();
          } else if (campaignDate) {
            taskDeadlineIso = new Date(`${campaignDate}T12:00:00`).toISOString();
          } else {
            taskDeadlineIso = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
          }

          await createTask({
            campaignId: editingCampaign.id,
            title: t.title,
            description: t.description || '',
            priority: (t.priority || 'medium').toLowerCase(),
            location: t.location || campaignLocation.trim(),
            deadline: taskDeadlineIso,
            volunteersNeeded: Number(t.volunteersNeeded) || 1,
            requiredSkills: Array.isArray(t.requiredSkills) ? t.requiredSkills : [],
            requiredMaterials: t.requiredMaterials || '',
            createdBy: currentUser.uid,
          });
        }
      } else {
        // Create new Campaign
        const camp = await createCampaign({
          name: campaignName.trim(),
          description: campaignDesc.trim(),
          category: campaignCategory,
          organizerId: currentUser.uid,
          startDate: startDateIso,
          endDate: endDateIso,
          location: campaignLocation.trim(),
          status: campaignStatus,
        });

        // Publish all tasks for this campaign
        for (const t of campaignTasks) {
          let taskDeadlineIso = null;
          if (t.deadlineDate) {
            const timeStr = t.deadlineTime || '12:00';
            taskDeadlineIso = new Date(`${t.deadlineDate}T${timeStr}:00`).toISOString();
          } else if (campaignDate) {
            taskDeadlineIso = new Date(`${campaignDate}T12:00:00`).toISOString();
          } else {
            taskDeadlineIso = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
          }

          await createTask({
            campaignId: camp.id,
            title: t.title,
            description: t.description || '',
            priority: (t.priority || 'medium').toLowerCase(),
            location: t.location || campaignLocation.trim(),
            deadline: taskDeadlineIso,
            volunteersNeeded: Number(t.volunteersNeeded) || 1,
            requiredSkills: Array.isArray(t.requiredSkills) ? t.requiredSkills : [],
            requiredMaterials: t.requiredMaterials || '',
            createdBy: currentUser.uid,
          });
        }
      }

      setCampaignName('');
      setCampaignDesc('');
      setCampaignCategory('Community Support');
      setCampaignDate('');
      setCampaignEndDate('');
      setCampaignLocation('');
      setCampaignStatus('active');
      setCampaignFormError('');
      setCampaignTasks([]);
      resetDraftTask();
      setEditingCampaign(null);
      setIsCampaignModalOpen(false);
    } catch (err) {
      setCampaignFormError('Failed to save campaign: ' + (err.message || 'Check connection.'));
    } finally {
      setSubmitting(false);
    }
  };

  // Open Campaign Edit Modal
  const handleOpenEditCampaign = (campaign) => {
    setEditingCampaign(campaign);
    setCampaignName(campaign.name || '');
    setCampaignDesc(campaign.description || '');
    setCampaignCategory(campaign.category || 'Community Support');
    setCampaignDate(campaign.startDate ? campaign.startDate.slice(0, 10) : '');
    setCampaignEndDate(campaign.endDate ? campaign.endDate.slice(0, 10) : '');
    setCampaignLocation(campaign.location || '');
    setCampaignStatus(campaign.status || 'active');
    setCampaignFormError('');
    setCampaignTasks([]);
    resetDraftTask();
    setIsCampaignModalOpen(true);
  };

  // 4. Recover Task Trigger (Opens Smart Recovery & Backup Volunteer Modal)
  const handleTriggerRecover = (task) => {
    setRecoveryModalTask(task);
  };

  // Assign smart backup volunteer
  const handleAssignBackupVolunteer = async (task, volunteer, reason) => {
    setRecoveryAssigningId(task.id);
    try {
      const responderName = volunteer.name || volunteer.displayName || volunteer.email || 'Backup Responder';
      await recoverTask(task.id, currentUser.uid, {
        newVolunteerId: volunteer.uid,
        newVolunteerName: responderName,
        reason: reason || `Assigned smart backup responder: ${responderName}`,
      });
      if (volunteer.uid) {
        try {
          await createNotification({
            userId: volunteer.uid,
            type: 'task_recovered',
            title: 'Assigned as Recovery Volunteer',
            message: `Incident Command assigned you to recover task "${task.title}". Immediate action required.`,
            taskId: task.id,
          });
        } catch (notifErr) {
          console.warn('Could not post notification:', notifErr);
        }
      }
      setRecoveryModalTask(null);
    } catch (err) {
      alert('Backup assignment failed: ' + err.message);
    } finally {
      setRecoveryAssigningId(null);
    }
  };

  // Release task back to open volunteer pool (unassigned)
  const handleReleaseTaskToPool = async (task, reason) => {
    setRecoveryAssigningId(task.id);
    try {
      await recoverTask(task.id, currentUser.uid, {
        newVolunteerId: null,
        reason: reason || 'Incident Commander released task to open volunteer pool',
      });
      setRecoveryModalTask(null);
    } catch (err) {
      alert('Failed to release task to open pool: ' + err.message);
    } finally {
      setRecoveryAssigningId(null);
    }
  };

  // 5. Assign Volunteer from Modal
  const handleConfirmAssign = async (volunteer) => {
    if (!assignModalTask) return;
    try {
      await assignVolunteerToTask(
        assignModalTask.id,
        volunteer.uid,
        volunteer.name || volunteer.displayName || volunteer.email
      );
      setAssignModalTask(null);
    } catch (err) {
      alert('Assignment failed: ' + err.message);
    }
  };

  // 6. Mark Task Completed by Organizer
  const handleOrganizerCompleteTask = async (task) => {
    try {
      const volId = task.assignedVolunteerId || (Array.isArray(task.assignedVolunteerIds) && task.assignedVolunteerIds[0]) || currentUser?.uid;
      await completeTask(task.id, volId, 'Verified and marked completed by Organizer', true);
      if (task.assignedVolunteerId) {
        createNotification({
          userId: task.assignedVolunteerId,
          type: 'task_completed',
          title: 'Task Verified & Completed',
          message: `Organizer verified and marked "${task.title}" as completed.`,
          taskId: task.id,
        }).catch(() => {});
      }
      alert(`Task "${task.title}" marked as completed!`);
    } catch (err) {
      alert('Failed to complete task: ' + err.message);
    }
  };

  // 6. Delete Task Trigger
  const handleDeleteTask = (task) => {
    setConfirmDialog({
      title: 'Delete Operational Task',
      message: `Are you sure you want to permanently delete task "${task.title}"? This cannot be undone.`,
      confirmLabel: 'Delete Task',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await deleteTask(task.id);
        } catch (err) {
          alert('Delete failed: ' + err.message);
        }
      },
    });
  };

  // 7. Delete Campaign Trigger
  const handleDeleteCampaign = (campaign) => {
    setConfirmDialog({
      title: 'Delete Emergency Campaign',
      message: `Are you sure you want to delete campaign "${campaign.name}"? Tasks associated with this campaign will remain in the database.`,
      confirmLabel: 'Delete Campaign',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await deleteCampaign(campaign.id);
        } catch (err) {
          alert('Delete failed: ' + err.message);
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
              <Shield className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {activeSection === 'recovery' ? 'Task Recovery' :
               activeSection === 'campaigns' ? 'Campaigns' :
               activeSection === 'tasks' ? 'Tasks & Dispatches' :
               activeSection === 'volunteers' ? 'Volunteer Roster' :
               activeSection === 'impact' ? 'Impact Report' :
               'Organizer Dashboard'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold uppercase tracking-wider">
              Organizer
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {activeSection === 'recovery' ? 'Incident failover recovery and volunteer reassignment.' :
             activeSection === 'campaigns' ? 'Manage relief campaigns, locations, and milestones.' :
             activeSection === 'tasks' ? 'Track mission dispatches, assignments, and requirements.' :
             activeSection === 'volunteers' ? 'Registered field responders and contact information.' :
             activeSection === 'impact' ? 'Operational progress, task distribution, and completion rates.' :
             'Manage campaigns, coordinate volunteers, and keep every community initiative moving forward.'}
          </p>
        </div>

        {tasks.length === 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={Sparkles}
              loading={submitting}
              onClick={handleSeedMission}
            >
              Seed Sample Mission
            </Button>
          </div>
        )}
      </div>

      {/* Navigation Sub-Tabs (Always visible at the top of content area) */}
      <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => handleSectionChange('dashboard')}
          className={`px-3.5 py-2 font-bold rounded-lg transition ${
            activeSection === 'dashboard'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          All Operations
        </button>
        <button
          onClick={() => handleSectionChange('campaigns')}
          className={`px-3.5 py-2 font-bold rounded-lg transition ${
            activeSection === 'campaigns'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Campaigns ({campaigns.length})
        </button>
        <button
          onClick={() => handleSectionChange('tasks')}
          className={`px-3.5 py-2 font-bold rounded-lg transition ${
            activeSection === 'tasks'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Tasks ({tasks.length})
        </button>
        <button
          onClick={() => handleSectionChange('recovery')}
          className={`px-3.5 py-2 font-bold rounded-lg transition flex items-center gap-1.5 ${
            activeSection === 'recovery'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Task Recovery</span>
          {attentionTasks.length > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeSection === 'recovery'
                  ? 'bg-white text-rose-700'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              {attentionTasks.length}
            </span>
          )}
        </button>
        <button
          onClick={() => handleSectionChange('volunteers')}
          className={`px-3.5 py-2 font-bold rounded-lg transition ${
            activeSection === 'volunteers'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Volunteer Roster ({registeredVolunteers.length})
        </button>
        <button
          onClick={() => handleSectionChange('impact')}
          className={`px-3.5 py-2 font-bold rounded-lg transition ${
            activeSection === 'impact'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Impact Report
        </button>
      </div>

      {/* Overview Dashboard Widgets (Shown on All Operations / Dashboard) */}
      {activeSection === 'dashboard' && (
        <div className="space-y-6">
          {/* Prominent Quick Actions Callout (KEPT as sole top create action) */}
          <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-white p-4 sm:p-5 rounded-2xl border border-blue-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-blue-600" />
                Organizer Controls: Create Campaigns &amp; Tasks
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Create community campaigns with tasks, or dispatch individual tasks directly to the volunteer roster.
              </p>
            </div>
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Button
                variant="primary"
                size="sm"
                icon={Flag}
                onClick={() => {
                  setEditingCampaign(null);
                  setCampaignName('');
                  setCampaignDesc('');
                  setCampaignCategory('Community Support');
                  setCampaignLocation('');
                  setCampaignDate(new Date().toISOString().slice(0, 10));
                  setCampaignEndDate('');
                  setCampaignStatus('active');
                  setCampaignFormError('');
                  setCampaignTasks([]);
                  setIsCampaignModalOpen(true);
                }}
                className="flex-1 sm:flex-none shadow-xs font-bold"
              >
                + Create Campaign
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={PlusCircle}
                onClick={() => {
                  setTaskTitle('');
                  setTaskDescription('');
                  setTaskPriority('normal');
                  setTaskDeadline('');
                  setTaskLocation('');
                  setTaskVolunteersNeeded(1);
                  setTaskSkills('');
                  setIsTaskModalOpen(true);
                }}
                className="flex-1 sm:flex-none bg-white hover:bg-slate-50 border-blue-300 text-blue-700 font-bold"
              >
                + Add Task
              </Button>
            </div>
          </div>

          {/* 5 Real-time Summary Cards (Active Tasks removed as requested) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* Total Campaigns */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-blue-200 transition">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Campaigns</span>
                <Flag className="w-4 h-4 text-blue-600" />
              </div>
              <div className="mt-2 text-2xl font-extrabold text-slate-900">{campaigns.length}</div>
              <div className="mt-1 text-[11px] text-slate-400">
                Community initiatives
              </div>
            </div>

            {/* Total Tasks */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-blue-200 transition">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Tasks</span>
                <ClipboardList className="w-4 h-4 text-slate-400" />
              </div>
              <div className="mt-2 text-2xl font-extrabold text-slate-900">{metrics.total}</div>
              <div className="mt-1 text-[11px] text-slate-400">
                {metrics.unassigned} open to claim
              </div>
            </div>

            {/* Blocked Tasks */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-rose-200 transition">
              <div className="flex items-center justify-between text-rose-700">
                <span className="text-[11px] font-bold uppercase tracking-wider">Blocked Tasks</span>
                <AlertOctagon className="w-4 h-4 text-rose-500" />
              </div>
              <div className="mt-2 text-2xl font-extrabold text-rose-600">{metrics.blocked}</div>
              <div className="mt-1 text-[11px] text-rose-700 font-medium">
                {metrics.blocked > 0 ? 'Recovery needed' : 'Clear'}
              </div>
            </div>

            {/* Completed Tasks */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-emerald-200 transition">
              <div className="flex items-center justify-between text-emerald-700">
                <span className="text-[11px] font-bold uppercase tracking-wider">Completed</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="mt-2 text-2xl font-extrabold text-emerald-600">{metrics.completed}</div>
              <div className="mt-1 text-[11px] text-emerald-700 font-medium">
                {metrics.total > 0 ? Math.round((metrics.completed / metrics.total) * 100) : 0}% resolved
              </div>
            </div>

            {/* Active Volunteers (Clickable to display registered volunteer names) */}
            <div
              onClick={() => setShowVolunteersModal(true)}
              className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-sm transition cursor-pointer group"
              title="Click to view registered volunteers list"
            >
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px] font-bold uppercase tracking-wider">Active Volunteers</span>
                <Users className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition" />
              </div>
              <div className="mt-2 text-2xl font-extrabold text-slate-900">
                {registeredVolunteers.length}
              </div>
              <div className="mt-1 text-[11px] text-emerald-600 font-medium flex items-center justify-between">
                <span>Field roster</span>
                <span className="text-[10px] text-emerald-700 font-bold group-hover:underline">Click to view &rarr;</span>
              </div>
            </div>
          </div>

          {/* Notifications / Tasks Requiring Attention Banner */}
          {attentionTasks.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900">
              <div className="flex items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">
                    Attention Required: {attentionTasks.length} task(s) stalled, blocked, or overdue
                  </h3>
                </div>
                <button
                  onClick={() => handleSectionChange('recovery')}
                  className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900 hover:bg-amber-300 transition"
                >
                  Open Recovery Hub &rarr;
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 mt-2">
                {attentionTasks.slice(0, 3).map((task) => {
                  const { suitableMatches, totalEligible } = getSmartBackupVolunteers(task, registeredVolunteers);
                  return (
                    <div
                      key={task.id}
                      className="bg-white p-3 rounded-lg border border-amber-200 shadow-2xs flex flex-col justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-slate-900 truncate">
                          {task.title}
                        </div>
                        <div className="text-[10px] text-rose-600 font-medium mt-0.5 truncate">
                          {task.status === TASK_STATUS.BLOCKED
                            ? `Blocked: ${task.blockReason || 'On-site blocker'}`
                            : 'Deadline expired'}
                        </div>

                        {/* Backup responders indicator */}
                        <div className="mt-1.5 flex items-center gap-1">
                          <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 inline-flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-blue-600" />
                            {totalEligible} available responder(s)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <span className="text-[10px] text-slate-400">
                          Target: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'Immediate'}
                        </span>
                        <button
                          onClick={() => handleTriggerRecover(task)}
                          className="px-2.5 py-1 text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition shrink-0 flex items-center gap-1"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                          Recover & Reassign
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION: TASK RECOVERY & SMART BACKUP VOLUNTEERS HUB                 */}
      {/* ==================================================================== */}
      {activeSection === 'recovery' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Task Recovery & Smart Backup Operations Center
                  </h2>
                  <p className="text-xs text-slate-500">
                    Transparent, deterministic volunteer matching for blocked and overdue missions using real Firestore profiles.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 font-bold border border-rose-200">
                {attentionTasks.length} Needs Recovery
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                {volunteers.filter((v) => (v.availability || 'available').toLowerCase() === 'available').length} Standby Responders
              </span>
            </div>
          </div>

          {attentionTasks.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                All Field Operations Healthy & Active
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No tasks are currently reported blocked or past deadline. All responders are moving forward smoothly.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {attentionTasks.map((task) => {
                const campaign = campaigns.find((c) => c.id === task.campaignId);
                const isBlocked = task.status === TASK_STATUS.BLOCKED;

                return (
                  <div
                    key={task.id}
                    className="p-5 bg-white rounded-2xl border border-rose-200/90 shadow-sm space-y-4"
                  >
                    {/* Task header and blocker info */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {task.id.slice(0, 8)}
                          </span>
                          <Badge status={task.status} size="sm" />
                          <Badge status={task.priority || 'urgent'} size="sm">
                            {(task.priority || 'urgent').toUpperCase()}
                          </Badge>
                          {campaign && (
                            <span className="text-xs text-slate-500 font-medium">
                              Campaign: {campaign.name}
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-slate-900">{task.title}</h3>
                        {task.description && (
                          <p className="text-xs text-slate-600 mt-1">{task.description}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={History}
                          onClick={() => setViewHistoryTask(task)}
                        >
                          Audit Trail
                        </Button>
                      </div>
                    </div>

                    {/* Blocker or Overdue Alert */}
                    {(isBlocked || !task.withdrawnVolunteerId) && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">
                            {isBlocked ? 'Reported Blocker:' : 'Overdue Alert:'}
                          </span>{' '}
                          {task.blockReason || 'Mission has passed scheduled deadline without check-in.'}{' '}
                          <span className="text-[11px] text-slate-500 ml-1">
                            (Current Assignee: {task.assignedVolunteerName || 'Previous Responder'})
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span>
                        Target Deadline:{' '}
                        <strong className="text-slate-700">
                          {task.deadline ? new Date(task.deadline).toLocaleString() : 'Immediate'}
                        </strong>
                      </span>
                    </div>

                    {/* Embedded Smart Backup Volunteers Recommendations */}
                    <div className="pt-2">
                      <SmartBackupVolunteersList
                        task={task}
                        volunteers={volunteers}
                        onAssign={(volunteer) =>
                          handleAssignBackupVolunteer(
                            task,
                            volunteer,
                            `Assigned smart backup volunteer: ${volunteer.name || volunteer.displayName || 'Volunteer'}`
                          )
                        }
                        onReleaseToPool={() =>
                          handleReleaseTaskToPool(
                            task,
                            'Incident Commander released task to open volunteer pool'
                          )
                        }
                        assigning={recoveryAssigningId === task.id}
                        showPoolRelease={true}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION: CAMPAIGNS VIEW                                             */}
      {/* ==================================================================== */}
      {activeSection === 'campaigns' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Active Campaigns & Relief Operations
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => {
                  setEditingCampaign(null);
                  setCampaignName('');
                  setCampaignDesc('');
                  setCampaignCategory('Community Support');
                  setCampaignLocation('');
                  setCampaignDate(new Date().toISOString().slice(0, 10));
                  setCampaignEndDate('');
                  setCampaignStatus('active');
                  setCampaignFormError('');
                  setCampaignTasks([]);
                  setIsCampaignModalOpen(true);
                }}
              >
                + Create Campaign
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={PlusCircle}
                onClick={() => {
                  setTaskTitle('');
                  setTaskDescription('');
                  setTaskPriority('normal');
                  setTaskDeadline('');
                  setTaskLocation('');
                  setTaskVolunteersNeeded(1);
                  setTaskSkills('');
                  setIsTaskModalOpen(true);
                }}
              >
                + Add Task
              </Button>
            </div>
          </div>

          {campaigns.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <Flag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No campaigns created yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Organize your volunteer dispatches into dedicated missions like regional disaster response or shelter relief.
              </p>
              <Button
                variant="primary"
                size="sm"
                className="mt-4"
                onClick={() => setIsCampaignModalOpen(true)}
              >
                Create Your First Campaign
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.map((camp) => {
                const campTasks = tasks.filter((t) => t.campaignId === camp.id);
                const campCompleted = campTasks.filter((t) => t.status === TASK_STATUS.COMPLETED).length;

                return (
                  <div
                    key={camp.id}
                    className="bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-300 transition shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          {camp.id.slice(0, 8)}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditCampaign(camp)}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded transition"
                            title="Edit Campaign"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteCampaign(camp)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                            title="Delete Campaign"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h3 className="font-bold text-slate-900 mt-2 text-sm">{camp.name}</h3>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{camp.description}</p>
                      {camp.location && (
                        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span className="truncate">{camp.location}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                        <span>Task Completion</span>
                        <span className="font-semibold text-slate-800">
                          {campCompleted} / {campTasks.length}
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full"
                          style={{
                            width: `${campTasks.length > 0 ? (campCompleted / campTasks.length) * 100 : 0}%`,
                          }}
                        />
                      </div>

                      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                        <span>
                          {camp.startDate ? new Date(camp.startDate).toLocaleDateString() : 'Ongoing'}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setTaskCampaignId(camp.id);
                              setTaskTitle('');
                              setTaskDescription('');
                              setTaskPriority('normal');
                              setTaskDeadline('');
                              setTaskLocation('');
                              setTaskSkills('');
                              setIsTaskModalOpen(true);
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded-md transition"
                            title="Create task for this campaign"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Task</span>
                          </button>
                          <button
                            onClick={() => {
                              setCampaignFilter(camp.id);
                              setActiveSection('tasks');
                            }}
                            className="text-blue-600 hover:underline font-semibold"
                          >
                            View Tasks &rarr;
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION: VOLUNTEERS ROSTER                                          */}
      {/* ==================================================================== */}
      {activeSection === 'volunteers' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Registered Volunteers
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              {volunteers.length} registered field responders
            </span>
          </div>

          {volunteers.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No volunteers registered yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Volunteers who register using the public registration form will automatically appear in this live directory.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {volunteers.map((vol) => {
                const volTasks = tasks.filter((t) => t.assignedVolunteerId === vol.uid);
                const activeVolTasks = volTasks.filter((t) => t.status !== TASK_STATUS.COMPLETED);

                return (
                  <div
                    key={vol.uid}
                    className="bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-300 transition shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                          {(vol.name || vol.displayName || vol.email || 'V')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-slate-900">
                            {vol.name || vol.displayName || 'Volunteer'}
                          </div>
                          <div className="text-[11px] text-slate-400">{vol.email}</div>
                        </div>
                      </div>
                      <Badge status={vol.availability || 'available'} size="sm">
                        {(vol.availability || 'available').toUpperCase()}
                      </Badge>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500">
                        Active Dispatches:{' '}
                        <strong className="text-slate-800">{activeVolTasks.length}</strong>
                      </span>
                      <span className="text-emerald-700 font-medium">
                        Completed: {volTasks.length - activeVolTasks.length}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION: IMPACT REPORT                                              */}
      {/* ==================================================================== */}
      {activeSection === 'impact' && (
        <ImpactReportView
          tasks={tasks}
          campaigns={campaigns}
          volunteers={volunteers}
          onViewTaskAudit={(task) => setViewHistoryTask(task)}
        />
      )}

      {/* ==================================================================== */}
      {/* SECTION: MAIN OPERATIONS & TASKS (Default View)                     */}
      {/* ==================================================================== */}
      {(activeSection === 'dashboard' || activeSection === 'tasks') && (
        <Card
          title="Live Mission Dispatch & Operations"
          subtitle="Real-time task synchronization from Cloud Firestore. Tasks can be claimed, assigned, or recovered."
          icon={ClipboardList}
          action={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={Flag}
                onClick={() => {
                  setEditingCampaign(null);
                  setCampaignName('');
                  setCampaignDesc('');
                  setCampaignCategory('Community Support');
                  setCampaignLocation('');
                  setCampaignDate(new Date().toISOString().slice(0, 10));
                  setCampaignEndDate('');
                  setCampaignStatus('active');
                  setCampaignFormError('');
                  setCampaignTasks([]);
                  setIsCampaignModalOpen(true);
                }}
              >
                + Create Campaign
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => {
                  setTaskTitle('');
                  setTaskDescription('');
                  setTaskPriority('normal');
                  setTaskDeadline('');
                  setTaskLocation('');
                  setTaskVolunteersNeeded(1);
                  setTaskSkills('');
                  setIsTaskModalOpen(true);
                }}
              >
                + Add Task
              </Button>
            </div>
          }
        >
          {/* Filters Bar: Campaign, Status, Deadline, Search */}
          <div className="mb-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search title, description, volunteer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Campaign Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500">Campaign:</span>
              <select
                value={campaignFilter}
                onChange={(e) => setCampaignFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
              >
                <option value="all">All Campaigns</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
              >
                <option value="all">All Statuses</option>
                <option value={TASK_STATUS.UNASSIGNED}>Unassigned</option>
                <option value={TASK_STATUS.ASSIGNED}>Active / Assigned</option>
                <option value={TASK_STATUS.BLOCKED}>Blocked</option>
                <option value="overdue">Overdue</option>
                <option value={TASK_STATUS.COMPLETED}>Completed</option>
              </select>
            </div>

            {/* Deadline Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500">Deadline:</span>
              <select
                value={deadlineFilter}
                onChange={(e) => setDeadlineFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
              >
                <option value="all">All Deadlines</option>
                <option value="today">Due Today</option>
                <option value="week">Due This Week</option>
                <option value="overdue">Expired / Overdue</option>
              </select>
            </div>

            {/* Reset Filters button if active */}
            {(statusFilter !== 'all' || campaignFilter !== 'all' || deadlineFilter !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setCampaignFilter('all');
                  setDeadlineFilter('all');
                  setSearchQuery('');
                }}
                className="text-[11px] font-semibold text-blue-600 hover:underline px-2"
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* Tasks Table / Empty State */}
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                  Connecting to live Cloud Firestore stream...
                </div>
              ) : tasks.length === 0 ? (
                <div>
                  <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">No operational tasks dispatched yet.</p>
                  <p className="text-slate-400 mt-1">
                    Click "Dispatch Task" above to publish your first assignment to volunteers.
                  </p>
                </div>
              ) : (
                <div>
                  <Filter className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">No tasks match your selected filters.</p>
                  <button
                    onClick={() => {
                      setStatusFilter('all');
                      setCampaignFilter('all');
                      setDeadlineFilter('all');
                      setSearchQuery('');
                    }}
                    className="mt-2 text-blue-600 font-bold hover:underline"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto -mx-6 -mb-6">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-y border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-6">Task Title & Campaign</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Assigned Volunteer</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Deadline</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTasks.map((task) => {
                    const isOverdue =
                      task.status !== TASK_STATUS.COMPLETED &&
                      task.deadline &&
                      new Date(task.deadline) < new Date();

                    const campaign = campaigns.find((c) => c.id === task.campaignId);

                    return (
                      <tr key={task.id} className="hover:bg-slate-50/70 transition">
                        {/* Title & Campaign */}
                        <td className="py-4 px-6 max-w-xs">
                          <div className="font-semibold text-slate-900 leading-snug">
                            {task.title}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-slate-400">{task.id.slice(0, 8)}</span>
                            <span>•</span>
                            <span className="text-blue-600 font-medium truncate max-w-[150px]">
                              {campaign ? campaign.name : 'General Operation'}
                            </span>
                            {task.location && (
                              <>
                                <span>•</span>
                                <span className="text-slate-600 flex items-center gap-0.5">
                                  <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                                  <span className="truncate max-w-[120px]">{task.location}</span>
                                </span>
                              </>
                            )}
                            {task.volunteersNeeded && (
                              <>
                                <span>•</span>
                                <span className="text-slate-600 flex items-center gap-0.5">
                                  <Users className="w-3 h-3 text-blue-500 shrink-0" />
                                  <span>{task.volunteersNeeded} vol.</span>
                                </span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Priority */}
                        <td className="py-4 px-4">
                          <Badge status={task.priority || 'normal'} size="sm">
                            {(task.priority || 'normal').toUpperCase()}
                          </Badge>
                        </td>

                        {/* Volunteer Assignment */}
                        <td className="py-4 px-4">
                          {(() => {
                            const needed = Number(task.volunteersNeeded) || 1;
                            const assignedList = Array.isArray(task.assignedVolunteers) && task.assignedVolunteers.length > 0
                              ? task.assignedVolunteers
                              : (Array.isArray(task.assignedVolunteerIds) && task.assignedVolunteerIds.length > 0)
                              ? task.assignedVolunteerIds.map((uid) => ({ uid, name: task.assignedVolunteerName || 'Volunteer' }))
                              : task.assignedVolunteerId
                              ? [{ uid: task.assignedVolunteerId, name: task.assignedVolunteerName || 'Assigned' }]
                              : [];
                            const count = assignedList.length;

                            return (
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    count >= needed
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : count > 0
                                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                      : 'bg-slate-100 text-slate-600'
                                  }`}>
                                    <Users className="w-3 h-3" />
                                    <span>{count} / {needed} Assigned</span>
                                  </span>
                                  {count < needed && (task.priority?.toLowerCase() === 'high' || task.priority?.toLowerCase() === 'urgent') && (
                                    <button
                                      onClick={() => setAssignModalTask(task)}
                                      className="text-blue-600 hover:text-blue-800 font-semibold text-[11px] hover:underline"
                                    >
                                      + Assign
                                    </button>
                                  )}
                                </div>
                                {assignedList.length > 0 && (
                                  <div className="text-[11px] text-slate-700 font-medium mt-1 truncate max-w-[180px]">
                                    {assignedList.map((v) => v.name).join(', ')}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          <Badge status={task.status} size="sm" />
                          {isOverdue && task.status !== TASK_STATUS.BLOCKED && (
                            <span className="block mt-0.5 text-[10px] text-amber-600 font-bold">
                              Overdue
                            </span>
                          )}
                          {task.blockReason && (
                            <div className="text-[10px] text-rose-600 font-medium truncate max-w-[160px] mt-0.5">
                              {task.blockReason}
                            </div>
                          )}
                        </td>

                        {/* Deadline */}
                        <td className="py-4 px-4 text-slate-600 whitespace-nowrap">
                          {task.deadline ? (
                            <div className={isOverdue ? 'text-amber-700 font-semibold' : ''}>
                              {new Date(task.deadline).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                              })}{' '}
                              {new Date(task.deadline).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          ) : (
                            <span className="text-slate-400">None</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Recover Task if Blocked or Overdue */}
                            {(task.status === TASK_STATUS.BLOCKED || isOverdue) && (
                              <Button
                                variant="danger"
                                size="sm"
                                icon={RotateCcw}
                                onClick={() => handleTriggerRecover(task)}
                              >
                                Recover
                              </Button>
                            )}

                            {/* Assign / Reassign - Only for High/Urgent priority */}
                            {(task.priority?.toLowerCase() === 'high' || task.priority?.toLowerCase() === 'urgent') && task.status !== TASK_STATUS.COMPLETED && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setAssignModalTask(task)}
                              >
                                {task.assignedVolunteerId ? 'Reassign' : 'Assign'}
                              </Button>
                            )}

                            {/* Mark Completed by Organizer */}
                            {task.status !== TASK_STATUS.COMPLETED && (
                              <Button
                                variant="primary"
                                size="sm"
                                icon={Check}
                                onClick={() => handleOrganizerCompleteTask(task)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                Mark Completed
                              </Button>
                            )}

                            {/* View Lifecycle & Recovery Audit Trail */}
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={History}
                              onClick={() => setViewHistoryTask(task)}
                              title="View Recovery Audit Trail & Lifecycle History"
                            >
                              Audit Trail
                            </Button>

                            {/* Delete Task */}
                            <button
                              onClick={() => handleDeleteTask(task)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition"
                              title="Delete Task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ==================================================================== */}
      {/* MODAL: DISPATCH NEW TASK                                            */}
      {/* ==================================================================== */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-blue-600" />
                Dispatch New Task to Field
              </h3>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deliver Cots to Shelter Pavilion B"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Campaign Mission
                </label>
                <select
                  value={taskCampaignId}
                  onChange={(e) => setTaskCampaignId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {campaigns.length === 0 ? (
                    <option value="">General Relief Initiative (Default)</option>
                  ) : (
                    campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description & Coordinates
                </label>
                <textarea
                  rows={2}
                  placeholder="Details, checkpoint coordinates, safety notes..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Location or Meeting Point
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Park paths or Hall A"
                    value={taskLocation}
                    onChange={(e) => setTaskLocation(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Volunteers Needed
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={taskVolunteersNeeded}
                    onChange={(e) => setTaskVolunteersNeeded(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Deadline *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={taskDeadline}
                    onChange={(e) => setTaskDeadline(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="urgent">Urgent</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Required Materials (optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Trash bags, gloves, log sheet"
                  value={taskMaterials}
                  onChange={(e) => setTaskMaterials(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Direct Assign Volunteer (Optional)
                </label>
                <select
                  value={taskAssigneeId}
                  onChange={(e) => setTaskAssigneeId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Leave Unassigned (Open to Claim)</option>
                  {volunteers.map((v) => (
                    <option key={v.uid} value={v.uid}>
                      {v.name || v.displayName || v.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsTaskModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  loading={submitting}
                >
                  Publish Task
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: CREATE / EDIT CAMPAIGN (WITH MULTI-TASK BUILDER)              */}
      {/* ==================================================================== */}
      {isCampaignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 my-8 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                  <Flag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingCampaign ? 'Edit Campaign' : 'Create Campaign'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Define campaign details and add missions for volunteers.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCampaignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto flex-1 pr-1 py-4 space-y-6">
              {/* SECTION 1: CAMPAIGN INFO */}
              <div className="space-y-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5 text-blue-600" />
                  <span>1. Campaign Details</span>
                </h4>

                {campaignFormError && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                    <AlertOctagon className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="font-semibold">{campaignFormError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Campaign Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Community Clean-Up Drive"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Campaign Description *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Describe the initiative, goals, and community purpose..."
                    value={campaignDesc}
                    onChange={(e) => setCampaignDesc(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Campaign Category *
                    </label>
                    <select
                      value={campaignCategory}
                      onChange={(e) => setCampaignCategory(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      <option value="Environmental Cleanup">Environmental Cleanup</option>
                      <option value="Food Distribution">Food Distribution</option>
                      <option value="Donation Drive">Donation Drive</option>
                      <option value="Disaster Relief">Disaster Relief</option>
                      <option value="Community Support">Community Support</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Campaign Status *
                    </label>
                    <select
                      value={campaignStatus}
                      onChange={(e) => setCampaignStatus(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      <option value="active">Active</option>
                      <option value="planning">Planning</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={campaignDate}
                      onChange={(e) => {
                        setCampaignDate(e.target.value);
                        if (!draftTaskDeadlineDate) setDraftTaskDeadlineDate(e.target.value);
                      }}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={campaignEndDate}
                      onChange={(e) => setCampaignEndDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Location / Meeting Point *
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="e.g. Community Park"
                        value={campaignLocation}
                        onChange={(e) => {
                          setCampaignLocation(e.target.value);
                          if (!draftTaskLocation) setDraftTaskLocation(e.target.value);
                        }}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 2: TASKS UNDER THIS CAMPAIGN */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <ClipboardList className="w-3.5 h-3.5 text-blue-600" />
                      <span>2. Tasks Under this Campaign ({campaignTasks.length})</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Add multiple tasks to this campaign and edit them before publishing.
                    </p>
                  </div>
                  {!isAddingTask && (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Plus}
                      onClick={() => {
                        setIsAddingTask(true);
                        setEditingTaskIndex(null);
                        setDraftTaskTitle('');
                        setDraftTaskDesc('');
                        setDraftTaskPriority('High');
                        setDraftTaskLocation(campaignLocation || '');
                        setDraftTaskDeadlineDate(campaignDate || '');
                        setDraftTaskDeadlineTime('10:00');
                        setDraftTaskVolunteersNeeded(1);
                        setDraftTaskSkills('');
                        setDraftTaskMaterials('');
                      }}
                    >
                      Add Task
                    </Button>
                  )}
                </div>

                {/* List of Tasks Added So Far */}
                {campaignTasks.length > 0 && (
                  <div className="space-y-2.5">
                    {campaignTasks.map((t, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border transition ${
                          editingTaskIndex === idx
                            ? 'border-blue-400 bg-blue-50/40 ring-2 ring-blue-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                                #{idx + 1}
                              </span>
                              <Badge status={(t.priority || 'medium').toLowerCase()} size="sm">
                                {t.priority ? t.priority.toUpperCase() : 'MEDIUM'}
                              </Badge>
                              <span className="text-xs font-bold text-slate-900 truncate">
                                {t.title}
                              </span>
                            </div>

                            {t.description && (
                              <p className="text-xs text-slate-600 line-clamp-1">{t.description}</p>
                            )}

                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                              {t.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                  <span>{t.location}</span>
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>{t.deadlineDate} at {t.deadlineTime}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3 text-slate-400" />
                                <span>{t.volunteersNeeded} {t.volunteersNeeded === 1 ? 'volunteer' : 'volunteers'} needed</span>
                              </span>
                              {t.requiredMaterials && (
                                <span className="text-slate-600 font-medium">
                                  Materials: {t.requiredMaterials}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleEditDraftTask(idx)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Edit task"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDraftTask(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Remove task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sub-form: Add / Edit a task in this campaign */}
                {isAddingTask && (
                  <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-blue-100">
                      <span className="text-xs font-bold text-blue-900">
                        {editingTaskIndex !== null ? `Edit Task #${editingTaskIndex + 1}` : 'New Task for this Campaign'}
                      </span>
                      <button
                        type="button"
                        onClick={resetDraftTask}
                        className="text-xs text-slate-500 hover:text-slate-700"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Task Title *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Collect litter from the park paths"
                          value={draftTaskTitle}
                          onChange={(e) => setDraftTaskTitle(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Priority *
                        </label>
                        <select
                          value={draftTaskPriority}
                          onChange={(e) => setDraftTaskPriority(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                        >
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Task Description
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Instructions, specifics, scope of work..."
                        value={draftTaskDesc}
                        onChange={(e) => setDraftTaskDesc(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Location or Meeting Point
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Park paths"
                          value={draftTaskLocation}
                          onChange={(e) => setDraftTaskLocation(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Deadline Date *
                        </label>
                        <input
                          type="date"
                          value={draftTaskDeadlineDate}
                          onChange={(e) => setDraftTaskDeadlineDate(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Deadline Time *
                        </label>
                        <input
                          type="time"
                          value={draftTaskDeadlineTime}
                          onChange={(e) => setDraftTaskDeadlineTime(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Volunteers Needed *
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="50"
                          value={draftTaskVolunteersNeeded}
                          onChange={(e) => setDraftTaskVolunteersNeeded(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Required Materials (optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Trash bags, gloves"
                          value={draftTaskMaterials}
                          onChange={(e) => setDraftTaskMaterials(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={handleSaveDraftTask}
                      >
                        {editingTaskIndex !== null ? 'Update Task' : '+ Save Task to Campaign'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                {campaignTasks.length === 0
                  ? 'Add at least 1 task (or publish campaign now and add tasks later)'
                  : `${campaignTasks.length} task(s) ready to publish`}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCampaignModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  loading={submitting}
                  onClick={handleSaveCampaign}
                >
                  {editingCampaign ? 'Save Changes' : `Publish Campaign & Tasks (${campaignTasks.length})`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: ASSIGN VOLUNTEER TO TASK                                     */}
      {/* ==================================================================== */}
      {assignModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Assign Volunteer to Task
              </h3>
              <button
                onClick={() => setAssignModalTask(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <div className="font-bold text-slate-900">{assignModalTask.title}</div>
              <div className="text-slate-500 mt-0.5">
                Priority: <strong className="text-slate-700 font-semibold">{(assignModalTask.priority || 'Normal').toUpperCase()}</strong>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-xs font-semibold text-slate-700 mb-2">
                Select from Available Responders:
              </h4>

              {volunteers.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  No volunteers currently registered in the database.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {volunteers.map((vol) => (
                    <button
                      key={vol.uid}
                      onClick={() => handleConfirmAssign(vol)}
                      className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-bold text-xs text-slate-900">
                          {vol.name || vol.displayName || 'Volunteer'}
                        </div>
                        <div className="text-[11px] text-slate-400">{vol.email}</div>
                      </div>
                      <Badge status={vol.availability || 'available'} size="sm">
                        {(vol.availability || 'available').toUpperCase()}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAssignModalTask(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TASK RECOVERY AUDIT TRAIL MODAL                                     */}
      {/* ==================================================================== */}
      {viewHistoryTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                Mission Lifecycle & Recovery Audit History
              </h3>
              <button
                onClick={() => setViewHistoryTask(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-4 max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <h4 className="font-bold text-sm text-slate-900">{viewHistoryTask.title}</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {viewHistoryTask.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[11px]">Current Status</span>
                  <Badge status={viewHistoryTask.status} size="sm" className="mt-1" />
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Priority</span>
                  <Badge status={viewHistoryTask.priority || 'normal'} size="sm" className="mt-1">
                    {(viewHistoryTask.priority || 'normal').toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Target Deadline</span>
                  <span className="font-semibold text-slate-700 block mt-1">
                    {viewHistoryTask.deadline
                      ? new Date(viewHistoryTask.deadline).toLocaleString()
                      : 'None'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Current Assignee</span>
                  <span className="font-semibold text-slate-700 block mt-1">
                    {viewHistoryTask.assignedVolunteerName || (viewHistoryTask.assignedVolunteerId ? 'Assigned' : 'Unassigned')}
                  </span>
                </div>
              </div>

              {/* Task Location, Volunteers Needed & Required Materials */}
              {(viewHistoryTask.location || viewHistoryTask.volunteersNeeded || viewHistoryTask.requiredMaterials) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-xs">
                  {viewHistoryTask.location && (
                    <div>
                      <span className="text-slate-500 block text-[10px] font-medium uppercase tracking-wider">Location / Meeting Point</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span>{viewHistoryTask.location}</span>
                      </span>
                    </div>
                  )}
                  {viewHistoryTask.volunteersNeeded && (
                    <div>
                      <span className="text-slate-500 block text-[10px] font-medium uppercase tracking-wider">Volunteers Needed</span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                        <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{viewHistoryTask.volunteersNeeded} volunteers</span>
                      </span>
                    </div>
                  )}
                  {viewHistoryTask.requiredMaterials && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-500 block text-[10px] font-medium uppercase tracking-wider">Required Materials</span>
                      <span className="font-medium text-slate-800 block mt-0.5">
                        {viewHistoryTask.requiredMaterials}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Recovery Metadata Callout */}
              {(viewHistoryTask.originalVolunteerId || viewHistoryTask.lastRecoveryReason) && (
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>Preserved Smart Recovery Metadata</span>
                  </div>
                  {viewHistoryTask.originalVolunteerId && (
                    <div className="text-[11px] text-purple-800">
                      Original Responder ID:{' '}
                      <code className="bg-purple-100 px-1 py-0.5 rounded font-mono">
                        {viewHistoryTask.originalVolunteerId}
                      </code>
                    </div>
                  )}
                  {viewHistoryTask.lastRecoveryReason && (
                    <div className="text-[11px] text-purple-800 mt-1">
                      Trigger Reason: "{viewHistoryTask.lastRecoveryReason}"
                    </div>
                  )}
                </div>
              )}

              {/* Recovery History Timeline */}
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Lifecycle & Recovery Audit Trail
                </h5>

                {(!viewHistoryTask.recoveryHistory || viewHistoryTask.recoveryHistory.length === 0) ? (
                  <p className="text-xs text-slate-400 italic">
                    No recovery actions recorded yet. Task is in its initial lifecycle stage.
                  </p>
                ) : (
                  <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {viewHistoryTask.recoveryHistory.map((event, idx) => (
                      <div key={idx} className="relative">
                        <span
                          className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white ${
                            event.action.includes('recovered')
                              ? 'bg-purple-600'
                              : event.action === 'blocked'
                              ? 'bg-rose-600'
                              : event.action === 'completed'
                              ? 'bg-emerald-600'
                              : 'bg-blue-600'
                          }`}
                        />
                        <div className="text-xs">
                          <span className="font-bold text-slate-900 capitalize">
                            Action: {event.action.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-2">
                            {event.timestamp ? new Date(event.timestamp).toLocaleString() : ''}
                          </span>
                        </div>

                        {event.newVolunteerName && event.previousVolunteerName && (
                          <div className="text-[11px] text-purple-700 font-semibold mt-0.5">
                            Hand-off: {event.previousVolunteerName} &rarr; {event.newVolunteerName}
                          </div>
                        )}

                        {event.reason && (
                          <p className="text-xs text-rose-600 mt-0.5">
                            Reason: {event.reason}
                          </p>
                        )}

                        {event.notes && (
                          <p className="text-xs text-slate-600 mt-0.5 italic">
                            Notes: {event.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewHistoryTask(null)}
              >
                Close Audit Trail
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SMART TASK RECOVERY & BACKUP VOLUNTEERS MODAL                       */}
      {/* ==================================================================== */}
      {recoveryModalTask && (
        <SmartRecoveryModal
          task={recoveryModalTask}
          volunteers={volunteers}
          onClose={() => setRecoveryModalTask(null)}
          onAssignBackup={(volunteer, reason) =>
            handleAssignBackupVolunteer(recoveryModalTask, volunteer, reason)
          }
          onReleaseToPool={(reason) =>
            handleReleaseTaskToPool(recoveryModalTask, reason)
          }
        />
      )}

      {/* ==================================================================== */}
      {/* CONFIRMATION DIALOG                                                 */}
      {/* ==================================================================== */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">{confirmDialog.title}</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              {confirmDialog.message}
            </p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmDialog(null)}
              >
                Cancel
              </Button>
              <Button
                variant={confirmDialog.confirmVariant || 'primary'}
                size="sm"
                onClick={async () => {
                  const onConfirm = confirmDialog.onConfirm;
                  setConfirmDialog(null);
                  await onConfirm();
                }}
              >
                {confirmDialog.confirmLabel || 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* REGISTERED ACTIVE VOLUNTEERS ROSTER MODAL                            */}
      {/* ==================================================================== */}
      {showVolunteersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Registered Volunteers ({registeredVolunteers.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Verified volunteer responder accounts registered on RELAY
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowVolunteersModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {registeredVolunteers.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No volunteers registered yet.
                </div>
              ) : (
                registeredVolunteers.map((vol) => {
                  const volTasks = tasks.filter(
                    (t) =>
                      t.assignedVolunteerId === vol.uid ||
                      (Array.isArray(t.assignedVolunteerIds) && t.assignedVolunteerIds.includes(vol.uid)) ||
                      (Array.isArray(t.assignedVolunteers) && t.assignedVolunteers.some((v) => v.uid === vol.uid))
                  );
                  const activeCount = volTasks.filter((t) => t.status !== TASK_STATUS.COMPLETED).length;

                  return (
                    <div
                      key={vol.uid || vol.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-emerald-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 font-bold text-sm flex items-center justify-center shrink-0">
                          {(vol.name || vol.displayName || vol.email || 'V')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <span>{vol.name || vol.displayName || 'Volunteer'}</span>
                            <Badge status={vol.availability || 'available'} size="xs">
                              {(vol.availability || 'available').toUpperCase()}
                            </Badge>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{vol.email}</div>
                        </div>
                      </div>

                      <div className="text-right sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                        <div className="text-[11px] text-slate-500">
                          Active Tasks: <strong className="text-slate-800">{activeCount}</strong>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Registered:{' '}
                          {vol.createdAt?.toDate
                            ? vol.createdAt.toDate().toLocaleDateString()
                            : vol.createdAt
                            ? new Date(vol.createdAt).toLocaleDateString()
                            : 'Active'}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVolunteersModal(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
