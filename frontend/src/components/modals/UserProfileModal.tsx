'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { 
  User, 
  ShieldCheck, 
  Key, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Sliders, 
  LogOut, 
  Lock, 
  Sparkles, 
  X, 
  Clock, 
  Building, 
  Mail, 
  ShieldAlert,
  Fingerprint
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const [mounted, setMounted] = useState(false);
  const [activePersona, setActivePersona] = useState<'recruiter' | 'vp' | 'compliance'>('recruiter');
  const [blindReviewMode, setBlindReviewMode] = useState(false);
  const [strictCitations, setStrictCitations] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const isClosingRef = useRef(false);

  const backdropRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleClose = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    if (!modalRef.current || !backdropRef.current) {
      isClosingRef.current = false;
      onClose();
      return;
    }

    const tl = gsap.timeline({
      onComplete: () => {
        isClosingRef.current = false;
        onClose();
      },
    });

    tl.to(modalRef.current, {
      opacity: 0,
      scale: 0.9,
      y: 18,
      duration: 0.22,
      ease: 'power2.in',
    });

    tl.to(
      backdropRef.current,
      {
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in',
      },
      '<0.05'
    );
  }, [onClose]);

  // GSAP Entry Animation
  useEffect(() => {
    if (!isOpen || !mounted) return;

    isClosingRef.current = false;
    document.body.style.overflow = 'hidden';

    // Set initial GSAP states
    gsap.set(backdropRef.current, { opacity: 0 });
    gsap.set(modalRef.current, {
      opacity: 0,
      scale: 0.86,
      y: -20,
      rotateX: 6,
      transformPerspective: 1000,
    });
    if (avatarRef.current) {
      gsap.set(avatarRef.current, { scale: 0.5, rotate: -15, opacity: 0 });
    }

    const tl = gsap.timeline();

    // 1. Backdrop fade in
    tl.to(backdropRef.current, {
      opacity: 1,
      duration: 0.32,
      ease: 'power2.out',
    });

    // 2. Modal card spring up
    tl.to(
      modalRef.current,
      {
        opacity: 1,
        scale: 1,
        y: 0,
        rotateX: 0,
        duration: 0.46,
        ease: 'back.out(1.4)',
      },
      '<0.05'
    );

    // 3. Avatar pop
    if (avatarRef.current) {
      tl.to(
        avatarRef.current,
        {
          opacity: 1,
          scale: 1,
          rotate: 0,
          duration: 0.4,
          ease: 'back.out(2)',
        },
        '<0.1'
      );
    }

    // 4. Staggered reveal of body sections
    if (bodyRef.current) {
      const items = Array.from(bodyRef.current.children);
      tl.fromTo(
        items,
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.36,
          stagger: 0.05,
          ease: 'power2.out',
        },
        '<0.15'
      );
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      tl.kill();
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, mounted, handleClose]);

  const handlePersonaSelect = (id: 'recruiter' | 'vp' | 'compliance') => {
    setActivePersona(id);
    if (avatarRef.current) {
      gsap.fromTo(
        avatarRef.current,
        { scale: 0.8, rotate: -8 },
        { scale: 1, rotate: 0, duration: 0.35, ease: 'back.out(2)' }
      );
    }
  };

  if (!isOpen || !mounted) return null;

  const personas = [
    {
      id: 'recruiter',
      name: 'Alex Thorne',
      role: 'Lead Talent Intelligence Architect',
      dept: 'Platform Engineering & Core Systems',
      email: 'alex.thorne@hireflow.internal',
      initials: 'AT',
      clearance: 'Level 4 — Human Sovereignty & Override Authority',
      color: '#0F0F0F'
    },
    {
      id: 'vp',
      name: 'Elena Rostova',
      role: 'VP of Engineering',
      dept: 'Executive Hiring Committee',
      email: 'elena.rostova@hireflow.internal',
      initials: 'ER',
      clearance: 'Level 5 — Executive Hiring Decision Authority',
      color: '#1E293B'
    },
    {
      id: 'compliance',
      name: 'Marcus Vance',
      role: 'Chief AI Ethics & Compliance Officer',
      dept: 'Algorithmic Governance & EEOC Auditing',
      email: 'marcus.vance@hireflow.internal',
      initials: 'MV',
      clearance: 'Level 4 — Immutable Audit Inspection Authority',
      color: '#334155'
    }
  ];

  const current = personas.find(p => p.id === activePersona)!;

  return createPortal(
    <div 
      ref={backdropRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div 
        ref={modalRef}
        className="w-full max-w-lg my-auto bg-[#f3f2f2] text-[#0F0F0F] rounded-2xl border border-neutral-300 shadow-2xl overflow-hidden relative max-h-[90vh] flex flex-col"
      >
        {/* Modal Top Banner */}
        <div className="bg-[#0F0F0F] text-white p-5 sm:p-6 relative shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Close user profile"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div 
              ref={avatarRef}
              className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-white text-[#0F0F0F] flex items-center justify-center text-xl font-mono font-extrabold shadow-md border border-neutral-700 shrink-0"
            >
              {current.initials}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-base sm:text-lg text-white leading-none">
                  {current.name}
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-mono text-emerald-400 font-semibold border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  AUTHENTICATED
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-medium">{current.role}</p>
              <div className="flex items-center gap-3 text-[11px] text-neutral-400 font-mono pt-0.5">
                <span className="flex items-center gap-1">
                  <Building className="w-3 h-3 text-neutral-500" />
                  {current.dept}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div ref={bodyRef} className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Persona Switcher */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono font-bold text-neutral-500 uppercase tracking-wider">
              Operator Persona (Role Switch)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {personas.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePersonaSelect(p.id as any)}
                  className={`px-2.5 py-2 rounded-xl text-left border transition-all cursor-pointer ${
                    activePersona === p.id 
                      ? 'border-black bg-white shadow-xs' 
                      : 'border-neutral-300/80 bg-white/50 hover:bg-white text-neutral-600'
                  }`}
                >
                  <div className="text-[11px] font-bold text-[#0F0F0F] truncate">{p.name}</div>
                  <div className="text-[9px] text-neutral-500 font-mono truncate">{p.role.split(' ')[0]}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Security & Credentials Card */}
          <div className="bg-white rounded-xl border border-neutral-300/80 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
              <span className="text-xs font-bold text-[#0F0F0F] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Security Credentials &amp; Sovereignty
              </span>
              <span className="text-[10px] font-mono text-neutral-500">SESSION ID: HF-9082</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-mono text-neutral-500 block uppercase">Clearance Level</span>
                <span className="font-semibold text-neutral-800 text-[11px]">{current.clearance}</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-neutral-500 block uppercase">Verification Standard</span>
                <span className="font-semibold text-neutral-800 text-[11px]">SOC2 Type-III &amp; ISO-42001</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-neutral-500 block uppercase">Encryption</span>
                <span className="font-mono text-neutral-800 text-[11px]">AES-256-GCM Hardware</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-neutral-500 block uppercase">Audit Ledger Signature</span>
                <span className="font-mono text-neutral-800 text-[11px]">SHA256: 4f98...d10e</span>
              </div>
            </div>
          </div>

          {/* Recruiter Workspace Preferences */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono font-bold text-neutral-500 uppercase tracking-wider">
              Intelligence Engine Configuration
            </label>
            <div className="space-y-2 bg-white rounded-xl border border-neutral-300/80 p-3.5">
              
              {/* Blind Evaluation Mode */}
              <div className="flex items-center justify-between py-1 border-b border-neutral-100">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F0F0F]">
                    {blindReviewMode ? <EyeOff className="w-3.5 h-3.5 text-neutral-700" /> : <Eye className="w-3.5 h-3.5 text-neutral-700" />}
                    <span>Blind Evaluation Mode (PII Masking)</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Anonymizes candidate names, photos, gender, and school names to eliminate cognitive bias.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setBlindReviewMode(!blindReviewMode)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    blindReviewMode ? 'bg-[#0F0F0F]' : 'bg-neutral-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      blindReviewMode ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Strict Evidence Citation */}
              <div className="flex items-center justify-between py-1">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F0F0F]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Strict Evidence Grounding Requirement</span>
                  </div>
                  <p className="text-[11px] text-neutral-500">
                    Disallows candidate qualification without verified line-level resume citations.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStrictCitations(!strictCitations)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    strictCitations ? 'bg-[#0F0F0F]' : 'bg-neutral-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      strictCitations ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-neutral-300/80">
            <button
              type="button"
              onClick={() => {
                setIsLocked(true);
                setTimeout(() => {
                  setIsLocked(false);
                  handleClose();
                }, 900);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-neutral-600 hover:text-black border border-neutral-300 rounded-lg hover:bg-neutral-200/60 transition-colors cursor-pointer font-medium"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isLocked ? 'Session Locked...' : 'Lock Workspace'}</span>
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2 bg-[#0F0F0F] hover:bg-black text-white rounded-lg text-xs font-bold font-display transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
