import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../common/Button';

export default function ProtectedRoute({ allowedRoles = [], children }) {
  const { currentUser, userRole, loading, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-700">
            Verifying Security Credentials & Roles...
          </p>
          <p className="text-xs text-slate-400">Connecting to Firebase Authentication</p>
        </div>
      </div>
    );
  }

  // Not logged in -> redirect to login
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role validation
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-rose-200 shadow-sm p-6 sm:p-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
            <ShieldAlert className="w-6 h-6" />
          </div>

          <h2 className="text-xl font-bold text-slate-900">
            Access Restricted
          </h2>
          <p className="text-xs font-semibold text-rose-600 uppercase tracking-wider mt-1">
            Insufficient Permissions ({userRole || 'Volunteer'})
          </p>

          <p className="text-xs text-slate-600 mt-3 leading-relaxed">
            This area requires the <strong>{allowedRoles.join(' or ')}</strong> clearance level.
            Your account is currently authorized as a <strong>{userRole || 'Volunteer'}</strong>.
            Frontend tampering is prevented by Cloud Firestore security rules and Firebase Custom Claims.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={userRole === 'organizer' ? '/organizer/dashboard' : '/volunteer/dashboard'}
              className="w-full sm:w-auto"
            >
              <Button variant="primary" size="sm" icon={ArrowLeft} className="w-full">
                Go to My Dashboard
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              icon={LogOut}
              onClick={logout}
              className="w-full sm:w-auto"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}

