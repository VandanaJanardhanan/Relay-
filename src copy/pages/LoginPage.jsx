import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Zap,
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Shield,
  ExternalLink,
} from 'lucide-react';
import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup, loginWithGoogle, isFirebaseConfigured } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isFirebaseConfigured) {
      setError(
        'Firebase credentials are not configured yet. Set up your .env file or use Guest Demo Mode below to explore.'
      );
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signup(email, password, displayName);
      } else {
        await login(email, password);
      }
      navigate('/dashboard');
    } catch (err) {
      console.error('Auth error:', err);
      // Format common Firebase error codes into human-readable messages
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password. Please verify your credentials.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Try logging in.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else {
        setError(err.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    if (!isFirebaseConfigured) {
      setError('Firebase credentials are not configured yet.');
      return;
    }
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError(err.message || 'Failed to sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
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
          {isSignUp ? 'Create your coordinator account' : 'Sign in to Response Hub'}
        </h2>
        <p className="mt-1.5 text-xs text-slate-500">
          {isSignUp
            ? 'Join the rapid task recovery and volunteer network'
            : 'Access real-time task recovery, volunteer rosters, and incident alerts'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        {/* Firebase Config Notice banner if .env is missing */}
        {!isFirebaseConfigured && (
          <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Firebase Environment Unconfigured:</span>
                <p className="mt-1 text-amber-700 leading-relaxed">
                  Provide your project keys in <code className="bg-amber-100 px-1 py-0.5 rounded">.env</code> to enable live Firebase Authentication. For hackathon testing, click <strong>"Explore as Guest"</strong> below.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200/80 rounded-2xl sm:px-10">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
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
                    placeholder="Jane Doe"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>
              </div>
            )}

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
                  placeholder="coordinator@relay.org"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                />
              </div>
            </div>

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

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={loading}
              icon={ArrowRight}
            >
              {isSignUp ? 'Create Coordinator Account' : 'Sign In with Email'}
            </Button>
          </form>

          {/* Social / Google Auth divider */}
          <div className="mt-5">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-slate-400 uppercase font-medium">Or</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2">
              <Button
                variant="white"
                className="w-full justify-center"
                onClick={handleGoogleSignIn}
                disabled={!isFirebaseConfigured || loading}
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Continue with Google
              </Button>

              <Button
                variant="secondary"
                className="w-full justify-center"
                onClick={handleDemoAccess}
              >
                Explore as Guest (Hackathon Demo)
              </Button>
            </div>
          </div>

          {/* Toggle Sign Up vs Sign In */}
          <div className="mt-6 text-center text-xs">
            {isSignUp ? (
              <p className="text-slate-600">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setError('');
                  }}
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Sign In
                </button>
              </p>
            ) : (
              <p className="text-slate-600">
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setError('');
                  }}
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Create one now
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-xs font-medium text-slate-500 hover:text-blue-600 transition"
          >
            &larr; Return to RELAY Home
          </Link>
        </div>
      </div>
    </div>
  );
}

