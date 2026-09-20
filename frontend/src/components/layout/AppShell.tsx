'use client';
 
import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { getPageRank, getActiveSlideDirection } from '@/components/layout/PageTransition';
import gsap from 'gsap';

function PageSlide({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (!ref.current) return;

    // Reliably get current slide direction
    let direction: 'forward' | 'backward' = getActiveSlideDirection();
    try {
      const stored = sessionStorage.getItem('slideDirection') as 'forward' | 'backward' | null;
      if (stored === 'forward' || stored === 'backward') {
        direction = stored;
      } else {
        const prevPath = sessionStorage.getItem('lastPathname');
        if (prevPath && prevPath !== pathname) {
          direction = getPageRank(pathname) >= getPageRank(prevPath) ? 'forward' : 'backward';
        }
      }
      sessionStorage.setItem('lastPathname', pathname);
    } catch {}

    // Forward: incoming page slides in from RIGHT to LEFT (starts at +100%)
    // Backward: incoming page slides in from LEFT to RIGHT (starts at -100%)
    const startX = direction === 'forward' ? '100%' : '-100%';

    // Directional drop shadow cast in the direction of motion
    const initialShadow =
      direction === 'forward'
        ? '-25px 20px 60px -10px rgba(0, 0, 0, 0.28), -10px 10px 25px rgba(0, 0, 0, 0.15)'
        : '25px 20px 60px -10px rgba(0, 0, 0, 0.28), 10px 10px 25px rgba(0, 0, 0, 0.15)';

    // Kill any existing tween on ref.current
    gsap.killTweensOf(ref.current);

    gsap.set(ref.current, {
      x: startX,
      scale: 0.985,
      borderRadius: '24px',
      boxShadow: initialShadow,
      border: '1px solid rgba(15, 15, 15, 0.12)',
      backgroundColor: '#f3f2f2',
      overflow: 'clip',
      opacity: 0.95,
    });

    const tl = gsap.timeline();

    // 1. Decelerate smoothly into place (power3.out)
    // For backward motion: moves from -100% (left) to 0% (center)
    // For forward motion: moves from +100% (right) to 0% (center)
    tl.to(ref.current, {
      x: '0%',
      scale: 1,
      opacity: 1,
      duration: 0.55,
      ease: 'power3.out',
    });

    // 2. In the final fraction of the slide, gently ease the card edges to full page
    tl.to(
      ref.current,
      {
        borderRadius: '0px',
        boxShadow: '0 0 0 0 rgba(0, 0, 0, 0)',
        border: '1px solid rgba(0, 0, 0, 0)',
        duration: 0.2,
        ease: 'power2.out',
        onComplete: () => {
          if (ref.current) {
            gsap.set(ref.current, {
              clearProps: 'all',
            });
          }
        },
      },
      '-=0.18'
    );

    return () => {
      tl.kill();
    };
  }, [pathname]);

  return (
    <div
      ref={ref}
      className="w-full flex-1 flex flex-col wireframe-grid"
    >
      {children}
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === '/';

  if (isLanding) {
    return (
      <div 
        className="min-h-screen w-full bg-[#f3f2f2] wireframe-grid text-[#0F0F0F] selection:bg-[#0F0F0F] selection:text-white"
        style={{ overflowX: 'clip' }}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col bg-[#f3f2f2] wireframe-grid text-[#0F0F0F] font-sans selection:bg-[#0F0F0F] selection:text-white theme-poppins-pages"
      style={{ overflowX: 'clip' }}
    >
      <Navbar />

      <div className="flex-1 flex flex-col w-full" style={{ overflowX: 'clip' }}>
        <PageSlide key={pathname}>
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </PageSlide>
      </div>

      <footer className="border-t border-neutral-300/80 bg-white/70 py-6 text-xs text-neutral-600 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#0F0F0F]">HIREFLOW</span>
            <span className="text-neutral-400">.</span>
            <span>Evidence-Backed Intelligence with Complete Audit Trail</span>
          </div>
          <div className="flex items-center gap-4 text-neutral-500 font-mono text-[11px]">
            <span>SOC2 TYPE-III</span>
            <span>.</span>
            <span>LATENCY: 14ms</span>
            <span>.</span>
            <span>HUMAN SOVEREIGNTY</span>
          </div>
        </div>
      </footer>
    </div>
  );
}