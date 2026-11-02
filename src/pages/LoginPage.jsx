import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Zap,
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Shield,
  Users,
  KeyRound,
  Info,
} from 'lucide-react';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [accountType, setAccountType] = useState('volunteer'); // 'volunteer' | 'organizer'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [invitationCode, setInvitationCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register, isFirebaseConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect destination after authentication
  const handleRedirectByRole = (role) => {
    // If user attempted to reach a specific protected page, check compatibility
    const fromPath = location.state?.from?.pathname;
    if (fromPath && !fromPath.includes('/login')) {
      if (fromPath.startsWith('/organizer') && role !== 'organizer') {
        navigate('/volunteer/dashboard', { replace: true });
        return;
      }
      navigate(fromPath, { replace: true });
      return;
    }

    if (role === 'organizer') {
      navigate('/organizer/dashboard', { replace: true });
    } else {
      navigate('/volunteer/dashboard', { replace: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isFirebaseConfigured) {
      setError(
        'Firebase configuration is missing in .env. Please configure your project keys.'
      );
      return;
    }

    if (isSignUp && accountType === 'organizer' && !invitationCode.trim()) {
      setError('An Organizer Invitation Code is required to create an Organizer account.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const result = await register({
          email,
          password,
          displayName,
          accountType,
          invitationCode,
        });
        handleRedirectByRole(result.role);
      } else {
        const result = await login(email, password);
        handleRedirectByRole(result.role);
      }
    } catch (err) {
      console.error('Authentication submission error:', err);

      // User-friendly error mapping
      const message = err.message || '';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Incorrect email or password. Please re-check your credentials.');
      } else if (err.code === 'auth/email-already-in-use' || message.includes('already exists') || message.includes('already-exists')) {
        setError('An account with this email address already exists. Try signing in.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters long.');
      } else if (message.includes('Invalid organizer invitation code') || message.includes('permission-denied')) {
        setError('Invalid Organizer Invitation Code. Please verify with Incident Command.');
      } else if (message.includes('already been used') || message.includes('already-exists')) {
        setError('This invitation code has already been consumed and expired.');
      } else if (message.includes('firebase deploy --only functions')) {
        setError(message);
      } else if (message === 'internal' || err.code === 'functions/internal') {
        setError(
          'Firebase Cloud Function returned internal error. Ensure registerUserAccount is deployed to your Firebase project.'
        );
      } else {
        setError(message || 'An error occurred during authentication. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 group">
          <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 group-hover:bg-blue-700 transition">
            <Zap className="w-6 h-6 fill-current" />
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900">
            RELAY
          </span>
        </Link>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
          {isSignUp ? 'Create your RELAY Account' : 'Sign in to Response Hub'}
        </h2>
        <p className="mt-1.5 text-xs text-slate-500">
          {isSignUp
            ? 'Select your role to access volunteer dispatch or campaign leadership'
            : 'Access real-time task recovery, volunteer rosters, and incident alerts'}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Main Card */}
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/80 rounded-2xl sm:px-8">
          {/* Sign In vs Register Toggle Tabs */}
          <div className="flex rounded-lg bg-slate-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setError('');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
                !isSignUp
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setError('');
              }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
                isSignUp
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Register
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <div className="leading-relaxed">{error}</div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* Account Type Selector for Registration */}
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Account Type / Role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Volunteer Card */}
                  <button
                    type="button"
                    onClick={() => {
                      setAccountType('volunteer');
                      setInvitationCode('');
                      setError('');
                    }}
                    className={`flex flex-col items-center text-center p-3 rounded-xl border transition ${
                      accountType === 'volunteer'
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 text-blue-900'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1.5 ${
                        accountType === 'volunteer'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold">Volunteer</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      No code needed
                    </span>
                  </button>

                  {/* Organizer Card */}
                  <button
                    type="button"
                    onClick={() => {
                      setAccountType('organizer');
                      setError('');
                    }}
                    className={`flex flex-col items-center text-center p-3 rounded-xl border transition ${
                      accountType === 'organizer'
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20 text-blue-900'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1.5 ${
                        accountType === 'organizer'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Shield className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold">Organizer</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      Requires Invite Code
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Organizer Invitation Code Input */}
            {isSignUp && accountType === 'organizer' && (
              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                    Organizer Invitation Code *
                  </label>
                </div>
                <div className="relative mt-1">
                  <input
                    type="text"
                    required
                    value={invitationCode}
                    onChange={(e) => setInvitationCode(e.target.value)}
                    placeholder=""
                    className="w-full px-3 py-2 text-sm font-mono tracking-wider bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
                  />
                </div>
              </div>
            )}

            {/* Display Name for Registration */}
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required={isSignUp}
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={accountType === 'organizer' ? 'Commander Jane Doe' : 'Jane Doe'}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="responder@relay.org"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              loading={loading}
              icon={ArrowRight}
            >
              {isSignUp
                ? accountType === 'organizer'
                  ? 'Verify Code & Create Organizer'
                  : 'Create Volunteer Account'
                : 'Sign In to Hub'}
            </Button>
          </form>

          {/* Quick Demo Shortcuts for Hackathon Evaluation */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center mb-3">
              Direct Role Preview
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link to="/organizer/dashboard">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  Organizer Hub
                </Button>
              </Link>
              <Link to="/volunteer/dashboard">
                <Button variant="outline" size="sm" className="w-full text-xs">
                  Volunteer Hub
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Return to Home Link */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-xs font-medium text-slate-500 hover:text-blue-600 transition"
          >
            &larr; Return to RELAY Landing Page
          </Link>
        </div>
      </div>
    </div>
  );
}
