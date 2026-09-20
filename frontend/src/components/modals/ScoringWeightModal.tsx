'use client';

import React, { useState } from 'react';
import { 
  X, 
  Sliders, 
  Sparkles, 
  Check, 
  Scale, 
  CheckCircle2,
  Info
} from 'lucide-react';
import { Requirement, RoleScoringConfig } from '@/lib/types';

interface ScoringWeightModalProps {
  roleId: string;
  requirements: Requirement[];
  currentConfig?: RoleScoringConfig;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function ScoringWeightModal({
  roleId,
  requirements,
  currentConfig,
  isOpen,
  onClose,
  onSaved
}: ScoringWeightModalProps) {
  const [mustHaveWeight, setMustHaveWeight] = useState<number>(currentConfig?.mustHaveWeight ?? 70);
  const [multipliers, setMultipliers] = useState<Record<string, number>>(currentConfig?.customMultipliers ?? {});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const niceToHaveWeight = 100 - mustHaveWeight;

  const handleMultiplierChange = (reqId: string, value: number) => {
    setMultipliers(prev => ({
      ...prev,
      [reqId]: value
    }));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/roles/${roleId}/scoring-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mustHaveWeight,
          niceToHaveWeight,
          customMultipliers: multipliers
        })
      });
      if (res.ok) {
        onSaved();
        onClose();
      }
    } catch (err) {
      console.error('Failed to save scoring config:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const mustHaves = requirements.filter(r => r.priority === 'REQUIRED');
  const niceToHaves = requirements.filter(r => r.priority === 'PREFERRED');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#f3f2f2] text-[#0F0F0F] border border-neutral-300 shadow-2xl rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-300 bg-white">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-[#0F0F0F] text-white flex items-center justify-center">
              <Sliders className="w-5 h-5 text-[#FF3B30]" />
            </div>
            <div>
              <h2 className="font-display font-bold text-base text-[#0F0F0F]">
                Scoring Weight Calibration & Priority Multipliers
              </h2>
              <p className="text-xs text-neutral-500 font-mono">
                Second PRD §6.1 · Recruiter-adjustable match scoring weights
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
          {/* Ratio Slider Card */}
          <div className="bg-white border border-neutral-300 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-neutral-700" />
                <span className="font-bold text-xs uppercase tracking-wider text-neutral-800">
                  Global Weight Distribution
                </span>
              </div>
              <span className="font-mono text-xs font-bold text-[#FF3B30] bg-[#FF3B30]/10 px-2 py-0.5 rounded border border-[#FF3B30]/20">
                {mustHaveWeight}% Must-Have · {niceToHaveWeight}% Nice-to-Have
              </span>
            </div>

            <div className="space-y-2">
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={mustHaveWeight}
                onChange={(e) => setMustHaveWeight(Number(e.target.value))}
                className="w-full accent-[#0F0F0F] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-mono text-neutral-500">
                <span>Balanced (50% / 50%)</span>
                <span>Standard (70% / 30%)</span>
                <span>Strict Must-Haves (90% / 10%)</span>
              </div>
            </div>

            <div className="p-3 bg-neutral-50 border border-neutral-200 rounded text-xs text-neutral-600 flex items-start gap-2">
              <Info className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
              <span>
                Adjusting this slider modifies how heavily foundational required competencies impact candidate match score calculations across this role.
              </span>
            </div>
          </div>

          {/* Individual Requirement Multipliers */}
          <div className="bg-white border border-neutral-300 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
              <span className="font-bold text-xs uppercase tracking-wider text-neutral-800">
                Individual Requirement Priority Multipliers
              </span>
              <span className="text-[11px] font-mono text-neutral-500">
                Default: 1.0x
              </span>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {requirements.map(req => {
                const currentMult = multipliers[req.id] ?? 1.0;
                return (
                  <div 
                    key={req.id}
                    className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg flex items-center justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          req.priority === 'REQUIRED' 
                            ? 'bg-neutral-900 text-white' 
                            : 'bg-neutral-200 text-neutral-700'
                        }`}>
                          {req.priority}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400 uppercase">
                          {req.type}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-800 truncate font-medium">
                        {req.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {[1.0, 1.5, 2.0, 3.0].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleMultiplierChange(req.id, val)}
                          className={`px-2 py-1 text-[11px] font-mono rounded transition-colors ${
                            currentMult === val
                              ? 'bg-[#0F0F0F] text-white font-bold'
                              : 'bg-white text-neutral-600 border border-neutral-300 hover:bg-neutral-100'
                          }`}
                        >
                          {val}x
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-300 bg-white">
          <button
            type="button"
            onClick={() => {
              setMustHaveWeight(70);
              setMultipliers({});
            }}
            className="text-xs text-neutral-500 hover:text-black font-semibold underline"
          >
            Reset to Standard Defaults
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-700 border border-neutral-300 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold text-white bg-[#0F0F0F] hover:bg-[#FF3B30] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Check className="w-4 h-4" />
              Apply & Recalculate Scores
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
