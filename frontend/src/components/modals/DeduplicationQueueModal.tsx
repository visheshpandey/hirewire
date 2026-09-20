'use client';

import React, { useState } from 'react';
import { 
  X, 
  CopyCheck, 
  AlertTriangle, 
  CheckCircle2, 
  GitMerge, 
  Split, 
  Trash2,
  Calendar,
  Mail,
  Briefcase,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { DuplicateCandidateRecord } from '@/lib/types';

interface DeduplicationQueueModalProps {
  duplicates: DuplicateCandidateRecord[];
  isOpen: boolean;
  onClose: () => void;
  onResolved: () => void;
}

export function DeduplicationQueueModal({
  duplicates,
  isOpen,
  onClose,
  onResolved
}: DeduplicationQueueModalProps) {
  const [selectedId, setSelectedId] = useState<string>(duplicates[0]?.id || '');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentRecord = duplicates.find(d => d.id === selectedId) || duplicates[0];
  const pendingCount = duplicates.filter(d => d.status === 'PENDING_REVIEW').length;

  const handleAction = async (action: 'MERGED' | 'KEPT_SEPARATE' | 'DISMISSED') => {
    if (!currentRecord) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/candidates/duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentRecord.id,
          action,
          notes: resolutionNotes
        })
      });
      if (res.ok) {
        setResolutionNotes('');
        onResolved();
      }
    } catch (err) {
      console.error('Failed to resolve duplicate:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col bg-[#f3f2f2] text-[#0F0F0F] border border-neutral-300 shadow-2xl rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-300 bg-white">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#0F0F0F] text-white flex items-center justify-center">
              <CopyCheck className="w-5 h-5 text-[#FF3B30]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-base text-[#0F0F0F]">
                  Candidate Deduplication & Merge Queue
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/30 rounded-full">
                  {pendingCount} PENDING REVIEW
                </span>
              </div>
              <p className="text-xs text-neutral-500 font-mono">
                Second PRD §5.2 · Name & email collision resolution protocol
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-500 hover:text-black rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {duplicates.length === 0 ? (
            <div className="text-center py-12 text-neutral-500">
              <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-600 mb-3" />
              <p className="font-bold text-sm">No duplicate records detected</p>
              <p className="text-xs">Candidate pool integrity is 100% verified.</p>
            </div>
          ) : (
            currentRecord && (
              <>
                {/* Match Summary Alert */}
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-900 space-y-1">
                    <div className="font-semibold flex items-center gap-2">
                      <span>Potential Duplicate Submission Detected</span>
                      <span className="font-mono bg-amber-200/80 px-1.5 py-0.5 rounded text-[11px]">
                        Confidence: {currentRecord.confidenceScore}%
                      </span>
                    </div>
                    <p className="text-amber-800">{currentRecord.matchReason}</p>
                  </div>
                </div>

                {/* Side-by-Side Comparison Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Original Profile */}
                  <div className="bg-white border border-neutral-300 rounded-lg p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                      <span className="text-[11px] font-mono text-neutral-500 uppercase font-semibold">
                        Existing Active Record
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-mono bg-neutral-100 text-neutral-700 rounded">
                        CANONICAL
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-display font-bold text-base text-[#0F0F0F]">
                        {currentRecord.originalCandidateName}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-neutral-600">
                        <Briefcase className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{currentRecord.originalRoleTitle}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-neutral-600">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Applied: {new Date(currentRecord.originalAppliedDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-neutral-50 border border-neutral-200 rounded text-xs text-neutral-600">
                      Current profile is active in evaluation pipeline with linked interview evidence.
                    </div>
                  </div>

                  {/* Incoming Duplicate Submission */}
                  <div className="bg-white border border-[#FF3B30]/30 rounded-lg p-5 space-y-4 relative">
                    <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
                      <span className="text-[11px] font-mono text-[#FF3B30] uppercase font-semibold flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-[#FF3B30]" />
                        Incoming Resubmission
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-mono bg-[#FF3B30]/10 text-[#FF3B30] rounded">
                        RECENT UPLOAD
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-display font-bold text-base text-[#0F0F0F]">
                        {currentRecord.incomingCandidateName}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-neutral-600">
                        <Mail className="w-3.5 h-3.5 text-neutral-400" />
                        <span>{currentRecord.incomingEmail}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-neutral-600">
                        <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Submitted: {new Date(currentRecord.incomingSubmissionDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Detected Differences / New Signals */}
                    <div className="space-y-2 border-t border-neutral-200 pt-3">
                      <div className="text-[11px] font-mono uppercase text-neutral-500 font-semibold">
                        Newly Detected Additions:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {currentRecord.newSkillsDetected.map((skill, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded text-[11px] font-mono font-medium">
                            +{skill}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-neutral-600 italic bg-neutral-50 p-2 rounded border border-neutral-200">
                        &ldquo;{currentRecord.newExperienceAdded}&rdquo;
                      </p>
                    </div>
                  </div>
                </div>

                {/* Resolution Notes */}
                <div className="bg-white border border-neutral-300 rounded-lg p-4 space-y-2">
                  <label className="block text-xs font-semibold text-neutral-700">
                    Resolution Justification (Logged to Immutable Audit Trail):
                  </label>
                  <input
                    type="text"
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="e.g. Candidate submitted updated portfolio with 2026 Q3 Raft paper; consolidating into single record."
                    className="w-full text-xs px-3 py-2 border border-neutral-300 rounded focus:outline-none focus:border-black bg-neutral-50"
                  />
                </div>
              </>
            )
          )}
        </div>

        {/* Footer Actions */}
        {currentRecord && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-300 bg-white">
            <div className="text-xs text-neutral-500 font-mono">
              Status: <span className="font-semibold text-[#0F0F0F]">{currentRecord.status}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleAction('DISMISSED')}
                className="px-3 py-2 text-xs font-semibold text-neutral-600 hover:text-red-700 border border-neutral-300 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Dismiss Duplicate
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleAction('KEPT_SEPARATE')}
                className="px-3 py-2 text-xs font-semibold text-neutral-800 border border-neutral-300 hover:bg-neutral-100 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Split className="w-3.5 h-3.5" />
                Keep as Separate
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleAction('MERGED')}
                className="px-4 py-2 text-xs font-bold text-white bg-[#0F0F0F] hover:bg-[#FF3B30] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <GitMerge className="w-3.5 h-3.5" />
                Merge & Update Canonical Profile
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
