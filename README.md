# RELAY — Volunteer Coordination & Task Recovery Platform

**RELAY** is a responsive, real-time coordination and rapid task recovery platform built for emergency response teams, disaster relief initiatives, and community volunteer operations.

Built for a **24-hour hackathon**, RELAY focuses on reliability, instant task reassignment (when volunteers are blocked, delayed, or unresponsive), and clean operational situational awareness.

---

## 🚀 Tech Stack

- **Frontend**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/) + [Tailwind CSS](https://tailwindcss.com/)
- **Routing & Protection**: [React Router v6](https://reactrouter.com/) + Role-based Protected Routes
- **Icons**: [Lucide React](https://lucide.dev/)
- **Backend & Auth**: [Firebase Authentication](https://firebase.google.com/docs/auth) with Custom Claims + [Cloud Firestore](https://firebase.google.com/docs/firestore)
- **Security & Authorization**: Firebase Cloud Functions (v2) for tamper-proof code validation + Firestore Security Rules

---

## 📁 Project Structure

```text
Relay2/
├── functions/                     # Firebase Cloud Functions (Backend)
│   ├── index.js                   # registerUserAccount callable function
│   ├── package.json               # Backend dependencies (firebase-admin, firebase-functions)
│   ├── .env                       # Backend secrets (ORGANIZER_INVITATION_CODE) - gitignored
│   └── .env.example               # Backend environment template
├── public/
│   └── favicon.svg                # Application brand favicon
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   └── ProtectedRoute.jsx # Role-based route guard & unauthorized fallback
│   │   ├── common/
│   │   │   ├── Badge.jsx          # Operational status badges (active, recovering, urgent)
│   │   │   ├── Button.jsx         # Accessible buttons (primary, outline, ghost)
│   │   │   ├── Card.jsx           # Clean container with headers & action slots
│   │   │   └── Navbar.jsx         # Public top navigation with auth routing
│   │   └── layout/
│   │       ├── DashboardLayout.jsx# Responsive sidebar + topbar wrapper
│   │       ├── Sidebar.jsx        # Navigation drawer with clearance badge
│   │       └── TopNav.jsx         # Dashboard search, alerts, and quick actions
│   ├── context/
│   │   └── AuthContext.jsx        # Firebase Auth state & custom claims role synchronization
│   ├── pages/
│   │   ├── LandingPage.jsx        # Value propositions, features & login triggers
│   │   ├── LoginPage.jsx          # Role selector registration (Volunteer vs Organizer) & Sign In
│   │   ├── OrganizerDashboardPage.jsx # Incident Command hub: KPI metrics & recovery queue
│   │   ├── VolunteerDashboardPage.jsx # Field Responder hub: Claimable tasks & check-ins
│   │   └── NotFoundPage.jsx       # 404 handler
│   ├── services/
│   │   ├── authService.js         # Trusted role registration, sign-in, token claims
│   │   └── databaseService.js     # Reusable Firestore CRUD & real-time snapshot listeners
│   ├── App.jsx                    # Route definitions, role redirects & route guards
│   ├── firebase.js                # Secure client Firebase App, Auth, Firestore & Functions
│   ├── index.css                  # Tailwind CSS root directives & styling
│   └── main.jsx                   # React DOM entry point
├── .env                           # Frontend environment variables (VITE_FIREBASE_*) - gitignored
├── .env.example                   # Frontend environment template
├── .gitignore                     # Strictly ignores .env, functions/.env, and node_modules
├── firebase.json                  # Firebase CLI configuration for Functions & Firestore
├── firestore.rules                # Production security rules enforcing role boundaries
├── package.json                   # Frontend dependencies
├── tailwind.config.js             # Tailwind CSS theme configuration
└── vite.config.js                 # Vite bundler configuration
```

---

## 👥 Role-Based Access Control (RBAC)

RELAY defines two distinct user roles:

| Role | Permissions & Access | Registration Requirement |
| :--- | :--- | :--- |
| **Volunteer** | • Browse open emergency tasks<br>• Claim eligible open tasks<br>• Submit status check-ins and complete assigned tasks<br>• Access `/volunteer/dashboard` | **No invitation code required** |
| **Organizer** | • Create and manage emergency campaigns<br>• Dispatch tasks to volunteer pool<br>• Override stalled tasks and trigger recovery failover<br>• Access `/organizer/dashboard` | **Valid single-use Invitation Code** validated strictly by Cloud Function |

### Security Model:
1. **No Frontend Role Assignment**: The frontend is forbidden from granting or changing roles.
2. **Firebase Custom Claims**: When an organizer code is validated by the Cloud Function, `admin.auth().setCustomUserClaims(uid, { role: 'organizer' })` mints an immutable claim on the user's ID token.
3. **Single-Use Burned Codes**: Codes are tracked in the private Firestore collection `_system_invitations`. Once consumed, subsequent registration attempts with the same code are rejected.
4. **Firestore Security Rules**: Rules enforce that:
   - Users cannot modify their own `role` field (`request.resource.data.role == resource.data.role`).
   - Only Organizers can create/delete tasks.
   - Volunteers can only claim open tasks or update tasks assigned to them (`resource.data.assignedVolunteerId == request.auth.uid`).
   - `_system_invitations` has `allow read, write: if false;` for all client SDKs.

---

## ⚡ Firebase Cloud Functions Setup & Deployment

The backend function `registerUserAccount` resides in the [`functions/`](file:///c:/Users/Vandana%20C/Desktop/Relay2/functions) directory.

### Step 1: Install Firebase CLI
If you don't already have the Firebase CLI installed:
```bash
npm install -g firebase-tools
```

### Step 2: Log In to Firebase
```bash
firebase login
```

### Step 3: Install Functions Dependencies
Navigate to the functions folder and install packages:
```bash
cd functions
npm install
cd ..
```

### Step 4: Configure the Organizer Invitation Code
In [`functions/.env`](file:///c:/Users/Vandana%20C/Desktop/Relay2/functions/.env), set your backend single-use organizer secret:
```env
ORGANIZER_INVITATION_CODE=RELAY-COMMAND-2026
```

### Step 5: Deploy Functions & Security Rules
To deploy Cloud Functions and Firestore security rules to your active Firebase project:
```bash
# Associate your project ID (relay-d2ca2)
firebase use relay-d2ca2

# Deploy Firestore Security Rules
firebase deploy --only firestore:rules

# Deploy Cloud Functions
firebase deploy --only functions
```

*(Note: Deploying Cloud Functions to Google Cloud requires the Firebase Blaze pay-as-you-go plan. During hackathon local development, you can run `firebase emulators:start` to test functions locally).*

---

## 🧪 Testing the Implementation

### 1. Test Volunteer Registration (No code needed)
1. Navigate to [http://localhost:3000/login](http://localhost:3000/login).
2. Click the **Register** tab.
3. Ensure **Volunteer** is selected. (Notice no invitation code input is displayed).
4. Enter a name, email (e.g. `volunteer1@relay.org`), and a password (minimum 6 characters).
5. Click **Create Volunteer Account**.
6. **Result**: Account is created, user is automatically redirected to `/volunteer/dashboard`, and the sidebar displays the green **VOLUNTEER** badge.

### 2. Test Organizer Registration (With Valid Code)
1. Open an Incognito window or sign out.
2. Go to [http://localhost:3000/login](http://localhost:3000/login) and click **Register**.
3. Select **Organizer**. (Notice the amber **Organizer Invitation Code** field appears).
4. Enter name, email (e.g. `commander@relay.org`), password, and the code:
   ```text
   RELAY-COMMAND-2026
   ```
5. Click **Verify Code & Create Organizer**.
6. **Result**: Code is validated by the Cloud Function, custom claim `{ role: 'organizer' }` is minted, the code is marked as consumed in `_system_invitations`, and user is redirected to `/organizer/dashboard`.

### 3. Test Invalid Invitation Code Rejection
1. Select **Organizer** on the registration form.
2. Enter an incorrect code (e.g. `INVALID-CODE-999`).
3. Click submit.
4. **Result**: The registration is blocked with the error:
   > *"Invalid Organizer Invitation Code. Please verify with Incident Command."*

### 4. Test Single-Use Code Expiration
1. Attempt to register a second organizer account with the same consumed code (`RELAY-COMMAND-2026`).
2. **Result**: Registration is blocked with the error:
   > *"This invitation code has already been consumed and expired. Single-use only."*

### 5. Test Direct Access Attempts to Organizer Pages
1. Sign in as a **Volunteer** account.
2. Manually type `http://localhost:3000/organizer/dashboard` into the browser URL bar.
3. **Result**: The [`ProtectedRoute`](file:///c:/Users/Vandana%20C/Desktop/Relay2/src/components/auth/ProtectedRoute.jsx) component intercepts the request, verifies that the user lacks the `organizer` role claim, blocks rendering of the dashboard, and displays:
   > *"Access Restricted: Insufficient Permissions (Volunteer). This area requires the Organizer clearance level."*
   along with a button to return safely to `/volunteer/dashboard`.

---

## 🗄️ Firestore Data Model & Task Lifecycle

RELAY uses Cloud Firestore as its permanent real-time operational database across 4 core collections:

### 1. `users`
- `uid`: Unique user identifier matching Firebase Authentication
- `name`: Full display name
- `email`: User email address
- `role`: `'organizer'` or `'volunteer'`
- `skills`: Array of capabilities (e.g. `['First Aid', 'Logistics', 'Communications']`)
- `availability`: Current on-call readiness (`'available'`, `'busy'`, `'offline'`)
- `createdAt`: Firestore Server Timestamp

### 2. `campaigns`
- `id`: Unique campaign identifier
- `name`: Campaign mission title
- `description`: Operation objectives and staging locations
- `organizerId`: UID of the creator
- `startDate`: Campaign initiation ISO timestamp
- `endDate`: Target conclusion ISO timestamp
- `createdAt`: Firestore Server Timestamp

### 3. `tasks`
- `id`: Unique task identifier
- `campaignId`: Associated campaign ID
- `title`: Short descriptive task name
- `description`: Operational instructions and checkpoint coordinates
- `deadline`: Target completion deadline
- `requiredSkills`: Array of required responder skills
- `status`: Lifecycle state (`'unassigned'`, `'assigned'`, `'blocked'`, `'overdue'`, `'completed'`)
- `assignedVolunteerId`: UID of current assigned responder (or `null`)
- `originalVolunteerId`: UID of original responder (retained during failover recovery)
- `createdBy`: UID of dispatching organizer
- `createdAt`: Firestore Server Timestamp
- `updatedAt`: Firestore Server Timestamp
- `recoveryHistory`: Audit trail of all claims, blockers, and recovery reassignment actions

### 4. `notifications`
- `userId`: Target recipient UID
- `type`: Notification category (`'task_assigned'`, `'task_recovered'`, `'task_blocked'`, `'alert'`)
- `title` & `message`: Operational alert text
- `taskId`: Linked task ID
- `read`: Read receipt boolean
- `createdAt`: Firestore Server Timestamp

---

## 🛡️ Atomic Concurrency & Recovery

- **Race Condition Prevention**: `claimTask()` uses `runTransaction()` to atomically verify that `task.status === 'unassigned'` and `task.assignedVolunteerId === null` before updating. If two volunteers tap "Claim Task" simultaneously, Firestore serializes the operations; one wins, and the other receives an instant notice that the task has already been claimed.
- **Failover Recovery**: When a volunteer encounters an obstruction and triggers `blockTask()`, the task moves to `'blocked'`. Incident Commanders can immediately execute `recoverTask()`, which resets the dispatch to `'unassigned'` or reassigns it to a standby volunteer while logging the event in `recoveryHistory`.
- **Permanent Persistence**: All operations mutate live Cloud Firestore documents. Refreshing the browser preserves the exact state.

---

## 📊 RELAY Impact Report & Analytics

Accessible to Incident Commanders via `/organizer/impact` or the **"Impact Report"** navigation tab:

- **Real Firestore Metrics**:
  - **Total Tasks**: Dispatches registered in the system (or filtered campaign).
  - **Completed Tasks**: Missions resolved and checked off by volunteers.
  - **Recovered Tasks**: Tasks that were reassigned after becoming blocked or overdue.
  - **Blocked Tasks**: Tasks currently halted due to on-ground hazards or missing supplies.
  - **Overdue Tasks**: Active tasks that have exceeded their target deadline.
  - **Completion Percentage**: Real-time ratio of completed tasks to total tasks (`completed / total * 100%`).
- **Campaign Selector**: Dropdown to view system-wide impact metrics or filter down to a specific active campaign.
- **Visual Progress Chart**: Segmented multi-stage progress distribution bar and comparative horizontal bar chart.
- **Table of Recovered Tasks**: Registry detailing the task title, campaign, original volunteer, backup volunteer, obstruction trigger, and direct one-click access to the complete lifecycle audit trail.
- **Recent Recovery Stream**: Chronological audit feed of recent failovers, blockers, and handoffs.

---

## 🎯 Smart Backup Volunteers (Transparent Matching Engine)

RELAY incorporates a transparent, rule-based matching algorithm to recommend backup volunteers when tasks are blocked or overdue, drawing directly from real Firestore responder profiles:

### Matching Rules:
1. **Availability Requirement**: Volunteer profile must have `availability === 'available'`. Offline or busy responders are filtered out.
2. **Exclusion of Current Assignee**: The responder who is currently assigned to or blocked on the mission is excluded.
3. **Skill Alignment Priority**:
   - Responders with matching required skills appear **first**, ranked by the number of matching skills (`matchCount` descending).
   - Matching skills are highlighted with green badges (`✓ First Aid`).
4. **General Standby Responders**: Available volunteers without matching skills appear below suitable matches as general standby.

### Where Suggestions Are Displayed:
- **Organizer Dashboard Attention Banner**: Direct preview showing number of available skill matches for each blocked or overdue task.
- **Task Recovery Operations Center (`/organizer/recovery`)**: Full management hub listing all stalled tasks alongside inline backup volunteer suggestions and one-click assignment.
- **Smart Task Recovery Modal**: Accessible from anywhere in the organizer interface when clicking "Recover & Reassign".
- **Volunteer Recovery Queue**: Highlights missions matching the volunteer's specialized capabilities (`⭐ Smart Backup Match`) with a one-click takeover option.

---

## 🔄 Two-Volunteer Smart Task Recovery Demo Guide

For hackathon presentation and live demonstrations, follow this sequence with two separate browser windows (or one normal window and one incognito window):

### Step 1: Create Initial Emergency Dispatch (Organizer)
1. Register/Sign in as **Organizer** using invitation code `RELAY-COMMAND-2026`.
2. Go to **Tasks** tab & click **"Create Task"**:
   - Title: `Deliver Medical Trauma Kits to Zone 4`
   - Campaign: Select active campaign
   - Priority: `Urgent`
   - Deadline: Set target deadline
   - Status: Leaves as `unassigned`
3. Click **"Dispatch Task"**.

### Step 2: Volunteer 1 Claims Mission & Reports Blocker
1. In Window 1, register/sign in as **Volunteer 1** (`alex@relay.org` - no code required).
2. Go to **"Available Tasks"** tab:
   - Locate `Deliver Medical Trauma Kits to Zone 4`.
   - Click **"Claim Mission"**.
3. Go to **"My Tasks"** tab:
   - The task is now under active dispatches.
   - Click **"Report Blocker"**.
   - Enter reason: `Route 42 flooded due to storm surge; vehicle impassable.`
   - Click **"Submit Blocker"**.
4. The task status transitions to `blocked`, preserving `originalVolunteerId: alex_uid`.

### Step 3: Peer Volunteer 2 Recovers the Mission
1. In Window 2 (Incognito), register/sign in as **Volunteer 2** (`sam@relay.org`).
2. Go to **"Available Tasks"** tab:
   - Notice the prominent emergency banner: **"🚨 Emergency Tasks Requiring Recovery"**.
   - See `Deliver Medical Trauma Kits to Zone 4` flagged with the blocker reason from Alex.
   - Click **"Recover & Take Over Mission"**.
3. Under **"My Tasks"**:
   - Sam now has the mission with badge **"Recovered Mission"**.
   - Original volunteer (Alex) and reason are preserved.
   - Status remains **assigned** (never automatically completed).
4. Click **"Audit Trail"** to view the timeline:
   - Initial claim by Alex Rivera
   - Blocker reported with flooding notes
   - Smart Recovery handoff: Alex Rivera &rarr; Sam Chen
5. Click **"Mark Completed"** with debrief notes: `Delivered via alternate Ridge Trail bypass.`

### Step 4: Incident Command Verification
1. Switch back to the **Organizer Dashboard**.
2. Notice the real-time notification alert and updated metrics (Completed tasks count increased).
3. In the Tasks table, click **"Audit Trail"** on the completed task to inspect the complete 4-step lifecycle chain.

---

## 🛠️ Running the Application

```bash
# Install frontend dependencies
npm install

# Start development server
npm run dev
```

The application is available at [http://localhost:3000](http://localhost:3000).
#   R e l a y -  
 