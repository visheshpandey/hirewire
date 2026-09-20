'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Search, 
  ChevronRight, 
  Briefcase, 
  Sparkles,
  CopyCheck,
  AlertTriangle,
  ShieldCheck,
  Percent
} from 'lucide-react';
import { Candidate, Role, DuplicateCandidateRecord } from '@/lib/types';
import { DeduplicationQueueModal } from '@/components/modals/DeduplicationQueueModal';

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateCandidateRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDedupOpen, setIsDedupOpen] = useState(false);

  const loadData = () => {
    Promise.all([
      fetch('/api/candidates').then(r => r.json()),
      fetch('/api/roles').then(r => r.json()),
      fetch('/api/candidates/duplicates').then(r => r.json())
    ]).then(([cData, rData, dData]) => {
      setCandidates(cData.candidates || []);
      setRoles(rData.roles || []);
      setDuplicates(dData.duplicates || []);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const pendingDuplicates = duplicates.filter(d => d.status === 'PENDING_REVIEW');

  const filtered = candidates.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
    c.currentTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-300/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-neutral-500 uppercase tracking-wider">
              CANDIDATE INTELLIGENCE PIPELINE
            </span>
          </div>
          <h1 className="text-2xl font-display font-bold tracking-tight text-[#0F0F0F] mt-1 flex items-center gap-2.5">
            <Users className="h-6 w-6 text-[#0F0F0F]" />
            <span>Candidate Intelligence Pool</span>
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Browse all screened candidates, view evidence matrices, conduct structured interviews, and review evaluations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {pendingDuplicates.length > 0 && (
            <button
              onClick={() => setIsDedupOpen(true)}
              className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-2xs"
            >
              <CopyCheck className="w-4 h-4 text-amber-700" />
              <span>Deduplication Queue ({pendingDuplicates.length})</span>
            </button>
          )}

          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter by name, skill, title..."
              className="w-full rounded-lg border border-neutral-300 bg-white pl-9 pr-3 py-2 text-xs text-[#0F0F0F] placeholder-neutral-400 focus:border-black focus:outline-hidden shadow-2xs"
            />
          </div>
        </div>
      </div>

      {/* Second PRD §5.2 Deduplication Queue Alert Banner */}
      {pendingDuplicates.length > 0 && (
        <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-xl flex items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-950">
                  {pendingDuplicates.length} Duplicate Submission Detected
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-amber-200 text-amber-900 rounded font-semibold">
                  PRD §5.2 COMPLIANCE
                </span>
              </div>
              <p className="text-xs text-amber-800">
                Incoming application matches existing record &ldquo;{pendingDuplicates[0].originalCandidateName}&rdquo; with updated resume artifacts.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsDedupOpen(true)}
            className="px-3.5 py-1.5 bg-[#0F0F0F] hover:bg-[#FF3B30] text-white rounded-lg text-xs font-bold font-display transition-colors shrink-0 cursor-pointer"
          >
            Review & Merge
          </button>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(cand => {
          const role = roles.find(r => r.id === cand.roleId);
          return (
            <div 
              key={cand.id}
              className="rounded-xl border border-neutral-300/80 bg-white p-5 hover:border-black transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-base font-bold text-[#0F0F0F]">
                    {cand.name}
                  </h3>
                  <span className="rounded-md border border-neutral-300 bg-neutral-100 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-neutral-800">
                    {cand.status.replace('_', ' ')}
                  </span>
                  {cand.tier && (
                    <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                      cand.tier === 'STRONG_MATCH'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : cand.tier === 'PARTIAL_MATCH'
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-neutral-200 text-neutral-700'
                    }`}>
                      {cand.tier.replace('_', ' ')}
                    </span>
                  )}
                  {cand.isAnonymized && (
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-300 rounded">
                      GDPR ANONYMIZED
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-600 font-medium">{cand.currentTitle}</p>
                <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono">
                  <Briefcase className="h-3 w-3 text-neutral-400" />
                  <span>Role: </span>
                  <span className="text-[#0F0F0F] font-semibold">{role?.title || 'General Engineering'}</span>
                  <span>•</span>
                  <span>{cand.experienceYears} yrs experience</span>
                  {cand.matchScore && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-0.5 font-bold text-neutral-800">
                        <Sparkles className="w-3 h-3 text-[#FF3B30]" />
                        Match: {cand.matchScore}%
                      </span>
                    </>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {cand.skills.slice(0, 5).map((s, i) => (
                    <span key={i} className="rounded bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-[10px] text-neutral-700 font-mono">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href={`/candidates/${cand.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F0F0F] hover:bg-[#FF3B30] px-4 py-2 text-xs font-display font-bold text-white transition-colors shadow-2xs"
                >
                  <span>Open Workspace</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deduplication Modal */}
      <DeduplicationQueueModal
        duplicates={duplicates}
        isOpen={isDedupOpen}
        onClose={() => setIsDedupOpen(false)}
        onResolved={() => {
          loadData();
          setIsDedupOpen(false);
        }}
      />
    </div>
  );
}

