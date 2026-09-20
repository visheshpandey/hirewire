'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Briefcase, Plus, Users, ChevronRight, FileCheck, MapPin, Sparkles, X } from 'lucide-react';
import { Role } from '@/lib/types';

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  // New Role Modal state
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDept, setNewDept] = useState('Platform Engineering');
  const [newLoc, setNewLoc] = useState('Remote');
  const [newJd, setNewJd] = useState('');
  const [creatingRole, setCreatingRole] = useState(false);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = () => {
    setLoading(true);
    fetch('/api/roles')
      .then(res => res.json())
      .then(data => setRoles(data.roles || []))
      .finally(() => setLoading(false));
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
        loadRoles();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingRole(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-300/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-neutral-500 uppercase tracking-wider">
              REQUIREMENT EXTRACTION ENGINE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight text-[#0F0F0F] mt-1 flex items-center gap-2.5">
            <Briefcase className="h-6 w-6 text-[#0F0F0F]" />
            <span>Hiring Roles</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1 font-sans max-w-2xl">
            Manage job descriptions, AI-extracted requirements, candidate pools, and interview workflows.
          </p>
        </div>
        <button
          onClick={() => setShowRoleModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-[#0F0F0F] px-5 py-2.5 text-xs font-display font-bold text-white hover:bg-[#FF3B30] transition-colors shadow-sm cursor-pointer active:scale-95 border-2 border-black"
        >
          <Plus className="h-4 w-4" />
          <span>New Role</span>
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center space-y-3">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#0F0F0F] border-t-transparent" />
          <p className="text-xs font-mono text-neutral-500">Loading active hiring roles...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles.map(role => (
            <div 
              key={role.id}
              className="rounded-xl border border-neutral-300/80 bg-white p-5 space-y-4 hover:border-black transition-all shadow-xs"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono font-bold text-neutral-600 uppercase tracking-wider">
                    {role.department}
                  </span>
                  <h3 className="text-base font-display font-bold text-[#0F0F0F]">{role.title}</h3>
                  <p className="text-xs text-neutral-500 flex items-center gap-1 font-mono">
                    <MapPin className="h-3 w-3 text-neutral-400" />
                    {role.location}
                  </p>
                </div>
                <span className="rounded-md bg-neutral-100 border border-neutral-300 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-neutral-800">
                  {role.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-200 text-xs">
                <div className="rounded-lg bg-neutral-50 p-2.5 border border-neutral-200">
                  <span className="text-neutral-500 block text-[11px] font-mono">Requirements</span>
                  <span className="font-bold text-[#0F0F0F] mt-0.5 block font-display">
                    {role.requirements?.length || 0} extracted
                  </span>
                </div>
                <div className="rounded-lg bg-neutral-50 p-2.5 border border-neutral-200">
                  <span className="text-neutral-500 block text-[11px] font-mono">Candidates</span>
                  <span className="font-bold text-[#0F0F0F] mt-0.5 block font-display">
                    {role.candidateCount || 0} in pipeline
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Link
                  href={`/roles/${role.id}`}
                  className="w-full text-center rounded-lg bg-[#0F0F0F] hover:bg-[#FF3B30] px-4 py-2 text-xs font-display font-bold text-white transition-colors flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <span>Open Role Workspace</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

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
