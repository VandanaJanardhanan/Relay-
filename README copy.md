# RELAY — Volunteer Coordination & Task Recovery Platform

**RELAY** is a responsive, real-time coordination and rapid task recovery platform built for emergency response teams, disaster relief initiatives, and community volunteer operations.

Built for a **24-hour hackathon**, RELAY focuses on reliability, instant task reassignment (when volunteers are blocked, delayed, or unresponsive), and clean operational situational awareness.

---

## 🚀 Tech Stack

- **Frontend Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Custom crisp blue-and-white theme)
- **Routing**: [React Router v6](https://reactrouter.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Backend & Auth**: [Firebase v10](https://firebase.google.com/) (Firebase Authentication + Cloud Firestore)
- **Secrets Management**: Vite Environment Variables (`import.meta.env`)

---

## 📁 Project Structure

```text
Relay2/
├── public/
│   └── favicon.svg                # Application brand favicon
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Badge.jsx          # Operational status badges (active, recovering, urgent, etc.)
│   │   │   ├── Button.jsx         # Accessible styled buttons (primary, outline, ghost)
│   │   │   ├── Card.jsx           # Clean white card container with headers & actions
│   │   │   └── Navbar.jsx         # Public top navigation with auth routing
│   │   └── layout/
│   │       ├── DashboardLayout.jsx# Responsive wrapper for sidebar + topbar
│   │       ├── Sidebar.jsx        # Navigation drawer with live Firestore indicator
│   │       └── TopNav.jsx         # Dashboard search, alerts, and quick actions
│   ├── context/
│   │   └── AuthContext.jsx        # Firebase Authentication context provider & hooks
│   ├── pages/
│   │   ├── DashboardPage.jsx      # Command hub: KPI stat cards, recovery task table
│   │   ├── LandingPage.jsx        # Value prop, features, hero & login navigation
│   │   ├── LoginPage.jsx          # Email/Password + Google login with Guest demo mode
│   │   └── NotFoundPage.jsx       # 404 handler
│   ├── services/
│   │   └── firebase.js            # Secure Firebase initialization from environment variables
│   ├── App.jsx                    # Route definitions and provider wiring
│   ├── index.css                  # Tailwind CSS root directives & base styles
│   └── main.jsx                   # React DOM entry point
├── .env.example                   # Environment variable template
├── .gitignore                     # Ignores .env and node_modules
├── index.html                     # HTML root template
├── package.json                   # Project dependencies and run scripts
├── postcss.config.js              # PostCSS configuration for Tailwind
├── tailwind.config.js             # Tailwind CSS theme configuration
└── vite.config.js                 # Vite bundler configuration
```

---

## 🛠️ Installation & Getting Started

### 1. Prerequisites
- **Node.js**: `v18.0.0` or later (tested on v24)
- **npm**: `v9.0.0` or later

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Firebase Credentials
1. Copy the environment template:
   ```bash
   cp .env.example .env
   # On Windows PowerShell:
   Copy-Item .env.example .env
   ```
2. Open `.env` and fill in your Firebase project values (see [Firebase Setup Guide](#-firebase-setup-guide) below).

> **Security Note:** Never commit `.env` or your raw API credentials to GitHub. The `.gitignore` file is pre-configured to exclude all `.env` files.

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 🔥 Firebase Setup Guide

Follow these steps to connect your Firebase backend to RELAY:

### Step 1: Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and name it `relay-ops` (or your preferred name).
3. Disable or enable Google Analytics (optional for hackathons), then click **Create project**.

### Step 2: Register a Web App
1. In your project dashboard, click the **Web icon (`</>`)** to add a web application.
2. Enter the app nickname (e.g. `RELAY Web`).
3. You do not need Firebase Hosting immediately; click **Register app**.
4. Firebase will display your `firebaseConfig` object with `apiKey`, `authDomain`, `projectId`, etc.

### Step 3: Enable Authentication
1. In the Firebase console sidebar, navigate to **Build > Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab:
   - Click **Email/Password**, toggle **Enable**, and click **Save**.
   - (Optional) Click **Google**, toggle **Enable**, provide your support email, and click **Save**.

### Step 4: Create Cloud Firestore
1. In the sidebar, navigate to **Build > Firestore Database**.
2. Click **Create database**.
3. Choose a location closest to your users.
4. Select **Start in test mode** for rapid hackathon prototyping (allows 30 days of read/write access).
5. Click **Enable**.

### Step 5: Fill in your `.env` File
In your local project root, open `.env` and assign each variable:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=relay-ops.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=relay-ops
VITE_FIREBASE_STORAGE_BUCKET=relay-ops.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

Restart your dev server (`npm run dev`) after updating `.env`.

---

## 🧪 Build & Verification

To verify that the application compiles and bundles cleanly for production without any errors:

```bash
npm run build
```

This runs Vite's build pipeline and outputs production assets into the `dist/` directory.

