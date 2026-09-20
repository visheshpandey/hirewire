'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface SmoothScrollProps {
  children?: React.ReactNode;
}

export function scrollToTarget(target: string | HTMLElement | number, options?: { offset?: number; duration?: number; immediate?: boolean }) {
  if (typeof window === 'undefined') return;

  const locomotive = (window as any).locomotiveScroll;
  if (locomotive && typeof locomotive.scrollTo === 'function') {
    locomotive.scrollTo(target, {
      duration: options?.duration ?? 1.2,
      offset: options?.offset ?? 0,
      immediate: options?.immediate ?? false,
    });
  } else {
    if (typeof target === 'number') {
      window.scrollTo({ top: target, behavior: options?.immediate ? 'auto' : 'smooth' });
    } else if (typeof target === 'string') {
      const el = document.querySelector(target);
      if (el) {
        el.scrollIntoView({ behavior: options?.immediate ? 'auto' : 'smooth' });
      }
    } else if (target instanceof HTMLElement) {
      target.scrollIntoView({ behavior: options?.immediate ? 'auto' : 'smooth' });
    }
  }
}

// Track if this is the very first window load/reload in the browser tab
let hasHandledInitialWindowLoad = false;

export function SmoothScroll({ children }: SmoothScrollProps) {
  const pathname = usePathname();
  const scrollRef = useRef<any>(null);

  // Initialize Locomotive Scroll ONCE for the application lifecycle
  useEffect(() => {
    let locomotiveScrollInstance: any = null;

    // Prevent browser from restoring scroll position down to dashboard on page reload
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const initScroll = async () => {
      try {
        const LocomotiveScroll = (await import('locomotive-scroll')).default;
        locomotiveScrollInstance = new LocomotiveScroll({
          lenisOptions: {
            lerp: 0.08,
            duration: 1.2,
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 1.8,
          }
        });

        scrollRef.current = locomotiveScrollInstance;
        // Expose on window for programmatic scrolling triggers
        (window as any).locomotiveScroll = locomotiveScrollInstance;

        // If this is an actual initial browser reload of the window
        if (!hasHandledInitialWindowLoad) {
          hasHandledInitialWindowLoad = true;
          const navEntries = typeof performance !== 'undefined' ? performance.getEntriesByType('navigation') : [];
          const isReload = navEntries.length > 0 && (navEntries[0] as PerformanceNavigationTiming).type === 'reload';

          if (isReload && window.location.pathname === '/') {
            if (window.location.hash) {
              window.history.replaceState(null, '', '/');
            }
            window.scrollTo(0, 0);
            locomotiveScrollInstance.scrollTo(0, { immediate: true, duration: 0 });
          }
        }
      } catch (err) {
        console.warn('LocomotiveScroll could not be initialized:', err);
      }
    };

    initScroll();

    return () => {
      if (locomotiveScrollInstance) {
        try {
          locomotiveScrollInstance.destroy();
        } catch (e) {
          // ignore cleanup errors
        }
      }
      if ((window as any).locomotiveScroll === locomotiveScrollInstance) {
        delete (window as any).locomotiveScroll;
      }
    };
  }, []);

  // Update layout dimensions on route changes without re-instantiating LocomotiveScroll
  useEffect(() => {
    if (scrollRef.current && typeof scrollRef.current.resize === 'function') {
      scrollRef.current.resize();
    }
  }, [pathname]);

  return <>{children}</>;
}
