import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import {
  Users,
  CheckCircle,
  Clock,
  MapPin,
  AlertCircle,
  Radio,
  ClipboardList,
  Send,
  Sparkles,
  Check,
  AlertOctagon,
  X,
  History,
  Shield,
  Tag,
  CheckCircle2,
  Calendar,
  Info,
  ChevronRight,
  Flame,
  RotateCcw,
  Zap,
  Flag,
  Filter,
  User,
  Mail,
  Phone,
  LogOut,
  Save,
} from 'lucide-react';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';

import { useAuth } from '../context/AuthContext';
import {
  subscribeToTasks,
  subscribeToCampaigns,
  claimTask,
  claimRecoveryTask,
  leaveTask,
  blockTask,
  unblockTask,
  completeTask,
  createNotification,
  getUserProfile,
  updateUserProfile,
  TASK_STATUS,
} from '../services/databaseService';

export default function VolunteerDashboardPage({ section: sectionProp }) {
  const { currentUser, userRole, isVolunteer } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  // Active section tab: 'campaigns' | 'my-tasks' | 'available' | 'completed' | 'profile'
  const sectionParam = searchParams.get('section');
  const safeSection = sectionParam === 'blocked' ? 'available' : sectionParam;
  const initialTab = sectionProp || (
    safeSection === 'field-ops' ? 'campaigns' :
    safeSection || (
      location.pathname.includes('/profile') ? 'profile' :
      location.pathname.includes('/campaigns') ? 'campaigns' :
      'my-tasks'
    )
  );
  const [activeTab, setActiveTab] = useState(initialTab);

  // Campaign selection filter & preview
  const [selectedCampaignFilter, setSelectedCampaignFilter] = useState('all');
  const [expandedCampaignId, setExpandedCampaignId] = useState(null);

  useEffect(() => {
    if (sectionProp) {
      setActiveTab(sectionProp);
    } else if (sectionParam) {
      setActiveTab(sectionParam === 'field-ops' ? 'campaigns' : (sectionParam === 'blocked' ? 'available' : sectionParam));
    } else if (location.pathname.includes('/profile')) {
      setActiveTab('profile');
    } else if (location.pathname.includes('/campaigns')) {
      setActiveTab('campaigns');
    } else if (location.pathname.includes('/recovery')) {
      setActiveTab('available');
    }
  }, [sectionProp, sectionParam, location.pathname]);

  // Firestore Live State
  const [tasks, setTasks] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // User feedback alerts
  const [alertMessage, setAlertMessage] = useState(null); // { type: 'success' | 'error', text }

  // Action states
  const [claimingId, setClaimingId] = useState(null);
  const [blockModalTask, setBlockModalTask] = useState(null);
  const [blockReason, setBlockReason] = useState('');
  const [completeModalTask, setCompleteModalTask] = useState(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [viewHistoryTask, setViewHistoryTask] = useState(null);

  // Leave / Withdraw from Task states
  const [leaveModalTask, setLeaveModalTask] = useState(null);
  const [leaveReason, setLeaveReason] = useState('');
  const [leavingId, setLeavingId] = useState(null);

  // Responder Profile State (Loaded for task matching & profile management)
  const [volunteerName, setVolunteerName] = useState('');
  const [availability, setAvailability] = useState('available');
  const [skills, setSkills] = useState([]);
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileLocation, setProfileLocation] = useState('');
  const [profileAvailability, setProfileAvailability] = useState('available');
  const [profileSkills, setProfileSkills] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Real-time Firestore Tasks and Campaigns listeners
  useEffect(() => {
    setLoading(true);

    const unsubTasks = subscribeToTasks((liveTasks) => {
      setTasks(liveTasks);
      setLoading(false);
    });

    const unsubCampaigns = subscribeToCampaigns((liveCampaigns) => {
      setCampaigns(liveCampaigns);
    });

    return () => {
      unsubTasks();
      unsubCampaigns();
    };
  }, []);

  // Fetch initial user profile
  useEffect(() => {
    if (!currentUser) return;

    getUserProfile(currentUser.uid)
      .then((profile) => {
        if (profile) {
          setUserProfile(profile);
          const nameVal = profile.name || profile.displayName || '';
          setVolunteerName(nameVal);
          setProfileName(nameVal);
          setProfilePhone(profile.phone || '');
          setProfileLocation(profile.location || '');
          const availVal = profile.availability || 'available';
          setAvailability(availVal);
          setProfileAvailability(availVal);
          const skillsList = Array.isArray(profile.skills) ? profile.skills : ['First Aid & CPR', 'Logistics Support'];
          setSkills(skillsList);
          setProfileSkills(skillsList.join(', '));
        }
      })
      .catch((err) => console.warn('Could not load user profile:', err));
  }, [currentUser]);

  // Dismiss user feedback alert after 4 seconds
  useEffect(() => {
    if (!alertMessage) return;
    const timer = setTimeout(() => setAlertMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [alertMessage]);

  // --------------------------------------------------------------------------
  // Categorized Task Lists
  // --------------------------------------------------------------------------
  const myActiveTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.status === TASK_STATUS.COMPLETED || t.status === TASK_STATUS.CANCELLED) return false;
      const isAssignedToMe =
        t.assignedVolunteerId === currentUser?.uid ||
        (Array.isArray(t.assignedVolunteerIds) && t.assignedVolunteerIds.includes(currentUser?.uid)) ||
        (Array.isArray(t.assignedVolunteers) && t.assignedVolunteers.some((v) => v.uid === currentUser?.uid));
      return Boolean(isAssignedToMe);
    });
  }, [tasks, currentUser]);

  const availableTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.status === TASK_STATUS.COMPLETED || t.status === TASK_STATUS.CANCELLED) return false;
      if (t.status === TASK_STATUS.BLOCKED || t.status === TASK_STATUS.OVERDUE) return false;
      const maxNeeded = Number(t.volunteersNeeded) || 1;
      const currentList = Array.isArray(t.assignedVolunteerIds)
        ? t.assignedVolunteerIds
        : t.assignedVolunteerId
        ? [t.assignedVolunteerId]
        : [];
      const alreadyClaimed = currentUser?.uid && (
        currentList.includes(currentUser.uid) ||
        t.assignedVolunteerId === currentUser.uid ||
        (Array.isArray(t.assignedVolunteers) && t.assignedVolunteers.some((v) => v.uid === currentUser.uid))
      );
      // Keep in available tasks if spots remain for others OR if already claimed by this user
      return currentList.length < maxNeeded || alreadyClaimed;
    });
  }, [tasks, currentUser]);

  // Tasks needing peer recovery (Blocked by other volunteers OR Overdue non-completed tasks)
  const recoveryNeededTasks = useMemo(() => {
    const now = new Date();
    return tasks.filter((t) => {
      if (t.status === TASK_STATUS.COMPLETED || t.status === TASK_STATUS.CANCELLED) return false;
      if (t.status === TASK_STATUS.BLOCKED) return true;
      if (t.status === TASK_STATUS.OVERDUE) return true;
      if (t.deadline && new Date(t.deadline) < now) return true;
      return false;
    });
  }, [tasks]);

  // Campaign-filtered Available & Recovery Tasks for volunteer selection
  const filteredAvailableTasks = useMemo(() => {
    if (selectedCampaignFilter === 'all') return availableTasks;
    return availableTasks.filter((t) => t.campaignId === selectedCampaignFilter);
  }, [availableTasks, selectedCampaignFilter]);

  const filteredRecoveryNeededTasks = useMemo(() => {
    if (selectedCampaignFilter === 'all') return recoveryNeededTasks;
    return recoveryNeededTasks.filter((t) => t.campaignId === selectedCampaignFilter);
  }, [recoveryNeededTasks, selectedCampaignFilter]);

  const myBlockedTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.status !== TASK_STATUS.BLOCKED) return false;
      return (
        t.assignedVolunteerId === currentUser?.uid ||
        (Array.isArray(t.assignedVolunteerIds) && t.assignedVolunteerIds.includes(currentUser?.uid))
      );
    });
  }, [tasks, currentUser]);

  // Tasks where current volunteer specifically was assigned as recovery responder by Incident Command
  // Alert ONLY the specific user assigned as recovery
  const recoveryAssignedTasks = useMemo(() => {
    if (!currentUser?.uid) return [];
    return tasks.filter((t) => {
      if (t.status === TASK_STATUS.COMPLETED || t.status === TASK_STATUS.CANCELLED) return false;
      const isAssignedToMe =
        t.assignedVolunteerId === currentUser.uid ||
        (Array.isArray(t.assignedVolunteerIds) && t.assignedVolunteerIds.includes(currentUser.uid)) ||
        (Array.isArray(t.assignedVolunteers) && t.assignedVolunteers.some((v) => v.uid === currentUser.uid));
      if (!isAssignedToMe) return false;

      // Check if THIS SPECIFIC USER was assigned as the recovery volunteer (never alert other peers)
      const isRecoveryTarget =
        t.recoveryAssignedTo === currentUser.uid ||
        (() => {
          if (!Array.isArray(t.recoveryHistory) || t.recoveryHistory.length === 0) return false;
          const recoveryEvents = t.recoveryHistory.filter(
            (h) => h.action === 'recovered' || h.action === 'reassigned'
          );
          if (recoveryEvents.length === 0) return false;
          const lastRecovery = recoveryEvents[recoveryEvents.length - 1];
          return lastRecovery.newVolunteerId === currentUser.uid;
        })();

      return Boolean(isRecoveryTarget);
    });
  }, [tasks, currentUser]);

  const peerBlockedTasks = useMemo(() => {
    return recoveryNeededTasks.filter((t) => {
      const isMine =
        t.assignedVolunteerId === currentUser?.uid ||
        (Array.isArray(t.assignedVolunteerIds) && t.assignedVolunteerIds.includes(currentUser?.uid));
      return !isMine;
    });
  }, [recoveryNeededTasks, currentUser]);

  const myCompletedTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.status !== TASK_STATUS.COMPLETED) return false;
      return (
        t.assignedVolunteerId === currentUser?.uid ||
        (Array.isArray(t.assignedVolunteerIds) && t.assignedVolunteerIds.includes(currentUser?.uid))
      );
    });
  }, [tasks, currentUser]);

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------

  // Atomic Claim / Recovery Claim Task
  const handleClaimTask = async (task, isRecovery = false) => {
    if (!currentUser) return;
    setClaimingId(task.id);
    setAlertMessage(null);

    try {
      if (userRole !== 'volunteer') {
        throw new Error('Only volunteers are authorized to claim tasks. Organizers cannot claim volunteer assignments.');
      }

      const responderName = volunteerName || currentUser.displayName || currentUser.email;

      await claimTask(task.id, currentUser.uid, responderName);

      // Notify the organizer who created the task
      if (task.createdBy) {
        try {
          await createNotification({
            userId: task.createdBy,
            type: isRecovery ? 'task_recovered' : 'task_assigned',
            title: isRecovery ? 'Mission Recovered by Peer Volunteer' : 'Mission Claimed by Volunteer',
            message: isRecovery
              ? `Task "${task.title}" was recovered from ${task.assignedVolunteerName || 'previous responder'} by ${responderName}.`
              : `Task "${task.title}" was claimed by ${responderName}.`,
            taskId: task.id,
          });
        } catch (notifErr) {
          console.warn('Notification log:', notifErr.message);
        }
      }

      setAlertMessage({
        type: 'success',
        text: isRecovery
          ? `Mission Recovered! You have successfully taken over "${task.title}".`
          : `Spot Claimed! You have filled a volunteer spot for "${task.title}".`,
      });
    } catch (err) {
      console.error('Claim error:', err);
      setAlertMessage({
        type: 'error',
        text: err.message || 'This task is no longer available. Please explore other opportunities.',
      });
    } finally {
      setClaimingId(null);
    }
  };

  // Leave / Withdraw from Task
  const handleConfirmLeaveTask = async (e) => {
    e.preventDefault();
    if (!leaveModalTask || !currentUser) return;

    if (!leaveReason.trim()) {
      setAlertMessage({
        type: 'error',
        text: 'A reason for leaving the task is required.',
      });
      return;
    }

    setLeavingId(leaveModalTask.id);
    try {
      const responderName = volunteerName || currentUser.displayName || currentUser.email;

      await leaveTask(
        leaveModalTask.id,
        currentUser.uid,
        responderName,
        leaveReason.trim()
      );

      // Notify the organizer who created the task
      if (leaveModalTask.createdBy) {
        try {
          await createNotification({
            userId: leaveModalTask.createdBy,
            type: 'alert',
            title: 'Volunteer Left Assignment - Task Blocked',
            message: `Volunteer ${responderName} has left task "${leaveModalTask.title}". Reason: ${leaveReason.trim()}. Task is now BLOCKED and requires recovery handoff.`,
            taskId: leaveModalTask.id,
          });
        } catch (notifErr) {
          console.warn('Notice notification:', notifErr.message);
        }
      }

      setAlertMessage({
        type: 'success',
        text: `You have left "${leaveModalTask.title}". The task has been marked as BLOCKED for emergency recovery takeover.`,
      });

      setLeaveModalTask(null);
      setLeaveReason('');
    } catch (err) {
      setAlertMessage({
        type: 'error',
        text: err.message || 'Failed to leave task.',
      });
    } finally {
      setLeavingId(null);
    }
  };

  // Save Volunteer Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    setSavingProfile(true);
    try {
      const skillsArray = typeof profileSkills === 'string'
        ? profileSkills.split(',').map((s) => s.trim()).filter(Boolean)
        : profileSkills;

      await updateUserProfile(currentUser.uid, {
        name: profileName.trim() || 'Volunteer',
        displayName: profileName.trim() || 'Volunteer',
        phone: profilePhone.trim(),
        location: profileLocation.trim(),
        availability: profileAvailability,
        skills: skillsArray,
      });

      setVolunteerName(profileName.trim());
      setAvailability(profileAvailability);
      setSkills(skillsArray);

      setAlertMessage({
        type: 'success',
        text: 'Profile updated successfully! Saved to Cloud Firestore.',
      });
    } catch (err) {
      setAlertMessage({
        type: 'error',
        text: err.message || 'Failed to update profile.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  // Report Blocker Submit
  const handleConfirmBlocker = async (e) => {
    e.preventDefault();
    if (!blockModalTask || !currentUser) return;

    if (!blockReason.trim()) {
      alert('Please enter an explanation of the obstruction or blocker.');
      return;
    }

    try {
      const responderName = volunteerName || currentUser.displayName || currentUser.email;

      await blockTask(
        blockModalTask.id,
        currentUser.uid,
        blockReason.trim(),
        responderName
      );

      // Alert the organizer
      if (blockModalTask.createdBy) {
        try {
          await createNotification({
            userId: blockModalTask.createdBy,
            type: 'task_blocked',
            title: 'Mission Blocked - Recovery Failover Needed',
            message: `Task "${blockModalTask.title}" was reported blocked by ${responderName}: "${blockReason.trim()}"`,
            taskId: blockModalTask.id,
          });
        } catch (notifErr) {
          console.warn('Notice notification:', notifErr.message);
        }
      }

      setAlertMessage({
        type: 'success',
        text: `Blocker submitted for "${blockModalTask.title}". Task is now flagged in the Recovery Queue for peer takeover.`,
      });

      setBlockModalTask(null);
      setBlockReason('');
    } catch (err) {
      setAlertMessage({
        type: 'error',
        text: err.message || 'Failed to submit blocker.',
      });
    }
  };

  // Resume / Unblock Task
  const handleResumeTask = async (task) => {
    if (!currentUser) return;
    try {
      await unblockTask(task.id, currentUser.uid, 'Obstruction cleared by volunteer');
      setAlertMessage({
        type: 'success',
        text: `Task "${task.title}" resumed to active status.`,
      });
    } catch (err) {
      setAlertMessage({
        type: 'error',
        text: err.message || 'Failed to resume task.',
      });
    }
  };

  // Complete Task Submit
  const handleConfirmComplete = async (e) => {
    e.preventDefault();
    if (!completeModalTask || !currentUser) return;

    try {
      await completeTask(
        completeModalTask.id,
        currentUser.uid,
        completionNotes || 'Task completed successfully on schedule'
      );
      setAlertMessage({
        type: 'success',
        text: `Mission Accomplished! "${completeModalTask.title}" recorded as completed in Firestore.`,
      });
      setCompleteModalTask(null);
      setCompletionNotes('');
    } catch (err) {
      setAlertMessage({
        type: 'error',
        text: err.message || 'Failed to complete task.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Volunteer Hub
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold uppercase tracking-wider">
              Volunteer
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Discover opportunities, manage your responsibilities, and make a difference through every task you complete.
          </p>
        </div>
      </div>

      {/* Recovery Assignment Priority Alert Banner */}
      {recoveryAssignedTasks.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md border border-amber-400 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white text-amber-600 flex items-center justify-center shrink-0 shadow-sm font-bold">
              <RotateCcw className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-700/60 text-white tracking-wider border border-white/20">
                  Recovery Alert
                </span>
                <span className="text-xs font-bold text-amber-100">
                  Priority Reassignment
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-white mt-1">
                You have been assigned as a Recovery Volunteer!
              </h3>
              <p className="text-xs text-amber-50 mt-0.5 leading-relaxed">
                Incident Command assigned you to recover task:{' '}
                <strong className="underline text-white font-bold">
                  "{recoveryAssignedTasks[0].title}"
                </strong>
                {recoveryAssignedTasks[0].lastRecoveryReason && ` — ${recoveryAssignedTasks[0].lastRecoveryReason}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setActiveTab('my-tasks');
                setSearchParams({ section: 'my-tasks' });
                if (recoveryAssignedTasks[0]) {
                  setViewHistoryTask(recoveryAssignedTasks[0]);
                }
              }}
              className="bg-white text-amber-700 hover:bg-amber-50 font-bold shadow-xs text-xs"
            >
              View Recovery Mission &rarr;
            </Button>
          </div>
        </div>
      )}

      {/* 3 Real-Time Statistics Cards (Excludes Blocked Tasks for Volunteers) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* My Active Tasks */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-blue-200 transition">
          <div className="flex items-center justify-between text-blue-700">
            <span className="text-[11px] font-bold uppercase tracking-wider">My Active Tasks</span>
            <Radio className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-blue-600">{myActiveTasks.length}</div>
          <div className="mt-1 text-[11px] text-blue-700 font-medium">
            In progress
          </div>
        </div>

        {/* Available Tasks */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-emerald-200 transition">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Available Tasks</span>
            <Sparkles className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900">
            {availableTasks.length + recoveryNeededTasks.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            Open to claim
          </div>
        </div>

        {/* Completed Tasks */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-emerald-200 transition">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-[11px] font-bold uppercase tracking-wider">Completed Tasks</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-600">{myCompletedTasks.length}</div>
          <div className="mt-1 text-[11px] text-emerald-700 font-medium">
            Recorded impact
          </div>
        </div>
      </div>

      {/* Real-Time User Feedback Alert Banner */}
      {alertMessage && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between transition-all duration-200 ${alertMessage.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
        >
          <div className="flex items-center gap-2">
            {alertMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{alertMessage.text}</span>
          </div>
          <button
            onClick={() => setAlertMessage(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Section Navigation Tabs (6 exact clean text tabs) */}
      <div className="border-b border-slate-200 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => {
            setActiveTab('campaigns');
            setSearchParams({ section: 'field-ops' });
          }}
          className={`px-3.5 py-2 font-bold rounded-lg transition flex items-center gap-2 ${activeTab === 'campaigns'
            ? 'bg-blue-600 text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
        >
          <span>Field Operations</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'campaigns' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-800'
              }`}
          >
            {campaigns.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('my-tasks');
            setSearchParams({ section: 'my-tasks' });
          }}
          className={`px-3.5 py-2 font-bold rounded-lg transition flex items-center gap-2 ${activeTab === 'my-tasks'
            ? 'bg-blue-600 text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
        >
          <span>My Tasks</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'my-tasks' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-700'
              }`}
          >
            {myActiveTasks.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('available');
            setSearchParams({ section: 'available' });
          }}
          className={`px-3.5 py-2 font-bold rounded-lg transition flex items-center gap-2 ${activeTab === 'available'
            ? 'bg-blue-600 text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
        >
          <span>Available Tasks</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'available' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-800'
              }`}
          >
            {availableTasks.length + recoveryNeededTasks.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('completed');
            setSearchParams({ section: 'completed' });
          }}
          className={`px-3.5 py-2 font-bold rounded-lg transition flex items-center gap-2 ${activeTab === 'completed'
            ? 'bg-emerald-600 text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
        >
          <span>Completed Tasks</span>
          <span
            className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === 'completed' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}
          >
            {myCompletedTasks.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('profile');
            setSearchParams({ section: 'profile' });
          }}
          className={`px-3.5 py-2 font-bold rounded-lg transition flex items-center gap-2 ${activeTab === 'profile'
            ? 'bg-blue-600 text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
        >
          <span>My Profile</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* 0. SECTION: CAMPAIGNS (BROWSE & VOLUNTEER BY CAMPAIGN)               */}
      {/* ==================================================================== */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Flag className="w-5 h-5 text-blue-600" />
                <span>Active Relief Campaigns</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Choose a campaign to browse its respective tasks and claim volunteer assignments.
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 self-start sm:self-auto">
              {campaigns.length} Active {campaigns.length === 1 ? 'Campaign' : 'Campaigns'}
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 bg-white rounded-2xl border border-slate-200">
              <span className="animate-spin inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2" />
              Loading campaigns from Firestore...
            </div>
          ) : campaigns.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <Flag className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No campaigns created yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Incident Command organizers will create campaigns and their respective tasks here.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setActiveTab('available');
                  setSearchParams({ section: 'available' });
                }}
              >
                Browse All Available Tasks &rarr;
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {campaigns.map((camp) => {
                // Filter out emergency/blocked/overdue tasks from field ops campaign preview as requested
                const campTasks = tasks.filter(
                  (t) => t.campaignId === camp.id && t.status !== TASK_STATUS.BLOCKED && t.status !== TASK_STATUS.OVERDUE
                );
                const campOpenTasks = campTasks.filter(
                  (t) => t.status === TASK_STATUS.UNASSIGNED
                );
                const campMyTasks = campTasks.filter((t) => {
                  const currentList = Array.isArray(t.assignedVolunteerIds)
                    ? t.assignedVolunteerIds
                    : t.assignedVolunteerId
                    ? [t.assignedVolunteerId]
                    : [];
                  return currentUser?.uid && currentList.includes(currentUser.uid);
                });
                const isExpanded = expandedCampaignId === camp.id;

                return (
                  <div
                    key={camp.id}
                    className="bg-white rounded-2xl border border-slate-200 hover:border-blue-300 transition-all shadow-xs flex flex-col justify-between overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                          CAMPAIGN: {camp.id.slice(0, 8)}
                        </span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            campOpenTasks.length > 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {campOpenTasks.length} Open {campOpenTasks.length === 1 ? 'Task' : 'Tasks'}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 leading-tight">
                        {camp.name}
                      </h3>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        {camp.description || 'No description provided.'}
                      </p>
                      {camp.location && (
                        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>{camp.location}</span>
                        </div>
                      )}

                      {/* Dates & Metrics */}
                      <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-center">
                        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                          <div className="text-xs font-bold text-slate-800">{campTasks.length}</div>
                          <div className="text-[10px] text-slate-500">Total Tasks</div>
                        </div>
                        <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100">
                          <div className="text-xs font-bold text-emerald-700">{campOpenTasks.length}</div>
                          <div className="text-[10px] text-emerald-600">Open to Claim</div>
                        </div>
                      </div>

                      {camp.startDate && (
                        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>
                            Started {new Date(camp.startDate).toLocaleDateString()}
                            {camp.endDate ? ` • Target: ${new Date(camp.endDate).toLocaleDateString()}` : ''}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Footer */}
                    <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <button
                        onClick={() => setExpandedCampaignId(isExpanded ? null : camp.id)}
                        className="text-xs font-semibold text-slate-600 hover:text-blue-600 flex items-center gap-1 transition"
                      >
                        <span>{isExpanded ? 'Hide Tasks' : `Preview Tasks (${campTasks.length})`}</span>
                        <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </button>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setSelectedCampaignFilter(camp.id);
                          setActiveTab('available');
                          setSearchParams({ section: 'available' });
                        }}
                      >
                        Choose Tasks in this Campaign &rarr;
                      </Button>
                    </div>

                    {/* Expanded Preview of Tasks in this Campaign */}
                    {isExpanded && (
                      <div className="p-4 bg-slate-100/60 border-t border-slate-200 space-y-2">
                        {campTasks.length === 0 ? (
                          <div className="text-xs text-slate-500 text-center py-2">
                            No tasks created under this campaign yet.
                          </div>
                        ) : (
                          campTasks.map((t) => {
                            const needed = Number(t.volunteersNeeded) || 1;
                            const currentList = Array.isArray(t.assignedVolunteerIds)
                              ? t.assignedVolunteerIds
                              : t.assignedVolunteerId
                              ? [t.assignedVolunteerId]
                              : [];
                            const currentCount = currentList.length;
                            const spotsRemaining = Math.max(0, needed - currentCount);
                            const isClaimedByMe = currentUser?.uid && (
                              currentList.includes(currentUser.uid) ||
                              t.assignedVolunteerId === currentUser.uid ||
                              (Array.isArray(t.assignedVolunteers) && t.assignedVolunteers.some((v) => v.uid === currentUser.uid))
                            );
                            const isBlocked = t.status === TASK_STATUS.BLOCKED;

                            return (
                              <div
                                key={t.id}
                                className={`p-3.5 rounded-xl border text-xs transition flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                                  isBlocked
                                    ? 'bg-rose-50/90 border-2 border-rose-500 shadow-sm ring-2 ring-rose-500/20'
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Badge status={t.status} size="sm" />
                                    <Badge status={t.priority || 'normal'} size="sm">
                                      {(t.priority || 'normal').toUpperCase()}
                                    </Badge>
                                    <span className="font-bold text-slate-800 truncate">{t.title}</span>
                                    {isBlocked && (
                                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-rose-600 text-white animate-pulse">
                                        🚨 Needs Recovery
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{t.description}</p>

                                  {/* Prominent blocker callout if blocked */}
                                  {isBlocked && (
                                    <div className="mt-2 p-2 rounded-lg bg-white border border-rose-300 text-rose-900 font-medium text-[11px]">
                                      <strong className="text-rose-700">Obstruction Report:</strong>{' '}
                                      {t.blockReason || 'On-ground blocker reported. Attention required!'}
                                    </div>
                                  )}

                                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500 flex-wrap">
                                    {t.location && (
                                      <span className="flex items-center gap-1 text-slate-600 font-medium">
                                        <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                                        <span>{t.location}</span>
                                      </span>
                                    )}
                                    <span className={`flex items-center gap-1 font-semibold px-2 py-0.5 rounded border ${
                                      isClaimedByMe
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                        : 'bg-blue-50 text-blue-700 border-blue-200'
                                    }`}>
                                      <Users className="w-3 h-3 text-current shrink-0" />
                                      <span>
                                        {currentCount} / {needed} spots filled ({spotsRemaining} remaining)
                                      </span>
                                    </span>
                                    {t.deadline && (
                                      <span className="flex items-center gap-1 text-slate-500">
                                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                        <span>{new Date(t.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div className="shrink-0 flex items-center gap-2">
                                  {isBlocked ? (
                                    <Button
                                      variant="danger"
                                      size="sm"
                                      loading={claimingId === t.id}
                                      disabled={Boolean(claimingId)}
                                      onClick={() => handleClaimTask(t, true)}
                                      className="font-bold shadow-xs ring-1 ring-rose-500"
                                    >
                                      Recover &amp; Take Over &rarr;
                                    </Button>
                                  ) : isClaimedByMe ? (
                                    <div className="flex items-center gap-2">
                                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-1 rounded-md">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        Claimed by You
                                      </span>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setLeaveModalTask(t)}
                                        className="text-[11px] text-rose-600 border-rose-200 hover:bg-rose-50"
                                      >
                                        Leave
                                      </Button>
                                    </div>
                                  ) : spotsRemaining > 0 ? (
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      loading={claimingId === t.id}
                                      disabled={Boolean(claimingId)}
                                      onClick={() => handleClaimTask(t, false)}
                                    >
                                      Claim Spot ({spotsRemaining} left) &rarr;
                                    </Button>
                                  ) : (
                                    <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">
                                      All {needed} Spots Filled
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 1. SECTION: MY TASKS (ACTIVE DISPATCHES)                            */}
      {/* ==================================================================== */}
      {activeTab === 'my-tasks' && (
        <Card
          title="My Active Tasks"
          subtitle="Assignments claimed by you. Submit regular progress or report on-site blockers. Organizer verifies and marks tasks completed."
          icon={Radio}
        >
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <span className="animate-spin inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2" />
              Loading active assignments from Firestore...
            </div>
          ) : myActiveTasks.length === 0 ? (
            <div className="py-12 text-center">
              <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700 text-sm">You have no active dispatches</p>
              <p className="text-slate-400 text-xs mt-1">
                Browse available tasks to claim an emergency assignment.
              </p>
              <Button
                variant="primary"
                size="sm"
                className="mt-4"
                onClick={() => {
                  setActiveTab('available');
                  setSearchParams({ section: 'available' });
                }}
              >
                Browse Available Tasks &rarr;
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {myActiveTasks.map((task) => {
                const isOverdue =
                  task.deadline && new Date(task.deadline) < new Date();
                const campaign = campaigns.find((c) => c.id === task.campaignId);
                const isRecoveredMission = Boolean(
                  task.previousVolunteerId && task.previousVolunteerId !== currentUser?.uid
                );

                return (
                  <div
                    key={task.id}
                    className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50 transition flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                          {task.id.slice(0, 8)}
                        </span>
                        <Badge status={task.status} size="sm" />
                        <Badge status={task.priority || 'normal'} size="sm">
                          {(task.priority || 'normal').toUpperCase()}
                        </Badge>
                        {isRecoveredMission && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-purple-600" />
                            Recovered Mission
                          </span>
                        )}
                        {isOverdue && (
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                            Deadline Expired
                          </span>
                        )}
                        <span className="text-xs text-blue-600 font-semibold">
                          {campaign ? campaign.name : 'Emergency Initiative'}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-900 text-sm">{task.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                        {task.description}
                      </p>

                      {isRecoveredMission && task.lastRecoveryReason && (
                        <div className="text-[11px] text-purple-800 bg-purple-50 p-2 rounded-lg border border-purple-200">
                          <strong>Recovery Hand-off:</strong> Taken over from{' '}
                          {task.previousVolunteerName || 'previous responder'} (Blocker:{' '}
                          "{task.lastRecoveryReason}")
                        </div>
                      )}

                      {task.status === TASK_STATUS.BLOCKED && (
                        <div className="text-[11px] text-rose-800 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                          <strong>⚠️ Task Blocked:</strong> {task.blockReason || 'On-ground obstruction reported. Awaiting resolution.'}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Deadline:{' '}
                          <strong className={isOverdue ? 'text-amber-700' : 'text-slate-700'}>
                            {task.deadline ? new Date(task.deadline).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Open'}
                          </strong>
                        </span>
                        {task.location && (
                          <span className="flex items-center gap-1 text-slate-700 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-rose-500" />
                            <span>{task.location}</span>
                          </span>
                        )}
                        {task.volunteersNeeded && (
                          <span className="flex items-center gap-1 text-slate-700">
                            <Users className="w-3.5 h-3.5 text-blue-600" />
                            <span>{task.volunteersNeeded} vol. needed</span>
                          </span>
                        )}
                        {task.requiredMaterials && (
                          <span>
                            Materials: <strong>{task.requiredMaterials}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 md:pt-0">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={History}
                        onClick={() => setViewHistoryTask(task)}
                      >
                        History
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={LogOut}
                        className="text-amber-700 hover:bg-amber-50 border-amber-200"
                        onClick={() => {
                          setLeaveModalTask(task);
                          setLeaveReason('');
                        }}
                      >
                        Leave Task
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={AlertOctagon}
                        onClick={() => {
                          setBlockModalTask(task);
                          setBlockReason('');
                        }}
                      >
                        Report Blocker
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}



      {/* ==================================================================== */}
      {/* 2. SECTION: AVAILABLE TASKS & EMERGENCY RECOVERY QUEUE              */}
      {/* ==================================================================== */}
      {activeTab === 'available' && (
        <div className="space-y-6">
          {/* Campaign Selector / Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                <Flag className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">Choose Campaign</span>
                <span className="text-[11px] text-slate-500">
                  Select which campaign you want to choose tasks from:
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedCampaignFilter}
                onChange={(e) => setSelectedCampaignFilter(e.target.value)}
                className="text-xs font-medium border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">
                  All Campaigns ({availableTasks.length + recoveryNeededTasks.length} open tasks)
                </option>
                {campaigns.map((camp) => {
                  const campCount = tasks.filter(
                    (t) =>
                      t.campaignId === camp.id &&
                      (t.status === TASK_STATUS.UNASSIGNED ||
                        t.status === TASK_STATUS.BLOCKED ||
                        t.status === TASK_STATUS.OVERDUE)
                  ).length;
                  return (
                    <option key={camp.id} value={camp.id}>
                      {camp.name} ({campCount} open)
                    </option>
                  );
                })}
              </select>

              {selectedCampaignFilter !== 'all' && (
                <button
                  onClick={() => setSelectedCampaignFilter('all')}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 transition"
                  title="Show all campaigns"
                >
                  Show All
                </button>
              )}
            </div>
          </div>

          {/* Recovery Needed Tasks (Blocked / Overdue Dispatches) */}
          {filteredRecoveryNeededTasks.length > 0 && (
            <Card
              title="🚨 Emergency Tasks Requiring Recovery"
              subtitle="Assignments halted by on-ground obstructions or overdue deadlines. Standout tasks needing immediate recovery takeover."
              icon={RotateCcw}
              className="border-2 border-rose-500 bg-rose-50/20 shadow-lg ring-4 ring-rose-500/10"
            >
              <div className="space-y-3">
                {filteredRecoveryNeededTasks.map((task) => {
                  const campaign = campaigns.find((c) => c.id === task.campaignId);
                  const isBlocked = task.status === TASK_STATUS.BLOCKED;
                  const isBlockedByMe = task.assignedVolunteerId === currentUser?.uid;

                  return (
                    <div
                      key={task.id}
                      className={`p-5 rounded-2xl border-2 transition flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
                        isBlocked
                          ? 'border-rose-500 bg-rose-50/90 shadow-md ring-2 ring-rose-500/20'
                          : 'border-rose-300 bg-rose-50/40 hover:bg-rose-50/60'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        {isBlocked && (
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-sm animate-pulse mb-1">
                            <AlertOctagon className="w-4 h-4 text-white shrink-0" />
                            <span>⚠️ ACTION REQUIRED: MISSION BLOCKED ON GROUND</span>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded">
                            {task.id.slice(0, 8)}
                          </span>
                          <Badge status={task.status} size="sm" />
                          <Badge status={task.priority || 'urgent'} size="sm">
                            {(task.priority || 'urgent').toUpperCase()}
                          </Badge>
                          <span className="text-xs font-bold text-rose-700">
                            Recovery Open
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-900 text-sm mt-1">{task.title}</h3>
                        <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                          {task.description}
                        </p>

                        {/* Blocker alert callout */}
                        <div className="p-3 rounded-xl bg-white border-2 border-rose-300 text-xs text-rose-950 font-medium shadow-xs">
                          <div className="flex items-center gap-1.5 font-bold text-rose-700 uppercase tracking-wide text-[11px] mb-1">
                            <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
                            <span>{isBlocked ? 'Obstruction Report (Field Blocker):' : 'Overdue Alert:'}</span>
                          </div>
                          <p className="text-slate-800 leading-relaxed font-semibold">
                            {task.blockReason || 'Responder passed scheduled target deadline without completion.'}
                          </p>
                          <span className="text-[11px] text-slate-500 block mt-1">
                            Reported by / Assigned to: <strong className="text-slate-700">{task.assignedVolunteerName || 'Previous responder'}</strong>
                          </span>
                        </div>

                        {/* Required skills & details breakdown */}
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            Target Deadline:{' '}
                            <strong className="text-slate-700">
                              {task.deadline ? new Date(task.deadline).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Immediate'}
                            </strong>
                          </span>

                          {task.location && (
                            <span className="flex items-center gap-1 text-slate-700 font-medium">
                              <MapPin className="w-3.5 h-3.5 text-rose-500" />
                              <span>{task.location}</span>
                            </span>
                          )}

                          {(() => {
                            const needed = Number(task.volunteersNeeded) || 1;
                            const current = Array.isArray(task.assignedVolunteerIds)
                              ? task.assignedVolunteerIds.length
                              : task.assignedVolunteerId
                              ? 1
                              : 0;
                            const remaining = Math.max(0, needed - current);
                            return (
                              <span className="inline-flex items-center gap-1 font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                <Users className="w-3.5 h-3.5 text-blue-600" />
                                <span>{current} / {needed} volunteers ({remaining} {remaining === 1 ? 'spot' : 'spots'} remaining)</span>
                              </span>
                            );
                          })()}

                          {task.requiredMaterials && (
                            <span>
                              Materials: <strong>{task.requiredMaterials}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={History}
                          onClick={() => setViewHistoryTask(task)}
                        >
                          Audit Trail
                        </Button>

                        {isBlockedByMe ? (
                          <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200">
                            Blocked by you (Awaiting peer takeover)
                          </span>
                        ) : (
                          <Button
                            variant="danger"
                            size="sm"
                            icon={RotateCcw}
                            loading={claimingId === task.id}
                            disabled={Boolean(claimingId)}
                            onClick={() => handleClaimTask(task, true)}
                            className="font-bold shadow-md ring-2 ring-rose-500 text-xs py-2 px-3 whitespace-nowrap"
                          >
                            Recover &amp; Take Over &rarr;
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Standard Open Unassigned Dispatches */}
          <Card
            title="Open Unassigned Dispatches"
            icon={CheckCircle}
          >
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <span className="animate-spin inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2" />
                Loading open dispatches...
              </div>
            ) : filteredAvailableTasks.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                <p className="font-semibold text-slate-700">
                  {selectedCampaignFilter !== 'all'
                    ? 'No open tasks found in this selected campaign.'
                    : 'No unassigned tasks currently open.'}
                </p>
                <p className="mt-1">
                  {selectedCampaignFilter !== 'all'
                    ? 'You can switch campaigns or choose "All Campaigns" to see other opportunities.'
                    : 'Check the Recovery Queue above or check back when Incident Command dispatches new assignments.'}
                </p>
                {selectedCampaignFilter !== 'all' && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setSelectedCampaignFilter('all')}
                  >
                    Show All Campaigns
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAvailableTasks.map((task) => {
                  const campaign = campaigns.find((c) => c.id === task.campaignId);
                  const needed = Number(task.volunteersNeeded) || 1;
                  const currentList = Array.isArray(task.assignedVolunteerIds)
                    ? task.assignedVolunteerIds
                    : task.assignedVolunteerId
                    ? [task.assignedVolunteerId]
                    : [];
                  const currentCount = currentList.length;
                  const spotsRemaining = Math.max(0, needed - currentCount);
                  const isClaimedByMe = currentUser?.uid && (
                    currentList.includes(currentUser.uid) ||
                    task.assignedVolunteerId === currentUser.uid ||
                    (Array.isArray(task.assignedVolunteers) && task.assignedVolunteers.some((v) => v.uid === currentUser.uid))
                  );

                  return (
                    <div
                      key={task.id}
                      className={`p-5 rounded-xl border transition flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
                        isClaimedByMe
                          ? 'border-emerald-300 bg-emerald-50/20 shadow-xs'
                          : 'border-slate-200 hover:border-blue-300 bg-white'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            {task.id.slice(0, 8)}
                          </span>
                          {isClaimedByMe ? (
                            <span className="text-[10px] font-extrabold uppercase text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              CLAIMED BY YOU ({currentCount}/{needed})
                            </span>
                          ) : (
                            <Badge status={spotsRemaining === 0 ? 'assigned' : 'unassigned'} size="sm">
                              {currentCount}/{needed} SPOTS FILLED
                            </Badge>
                          )}
                          <Badge status={task.priority || 'normal'} size="sm">
                            {(task.priority || 'normal').toUpperCase()}
                          </Badge>
                          <span className="text-xs font-semibold text-blue-600">
                            {campaign ? campaign.name : 'Emergency Initiative'}
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-900 text-sm mt-1">{task.title}</h3>
                        <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                          {task.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            Target Deadline:{' '}
                            <strong className="text-slate-700">
                              {task.deadline ? new Date(task.deadline).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Flexible'}
                            </strong>
                          </span>

                          {task.location && (
                            <span className="flex items-center gap-1 text-slate-700 font-medium">
                              <MapPin className="w-3.5 h-3.5 text-rose-500" />
                              <span>{task.location}</span>
                            </span>
                          )}

                          <span className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded border ${
                            isClaimedByMe
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}>
                            <Users className="w-3.5 h-3.5 text-current shrink-0" />
                            <span>
                              {currentCount} / {needed} volunteers ({spotsRemaining} {spotsRemaining === 1 ? 'spot' : 'spots'} remaining)
                            </span>
                          </span>

                          {task.requiredMaterials && (
                            <span>
                              Materials: <strong className="text-slate-700">{task.requiredMaterials}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={History}
                          onClick={() => setViewHistoryTask(task)}
                        >
                          Details
                        </Button>

                        {isClaimedByMe ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Claimed by You
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setLeaveModalTask(task)}
                              className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300"
                            >
                              Leave Task
                            </Button>
                          </div>
                        ) : spotsRemaining > 0 ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            loading={claimingId === task.id}
                            disabled={Boolean(claimingId)}
                            onClick={() => handleClaimTask(task, false)}
                          >
                            Claim Spot ({spotsRemaining} left) &rarr;
                          </Button>
                        ) : (
                          <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg">
                            All {needed} Spots Filled
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      )}





      {/* ==================================================================== */}
      {/* 4. SECTION: COMPLETED TASKS                                         */}
      {/* ==================================================================== */}
      {activeTab === 'completed' && (
        <Card
          title="Completed Missions & Contribution Log"
          subtitle="Assignments you have resolved. Stored permanently in Cloud Firestore as your rescue history."
          icon={CheckCircle2}
        >
          {myCompletedTasks.length === 0 ? (
            <div className="py-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700 text-sm">No completed tasks yet</p>
              <p className="text-slate-400 text-xs mt-1">
                Claim active dispatches and complete them to build your mission accomplishment record.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myCompletedTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 rounded-xl border border-slate-200 bg-emerald-50/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                        {task.id.slice(0, 8)}
                      </span>
                      <Badge status="completed" size="sm">
                        COMPLETED
                      </Badge>
                      <span className="text-xs text-slate-400">
                        {task.completedAt
                          ? new Date(task.completedAt.seconds * 1000).toLocaleString()
                          : 'Recorded'}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm mt-1">{task.title}</h3>
                    {task.completionNotes && (
                      <p className="text-xs text-slate-600 mt-1 italic">
                        "{task.completionNotes}"
                      </p>
                    )}
                  </div>

                  <div className="shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={History}
                      onClick={() => setViewHistoryTask(task)}
                    >
                      Audit Trail
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ==================================================================== */}
      {/* 5. SECTION: MY PROFILE & CREDENTIALS                                 */}
      {/* ==================================================================== */}
      {activeTab === 'profile' && (
        <div className="space-y-6 max-w-4xl">
          {/* Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md shadow-blue-500/20 shrink-0">
                {(profileName || currentUser?.displayName || currentUser?.email || 'V')[0].toUpperCase()}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {profileName || currentUser?.displayName || 'Registered Responder'}
                </h2>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{currentUser?.email || 'N/A'}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Status:</span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                profileAvailability === 'available'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : profileAvailability === 'busy'
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  profileAvailability === 'available'
                    ? 'bg-emerald-500'
                    : profileAvailability === 'busy'
                    ? 'bg-amber-500'
                    : 'bg-slate-400'
                }`} />
                {profileAvailability === 'available' ? 'Available' : profileAvailability === 'busy' ? 'Busy' : 'Inactive / On-Call'}
              </span>
            </div>
          </div>

          {/* Impact Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Completed Missions</div>
              <div className="text-2xl font-bold text-emerald-600 mt-1">{myCompletedTasks.length}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Tasks successfully resolved</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Active Assignments</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">{myActiveTasks.length}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Currently assigned to you</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Reported Blockers</div>
              <div className="text-2xl font-bold text-rose-600 mt-1">{myBlockedTasks.length}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Awaiting recovery or resolution</div>
            </div>
          </div>

          {/* Profile Form */}
          <Card>
            <div className="border-b border-slate-100 pb-4 mb-6">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Personal Information &amp; Operational Preferences
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Keep your contact information and availability up-to-date.
              </p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address (Read-only)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={currentUser?.email || ''}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    Authentication identifier managed via Firebase Auth.
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="e.g. +1 (555) 019-2834"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Location / Operational Area
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={profileLocation}
                      onChange={(e) => setProfileLocation(e.target.value)}
                      placeholder="e.g. Sector 4 / Downtown Base"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Availability Status
                  </label>
                  <select
                    value={profileAvailability}
                    onChange={(e) => setProfileAvailability(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="available">Available (Ready for dispatches)</option>
                    <option value="busy">Busy (Currently on assignment)</option>
                    <option value="offline">Inactive / On-Call</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Role Assigned
                  </label>
                  <div className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-700 font-semibold flex items-center justify-between">
                    <span>Volunteer</span>
                    <span className="text-xs font-normal text-slate-400">Strictly volunteer permissions</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                <Button
                  variant="primary"
                  type="submit"
                  icon={Save}
                  loading={savingProfile}
                  className="shadow-sm"
                >
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: REPORT BLOCKER (Requires Reason)                             */}
      {/* ==================================================================== */}
      {blockModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-rose-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-rose-700 flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-rose-600" />
                Report Mission Blocker
              </h3>
              <button
                onClick={() => setBlockModalTask(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmBlocker} className="space-y-4 mt-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <span className="font-bold text-slate-900 block">{blockModalTask.title}</span>
                <span className="text-slate-500 text-[11px]">
                  Task ID: {blockModalTask.id.slice(0, 8)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Obstruction Reason / Blocker Explanation *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Downed electrical lines across Sector 4; medical transport vehicle tire puncture; waiting for security escort..."
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <p className="text-[11px] text-slate-500">
                Reporting a blocker immediately moves the task to the <strong>Recovery Queue</strong>, alerting Incident Command and opening the mission for takeover by available standby volunteers.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBlockModalTask(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  type="submit"
                >
                  Confirm & Report Blocker
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: MARK TASK COMPLETED                                          */}
      {/* ==================================================================== */}
      {completeModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Complete Mission Assignment
              </h3>
              <button
                onClick={() => setCompleteModalTask(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmComplete} className="space-y-4 mt-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <span className="font-bold text-slate-900 block">{completeModalTask.title}</span>
                <span className="text-slate-500 text-[11px]">
                  Task ID: {completeModalTask.id.slice(0, 8)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Completion Debrief & Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Delivered 15 kits to Nurse Jenkins at Main Tent; all units checked."
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCompleteModalTask(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                >
                  Confirm Completed
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: LEAVE TASK / WITHDRAW FROM ASSIGNMENT                         */}
      {/* ==================================================================== */}
      {leaveModalTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-amber-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <LogOut className="w-5 h-5 text-amber-600" />
                Leave Mission Assignment
              </h3>
              <button
                onClick={() => setLeaveModalTask(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmLeaveTask} className="space-y-4 mt-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                <span className="font-bold text-slate-900 block">{leaveModalTask.title}</span>
                <span className="text-slate-500 text-[11px]">
                  Task ID: {leaveModalTask.id.slice(0, 8)}
                </span>
              </div>

              <div className="p-3 bg-rose-50 rounded-lg border border-rose-200 text-xs text-rose-900 leading-relaxed font-medium">
                Leaving this assignment will mark the task as <strong>BLOCKED</strong> with your reason. Incident Command and standby responders will be alerted for immediate recovery takeover.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for leaving * (Required)
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain why you cannot continue this task (e.g. medical emergency, transport breakdown, scheduling conflict)..."
                  value={leaveReason}
                  onChange={(e) => setLeaveReason(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLeaveModalTask(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  loading={leavingId === leaveModalTask.id}
                  className="bg-rose-600 hover:bg-rose-700 focus:ring-rose-500 font-bold"
                >
                  Confirm &amp; Mark Blocked
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL: TASK DETAILS & RECOVERY AUDIT TRAIL                          */}
      {/* ==================================================================== */}
      {viewHistoryTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-blue-600" />
                Mission Details & Recovery Audit History
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
                  <span className="text-slate-400 block text-[11px]">Current Responder</span>
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
                  Task Lifecycle & Audit Trail
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
                          className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full ring-4 ring-white ${event.action.includes('recovered')
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
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
