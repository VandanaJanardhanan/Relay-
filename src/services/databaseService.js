import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  runTransaction,
  arrayUnion,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../firebase.js';

/**
 * Task Statuses enforced by RELAY
 * @readonly
 * @enum {string}
 */
export const TASK_STATUS = {
  UNASSIGNED: 'unassigned',
  ASSIGNED: 'assigned',
  BLOCKED: 'blocked',
  OVERDUE: 'overdue',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

/**
 * Validates that Firestore is initialized before performing queries
 */
function checkDatabaseReady() {
  if (!isFirebaseConfigured || !db) {
    throw new Error(
      'Cloud Firestore is not configured. Please supply your credentials in the .env file.'
    );
  }
}

// ============================================================================
// 1. GENERIC CRUD HELPERS
// ============================================================================

export async function createDocument(collectionName, data, customId = null) {
  checkDatabaseReady();

  const payload = {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  if (customId) {
    const docRef = doc(db, collectionName, customId);
    await setDoc(docRef, payload);
    return { id: customId, ...data };
  } else {
    const colRef = collection(db, collectionName);
    const docRef = await addDoc(colRef, payload);
    return { id: docRef.id, ...data };
  }
}

export async function getDocument(collectionName, docId) {
  checkDatabaseReady();

  const docRef = doc(db, collectionName, docId);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
}

export async function getDocuments(collectionName, queryConstraints = []) {
  checkDatabaseReady();

  const colRef = collection(db, collectionName);
  const q = queryConstraints.length > 0 ? query(colRef, ...queryConstraints) : colRef;
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

export async function updateDocument(collectionName, docId, data) {
  checkDatabaseReady();

  const docRef = doc(db, collectionName, docId);
  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
  };

  return await updateDoc(docRef, payload);
}

export async function deleteDocument(collectionName, docId) {
  checkDatabaseReady();

  const docRef = doc(db, collectionName, docId);
  return await deleteDoc(docRef);
}

export function subscribeToCollection(collectionName, onNext, queryConstraints = [], onError) {
  if (!isFirebaseConfigured || !db) {
    onNext([]);
    return () => {};
  }

  const colRef = collection(db, collectionName);
  const q = queryConstraints.length > 0 ? query(colRef, ...queryConstraints) : colRef;

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      onNext(items);
    },
    (error) => {
      console.error(`Error subscribing to collection ${collectionName}:`, error);
      if (onError) onError(error);
    }
  );
}

export function subscribeToDocument(collectionName, docId, onNext, onError) {
  if (!isFirebaseConfigured || !db) {
    onNext(null);
    return () => {};
  }

  const docRef = doc(db, collectionName, docId);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onNext(null);
      } else {
        onNext({ id: snapshot.id, ...snapshot.data() });
      }
    },
    (error) => {
      console.error(`Error subscribing to document ${collectionName}/${docId}:`, error);
      if (onError) onError(error);
    }
  );
}

// ============================================================================
// 2. USER PROFILES
// ============================================================================

/**
 * Retrieve a user's full profile document
 * @param {string} uid
 */
export async function getUserProfile(uid) {
  return await getDocument('users', uid);
}

/**
 * Update user profile fields (e.g. skills, availability, name)
 * @param {string} uid
 * @param {object} profileData
 */
export async function updateUserProfile(uid, profileData) {
  checkDatabaseReady();

  // Prevent role tampering from general profile update
  const { role, uid: _, createdAt: __, ...safeData } = profileData;

  return await updateDocument('users', uid, safeData);
}

/**
 * Retrieve all registered volunteers
 */
export async function getVolunteers() {
  return await getDocuments('users', [where('role', '==', 'volunteer')]);
}

/**
 * Real-time listener for active volunteers
 * @param {(volunteers: Array<object>) => void} onNext
 */
export function subscribeToVolunteers(onNext, onError) {
  return subscribeToCollection('users', onNext, [where('role', '==', 'volunteer')], onError);
}

// ============================================================================
// 3. CAMPAIGNS
// ============================================================================

/**
 * Create a new emergency campaign
 * Model: name, description, organizerId, startDate, endDate, createdAt
 *
 * @param {object} campaign
 * @param {string} campaign.name
 * @param {string} campaign.description
 * @param {string} campaign.organizerId
 * @param {string} [campaign.startDate]
 * @param {string} [campaign.endDate]
 */
export async function createCampaign({
  name,
  description,
  organizerId,
  startDate = new Date().toISOString(),
  endDate = null,
  location = '',
  category = 'Community Support',
  status = 'active',
}) {
  checkDatabaseReady();

  if (!name || !name.trim()) {
    throw new Error('Campaign title is required.');
  }
  if (!description || !description.trim()) {
    throw new Error('Campaign description is required.');
  }
  if (!organizerId) {
    throw new Error('Organizer authentication is required.');
  }

  // Validate dates: End date must not be before start date
  if (startDate && endDate) {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    if (!isNaN(start) && !isNaN(end) && end < start) {
      throw new Error('Campaign end date cannot be earlier than start date.');
    }
  }

  const payload = {
    name: name.trim(),
    description: description.trim(),
    organizerId,
    startDate,
    endDate: endDate || null,
    location: location ? location.trim() : '',
    category: category || 'Community Support',
    status: status || 'active',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const colRef = collection(db, 'campaigns');
  const docRef = await addDoc(colRef, payload);

  return { id: docRef.id, ...payload };
}

/**
 * Retrieve all campaigns
 */
export async function getCampaigns() {
  return await getDocuments('campaigns', [orderBy('createdAt', 'desc')]);
}

/**
 * Retrieve a specific campaign by ID
 * @param {string} campaignId
 */
export async function getCampaignById(campaignId) {
  return await getDocument('campaigns', campaignId);
}

/**
 * Update an existing campaign
 * @param {string} campaignId
 * @param {object} data
 */
export async function updateCampaign(campaignId, data) {
  checkDatabaseReady();
  const safeData = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  return await updateDocument('campaigns', campaignId, safeData);
}

/**
 * Delete a campaign
 * @param {string} campaignId
 */
export async function deleteCampaign(campaignId) {
  checkDatabaseReady();
  return await deleteDocument('campaigns', campaignId);
}

/**
 * Seed official sample/demo campaigns and tasks (Clean-Up Drive, Food Distribution, Support Visit)
 * Checks existing campaigns to avoid creating duplicates.
 * @param {string} organizerId
 */
export async function seedSampleCampaigns(organizerId) {
  checkDatabaseReady();
  const existing = await getCampaigns();

  // Pick suitable future demo date: tomorrow or upcoming Saturday
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() + 2); // 2 days from now
  const baseDateStr = baseDate.toISOString().slice(0, 10); // YYYY-MM-DD

  const sampleCampaignsData = [
    {
      name: 'Neighborhood Park Clean-Up',
      description: 'A volunteer initiative to clean up and refresh our neighborhood park, walking trails, and playground.',
      location: 'City Park, Main Entrance',
      category: 'Environmental Cleanup',
      status: 'active',
      startDate: new Date(`${baseDateStr}T09:00:00`).toISOString(),
      endDate: new Date(`${baseDateStr}T13:00:00`).toISOString(),
      tasks: [
        {
          title: 'Pick up litter along walking paths',
          description: 'Collect paper, plastic, and general litter along the main park paths to keep trails clean.',
          priority: 'high',
          location: 'Park walking paths',
          deadline: new Date(`${baseDateStr}T10:00:00`).toISOString(),
          volunteersNeeded: 3,
          requiredMaterials: 'Trash bags, gloves, trash grabbers',
        },
        {
          title: 'Sort collected waste into recycling bins',
          description: 'Sort plastic bottles, aluminum cans, and general waste at the entrance collection point.',
          priority: 'medium',
          location: 'Main Entrance',
          deadline: new Date(`${baseDateStr}T11:00:00`).toISOString(),
          volunteersNeeded: 2,
          requiredMaterials: 'Recycling bins, sorting labels',
        },
        {
          title: 'Clean park benches and picnic tables',
          description: 'Wipe down picnic tables and benches in the central pavilion for families visiting the park.',
          priority: 'medium',
          location: 'Central Pavilion',
          deadline: new Date(`${baseDateStr}T11:30:00`).toISOString(),
          volunteersNeeded: 2,
          requiredMaterials: 'Cleaning cloths, spray bottles',
        },
        {
          title: 'Final playground walkthrough and area check',
          description: 'Inspect the playground area, check trash receptacles, and submit a completion check-in.',
          priority: 'low',
          location: "Children's Playground",
          deadline: new Date(`${baseDateStr}T12:00:00`).toISOString(),
          volunteersNeeded: 1,
          requiredMaterials: 'Log sheet, checklist',
        },
      ],
    },
    {
      name: 'Community Food Pantry Distribution',
      description: 'Help organize and distribute fresh groceries and pantry essentials to local families.',
      location: 'Community Centre Hall',
      category: 'Food Distribution',
      status: 'active',
      startDate: new Date(`${baseDateStr}T08:30:00`).toISOString(),
      endDate: new Date(`${baseDateStr}T14:00:00`).toISOString(),
      tasks: [
        {
          title: 'Unpack and organize food crates',
          description: 'Unload donated vegetables, fruits, and dry staples into sorting bins in the hall.',
          priority: 'high',
          location: 'Storage Room',
          deadline: new Date(`${baseDateStr}T09:30:00`).toISOString(),
          volunteersNeeded: 3,
          requiredMaterials: 'Box cutters, markers, sorting trays',
        },
        {
          title: 'Pack grocery bags for families',
          description: 'Assemble balanced grocery parcels containing pantry staples, produce, and baked goods.',
          priority: 'high',
          location: 'Packing Tables, Hall A',
          deadline: new Date(`${baseDateStr}T11:00:00`).toISOString(),
          volunteersNeeded: 4,
          requiredMaterials: 'Reusable bags, packing boxes',
        },
        {
          title: 'Distribute bags and greet visitors',
          description: 'Welcome community members at the distribution desk and hand out prepared parcels.',
          priority: 'medium',
          location: 'Distribution Desk',
          deadline: new Date(`${baseDateStr}T13:00:00`).toISOString(),
          volunteersNeeded: 3,
          requiredMaterials: 'Check-in clipboard, parcel tags',
        },
        {
          title: 'Restock tables and tidy up distribution area',
          description: 'Break down empty cardboard boxes, restock remaining items, and sweep the distribution floor.',
          priority: 'low',
          location: 'Community Centre Hall',
          deadline: new Date(`${baseDateStr}T13:30:00`).toISOString(),
          volunteersNeeded: 2,
          requiredMaterials: 'Brooms, recycling bin',
        },
      ],
    },
  ];

  const created = [];
  for (const sample of sampleCampaignsData) {
    const exists = existing.some(
      (c) => c.name && c.name.toLowerCase() === sample.name.toLowerCase()
    );
    if (!exists) {
      const camp = await createCampaign({
        name: sample.name,
        description: sample.description,
        location: sample.location,
        startDate: sample.startDate,
        endDate: sample.endDate,
        organizerId: organizerId || 'system-organizer',
      });

      for (const t of sample.tasks) {
        await createTask({
          campaignId: camp.id,
          title: t.title,
          description: t.description,
          priority: t.priority,
          location: t.location,
          deadline: t.deadline,
          volunteersNeeded: t.volunteersNeeded,
          requiredSkills: t.requiredSkills,
          requiredMaterials: t.requiredMaterials,
          createdBy: organizerId || 'system-organizer',
        });
      }
      created.push(camp);
    }
  }

  return created;
}

/**
 * Real-time listener for campaigns
 * @param {(campaigns: Array<object>) => void} onNext
 */
export function subscribeToCampaigns(onNext, onError) {
  return subscribeToCollection('campaigns', onNext, [orderBy('createdAt', 'desc')], onError);
}

// ============================================================================
// 4. TASKS
// ============================================================================

/**
 * Create a new operational task
 * Model: campaignId, title, description, deadline, requiredSkills, status,
 * assignedVolunteerId, originalVolunteerId, createdBy, createdAt, updatedAt, recoveryHistory
 *
 * @param {object} task
 * @param {string} task.campaignId
 * @param {string} task.title
 * @param {string} task.description
 * @param {string} task.deadline
 * @param {Array<string>} [task.requiredSkills=[]]
 * @param {string} task.createdBy
 * @param {string} [task.assignedVolunteerId=null]
 * @param {string} [task.priority='normal']
 */
export async function createTask({
  campaignId,
  title,
  description = '',
  deadline = null,
  requiredSkills = [],
  createdBy,
  assignedVolunteerId = null,
  assignedVolunteerName = null,
  priority = 'normal',
  location = '',
  volunteersNeeded = 1,
  requiredMaterials = '',
}) {
  checkDatabaseReady();

  if (!title || !createdBy) {
    throw new Error('Task title and createdBy (organizerId) are required.');
  }

  const initialStatus = assignedVolunteerId ? TASK_STATUS.ASSIGNED : TASK_STATUS.UNASSIGNED;

  const payload = {
    campaignId: campaignId || 'general',
    title: title.trim(),
    description: description.trim(),
    deadline: deadline || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    requiredSkills: Array.isArray(requiredSkills) ? requiredSkills : [],
    priority: priority.toLowerCase(),
    location: location ? location.trim() : '',
    volunteersNeeded: Number(volunteersNeeded) || 1,
    requiredMaterials: requiredMaterials ? requiredMaterials.trim() : '',
    status: initialStatus,
    assignedVolunteerId: assignedVolunteerId || null,
    assignedVolunteerName: assignedVolunteerName || null,
    originalVolunteerId: assignedVolunteerId || null,
    createdBy,
    recoveryHistory: assignedVolunteerId
      ? [
          {
            action: 'assigned_on_creation',
            volunteerId: assignedVolunteerId,
            volunteerName: assignedVolunteerName,
            timestamp: new Date().toISOString(),
          },
        ]
      : [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const colRef = collection(db, 'tasks');
  const docRef = await addDoc(colRef, payload);

  return { id: docRef.id, ...payload };
}

/**
 * Retrieve tasks with optional filtering
 * @param {object} [filters={}]
 * @param {string} [filters.campaignId]
 * @param {string} [filters.status]
 * @param {string} [filters.assignedVolunteerId]
 */
export async function getTasks(filters = {}) {
  checkDatabaseReady();

  const constraints = [];

  if (filters.campaignId) {
    constraints.push(where('campaignId', '==', filters.campaignId));
  }
  if (filters.status) {
    constraints.push(where('status', '==', filters.status));
  }
  if (filters.assignedVolunteerId) {
    constraints.push(where('assignedVolunteerId', '==', filters.assignedVolunteerId));
  }

  // Sort by createdAt desc
  constraints.push(orderBy('createdAt', 'desc'));

  try {
    return await getDocuments('tasks', constraints);
  } catch (err) {
    // If composite index is pending, fallback to simpler query
    console.warn('Query with composite index notice, trying fallback order:', err.message);
    return await getDocuments('tasks');
  }
}

/**
 * Retrieve a single task by ID
 * @param {string} taskId
 */
export async function getTaskById(taskId) {
  return await getDocument('tasks', taskId);
}

/**
 * Update an existing task
 * @param {string} taskId
 * @param {object} data
 */
export async function updateTask(taskId, data) {
  checkDatabaseReady();
  const safeData = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  return await updateDocument('tasks', taskId, safeData);
}

/**
 * Delete a task
 * @param {string} taskId
 */
export async function deleteTask(taskId) {
  checkDatabaseReady();
  return await deleteDocument('tasks', taskId);
}

/**
 * Assign a volunteer to a task by Organizer
 * @param {string} taskId
 * @param {string} volunteerId
 * @param {string} [volunteerName]
 */
export async function assignVolunteerToTask(taskId, volunteerId, volunteerName = '') {
  checkDatabaseReady();
  const taskRef = doc(db, 'tasks', taskId);

  return await runTransaction(db, async (transaction) => {
    const taskDoc = await transaction.get(taskRef);
    if (!taskDoc.exists()) {
      throw new Error('Task does not exist.');
    }

    const taskData = taskDoc.data();
    const historyEntry = {
      action: 'assigned_by_organizer',
      volunteerId,
      volunteerName: volunteerName || 'Volunteer',
      timestamp: new Date().toISOString(),
    };

    const maxNeeded = Number(taskData.volunteersNeeded) || 1;
    let existingIds = Array.isArray(taskData.assignedVolunteerIds) ? [...taskData.assignedVolunteerIds] : [];
    if (taskData.assignedVolunteerId && !existingIds.includes(taskData.assignedVolunteerId)) {
      existingIds.push(taskData.assignedVolunteerId);
    }
    if (!existingIds.includes(volunteerId)) {
      existingIds.push(volunteerId);
    }
    const isFull = existingIds.length >= maxNeeded;

    let existingList = Array.isArray(taskData.assignedVolunteers) ? [...taskData.assignedVolunteers] : [];
    if (!existingList.some(v => v.uid === volunteerId)) {
      existingList.push({
        uid: volunteerId,
        name: volunteerName || 'Volunteer',
        assignedAt: new Date().toISOString()
      });
    }

    transaction.update(taskRef, {
      status: isFull ? TASK_STATUS.ASSIGNED : TASK_STATUS.UNASSIGNED,
      assignedVolunteerId: volunteerId,
      assignedVolunteerName: volunteerName || 'Volunteer',
      assignedVolunteerIds: existingIds,
      assignedVolunteers: existingList,
      originalVolunteerId: taskData.originalVolunteerId || volunteerId,
      updatedAt: serverTimestamp(),
      recoveryHistory: arrayUnion(historyEntry),
    });

    return {
      id: taskId,
      ...taskData,
      status: isFull ? TASK_STATUS.ASSIGNED : TASK_STATUS.UNASSIGNED,
      assignedVolunteerId: volunteerId,
      assignedVolunteerName: volunteerName || 'Volunteer',
      assignedVolunteerIds: existingIds,
      assignedVolunteers: existingList,
    };
  });
}

/**
 * Real-time listener for tasks
 * @param {(tasks: Array<object>) => void} onNext
 * @param {object} [filters={}]
 */
export function subscribeToTasks(onNext, filters = {}, onError) {
  if (!isFirebaseConfigured || !db) {
    onNext([]);
    return () => {};
  }

  const colRef = collection(db, 'tasks');
  const constraints = [];

  if (filters.campaignId) {
    constraints.push(where('campaignId', '==', filters.campaignId));
  }
  if (filters.status) {
    constraints.push(where('status', '==', filters.status));
  }
  if (filters.assignedVolunteerId) {
    constraints.push(where('assignedVolunteerId', '==', filters.assignedVolunteerId));
  }

  const q = constraints.length > 0 ? query(colRef, ...constraints) : colRef;

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      onNext(items);
    },
    (error) => {
      console.error('Error in subscribeToTasks:', error);
      if (onError) onError(error);
    }
  );
}

// ============================================================================
// 5. ATOMIC TASK OPERATIONS (TRANSACTIONS & SAFE CONCURRENCY)
// ============================================================================

/**
 * Atomic Claim Task:
 * Uses a Firestore Transaction to guarantee that two volunteers CANNOT
 * claim the same task simultaneously.
 * Supports both unassigned tasks and recovery claiming of blocked/overdue tasks.
 *
 * @param {string} taskId
 * @param {string} volunteerId
 * @param {string} [volunteerName]
 * @returns {Promise<object>} The updated task document
 */
export async function claimTask(taskId, volunteerId, volunteerName = '') {
  checkDatabaseReady();

  if (!taskId || !volunteerId) {
    throw new Error('Task ID and Volunteer ID are required to claim a task.');
  }

  const taskRef = doc(db, 'tasks', taskId);

  return await runTransaction(db, async (transaction) => {
    const taskDoc = await transaction.get(taskRef);

    if (!taskDoc.exists()) {
      throw new Error('Task does not exist.');
    }

    const taskData = taskDoc.data();
    const now = new Date();
    const isBlocked = taskData.status === TASK_STATUS.BLOCKED;
    const isOverdue =
      taskData.status === TASK_STATUS.OVERDUE ||
      (taskData.deadline && new Date(taskData.deadline) < now && taskData.status !== TASK_STATUS.COMPLETED);
    const isUnassigned = taskData.status === TASK_STATUS.UNASSIGNED;

    // Prevent claiming completed or cancelled tasks
    if (taskData.status === TASK_STATUS.COMPLETED || taskData.status === 'cancelled') {
      throw new Error('This task is already completed.');
    }

    // Strict role check: verify user is a volunteer (Organizers cannot claim tasks)
    const userDocRef = doc(db, 'users', volunteerId);
    const userSnap = await transaction.get(userDocRef);
    if (userSnap.exists() && userSnap.data().role !== 'volunteer') {
      throw new Error('Only volunteers are authorized to claim tasks. Organizers cannot claim volunteer assignments.');
    }

    // Capacity & single/multi volunteer check
    const maxVolunteers = Number(taskData.volunteersNeeded) || 1;
    let currentVolunteers = Array.isArray(taskData.assignedVolunteerIds)
      ? [...taskData.assignedVolunteerIds]
      : [];
    if (taskData.assignedVolunteerId && !currentVolunteers.includes(taskData.assignedVolunteerId)) {
      currentVolunteers.push(taskData.assignedVolunteerId);
    }

    if (currentVolunteers.includes(volunteerId)) {
      throw new Error('You have already claimed this task.');
    }

    const hasSpotsRemaining = currentVolunteers.length < maxVolunteers;

    // Strict availability check: must either have open spots remaining OR be in recovery state (blocked/overdue)
    if (!hasSpotsRemaining && !isBlocked && !isOverdue) {
      throw new Error('This task is full. All required volunteer spots have been claimed.');
    }

    // Eligibility check for recovery: Volunteer cannot recover their own blocked task
    if ((isBlocked || isOverdue) && taskData.assignedVolunteerId === volunteerId) {
      throw new Error(
        'You cannot recover a task currently assigned to you. Another volunteer must take over this mission.'
      );
    }

    const prevVolunteerId = taskData.assignedVolunteerId;
    const prevVolunteerName = taskData.assignedVolunteerName || 'Previous Volunteer';
    const recoveryReason = taskData.blockReason || (isOverdue ? 'Overdue recovery take-over' : 'Volunteer claim');

    const historyEntry = {
      action: isBlocked ? 'recovered_from_blocker' : isOverdue ? 'recovered_from_overdue' : 'claimed',
      previousVolunteerId: prevVolunteerId || null,
      previousVolunteerName: prevVolunteerName,
      newVolunteerId: volunteerId,
      newVolunteerName: volunteerName || 'Volunteer',
      reason: recoveryReason,
      timestamp: new Date().toISOString(),
    };

    let existingVolunteersList = Array.isArray(taskData.assignedVolunteers) ? [...taskData.assignedVolunteers] : [];
    if (taskData.assignedVolunteerId && !existingVolunteersList.some(v => v.uid === taskData.assignedVolunteerId)) {
      existingVolunteersList.push({
        uid: taskData.assignedVolunteerId,
        name: taskData.assignedVolunteerName || 'Volunteer',
        assignedAt: new Date().toISOString()
      });
    }

    let updatedVolunteers;
    let updatedVolunteersList;

    if (isBlocked && prevVolunteerId) {
      updatedVolunteers = [...currentVolunteers.filter(id => id !== prevVolunteerId && id !== volunteerId), volunteerId];
      updatedVolunteersList = [
        ...existingVolunteersList.filter(v => v.uid !== prevVolunteerId && v.uid !== volunteerId),
        { uid: volunteerId, name: volunteerName || 'Volunteer', assignedAt: new Date().toISOString() }
      ];
    } else {
      updatedVolunteers = [...currentVolunteers.filter(id => id !== volunteerId), volunteerId];
      updatedVolunteersList = [
        ...existingVolunteersList.filter(v => v.uid !== volunteerId),
        { uid: volunteerId, name: volunteerName || 'Volunteer', assignedAt: new Date().toISOString() }
      ];
    }

    const isFull = updatedVolunteers.length >= maxVolunteers;
    const nextStatus = isFull ? TASK_STATUS.ASSIGNED : TASK_STATUS.UNASSIGNED;

    transaction.update(taskRef, {
      status: nextStatus,
      assignedVolunteerId: updatedVolunteers[0] || volunteerId,
      assignedVolunteerName: updatedVolunteersList[0]?.name || volunteerName || 'Volunteer',
      assignedVolunteerIds: updatedVolunteers,
      assignedVolunteers: updatedVolunteersList,
      previousVolunteerId: prevVolunteerId || null,
      previousVolunteerName: prevVolunteerName,
      originalVolunteerId: taskData.originalVolunteerId || prevVolunteerId || volunteerId,
      withdrawnVolunteerId: null,
      withdrawnReason: null,
      lastRecoveryReason: recoveryReason,
      blockReason: null,
      updatedAt: serverTimestamp(),
      recoveryHistory: arrayUnion(historyEntry),
    });

    return {
      id: taskId,
      ...taskData,
      status: nextStatus,
      assignedVolunteerId: updatedVolunteers[0] || volunteerId,
      assignedVolunteerName: updatedVolunteersList[0]?.name || volunteerName || 'Volunteer',
      assignedVolunteerIds: updatedVolunteers,
      assignedVolunteers: updatedVolunteersList,
      previousVolunteerId: prevVolunteerId,
      originalVolunteerId: taskData.originalVolunteerId || prevVolunteerId || volunteerId,
    };
  });
}

/**
 * Claim Recovery Task (Explicit Smart Recovery Take-over):
 * Atomically transfers a blocked or overdue task to a new eligible volunteer.
 * Preserves original volunteer ID and recovery reason in audit trail.
 *
 * @param {string} taskId
 * @param {string} newVolunteerId
 * @param {string} [newVolunteerName]
 */
export async function claimRecoveryTask(taskId, newVolunteerId, newVolunteerName = '') {
  return await claimTask(taskId, newVolunteerId, newVolunteerName);
}

/**
 * Leave / Withdraw from Task:
 * Allows a volunteer to voluntarily release an assigned task if they become unavailable.
 * Removes active assignment, makes the task available for reassignment,
 * and records the withdrawal in the task's recovery history.
 *
 * @param {string} taskId
 * @param {string} volunteerId
 * @param {string} [volunteerName='']
 * @param {string} [reason='']
 */
export async function leaveTask(taskId, volunteerId, volunteerName = '', reason = '') {
  checkDatabaseReady();

  if (!taskId || !volunteerId) {
    throw new Error('Task ID and Volunteer ID are required.');
  }

  const cleanReason = reason ? reason.trim() : '';
  if (!cleanReason) {
    throw new Error('A specific reason for leaving the task is required.');
  }

  const taskRef = doc(db, 'tasks', taskId);

  return await runTransaction(db, async (transaction) => {
    const taskDoc = await transaction.get(taskRef);

    if (!taskDoc.exists()) {
      throw new Error('Task does not exist.');
    }

    const taskData = taskDoc.data();

    // Verify volunteer is actually assigned
    const assignedIds = Array.isArray(taskData.assignedVolunteerIds)
      ? taskData.assignedVolunteerIds
      : taskData.assignedVolunteerId
      ? [taskData.assignedVolunteerId]
      : [];

    if (!assignedIds.includes(volunteerId) && taskData.assignedVolunteerId !== volunteerId) {
      throw new Error('You are not authorized to leave a task you are not assigned to.');
    }

    if (taskData.status === TASK_STATUS.COMPLETED || taskData.status === 'cancelled') {
      throw new Error('Cannot leave a completed or cancelled task.');
    }

    const remainingIds = assignedIds.filter((id) => id !== volunteerId);
    const existingVolunteersList = Array.isArray(taskData.assignedVolunteers) ? taskData.assignedVolunteers : [];
    const remainingVolunteersList = existingVolunteersList.filter((v) => v.uid !== volunteerId);

    const historyEntry = {
      action: 'blocked_by_withdrawal',
      volunteerId: volunteerId,
      volunteerName: volunteerName || taskData.assignedVolunteerName || 'Volunteer',
      reason: cleanReason,
      timestamp: new Date().toISOString(),
    };

    // When a volunteer leaves, the task becomes BLOCKED to trigger emergency recovery protocol
    transaction.update(taskRef, {
      status: TASK_STATUS.BLOCKED,
      assignedVolunteerId: remainingIds.length > 0 ? remainingIds[0] : null,
      assignedVolunteerName: remainingVolunteersList.length > 0 ? remainingVolunteersList[0].name : null,
      assignedVolunteerIds: remainingIds,
      assignedVolunteers: remainingVolunteersList,
      blockReason: cleanReason,
      lastRecoveryReason: cleanReason,
      originalVolunteerId: taskData.originalVolunteerId || volunteerId,
      originalVolunteerName: taskData.originalVolunteerName || volunteerName || taskData.assignedVolunteerName || 'Volunteer',
      previousVolunteerId: volunteerId,
      previousVolunteerName: volunteerName || taskData.assignedVolunteerName || 'Volunteer',
      withdrawnVolunteerId: volunteerId,
      withdrawnReason: cleanReason,
      updatedAt: serverTimestamp(),
      recoveryHistory: arrayUnion(historyEntry),
    });

    return {
      id: taskId,
      ...taskData,
      status: TASK_STATUS.BLOCKED,
      assignedVolunteerId: remainingIds.length > 0 ? remainingIds[0] : null,
      assignedVolunteerIds: remainingIds,
      assignedVolunteers: remainingVolunteersList,
    };
  });
}

/**
 * Block Task:
 * Marks a task as blocked when a volunteer encounters road closures,
 * hazard, or missing supplies. Requires a reason, preserves original volunteer ID,
 * and makes the task eligible for recovery by another volunteer.
 *
 * @param {string} taskId
 * @param {string} volunteerId
 * @param {string} reason - Required obstruction reason
 * @param {string} [volunteerName]
 */
export async function blockTask(taskId, volunteerId, reason, volunteerName = '') {
  checkDatabaseReady();

  if (!reason || !reason.trim()) {
    throw new Error('A specific reason is required to report a task as blocked.');
  }

  const cleanReason = reason.trim();
  const taskRef = doc(db, 'tasks', taskId);

  return await runTransaction(db, async (transaction) => {
    const taskDoc = await transaction.get(taskRef);

    if (!taskDoc.exists()) {
      throw new Error('Task does not exist.');
    }

    const taskData = taskDoc.data();

    // Prevent modifying tasks assigned to other volunteers
    if (taskData.assignedVolunteerId !== volunteerId) {
      throw new Error('You are not authorized to report blockers for a task assigned to someone else.');
    }

    const originalVolunteerId = taskData.originalVolunteerId || volunteerId;

    const historyEntry = {
      action: 'blocked',
      volunteerId: volunteerId,
      volunteerName: volunteerName || taskData.assignedVolunteerName || 'Volunteer',
      reason: cleanReason,
      timestamp: new Date().toISOString(),
    };

    transaction.update(taskRef, {
      status: TASK_STATUS.BLOCKED,
      blockReason: cleanReason,
      originalVolunteerId: originalVolunteerId,
      blockedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      recoveryHistory: arrayUnion(historyEntry),
    });

    return {
      id: taskId,
      ...taskData,
      status: TASK_STATUS.BLOCKED,
      blockReason: cleanReason,
      originalVolunteerId: originalVolunteerId,
    };
  });
}

/**
 * Unblock / Resume Task:
 * Resumes a previously blocked task back to assigned state once obstruction is cleared.
 *
 * @param {string} taskId
 * @param {string} volunteerId
 * @param {string} [notes='Obstruction cleared by volunteer']
 */
export async function unblockTask(taskId, volunteerId, notes = 'Obstruction cleared by volunteer') {
  checkDatabaseReady();

  const taskRef = doc(db, 'tasks', taskId);

  return await runTransaction(db, async (transaction) => {
    const taskDoc = await transaction.get(taskRef);

    if (!taskDoc.exists()) {
      throw new Error('Task does not exist.');
    }

    const taskData = taskDoc.data();

    if (taskData.assignedVolunteerId !== volunteerId) {
      throw new Error('You are not authorized to resume a task assigned to someone else.');
    }

    const historyEntry = {
      action: 'unblocked',
      volunteerId: volunteerId,
      notes: notes,
      timestamp: new Date().toISOString(),
    };

    transaction.update(taskRef, {
      status: TASK_STATUS.ASSIGNED,
      blockReason: null,
      updatedAt: serverTimestamp(),
      recoveryHistory: arrayUnion(historyEntry),
    });

    return {
      id: taskId,
      ...taskData,
      status: TASK_STATUS.ASSIGNED,
      blockReason: null,
    };
  });
}

/**
 * Complete Task:
 * Marks an assigned task as completed by the assigned volunteer.
 *
 * @param {string} taskId
 * @param {string} volunteerId
 * @param {string} [notes='']
 */
export async function completeTask(taskId, volunteerId, notes = '', isOrganizer = false) {
  checkDatabaseReady();

  const taskRef = doc(db, 'tasks', taskId);

  return await runTransaction(db, async (transaction) => {
    const taskDoc = await transaction.get(taskRef);

    if (!taskDoc.exists()) {
      throw new Error('Task does not exist.');
    }

    const taskData = taskDoc.data();

    // Prevent modifying tasks assigned to other volunteers unless authorized as organizer
    const isAssigned =
      taskData.assignedVolunteerId === volunteerId ||
      (Array.isArray(taskData.assignedVolunteerIds) && taskData.assignedVolunteerIds.includes(volunteerId));

    if (!isOrganizer && !isAssigned) {
      throw new Error('You can only mark tasks assigned to you as completed.');
    }

    const historyEntry = {
      action: 'completed',
      volunteerId: taskData.assignedVolunteerId || volunteerId,
      completedBy: volunteerId,
      isOrganizerCompletion: !!isOrganizer,
      notes: notes,
      timestamp: new Date().toISOString(),
    };

    transaction.update(taskRef, {
      status: TASK_STATUS.COMPLETED,
      completedAt: serverTimestamp(),
      completionNotes: notes,
      updatedAt: serverTimestamp(),
      recoveryHistory: arrayUnion(historyEntry),
    });

    return {
      id: taskId,
      ...taskData,
      status: TASK_STATUS.COMPLETED,
    };
  });
}

/**
 * Recover Task (CORE RELAY CAPABILITY):
 * Reassigns or resets a blocked/overdue/stalled task to another volunteer or returns
 * it to the unassigned queue for immediate recovery.
 *
 * @param {string} taskId
 * @param {string} organizerId
 * @param {object} [options={}]
 * @param {string|null} [options.newVolunteerId=null] - If provided, reassigns directly; if null, marks unassigned.
 * @param {string} [options.newVolunteerName='']
 * @param {string} [options.reason='Auto-failover recovery initiated']
 */
export async function recoverTask(taskId, organizerId, options = {}) {
  checkDatabaseReady();

  const {
    newVolunteerId = null,
    newVolunteerName = '',
    reason = 'Task recovery failover initiated by Incident Command',
  } = options;

  const taskRef = doc(db, 'tasks', taskId);

  return await runTransaction(db, async (transaction) => {
    const taskDoc = await transaction.get(taskRef);

    if (!taskDoc.exists()) {
      throw new Error('Task does not exist.');
    }

    const taskData = taskDoc.data();
    const prevVolunteerId = taskData.assignedVolunteerId;
    const newStatus = newVolunteerId ? TASK_STATUS.ASSIGNED : TASK_STATUS.UNASSIGNED;

    const historyEntry = {
      action: 'recovered',
      recoveredBy: organizerId,
      previousVolunteerId: prevVolunteerId,
      newVolunteerId: newVolunteerId,
      reason: reason,
      timestamp: new Date().toISOString(),
    };

    transaction.update(taskRef, {
      status: newStatus,
      assignedVolunteerId: newVolunteerId,
      assignedVolunteerName: newVolunteerName || (newVolunteerId ? 'Standby Volunteer' : null),
      assignedVolunteerIds: newVolunteerId ? [newVolunteerId] : [],
      assignedVolunteers: newVolunteerId ? [{ uid: newVolunteerId, name: newVolunteerName || 'Standby Volunteer', assignedAt: new Date().toISOString() }] : [],
      recoveryAssignedTo: newVolunteerId,
      isRecovered: !!newVolunteerId,
      lastRecoveryReason: reason || null,
      originalVolunteerId: taskData.originalVolunteerId || prevVolunteerId || null,
      blockReason: null,
      updatedAt: serverTimestamp(),
      recoveryHistory: arrayUnion(historyEntry),
    });

    return {
      id: taskId,
      ...taskData,
      status: newStatus,
      assignedVolunteerId: newVolunteerId,
    };
  });
}

// ============================================================================
// 6. NOTIFICATIONS
// ============================================================================

/**
 * Send an operational notification to a user
 * @param {object} notification
 * @param {string} notification.userId
 * @param {'task_assigned'|'task_recovered'|'task_blocked'|'task_completed'|'alert'} notification.type
 * @param {string} notification.title
 * @param {string} notification.message
 * @param {string} [notification.taskId]
 */
export async function createNotification({ userId, type, title, message, taskId = null }) {
  checkDatabaseReady();

  const payload = {
    userId,
    type,
    title,
    message,
    taskId,
    read: false,
    createdAt: serverTimestamp(),
  };

  const colRef = collection(db, 'notifications');
  const docRef = await addDoc(colRef, payload);

  return { id: docRef.id, ...payload };
}

/**
 * Retrieve notifications for a user
 * @param {string} userId
 */
export async function getUserNotifications(userId) {
  checkDatabaseReady();
  const docs = await getDocuments('notifications', [
    where('userId', '==', userId),
  ]);
  docs.sort((a, b) => {
    const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
    const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });
  return docs.slice(0, 20);
}

/**
 * Real-time listener for user notifications
 * @param {string} userId
 * @param {(notifications: Array<object>) => void} onNext
 */
export function subscribeToUserNotifications(userId, onNext, onError) {
  if (!isFirebaseConfigured || !db || !userId) {
    onNext([]);
    return () => {};
  }

  const colRef = collection(db, 'notifications');
  const q = query(
    colRef,
    where('userId', '==', userId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      // Sort client-side to prevent Firestore composite index requirements
      items.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      onNext(items.slice(0, 20));
    },
    (error) => {
      console.warn('Notice: notifications listener:', error.message);
      if (onError) onError(error);
    }
  );
}

/**
 * Mark a notification as read
 * @param {string} notificationId
 */
export async function markNotificationAsRead(notificationId) {
  return await updateDocument('notifications', notificationId, { read: true });
}
