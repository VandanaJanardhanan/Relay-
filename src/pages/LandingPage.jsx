import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Zap,
  Shield,
  Users,
  RotateCcw,
  ArrowRight,
  CheckCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  LifeBuoy,
  Network,
  HeartHandshake,
  ClipboardList,
  BarChart3,
  TrendingUp,
  AlertOctagon,
  UserCheck,
  Flag,
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

        {/* ================================================================ */}
        {/* 1. HERO SECTION — EXACTLY PRESERVED AS REQUIRED                  */}
        {/* ================================================================ */}
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
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* 2. CAPABILITIES SECTION — PRESERVED CONTENT & FUNCTIONALITY      */}
        {/* ================================================================ */}
        <section id="capabilities" className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200/80 scroll-mt-20">
          {/* Alias anchor to support existing #features navigation */}
          <div id="features" className="scroll-mt-20" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-xs uppercase tracking-wider font-bold text-blue-600">Built for Critical Response</h2>
              <p className="mt-2 text-3xl font-extrabold text-slate-900">
                Engineered to recover stalled operations immediately
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

        {/* ================================================================ */}
        {/* 3. BUILT FOR EVERY ROLE                                          */}
        {/* ================================================================ */}
        <section id="roles" className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200/80 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold mb-4">
                <Users className="w-3.5 h-3.5" />
                <span>Tailored Role Experiences</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
                One Platform. Two Roles.{' '}
                <span className="text-blue-600 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  One Shared Mission.
                </span>
              </h2>
              <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
                Whether you're leading an initiative or contributing on the ground, RELAY gives everyone the tools to work together and get things done.
              </p>
            </div>

            {/* Two Side-by-Side Role Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* CARD 01 — FOR ORGANIZERS */}
              <div className="bg-white rounded-2xl p-7 sm:p-9 border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                      <Shield className="w-3.5 h-3.5" />
                      For Organizers
                    </span>
                    <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                      <ClipboardList className="w-6 h-6" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-slate-900 mb-3">
                    Lead the Mission
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-6">
                    Take control of community initiatives with a centralized platform to create campaigns, organize tasks, coordinate volunteers, and monitor progress.
                  </p>

                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Key Capabilities:
                    </div>
                    {[
                      'Create and manage community campaigns.',
                      'Assign tasks and coordinate volunteers.',
                      'Monitor task progress and identify blocked activities.',
                      'Recover interrupted tasks and reassign responsibilities.',
                      'Track completed work and measure campaign outcomes.',
                    ].map((point, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-sm text-slate-700 font-medium">
                          {point}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    Invitation-verified access
                  </span>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition"
                  >
                    <span>Organizer Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* CARD 02 — FOR VOLUNTEERS */}
              <div className="bg-white rounded-2xl p-7 sm:p-9 border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <UserCheck className="w-3.5 h-3.5" />
                      For Volunteers
                    </span>
                    <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                      <HeartHandshake className="w-6 h-6" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-slate-900 mb-3">
                    Be the Difference
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed mb-6">
                    Find meaningful opportunities, take responsibility for tasks, track your contributions, and stay connected with the initiatives you support.
                  </p>

                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Key Capabilities:
                    </div>
                    {[
                      'Discover available volunteering opportunities.',
                      'Accept and manage assigned tasks.',
                      'Update task status and track progress.',
                      'Report blocked tasks when unable to continue.',
                      'View completed tasks and personal contributions.',
                    ].map((point, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-sm text-slate-700 font-medium">
                          {point}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">
                    Open community participation
                  </span>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition"
                  >
                    <span>Volunteer Portal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* 5. NEW SECTION: WHY RELAY MAKES A DIFFERENCE                      */}
        {/*    (Completely replaces the old developer architecture section) */}
        {/* ================================================================ */}
        <section id="why-relay" className="py-16 sm:py-24 bg-white border-b border-slate-200 scroll-mt-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold mb-4">
                <LifeBuoy className="w-3.5 h-3.5" />
                <span>The RELAY Advantage</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
                Why RELAY Makes a Difference
              </h2>
              <p className="mt-3 text-base sm:text-lg text-blue-600 font-medium">
                Because every volunteer effort deserves to make it to the finish line.
              </p>
            </div>

            {/* Four Impact Feature Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* CARD 01 */}
              <div className="bg-slate-50/60 rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-5">
                    <LifeBuoy className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    No Task Left Behind
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    When a volunteer cannot continue, their task doesn't disappear. RELAY brings interrupted tasks back into focus so organizers can take action and keep important work moving.
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-slate-200/60 text-[11px] font-bold text-blue-600 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Resilient Continuity</span>
                </div>
              </div>

              {/* CARD 02 */}
              <div className="bg-slate-50/60 rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-5">
                    <Network className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    Clear Team Coordination
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Keep organizers and volunteers connected through a centralized view of campaigns, responsibilities, and task progress.
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-slate-200/60 text-[11px] font-bold text-indigo-600 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Centralized Dispatch</span>
                </div>
              </div>

              {/* CARD 03 */}
              <div className="bg-slate-50/60 rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 flex items-center justify-center mb-5">
                    <RotateCcw className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    Faster Task Recovery
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Identify blocked responsibilities and make it easier for organizers to reassign tasks to available volunteers without losing track of ongoing work.
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-slate-200/60 text-[11px] font-bold text-blue-600 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Rapid Handover</span>
                </div>
              </div>

              {/* CARD 04 */}
              <div className="bg-slate-50/60 rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    Measurable Community Impact
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    Track completed tasks, volunteer contributions, and campaign progress to understand the real outcomes of every initiative.
                  </p>
                </div>
                <div className="mt-6 pt-3 border-t border-slate-200/60 text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Real-Time Analytics</span>
                </div>
              </div>
            </div>

            {/* Bottom Callout Banner */}
            <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/15 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <h4 className="text-xl font-bold">Ready to Keep Your Community Moving?</h4>
                <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-xl">
                  Join organizers and volunteers on RELAY to ensure every essential effort reaches completion.
                </p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  size="md"
                  variant="secondary"
                  icon={ArrowRight}
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto font-bold bg-white text-blue-700 hover:bg-blue-50 shadow-md"
                >
                  Get Started
                </Button>
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
            <span>&copy; {new Date().getFullYear()} — Volunteer Coordination & Task Recovery</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-blue-600 transition">Sign In</Link>
            <Link to="/dashboard" className="hover:text-blue-600 transition">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
