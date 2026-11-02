import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  Bell,
  Search,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  X,
  ExternalLink,
} from 'lucide-react';
import Button from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import {
  subscribeToUserNotifications,
  markNotificationAsRead,
} from '../../services/databaseService';

export default function TopNav({ onMenuToggle }) {
  const { currentUser, isOrganizer, isVolunteer } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Subscribe to live notifications for current user
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribe = subscribeToUserNotifications(
      currentUser.uid,
      (liveNotifs) => {
        setNotifications(liveNotifs);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = async (notif) => {
    if (!notif.read) {
      await markNotificationAsRead(notif.id);
    }
    if (isOrganizer) {
      navigate('/organizer/recovery');
    } else {
      navigate('/volunteer/dashboard?section=available');
    }
    setShowNotifications(false);
  };

  const handlePrimaryAction = () => {
    if (isOrganizer) {
      navigate('/organizer/tasks');
    } else {
      navigate('/volunteer/dashboard?section=available');
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Context Tag */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Node:
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
            {isOrganizer ? 'Organizer Hub' : 'Volunteer Hub'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">


        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            title="Operational Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Popover */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-blue-600" />
                  Operational Alerts ({notifications.length})
                </h4>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-2 max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No new alerts or incident updates.
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`py-2.5 px-2 hover:bg-slate-50 rounded-lg transition cursor-pointer text-xs ${
                        !notif.read ? 'bg-blue-50/40 font-semibold' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                        <span className="uppercase font-bold text-blue-600">
                          {notif.type?.replace(/_/g, ' ') || 'Notice'}
                        </span>
                        <span>
                          {notif.createdAt?.toDate
                            ? notif.createdAt.toDate().toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </span>
                      </div>
                      <div className="text-slate-900">{notif.title}</div>
                      {notif.message && (
                        <div className="text-slate-500 text-[11px] mt-0.5 line-clamp-2">
                          {notif.message}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Primary Action Button for Volunteer */}
        {!isOrganizer && (
          <Button
            variant="primary"
            size="sm"
            icon={CheckCircle2}
            onClick={handlePrimaryAction}
          >
            Find Available Tasks
          </Button>
        )}
      </div>
    </header>
  );
}
