import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  RotateCcw,
  Settings,
  Shield,
  LogOut,
  Zap,
  CheckCircle,
  CheckCircle2,
  Flag,
  BarChart3,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { currentUser, userRole, isOrganizer, logout, isFirebaseConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const organizerNavItems = [
    { name: 'Dashboard', path: '/organizer/dashboard', icon: LayoutDashboard },
    { name: 'Campaigns', path: '/organizer/campaigns', icon: Flag },
    { name: 'Tasks', path: '/organizer/tasks', icon: ClipboardList },
    { name: 'Task Recovery', path: '/organizer/recovery', icon: RotateCcw },
    { name: 'Volunteers', path: '/organizer/volunteers', icon: Users },
    { name: 'Impact Report', path: '/organizer/impact', icon: BarChart3 },
  ];

  const volunteerNavItems = [
    { name: 'Field Operations', path: '/volunteer/dashboard?section=field-ops', icon: Flag },
    { name: 'My Tasks', path: '/volunteer/dashboard?section=my-tasks', icon: ClipboardList },
    { name: 'Available Tasks', path: '/volunteer/dashboard?section=available', icon: CheckCircle },
    { name: 'Completed Tasks', path: '/volunteer/dashboard?section=completed', icon: CheckCircle2 },
    { name: 'My Profile', path: '/volunteer/profile', icon: User },
  ];

  const navItems = isOrganizer ? organizerNavItems : volunteerNavItems;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-100">
            <NavLink to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900">RELAY</span>
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-blue-600">
                  {isOrganizer ? 'Organizer Hub' : 'Volunteer Hub'}
                </span>
              </div>
            </NavLink>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {isOrganizer ? 'Command Operations' : 'Field Operations'}
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isItemActive = item.path.includes('?')
                ? (location.pathname + location.search) === item.path
                : location.pathname === item.path;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => onClose && onClose()}
                  className={`flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isItemActive
                      ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0 text-current" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}

            {/* Direct Logout Item */}
            <button
              type="button"
              onClick={() => {
                if (onClose) onClose();
                handleLogout();
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-4 h-4 shrink-0 text-current" />
                <span>Logout</span>
              </div>
            </button>
          </nav>



          {/* User profile & Logout */}
          <div className="p-3 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-8 h-8 rounded-full font-semibold text-xs flex items-center justify-center shrink-0 ${
                  isOrganizer
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">
                  {currentUser?.displayName || currentUser?.email || 'User'}
                </p>
                <p className="text-[11px] text-slate-400 capitalize truncate">
                  {userRole || 'Volunteer'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
