'use client';

import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import Image from 'next/image';

export interface Character3DHandle {
  resetCore: () => void;
}

interface Character3DProps {
  className?: string;
}

export const Character3D = forwardRef<Character3DHandle, Character3DProps>(
  ({ className }, ref) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isPressed, setIsPressed] = useState(false);
    const [activeBadge, setActiveBadge] = useState<string | null>(null);

    // Physics state running at 60fps via requestAnimationFrame
    const stateRef = useRef({
      rotX: 0,
      rotY: 0,
      targetRotX: 0,
      targetRotY: 0,
      lightX: 50,
      lightY: 30,
      lastPointerX: 0,
      lastPointerY: 0,
      velocityX: 0,
      velocityY: 0,
      time: 0,
      animId: 0
    });

    const characterCardRef = useRef<HTMLDivElement | null>(null);
    const shadowRef = useRef<HTMLDivElement | null>(null);
    const sheenRef = useRef<HTMLDivElement | null>(null);
    const badgeLeftRef = useRef<HTMLDivElement | null>(null);
    const badgeRightRef = useRef<HTMLDivElement | null>(null);

    useImperativeHandle(ref, () => ({
      resetCore: () => {
        stateRef.current.targetRotX = 0;
        stateRef.current.targetRotY = 0;
        stateRef.current.velocityX = 0;
        stateRef.current.velocityY = 0;
      }
    }));

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const onPointerDown = (e: MouseEvent | TouchEvent) => {
        setIsDragging(true);
        setIsPressed(true);
        const clientX = 'clientX' in e ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        const clientY = 'clientY' in e ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
        stateRef.current.lastPointerX = clientX;
        stateRef.current.lastPointerY = clientY;
      };

      const onPointerMove = (e: MouseEvent | TouchEvent) => {
        const clientX = 'clientX' in e ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        const clientY = 'clientY' in e ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

        if (stateRef.current.lastPointerX !== 0 && isDragging) {
          const deltaX = clientX - stateRef.current.lastPointerX;
          const deltaY = clientY - stateRef.current.lastPointerY;

          stateRef.current.targetRotY += deltaX * 0.5;
          stateRef.current.targetRotX -= deltaY * 0.45;
          // Clamp X rotation
          stateRef.current.targetRotX = Math.max(-28, Math.min(28, stateRef.current.targetRotX));

          stateRef.current.velocityX = deltaX * 0.1;
          stateRef.current.velocityY = -deltaY * 0.1;

          stateRef.current.lastPointerX = clientX;
          stateRef.current.lastPointerY = clientY;
        } else if (!isDragging) {
          // Cursor hover parallax
          const rect = container.getBoundingClientRect();
          const normX = (clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
          const normY = (clientY - (rect.top + rect.height / 2)) / (rect.height / 2);

          stateRef.current.targetRotY = Math.max(-24, Math.min(24, normX * 22));
          stateRef.current.targetRotX = Math.max(-18, Math.min(18, -normY * 16));

          stateRef.current.lightX = 50 + normX * 35;
          stateRef.current.lightY = 35 + normY * 25;
        }
      };

      const onPointerUp = () => {
        setIsDragging(false);
        setIsPressed(false);
      };

      const onWindowMouseMove = (e: MouseEvent) => {
        if (!isDragging) {
          const normX = (e.clientX / window.innerWidth - 0.5) * 2;
          const normY = (e.clientY / window.innerHeight - 0.5) * 2;
          stateRef.current.targetRotY = Math.max(-20, Math.min(20, normX * 18));
          stateRef.current.targetRotX = Math.max(-15, Math.min(15, -normY * 13));
          stateRef.current.lightX = 50 + normX * 38;
          stateRef.current.lightY = 35 + normY * 28;
        }
      };

      container.addEventListener('mousedown', onPointerDown);
      window.addEventListener('mousemove', onPointerMove);
      window.addEventListener('mouseup', onPointerUp);
      window.addEventListener('mousemove', onWindowMouseMove);

      container.addEventListener('touchstart', onPointerDown, { passive: true });
      window.addEventListener('touchmove', onPointerMove, { passive: true });
      window.addEventListener('touchend', onPointerUp);

      // Animation Loop
      function update() {
        const s = stateRef.current;
        s.time += 0.025;

        // Damped spring physics
        s.rotX += (s.targetRotX - s.rotX) * 0.09;
        s.rotY += (s.targetRotY - s.rotY) * 0.09;

        // Organic idle breathing oscillation
        const idleFloat = Math.sin(s.time) * 5;
        const idleSway = Math.cos(s.time * 0.7) * 1.0;

        const currentRotX = s.rotX + Math.sin(s.time * 0.5) * 0.8;
        const currentRotY = s.rotY + idleSway;

        // 3D transform for Character Card
        if (characterCardRef.current) {
          characterCardRef.current.style.transform = `
            perspective(1100px)
            translateY(${idleFloat}px)
            rotateX(${currentRotX}deg)
            rotateY(${currentRotY}deg)
            translateZ(15px)
          `;
        }

        // 3D transform for Floor Shadow
        if (shadowRef.current) {
          const shadowOffsetX = -currentRotY * 0.9;
          const shadowScaleX = 1 + Math.abs(currentRotY) * 0.008;
          shadowRef.current.style.transform = `
            translateX(${shadowOffsetX}px)
            scale(${shadowScaleX}, 1)
          `;
          shadowRef.current.style.opacity = `${0.65 - idleFloat * 0.02}`;
        }

        // Dynamic specular sheen overlay
        if (sheenRef.current) {
          sheenRef.current.style.background = `radial-gradient(
            circle at ${s.lightX}% ${s.lightY}%,
            rgba(255, 255, 255, 0.42) 0%,
            rgba(255, 255, 255, 0.12) 35%,
            rgba(0, 0, 0, 0.18) 75%,
            rgba(0, 0, 0, 0.45) 100%
          )`;
        }

        // Floating Parallax Badges with deeper Z-depth
        if (badgeLeftRef.current) {
          badgeLeftRef.current.style.transform = `
            perspective(1100px)
            rotateX(${currentRotX * 0.7}deg)
            rotateY(${currentRotY * 0.7}deg)
            translateZ(55px)
            translateY(${idleFloat * 0.6}px)
          `;
        }

        if (badgeRightRef.current) {
          badgeRightRef.current.style.transform = `
            perspective(1100px)
            rotateX(${currentRotX * 0.7}deg)
            rotateY(${currentRotY * 0.7}deg)
            translateZ(70px)
            translateY(${-idleFloat * 0.6}px)
          `;
        }

        s.animId = requestAnimationFrame(update);
      }

      update();

      return () => {
        cancelAnimationFrame(stateRef.current.animId);
        container.removeEventListener('mousedown', onPointerDown);
        window.removeEventListener('mousemove', onPointerMove);
        window.removeEventListener('mouseup', onPointerUp);
        window.removeEventListener('mousemove', onWindowMouseMove);
        container.removeEventListener('touchstart', onPointerDown);
        window.removeEventListener('touchmove', onPointerMove);
        window.removeEventListener('touchend', onPointerUp);
      };
    }, [isDragging]);

    return (
      <div
        ref={containerRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`relative flex items-center justify-center cursor-grab active:cursor-grabbing select-none ${className || ''}`}
        style={{ perspective: 1200 }}
      >
        {/* Floor Grounding Stage with Clean Natural Shadow (NO revolving red dot) */}
        <div className="absolute bottom-2 sm:bottom-4 w-[240px] sm:w-[320px] h-[36px] flex items-center justify-center pointer-events-none z-0">
          {/* Natural Elliptical Floor Shadow */}
          <div
            ref={shadowRef}
            className="w-[200px] sm:w-[260px] h-[22px] rounded-[100%] transition-opacity duration-300"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(15, 15, 15, 0.45) 0%, rgba(15, 15, 15, 0.12) 55%, transparent 75%)'
            }}
          />
        </div>

        {/* 3D Character Model Card with Specular Depth */}
        <div
          ref={characterCardRef}
          className={`relative z-10 w-[220px] sm:w-[300px] md:w-[360px] lg:w-[400px] h-[380px] sm:h-[500px] md:h-[580px] lg:h-[620px] flex items-center justify-center transition-transform duration-100 ease-out ${
            isPressed ? 'scale-[0.98]' : 'scale-100'
          }`}
          style={{
            transformStyle: 'preserve-3d',
            willChange: 'transform'
          }}
        >
          {/* Main 3D Character Cutout (High-Res) */}
          <div className="relative w-full h-full flex items-center justify-center pointer-events-none drop-shadow-xl">
            <Image
              src="/character_3d.png"
              alt="HireFlow 3D Executive Talent Intelligence Model"
              fill
              priority
              sizes="(max-width: 768px) 300px, 400px"
              className="object-contain filter contrast-[1.02] brightness-[1.01]"
            />

            {/* Dynamic 3D Specular Light Sheen Overlay */}
            <div
              ref={sheenRef}
              className="absolute inset-0 pointer-events-none mix-blend-soft-light opacity-55 transition-opacity duration-300"
              style={{
                WebkitMaskImage: 'url(/character_3d.png)',
                maskImage: 'url(/character_3d.png)',
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                maskPosition: 'center'
              }}
            />
          </div>

          {/* Interactive 3D Floating Telemetry Badges */}
          <div
            ref={badgeLeftRef}
            onMouseEnter={() => setActiveBadge('evidence')}
            onMouseLeave={() => setActiveBadge(null)}
            className="absolute -left-6 sm:-left-20 top-24 sm:top-32 pointer-events-auto flex items-center gap-2 bg-[#0F0F0F]/90 hover:bg-[#0F0F0F] text-white border border-neutral-700/80 hover:border-emerald-500/60 px-3 py-1.5 rounded-lg shadow-xl backdrop-blur-md text-[11px] font-mono tracking-tight transition-all cursor-pointer group"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-neutral-300">EVIDENCE FIT:</span>
            <span className="text-emerald-400 font-bold">98.4%</span>
            {activeBadge === 'evidence' && (
              <span className="text-[10px] text-neutral-400 border-l border-neutral-700 pl-2">5 criteria</span>
            )}
          </div>

          <div
            ref={badgeRightRef}
            onMouseEnter={() => setActiveBadge('candidate')}
            onMouseLeave={() => setActiveBadge(null)}
            className="absolute -right-6 sm:-right-20 top-20 sm:top-28 pointer-events-auto flex flex-col bg-[#0F0F0F]/90 hover:bg-[#0F0F0F] text-white border border-neutral-700/80 hover:border-neutral-500 px-3 py-2 rounded-lg shadow-xl backdrop-blur-md text-[10px] font-mono tracking-tight transition-all cursor-pointer group"
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="flex items-center gap-1.5 text-neutral-400">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 group-hover:bg-emerald-400 transition-colors" />
              <span>CANDIDATE ACTIVE</span>
            </div>
            <span className="text-white font-semibold font-sans text-xs mt-0.5">Alex Thorne</span>
            <span className="text-[#BCABAE] text-[9px]">Staff Infra Architect</span>
          </div>
        </div>
      </div>
    );
  }
);

Character3D.displayName = 'Character3D';
