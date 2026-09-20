'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center min-h-[340px] text-neutral-400">
      <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mb-2" />
      <span className="text-[11px] font-mono tracking-wider uppercase">Loading 3D Intelligence...</span>
    </div>
  ),
});
import { 
  Briefcase, 
  Users, 
  Search, 
  Sparkles, 
  ArrowRight, 
  Plus, 
  ShieldCheck, 
  Activity,
  ChevronRight,
  Cpu,
  Layers,
  X
} from 'lucide-react';
import { Role, Candidate, AuditEvent } from '@/lib/types';

interface DashboardViewProps {
  onBackToLanding?: () => void;
}

export function DashboardView({ onBackToLanding }: DashboardViewProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // New Role Modal state
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDept, setNewDept] = useState('Platform Engineering');
  const [newLoc, setNewLoc] = useState('Remote');
  const [newJd, setNewJd] = useState('');
  const [creatingRole, setCreatingRole] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [rRes, cRes, aRes] = await Promise.all([
        fetch('/api/roles'),
        fetch('/api/candidates'),
        fetch('/api/audit')
      ]);

      const rData = await rRes.json();
      const cData = await cRes.json();
      const aData = await aRes.json();

      setRoles(rData.roles || []);
      setCandidates(cData.candidates || []);
      setAuditEvents((aData.auditEvents || []).slice(0, 6));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newJd) return;

    try {
      setCreatingRole(true);
      const res = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          department: newDept,
          location: newLoc,
          rawJd: newJd
        })
      });

      if (res.ok) {
        setShowRoleModal(false);
        setNewTitle('');
        setNewJd('');
        await fetchDashboardData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingRole(false);
    }
  };

  // Cleanly remove any "Built with Spline" watermark badges inserted into DOM
  useEffect(() => {
    const purgeWatermarks = () => {
      const targets = document.querySelectorAll(
        'a[href*="spline.design"], a[href*="spline"], #spline-watermark, [class*="watermark"], [class*="spline-watermark"]'
      );
      targets.forEach(el => {
        (el as HTMLElement).style.setProperty('display', 'none', 'important');
        el.remove();
      });
    };

    purgeWatermarks();
    const observer = new MutationObserver(purgeWatermarks);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="w-full">
      {/* 2-Column Master Layout: Left Column = STICKY 3D Model, Right Column = All Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        
        {/* Left Side: Sticky 3D Spline Interactive Model */}
        <div className="lg:col-span-5 w-full lg:sticky lg:top-20 self-start z-10">
          <div className="w-full h-[440px] sm:h-[500px] lg:h-[calc(100vh-6.5rem)] max-h-[600px] relative flex items-center justify-center overflow-visible">
            
            {/* Realistic Floating Ground Shadow positioned directly under the floating robot */}
            <div
              aria-hidden="true"
              className="absolute bottom-[118px] sm:bottom-[128px] lg:bottom-[132px] left-1/2 pointer-events-none -translate-x-1/2 translate-x-4 sm:translate-x-8 flex items-center justify-center"
            >
              {/* Soft Ambient Penumbra */}
              <div
                className="w-52 sm:w-60 h-6 sm:h-7 rounded-[50%]"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(15, 15, 15, 0.18) 0%, rgba(15, 15, 15, 0.05) 50%, transparent 75%)',
                  filter: 'blur(8px)',
                }}
              />
              {/* Focused Core Occlusion Shadow */}
              <div
                className="absolute w-32 sm:w-38 h-3 sm:h-3.5 rounded-[50%]"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(15, 15, 15, 0.40) 0%, rgba(15, 15, 15, 0.15) 45%, transparent 75%)',
                  filter: 'blur(4px)',
                }}
              />
            </div>

            {/* 3D Spline Character: pushed rightward and bottom watermark badge completely clipped out */}
            <div 
              className="w-full h-full transform translate-x-4 sm:translate-x-8 flex items-center justify-center overflow-visible"
              style={{ clipPath: 'inset(0 0 110px 0)' }}
            >
              <Spline
                scene="https://prod.spline.design/p80gWRiUGIf-AO8E/scene.splinecode"
                className="w-full h-full cursor-grab active:cursor-grabbing"
              />
            </div>
          </div>
        </div>

        {/* Right Side: Akira Heading, Actions, KPI Stats, Active Roles, Candidates & Audit */}
        <div className="lg:col-span-7 space-y-8 text-left">
          
          {/* Hero Header & Action Buttons */}
          <div className="space-y-5 pt-2 sm:pt-4">
            <h1 className="font-akira text-2xl sm:text-3xl md:text-[2.1rem] lg:text-[2.25rem] text-[#0F0F0F] font-bold uppercase tracking-wider leading-snug sm:leading-tight">
              EVIDENCE BACKED CANDIDATE<br className="hidden sm:inline" /> SCREENING &amp; INTERVIEW INTELLIGENCE
            </h1>

            <p className="text-xs sm:text-sm text-neutral-600 max-w-xl leading-relaxed font-medium tracking-wide">
              Eliminate repetitive resume triage with precision requirement-to-evidence mapping, candidate-specific interview questions, and explainable audit trails.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <button
                onClick={() => setShowRoleModal(true)}
                className="inline-flex items-center justify-center gap-2 rounded-none sm:rounded-md bg-black hover:bg-[#FF3B30] text-white px-7 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer border-2 border-black"
              >
                <Plus className="h-4 w-4" />
                <span>Create New Role</span>
              </button>

              <Link
                href="/search"
                className="inline-flex items-center justify-center gap-2 rounded-none sm:rounded-md border-2 border-black bg-white hover:bg-neutral-100 text-black px-7 py-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shadow-sm"
              >
                <Search className="h-4 w-4 text-black" />
                <span>Natural Language Search</span>
              </Link>
            </div>
          </div>

          {/* KPI Stats Grid (2x2 on right side) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-neutral-300/80 bg-white p-5 shadow-xs hover:border-black transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-neutral-500 uppercase tracking-wider">Active Roles</span>
                <div className="rounded-lg bg-neutral-100 p-2 text-[#0F0F0F] border border-neutral-200">
                  <Briefcase className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-display font-bold text-[#0F0F0F]">{roles.length}</p>
              <p className="mt-1 text-xs text-neutral-500">Standardized JD requirement models</p>
            </div>

            <div className="rounded-xl border border-neutral-300/80 bg-white p-5 shadow-xs hover:border-black transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-neutral-500 uppercase tracking-wider">Candidates Screened</span>
                <div className="rounded-lg bg-neutral-100 p-2 text-[#0F0F0F] border border-neutral-200">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-display font-bold text-[#0F0F0F]">{candidates.length}</p>
              <p className="mt-1 text-xs text-neutral-500">Evidence mapped & verified</p>
            </div>

            <div className="rounded-xl border border-neutral-300/80 bg-white p-5 shadow-xs hover:border-black transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-neutral-500 uppercase tracking-wider">Interview Sessions</span>
                <div className="rounded-lg bg-neutral-100 p-2 text-[#0F0F0F] border border-neutral-200">
                  <Cpu className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-display font-bold text-[#0F0F0F]">
                {candidates.filter(c => c.status === 'EVALUATED' || c.status === 'INTERVIEW_SCHEDULED').length}
              </p>
              <p className="mt-1 text-xs text-neutral-500">AI-tailored questions & follow-ups</p>
            </div>

            <div className="rounded-xl border border-neutral-300/80 bg-white p-5 shadow-xs hover:border-black transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-neutral-500 uppercase tracking-wider">Decision Authority</span>
                <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 text-3xl font-display font-bold text-emerald-700">100% Human</p>
              <p className="mt-1 text-xs text-neutral-500">Zero autonomous rejections</p>
            </div>
          </div>

          {/* Active Roles Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-[#0F0F0F]" />
                <h2 className="text-base font-display font-bold text-[#0F0F0F] tracking-wide uppercase">ACTIVE HIRING ROLES</h2>
              </div>
              <Link 
                href="/roles" 
                className="text-xs font-semibold text-neutral-700 hover:text-black flex items-center gap-1 group"
              >
                <span>View All Roles</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            <div className="space-y-3">
              {roles.map(role => (
                <div 
                  key={role.id}
                  className="group rounded-xl border border-neutral-300/80 bg-white p-5 hover:border-black transition-all shadow-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-base font-bold text-[#0F0F0F] group-hover:text-black transition-colors">
                          {role.title}
                        </h3>
                        <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] font-mono font-semibold text-neutral-800 border border-neutral-300">
                          {role.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-neutral-500">
                        <span>{role.department}</span>
                        <span>•</span>
                        <span>{role.location}</span>
                        <span>•</span>
                        <span className="text-neutral-800 font-mono font-medium">
                          {role.requirements?.length || 0} Requirements
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-mono font-semibold text-neutral-700 border border-neutral-300">
                        {role.candidateCount || 0} Candidates
                      </span>
                      <Link
                        href={`/roles/${role.id}`}
                        className="rounded-lg bg-[#0F0F0F] px-4 py-2 text-xs font-display font-bold text-white hover:bg-[#FF3B30] transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <span>Role Workspace</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Natural Language Search Banner */}
            <div className="rounded-xl border border-neutral-300/80 bg-white p-5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-neutral-100 text-[#0F0F0F] border border-neutral-200">
                  <Search className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#0F0F0F]">Natural Language Candidate Search</h4>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    Semantic requirement matching across parsed resume snippets and portfolios.
                  </p>
                </div>
              </div>
              <div className="mt-3.5">
                <Link 
                  href="/search" 
                  className="w-full text-left rounded-lg border border-neutral-300 bg-neutral-50 hover:bg-neutral-100 px-4 py-2.5 text-xs text-neutral-600 hover:text-black hover:border-black transition-all flex items-center justify-between shadow-2xs"
                >
                  <span>Try: &ldquo;Show candidates with distributed systems and Kafka scale&rdquo;</span>
                  <ArrowRight className="h-4 w-4 text-[#0F0F0F]" />
                </Link>
              </div>
            </div>
          </div>

          {/* Subgrid: Recent Candidates & Audit Feed */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Candidates Box */}
            <div className="rounded-xl border border-neutral-300/80 bg-white p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#0F0F0F]" />
                  <h3 className="text-sm font-display font-bold text-[#0F0F0F] uppercase">RECENT CANDIDATES</h3>
                </div>
                <Link href="/candidates" className="text-xs font-semibold text-neutral-600 hover:text-black hover:underline">
                  View All
                </Link>
              </div>

              <div className="space-y-2.5">
                {candidates.slice(0, 4).map(cand => (
                  <Link
                    key={cand.id}
                    href={`/candidates/${cand.id}`}
                    className="block rounded-lg border border-neutral-200 bg-neutral-50/60 p-3 hover:border-black hover:bg-white transition-all shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-[#0F0F0F]">{cand.name}</span>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border border-neutral-300 bg-white text-neutral-800">
                        {cand.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1 truncate">{cand.currentTitle}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {cand.skills.slice(0, 3).map((s, idx) => (
                        <span key={idx} className="rounded bg-neutral-200/70 px-1.5 py-0.5 text-[10px] text-neutral-700 font-mono">
                          {s}
                        </span>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Audit Feed */}
            <div className="rounded-xl border border-neutral-300/80 bg-white p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-[#0F0F0F]" />
                  <h3 className="text-sm font-display font-bold text-[#0F0F0F] uppercase">AUDIT TRAIL</h3>
                </div>
                <Link href="/audit" className="text-xs font-semibold text-neutral-600 hover:text-black hover:underline">
                  Full Log
                </Link>
              </div>

              <div className="space-y-3 text-xs">
                {auditEvents.map(evt => (
                  <div key={evt.id} className="border-l-2 border-black pl-3 py-0.5 space-y-0.5">
                    <div className="flex items-center justify-between text-[11px] text-neutral-500">
                      <span className="font-bold text-[#0F0F0F]">{evt.action.replace('_', ' ')}</span>
                      <span className="font-mono">{new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-neutral-600 line-clamp-2">{evt.details}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Modal: Create Role & Parse JD */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-2xl rounded-2xl border-2 border-black bg-white shadow-2xl p-6 sm:p-8 space-y-5 text-[#0F0F0F] animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#0F0F0F] text-white border border-black">
                  <Briefcase className="h-5 w-5 text-[#FF3B30]" />
                </div>
                <div>
                  <h3 className="text-base font-display font-bold text-[#0F0F0F]">Create New Role & Parse Requirements</h3>
                  <p className="text-xs text-neutral-500">AI extracts discrete criteria with source citations for human validation</p>
                </div>
              </div>
              <button 
                onClick={() => setShowRoleModal(false)}
                className="text-neutral-400 hover:text-black text-sm cursor-pointer p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-neutral-700">Role Title</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g. Principal Cloud Infrastructure Engineer"
                    className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-[#0F0F0F] placeholder-neutral-400 focus:border-black focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-700">Department</label>
                  <input
                    type="text"
                    value={newDept}
                    onChange={e => setNewDept(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-[#0F0F0F] focus:border-black focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-700">Location</label>
                <input
                  type="text"
                  value={newLoc}
                  onChange={e => setNewLoc(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-[#0F0F0F] focus:border-black focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-700">Job Description (Paste raw text)</label>
                  <button
                    type="button"
                    onClick={() => {
                      setNewTitle('Principal Cloud Architect');
                      setNewDept('Infrastructure');
                      setNewLoc('Remote');
                      setNewJd(`Role: Principal Cloud Architect
Experience: 8+ years designing multi-region cloud architectures.
Requirements:
- 8+ years of hands-on experience designing cloud infrastructure in AWS and GCP.
- Deep expertise in Terraform, Kubernetes, and automated infrastructure as code.
- Proven experience with SOC2 compliance and zero-trust security architecture.
- Track record of leading architecture review boards and cross-team tech alignment.
- Preferred: AWS Certified Solutions Architect Professional.
- Preferred: Experience managing $5M+ annual cloud infrastructure budgets.`);
                    }}
                    className="text-[11px] text-neutral-500 hover:text-black underline cursor-pointer"
                  >
                    Paste sample JD
                  </button>
                </div>
                <textarea
                  rows={7}
                  required
                  value={newJd}
                  onChange={e => setNewJd(e.target.value)}
                  placeholder="Paste complete Job Description here..."
                  className="w-full rounded-lg border border-neutral-300 bg-neutral-50 p-3 text-xs text-[#0F0F0F] placeholder-neutral-400 font-mono focus:border-black focus:outline-hidden"
                />
              </div>

              <div className="rounded-lg bg-neutral-100 border border-neutral-200 p-3 text-xs text-neutral-600 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#FF3B30] shrink-0" />
                <span>AI will extract discrete requirements, categorize them, and flag exact JD source citations for recruiter review.</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingRole}
                  className="rounded-lg bg-[#0F0F0F] px-5 py-2 text-xs font-display font-bold text-white hover:bg-[#FF3B30] transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {creatingRole ? 'Extracting Requirements...' : 'Create Role & Parse JD'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
