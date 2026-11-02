import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import NotFoundPage from './pages/NotFoundPage';
import DashboardLayout from './components/layout/DashboardLayout';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Authentication */}
          <Route path="/login" element={<LoginPage />} />

          {/* Operational Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <DashboardLayout>
                <DashboardPage />
              </DashboardLayout>
            }
          />
          <Route
            path="/tasks"
            element={
              <DashboardLayout>
                <DashboardPage />
              </DashboardLayout>
            }
          />
          <Route
            path="/volunteers"
            element={
              <DashboardLayout>
                <DashboardPage />
              </DashboardLayout>
            }
          />
          <Route
            path="/recovery"
            element={
              <DashboardLayout>
                <DashboardPage />
              </DashboardLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <DashboardLayout>
                <DashboardPage />
              </DashboardLayout>
            }
          />

          {/* Catch-all Not Found */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

