'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Character3D, Character3DHandle } from '@/components/ui/Character3D';
import { Navbar } from '@/components/layout/Navbar';
import { DashboardView } from '@/components/DashboardView';
import { scrollToTarget } from '@/components/layout/SmoothScroll';
import gsap from 'gsap';
import { 
  ArrowDown,
  RotateCcw, 
  ShieldCheck, 
  X
} from 'lucide-react';

export default function LandingPage() {
  const characterRef = useRef<Character3DHandle | null>(null);
  const [showMethodology, setShowMethodology] = useState(false);

  // GSAP animation refs
  const logoRef       = useRef<HTMLDivElement>(null);
  const navRef        = useRef<HTMLElement>(null);
  const modelRef      = useRef<HTMLDivElement>(null);
  const lettersRef    = useRef<HTMLHeadingElement>(null);
  const ctaRef        = useRef<HTMLDivElement>(null);
  const dashboardRef  = useRef<HTMLElement>(null);

  const scrollToDashboard = () => {
    scrollToTarget('#dashboard', { duration: 1.3 });
  };

  const scrollToTop = () => {
    scrollToTarget(0, { duration: 1.2 });
  };

  // ── GSAP Entry Animation ──────────────────────────────────────────────────
  useEffect(() => {
    // Set everything invisible before animating in
    gsap.set([logoRef.current, navRef.current, modelRef.current, ctaRef.current], {
      autoAlpha: 0,
    });
    if (lettersRef.current) {
      gsap.set(lettersRef.current.querySelectorAll('span'), {
        autoAlpha: 0,
        y: 60,
        rotateX: -90,
        transformOrigin: 'center bottom',
      });
    }
    gsap.set(modelRef.current, { y: -80, scale: 0.85 });
    gsap.set(ctaRef.current,    { y: 40 });
    gsap.set(logoRef.current,   { x: -30 });
    gsap.set(navRef.current,    { y: -20 });

    const tl = gsap.timeline({ delay: 0.1 });

    // 1. Logo slides in from left
    tl.to(logoRef.current, {
      autoAlpha: 1, x: 0,
      duration: 0.7, ease: 'power3.out',
    });

    // 2. Nav fades down simultaneously
    tl.to(navRef.current, {
      autoAlpha: 1, y: 0,
      duration: 0.6, ease: 'power3.out',
    }, '<0.1');

    // 3. 3D model drops in with bounce
    tl.to(modelRef.current, {
      autoAlpha: 1, y: 0, scale: 1,
      duration: 1.0, ease: 'back.out(1.5)',
    }, '<0.2');

    // 4. HIREFLOW letters flip in one by one
    if (lettersRef.current) {
      tl.to(lettersRef.current.querySelectorAll('span'), {
        autoAlpha: 1, y: 0, rotateX: 0,
        duration: 0.55,
        ease: 'back.out(2)',
        stagger: 0.07,
      }, '<0.3');
    }

    // 5. CTAs slide up
    tl.to(ctaRef.current, {
      autoAlpha: 1, y: 0,
      duration: 0.6, ease: 'power3.out',
    }, '<0.4');

    return () => { tl.kill(); };
  }, []);
  // ─────────────────────────────────────────────────────────────────────────

  // Handle initial page load, reload, and intentional navigation to dashboard
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // 1. Check if user intentionally navigated to Dashboard (via Navbar or /dashboard redirect)
    let shouldGoToDashboard = false;
    let isBackward = false;
    try {
      shouldGoToDashboard = 
        sessionStorage.getItem('navToDashboard') === 'true' ||
        window.location.search.includes('tab=dashboard') ||
        window.location.hash === '#dashboard';
      isBackward = sessionStorage.getItem('slideDirection') === 'backward';
    } catch (e) {}

    if (shouldGoToDashboard) {
      try {
        sessionStorage.removeItem('navToDashboard');
        sessionStorage.removeItem('slideDirection');
      } catch (e) {}

      // Clean query parameters and hash so future reloads won't have ?tab=dashboard or #dashboard
      window.history.replaceState(null, '', '/');

      // Scroll directly to Dashboard (Slide 2)
      const scrollToDash = () => {
        scrollToTarget('#dashboard', { immediate: true });
      };

      scrollToDash();
      const t1 = setTimeout(scrollToDash, 50);
      const t2 = setTimeout(scrollToDash, 150);
      const t3 = setTimeout(scrollToDash, 300);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }

    // 2. Otherwise (fresh arrival or reload without dashboard intent):
    // ALWAYS start at the top (Slide 1 Landing Page)
    if (window.location.hash || window.location.search) {
      window.history.replaceState(null, '', '/');
    }
    window.scrollTo(0, 0);
    scrollToTarget(0, { immediate: true });
  }, []);





  return (
    <div className="w-full bg-[#f3f2f2] text-[#0F0F0F] select-none wireframe-grid">
      {/* 
        Persistent Fixed Brand Logo in Top-Left across all slides:
        Stays fixed in the top-left corner as the user scrolls through the landing hero and down to the dashboard.
      */}
      <div ref={logoRef} className="fixed top-0 left-0 z-50 px-4 sm:px-8 py-4 sm:py-5 flex items-center pointer-events-auto">
        <button 
          type="button"
          onClick={scrollToTop}
          className="flex items-center gap-2.5 tracking-wider font-display font-bold text-sm sm:text-base cursor-pointer hover:opacity-80 transition-all bg-transparent text-[#0F0F0F]"
          title="Scroll to 3D Landing Page"
        >
          <span className="tracking-[0.2em] uppercase text-[#0F0F0F] font-bold">HIREFLOW</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SLIDE 1: 3D Core Interactive Landing Page — PINNED (sticky)               */}
      {/* ========================================================================= */}
      <section className="h-screen w-full flex flex-col justify-between relative overflow-hidden sticky top-0 z-[1]">
        {/* Top Header Navigation (Offset on left for persistent fixed logo) */}
        <header className="w-full pt-4 px-4 sm:pt-6 sm:px-8 z-30 flex items-center justify-between gap-4">
          {/* Spacer for fixed top-left logo */}
          <div className="w-36 sm:w-48 shrink-0" aria-hidden="true" />

          {/* Right Navigation Menu */}
          <nav ref={navRef} className="px-4 py-2 sm:px-7 sm:py-3 flex items-center space-x-4 sm:space-x-8 font-sans text-xs sm:text-sm font-medium tracking-wide bg-transparent">
            <div className="hidden lg:flex items-center space-x-6 text-[#0F0F0F]">
              <Link 
                href="/dashboard"
                className="hover:text-neutral-600 transition-colors duration-200 font-medium cursor-pointer"
              >
                Dashboard
              </Link>
              <button 
                onClick={() => setShowMethodology(true)}
                className="hover:text-neutral-600 transition-colors duration-200 font-medium cursor-pointer"
              >
                Methodology
              </button>
              <Link 
                href="/roles" 
                className="hover:text-neutral-600 transition-colors duration-200 flex items-center gap-1.5 font-medium"
              >
                <span>Engine</span>
                <span className="bg-[#2D2E2E] text-[10px] text-[#BCABAE] px-1.5 py-0.5 rounded font-mono">AI</span>
              </Link>
              <Link 
                href="/audit" 
                className="hover:text-neutral-600 transition-colors duration-200 font-medium"
              >
                Audits
              </Link>
            </div>

            {/* Action Button: Scrolls smoothly to Slide 2 Dashboard */}
            <button 
              type="button"
              onClick={scrollToDashboard}
              className="bg-[#2D2E2E] hover:bg-[#FF3B30] hover:text-white text-neutral-100 font-display font-medium text-xs sm:text-sm px-4 py-2 transition-all duration-300 flex items-center gap-2 border border-neutral-700 shadow-xs cursor-pointer active:scale-95"
            >
              <span>Explore Platform</span>
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          </nav>
        </header>

        {/* Central Hero Section with 3D Character Model & Akira Expanded Typography */}
        <main className="relative flex-1 w-full flex items-center justify-center min-h-0 overflow-visible py-1 sm:py-2" data-purpose="hero-3d-stage">
          <div className="relative w-full max-w-6xl h-full max-h-[64vh] flex items-center justify-center">
            {/* Interactive 3D Character Model */}
            <div ref={modelRef} className="w-full h-full z-10">
              <Character3D 
                ref={characterRef} 
                className="w-full h-full" 
              />
            </div>

            {/* Giant Centered Typography "HIREFLOW" in Akira Expanded with interactive letter hover inversion */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20" data-purpose="giant-hero-title">
              <h1 
                ref={lettersRef}
                className="font-akira font-black text-[2.8rem] sm:text-[4.4rem] md:text-[5.8rem] lg:text-[7.4rem] xl:text-[8.6rem] leading-none select-none whitespace-nowrap transform -translate-y-1"
                style={{
                  letterSpacing: '0.14em',
                  perspective: '800px',
                }}
              >
                {/* Letters in HIRE: default black, inverts to white on hover */}
                {['H', 'I', 'R', 'E'].map((char, idx) => (
                  <span
                    key={`hire-${idx}`}
                    className="letter-interactive letter-hire"
                  >
                    {char}
                  </span>
                ))}

                {/* Letters in FLOW: default outline/white difference, inverts to solid black on hover */}
                {['F', 'L', 'O', 'W'].map((char, idx) => (
                  <span
                    key={`flow-${idx}`}
                    className="letter-interactive letter-flow"
                  >
                    {char}
                  </span>
                ))}
              </h1>
            </div>
          </div>
        </main>

        {/* Bottom Interactive Controls Bar */}
        <footer className="w-full pb-4 sm:pb-7 px-4 flex justify-center z-30" data-purpose="bottom-controls-bar">
          <div 
            className="w-full max-w-5xl bg-transparent px-5 py-3 sm:px-8 sm:py-4 flex flex-col md:flex-row items-center justify-center gap-4" 
            data-purpose="bottom-action-container"
          >
            {/* Primary / Secondary CTAs */}
            <div ref={ctaRef} className="flex flex-wrap items-center justify-center gap-3 w-full">
              <button
                type="button"
                onClick={scrollToDashboard}
                className="bg-white hover:bg-black hover:text-white text-[#0F0F0F] font-display font-bold text-xs sm:text-sm px-5 py-2.5 transition-all duration-200 flex items-center gap-2 group border-2 border-black shadow-sm active:scale-95 cursor-pointer"
                id="btn-initialize"
              >
                <span>Initialize Protocol</span>
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </button>

              <Link
                href="/candidates"
                className="bg-white/70 hover:bg-white text-neutral-800 hover:text-black text-xs sm:text-sm px-4 py-2.5 transition-all border border-neutral-300/80 hover:border-neutral-500 font-medium shadow-2xs backdrop-blur-xs active:scale-95"
              >
                Explore Candidates
              </Link>

              <button
                type="button"
                onClick={() => characterRef.current?.resetCore()}
                className="bg-white/50 hover:bg-white text-neutral-700 hover:text-black text-xs px-3 py-2.5 transition-all border border-neutral-300/80 hover:border-neutral-400 flex items-center gap-1.5 cursor-pointer shadow-2xs backdrop-blur-xs active:scale-95"
                title="Re-center 3D Character"
              >
                <span>Reset Core</span>
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </footer>
      </section>

      {/* ========================================================================= */}
      {/* SLIDE 2: Executive Platform Dashboard — slides UP over landing            */}
      {/* ========================================================================= */}
      <section 
        id="dashboard" 
        ref={dashboardRef}
        className="min-h-screen w-full relative z-[10] bg-[#f3f2f2] theme-poppins-pages wireframe-grid"
        style={{
          borderRadius: '24px 24px 0 0',
          boxShadow: '0 -24px 80px rgba(0,0,0,0.18), 0 -4px 24px rgba(0,0,0,0.10)',
        }}
      >
        {/* 
          Sticky Navbar for Slide 2:
          - hideLogo={true} ensures no duplicate logo is rendered in the navbar
            because the persistent fixed logo from Slide 1 is already sitting in the top-left!
          - Stays sticky at top-0 as the user scrolls further down through the dashboard.
          - 3D Core and Human Invariance removed per user request.
        */}
        <Navbar 
          hideLogo={true} 
          forceDashboardActive={true}
        />

        {/* Dashboard Workspace */}
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <DashboardView />
        </div>

      </section>

      {/* Methodology Modal */}
      {showMethodology && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-2xl bg-[#0F0F0F] text-white border border-neutral-800 shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white">
                  <ShieldCheck className="w-4 h-4 text-[#FF3B30]" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-lg text-white">HireFlow Intelligence Protocol</h2>
                  <p className="text-xs text-neutral-400 font-mono">METHODOLOGY SPECIFICATION v3.4</p>
                </div>
              </div>
              <button
                onClick={() => setShowMethodology(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-md hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-neutral-300 leading-relaxed">
              <div className="p-3.5 bg-neutral-900/90 border border-neutral-800 space-y-1">
                <div className="flex items-center gap-2 font-display font-semibold text-white">
                  <span className="text-[#FF3B30] font-mono">01.</span>
                  <span>Granular Evidence Sourcing</span>
                </div>
                <p className="text-neutral-400">
                  Every candidate evaluation is directly grounded in explicit resume snippets and verified portfolio artifacts. No hallucinated qualifications.
                </p>
              </div>

              <div className="p-3.5 bg-neutral-900/90 border border-neutral-800 space-y-1">
                <div className="flex items-center gap-2 font-display font-semibold text-white">
                  <span className="text-[#FF3B30] font-mono">02.</span>
                  <span>Targeted Technical Probing</span>
                </div>
                <p className="text-neutral-400">
                  Interview questions and follow-ups are dynamically synthesized around ambiguities, gaps, or critical criteria identified in the requirement matrix.
                </p>
              </div>

              <div className="p-3.5 bg-neutral-900/90 border border-neutral-800 space-y-1">
                <div className="flex items-center gap-2 font-display font-semibold text-white">
                  <span className="text-[#FF3B30] font-mono">03.</span>
                  <span>Zero Blind Autonomy (Human Sovereignty)</span>
                </div>
                <p className="text-neutral-400">
                  AI acts strictly as an analytical copilot. Autonomous candidate rejections are prohibited; final hiring decisions remain with the hiring team, logged in an immutable audit ledger.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-neutral-800 pt-4">
              <span className="text-[11px] font-mono text-neutral-500">ISO-42001 & SOC2 COMPLIANT</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowMethodology(false)}
                  className="px-4 py-2 text-xs text-neutral-400 hover:text-white border border-neutral-800 hover:bg-neutral-800 transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMethodology(false);
                    scrollToDashboard();
                  }}
                  className="px-4 py-2 text-xs bg-white text-[#0F0F0F] font-bold hover:bg-[#FF3B30] hover:text-white transition-colors cursor-pointer"
                >
                  Open Platform →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

