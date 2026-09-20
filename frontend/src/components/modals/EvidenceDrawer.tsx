'use client';

import React from 'react';
import { X, FileText, CheckCircle2, ShieldAlert, Sparkles, UserCheck } from 'lucide-react';
import { Evidence, RequirementMapping, Requirement } from '@/lib/types';

interface EvidenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  requirement?: Requirement;
  mapping?: RequirementMapping;
  evidenceList: Evidence[];
}

export function EvidenceDrawer({
  isOpen,
  onClose,
  requirement,
  mapping,
  evidenceList
}: EvidenceDrawerProps) {
  if (!isOpen) return null;

  const relevantEvidence = evidenceList.filter(
    e => mapping?.evidenceIds.includes(e.id)
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/65 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div 
        className="w-full max-w-xl h-full bg-white border-l border-neutral-300 shadow-2xl flex flex-col overflow-hidden text-[#0F0F0F]"
      >
        {/* Header (Executive Onyx) */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-neutral-800 bg-[#0F0F0F] text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-neutral-800 border border-neutral-700 text-white">
              <FileText className="h-4 w-4 text-[#FF3B30]" />
            </div>
            <div>
              <h3 className="text-base font-display font-bold text-white">Source Evidence Inspector</h3>
              <p className="text-xs text-neutral-400 font-mono">Traceable audit connection to source artifacts</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#f3f2f2]">
          {/* 1. Target Requirement */}
          {requirement && (
            <div className="rounded-xl border border-neutral-300/80 bg-white p-4.5 space-y-2 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500">
                  Target Requirement
                </span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                  requirement.priority === 'REQUIRED'
                    ? 'border-black bg-[#0F0F0F] text-white'
                    : 'border-neutral-300 bg-neutral-100 text-neutral-700'
                }`}>
                  {requirement.priority}
                </span>
              </div>
              <p className="text-sm font-semibold text-[#0F0F0F]">{requirement.description}</p>
              {requirement.sourceSnippet && (
                <div className="text-xs text-neutral-700 bg-neutral-50 p-2.5 rounded-lg border border-neutral-200 font-mono">
                  <span className="text-neutral-500 font-semibold">JD Context: </span>
                  &ldquo;{requirement.sourceSnippet}&rdquo;
                </div>
              )}
            </div>
          )}

          {/* 2. AI Interpretation & Reasoning */}
          {mapping && (
            <div className="rounded-xl border border-neutral-300/80 bg-white p-4.5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-[#FF3B30]" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-700">
                    AI Interpretation & Reasoning
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-neutral-600">
                    {mapping.confidence}% Confidence
                  </span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-md font-mono font-bold border ${
                    mapping.status === 'SUPPORTED' 
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                      : mapping.status === 'PARTIALLY_SUPPORTED'
                      ? 'border-amber-300 bg-amber-50 text-amber-800'
                      : mapping.status === 'UNCLEAR'
                      ? 'border-neutral-300 bg-neutral-100 text-neutral-700'
                      : 'border-red-300 bg-red-50 text-red-800'
                  }`}>
                    {mapping.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <p className="text-sm text-neutral-800 leading-relaxed bg-neutral-50 p-3 rounded-lg border border-neutral-200">
                {mapping.aiReasoning}
              </p>
            </div>
          )}

          {/* 3. Original Candidate Evidence */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#0F0F0F]" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0F0F0F]">
                  Original Evidence Snippets ({relevantEvidence.length})
                </span>
              </div>
              <span className="text-[11px] text-neutral-500 font-mono">Verbatim text from source artifact</span>
            </div>

            {relevantEvidence.length === 0 ? (
              <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center text-neutral-500">
                <ShieldAlert className="h-6 w-6 mx-auto mb-2 text-amber-600" />
                <p className="text-sm font-bold text-[#0F0F0F]">No explicit documentary evidence found</p>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                  Per PRD rules: &ldquo;Not Found&rdquo; is never assumed as a disqualification. It is flagged for human probing during the interview.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {relevantEvidence.map((ev, index) => (
                  <div 
                    key={ev.id || index}
                    className="rounded-xl border border-neutral-300/80 bg-white p-4 space-y-2 hover:border-black transition-all shadow-xs"
                  >
                    <div className="flex items-center justify-between text-xs text-neutral-500 font-mono">
                      <span className="font-bold text-[#0F0F0F] flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        {ev.sourceDoc}
                      </span>
                      <span className="rounded bg-neutral-100 border border-neutral-200 px-2 py-0.5 text-neutral-700">
                        {ev.section} • {ev.pageOrLine || 'Verified snippet'}
                      </span>
                    </div>
                    <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200 text-sm text-neutral-900 font-serif italic border-l-4 border-l-[#0F0F0F]">
                      &ldquo;{ev.snippet}&rdquo;
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. Human Review & Override Status */}
          <div className="rounded-xl border border-neutral-300/80 bg-white p-4.5 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-neutral-700">
              <UserCheck className="h-4 w-4 text-emerald-600" />
              <span>Human Review Authority</span>
            </div>
            {mapping?.humanOverride ? (
              <div className="rounded-lg bg-emerald-50 border border-emerald-300 p-3 text-sm text-emerald-900">
                <span className="font-bold text-emerald-800">Manually Overridden to: </span>
                {mapping.humanOverride}
                {mapping.humanNotes && (
                  <p className="text-xs text-neutral-600 mt-1">Note: {mapping.humanNotes}</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-neutral-500">
                AI extraction is active. Recruiters hold final authority to modify or override this classification.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-300/80 bg-white flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg bg-[#0F0F0F] hover:bg-[#FF3B30] px-4 py-2 text-xs font-display font-bold text-white transition-colors cursor-pointer shadow-xs"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
