import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import OrganizerDashboardPage from './pages/OrganizerDashboardPage';
import VolunteerDashboardPage from './pages/VolunteerDashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Smart dispatcher component to route /dashboard based on trusted role
function DashboardRedirect() {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (userRole === 'organizer') {
    return <Navigate to="/organizer/dashboard" replace />;
  }

  return <Navigate to="/volunteer/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing & Login */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Smart Redirect Root */}
          <Route path="/dashboard" element={<DashboardRedirect />} />

          {/* Organizer Protected Routes (Requires 'organizer' role) */}
          <Route
            path="/organizer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <DashboardLayout>
                  <OrganizerDashboardPage section="dashboard" />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/campaigns"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <DashboardLayout>
                  <OrganizerDashboardPage section="campaigns" />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/tasks"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <DashboardLayout>
                  <OrganizerDashboardPage section="tasks" />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/recovery"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <DashboardLayout>
                  <OrganizerDashboardPage section="recovery" />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/volunteers"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <DashboardLayout>
                  <OrganizerDashboardPage section="volunteers" />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/impact"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <DashboardLayout>
                  <OrganizerDashboardPage section="impact" />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/volunteers"
            element={<Navigate to="/organizer/volunteers" replace />}
          />

          {/* Volunteer Protected Routes (Strictly for Volunteers) */}
          <Route
            path="/volunteer/campaigns"
            element={
              <ProtectedRoute allowedRoles={['volunteer']}>
                <DashboardLayout>
                  <VolunteerDashboardPage section="campaigns" />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/volunteer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['volunteer']}>
                <DashboardLayout>
                  <VolunteerDashboardPage />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/volunteer/profile"
            element={
              <ProtectedRoute allowedRoles={['volunteer']}>
                <DashboardLayout>
                  <VolunteerDashboardPage section="profile" />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={<Navigate to="/volunteer/profile" replace />}
          />
          <Route
            path="/volunteer/tasks"
            element={
              <ProtectedRoute allowedRoles={['volunteer']}>
                <DashboardLayout>
                  <VolunteerDashboardPage section="my-tasks" />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/volunteer/recovery"
            element={
              <ProtectedRoute allowedRoles={['volunteer']}>
                <DashboardLayout>
                  <VolunteerDashboardPage section="blocked" />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Shared Operational Views */}
          <Route
            path="/tasks"
            element={<DashboardRedirect />}
          />
          <Route
            path="/recovery"
            element={<DashboardRedirect />}
          />
          <Route
            path="/settings"
            element={<DashboardRedirect />}
          />

          {/* Catch-all 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
