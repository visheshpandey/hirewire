'use client';

import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { usePageTransition, setActiveSlideDirection } from '@/components/layout/PageTransition';

const NEXT_PAGE_MAP: Record<string, string> = {
  '/': '/roles',           // On landing page ('/'), scrolling past dashboard transitions to /roles
  '/dashboard': '/roles',  // On /dashboard, scrolling down transitions to /roles
  '/roles': '/candidates', // On /roles, scrolling down transitions to /candidates
  '/candidates': '/search',// On /candidates, scrolling down transitions to /search
  '/search': '/audit',     // On /search, scrolling down transitions to /audit
};

const PREV_PAGE_MAP: Record<string, string> = {
  '/audit': '/search',     // On /audit, scrolling up transitions backward to /search
  '/search': '/candidates',// On /search, scrolling up transitions backward to /candidates
  '/candidates': '/roles', // On /candidates, scrolling up transitions backward to /roles
  '/roles': '/dashboard',  // On /roles, scrolling up transitions backward to /dashboard
  '/dashboard': '/',       // On /dashboard, scrolling up transitions backward to /
};

export function ScrollPageTransition() {
  const pathname = usePathname();
  const { navigate } = usePageTransition();

  const isNavigatingRef = useRef(false);
  const accumulatedDeltaRef = useRef(0);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  useEffect(() => {
    // Reset state on route change
    isNavigatingRef.current = false;
    accumulatedDeltaRef.current = 0;
  }, [pathname]);

  useEffect(() => {
    const hasNext = Boolean(NEXT_PAGE_MAP[pathname]);
    const hasPrev = Boolean(PREV_PAGE_MAP[pathname]);
    if (!hasNext && !hasPrev) return;

    const checkAtBottom = () => {
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
      const innerHeight = window.innerHeight;
      const scrollHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      return scrollHeight - (scrollY + innerHeight) <= 40;
    };

    const checkAtTop = () => {
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
      return scrollY <= 35;
    };

    const triggerNext = () => {
      const nextPage = NEXT_PAGE_MAP[pathname];
      if (!nextPage || isNavigatingRef.current) return;
      isNavigatingRef.current = true;
      accumulatedDeltaRef.current = 0;
      setActiveSlideDirection('forward');
      navigate(nextPage, 'forward');
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 1200);
    };

    const triggerPrev = () => {
      const prevPage = PREV_PAGE_MAP[pathname];
      if (!prevPage || isNavigatingRef.current) return;
      isNavigatingRef.current = true;
      accumulatedDeltaRef.current = 0;
      setActiveSlideDirection('backward');
      navigate(prevPage, 'backward');
      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 1200);
    };

    const handleWheel = (e: WheelEvent) => {
      if (isNavigatingRef.current) return;

      const atBottom = checkAtBottom();
      const atTop = checkAtTop();

      // Scrolling DOWN at the bottom of the page -> Next page (from Right to Left)
      if (e.deltaY > 0 && atBottom) {
        accumulatedDeltaRef.current = Math.max(0, accumulatedDeltaRef.current) + e.deltaY;
        if (accumulatedDeltaRef.current >= 30) {
          triggerNext();
        }
      }
      // Scrolling UP at the top of the page -> Previous page (from Left to Right)
      else if (e.deltaY < 0 && atTop && pathname !== '/') {
        accumulatedDeltaRef.current = Math.min(0, accumulatedDeltaRef.current) + e.deltaY;
        if (accumulatedDeltaRef.current <= -30) {
          triggerPrev();
        }
      } else {
        // Reset only if user reverses direction
        if ((accumulatedDeltaRef.current > 0 && e.deltaY < 0) || (accumulatedDeltaRef.current < 0 && e.deltaY > 0)) {
          accumulatedDeltaRef.current = 0;
        }
      }

      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => {
        accumulatedDeltaRef.current = 0;
      }, 600);
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches && e.touches[0]) {
        touchStartYRef.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isNavigatingRef.current || touchStartYRef.current === null) return;
      if (!e.touches || !e.touches[0]) return;

      const currentY = e.touches[0].clientY;
      const diffY = touchStartYRef.current - currentY; // positive = swipe up (scroll down)

      const atBottom = checkAtBottom();
      const atTop = checkAtTop();

      if (diffY > 30 && atBottom) {
        touchStartYRef.current = null;
        triggerNext();
      } else if (diffY < -30 && atTop && pathname !== '/') {
        touchStartYRef.current = null;
        triggerPrev();
      }
    };

    const handleTouchEnd = () => {
      touchStartYRef.current = null;
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, [pathname, navigate]);

  return null;
}
