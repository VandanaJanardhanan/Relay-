import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Zap,
  Shield,
  Users,
  RotateCcw,
  ArrowRight,
  CheckCircle,
  Clock,
  Sparkles,
  Database,
  Lock,
} from 'lucide-react';
import Navbar from '../components/common/Navbar';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isFirebaseConfigured } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Main Content */}
      <main className="flex-1">
        {/* Firebase Config Notice if missing */}
        {!isFirebaseConfigured && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-800 text-center font-medium">
            <span className="font-semibold">Setup Tip:</span> Copy <code className="bg-amber-100 px-1 py-0.5 rounded">.env.example</code> to <code className="bg-amber-100 px-1 py-0.5 rounded">.env</code> to connect your live Firebase Auth & Firestore instances.
          </div>
        )}

        {/* Hero Section */}
        <section className="relative overflow-hidden bg-white border-b border-slate-200 py-20 lg:py-28">
          {/* Subtle blue gradient overlay */}
          <div className="absolute inset-0 bg-radial-gradient from-blue-50/60 via-transparent to-transparent pointer-events-none" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="text-center max-w-3xl mx-auto">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Gen Response Hub for Hackathons & Emergency Teams</span>
              </div>

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight">
                Volunteer Coordination &{' '}
                <span className="text-blue-600 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Task Recovery
                </span>
              </h1>

              {/* Description */}
              <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed">
                <span className="font-semibold text-slate-800">RELAY</span> prevents tasks from falling through the cracks. When emergency volunteers get delayed or drop out, RELAY detects stalled work and recovers tasks instantly to keep missions on schedule.
              </p>

              {/* CTA Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  size="lg"
                  variant="primary"
                  icon={ArrowRight}
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto shadow-lg shadow-blue-500/25"
                >
                  Access Platform
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="w-full sm:w-auto"
                >
                  Explore Dashboard
                </Button>
              </div>

              {/* Quick stats pills */}
              <div className="mt-12 pt-8 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-3">
                  <div className="text-2xl font-bold text-slate-900">&lt; 30s</div>
                  <div className="text-xs text-slate-500 mt-0.5">Task Recovery Time</div>
                </div>
                <div className="p-3">
                  <div className="text-2xl font-bold text-blue-600">100%</div>
                  <div className="text-xs text-slate-500 mt-0.5">Real-time Sync</div>
                </div>
                <div className="p-3">
                  <div className="text-2xl font-bold text-slate-900">Zero</div>
                  <div className="text-xs text-slate-500 mt-0.5">Dropped Dispatches</div>
                </div>
                <div className="p-3">
                  <div className="text-2xl font-bold text-emerald-600">24h Ready</div>
                  <div className="text-xs text-slate-500 mt-0.5">Rapid Deployment</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Pillars / Features */}
        <section id="features" className="py-16 sm:py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-xs uppercase tracking-wider font-bold text-blue-600">Built for Critical Response</h2>
              <p className="mt-2 text-3xl font-extrabold text-slate-900">
                Engineered to recover stalled operations immediately
              </p>
              <p className="mt-3 text-slate-600 text-sm">
                A simple, robust system built with React, Tailwind, and Firebase Cloud Firestore.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition">
                <div className="w-12 h-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mb-5">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Automated Task Recovery</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  When an assigned volunteer doesn't check in or encounters a blocker, RELAY flags the stall and initiates a recovery protocol to reassign the task to available backup personnel.
                </p>
                <Badge status="recovering">Auto-Failover</Badge>
              </div>

              {/* Feature 2 */}
              <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition">
                <div className="w-12 h-12 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Real-Time Volunteer Roster</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  Match tasks to volunteer skill sets, availability status, and physical locations. Dispatch urgent alerts directly to on-call community responders.
                </p>
                <Badge status="active">Live Roster</Badge>
              </div>

              {/* Feature 3 */}
              <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition">
                <div className="w-12 h-12 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center mb-5">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Clean Incident Dashboard</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">
                  Complete situational awareness with clear priority badges, progress tracking, and instant coordinator intervention tools.
                </p>
                <Badge status="in-progress">Command Hub</Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Tech Stack Callout */}
        <section id="architecture" className="py-12 bg-white border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6 rounded-2xl bg-blue-50/70 border border-blue-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Modern Reactive Cloud Architecture</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    React 18 + Vite + Tailwind CSS + Firebase Auth & Cloud Firestore. Zero hardcoded secrets.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-semibold text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition shadow-xs"
                >
                  Operator Sign In
                </Link>
                <Link
                  to="/dashboard"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition shadow-xs"
                >
                  View Live Hub
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-slate-800">RELAY</span>
            <span>&copy; {new Date().getFullYear()} — 24-Hour Hackathon Build</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-blue-600 transition">Sign In</Link>
            <Link to="/dashboard" className="hover:text-blue-600 transition">Dashboard</Link>
            <span className="text-slate-400">Secure Firebase Backend</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

