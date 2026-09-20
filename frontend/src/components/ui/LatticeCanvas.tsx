'use client';

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';

export interface LatticeCanvasHandle {
  resetCore: () => void;
}

export const LatticeCanvas = forwardRef<LatticeCanvasHandle, { className?: string }>(
  ({ className }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // References to control state without re-triggering effects
    const stateRef = useRef({
      rotX: 0.25,
      rotY: 0.4,
      targetRotX: 0.25,
      targetRotY: 0.4,
      velocityX: 0.003,
      velocityY: 0.005,
      isDragging: false,
      lastPointerX: 0,
      lastPointerY: 0,
      animId: 0
    });

    useImperativeHandle(ref, () => ({
      resetCore: () => {
        stateRef.current.rotX = 0.25;
        stateRef.current.rotY = 0.4;
        stateRef.current.targetRotX = 0.25;
        stateRef.current.targetRotY = 0.4;
        stateRef.current.velocityX = 0.003;
        stateRef.current.velocityY = 0.005;
      }
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let width = canvas.clientWidth || 800;
      let height = canvas.clientHeight || 800;
      let dpr = window.devicePixelRatio || 1;

      // Mathematical vertices for an Icosahedron (12 vertices, 30 edges)
      const phi = (1 + Math.sqrt(5)) / 2;
      const baseVertices = [
        [-1,  phi, 0], [ 1,  phi, 0], [-1, -phi, 0], [ 1, -phi, 0],
        [0, -1,  phi], [0,  1,  phi], [0, -1, -phi], [0,  1, -phi],
        [ phi, 0, -1], [ phi, 0,  1], [-phi, 0, -1], [-phi, 0,  1]
      ];

      // Normalize vertices to unit sphere
      const icosahedronVertices = baseVertices.map(([x, y, z]) => {
        const len = Math.hypot(x, y, z);
        return [x / len, y / len, z / len];
      });

      // Calculate edges based on distance threshold
      const edges: [number, number][] = [];
      for (let i = 0; i < icosahedronVertices.length; i++) {
        for (let j = i + 1; j < icosahedronVertices.length; j++) {
          const dx = icosahedronVertices[i][0] - icosahedronVertices[j][0];
          const dy = icosahedronVertices[i][1] - icosahedronVertices[j][1];
          const dz = icosahedronVertices[i][2] - icosahedronVertices[j][2];
          const dist = Math.hypot(dx, dy, dz);
          if (Math.abs(dist - 1.051) < 0.15) {
            edges.push([i, j]);
          }
        }
      }

      function resize() {
        if (!canvas || !ctx) return;
        dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        width = rect.width || 800;
        height = rect.height || 800;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      resize();
      window.addEventListener('resize', resize);

      // Pointer interactions
      const onPointerDown = (e: MouseEvent | TouchEvent) => {
        stateRef.current.isDragging = true;
        const clientX = 'clientX' in e ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        const clientY = 'clientY' in e ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
        stateRef.current.lastPointerX = clientX;
        stateRef.current.lastPointerY = clientY;
      };

      const onPointerMove = (e: MouseEvent | TouchEvent) => {
        if (!stateRef.current.isDragging) return;
        const clientX = 'clientX' in e ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        const clientY = 'clientY' in e ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
        const deltaX = clientX - stateRef.current.lastPointerX;
        const deltaY = clientY - stateRef.current.lastPointerY;

        stateRef.current.targetRotY += deltaX * 0.009;
        stateRef.current.targetRotX += deltaY * 0.009;

        stateRef.current.lastPointerX = clientX;
        stateRef.current.lastPointerY = clientY;
      };

      const onPointerUp = () => {
        stateRef.current.isDragging = false;
      };

      const onMouseMoveWindow = (e: MouseEvent) => {
        if (!stateRef.current.isDragging) {
          const normX = (e.clientX / window.innerWidth) - 0.5;
          const normY = (e.clientY / window.innerHeight) - 0.5;
          stateRef.current.targetRotY = stateRef.current.rotY + (normX * 0.002);
          stateRef.current.targetRotX = stateRef.current.rotX + (normY * 0.002);
        }
      };

      canvas.addEventListener('mousedown', onPointerDown);
      window.addEventListener('mousemove', onPointerMove);
      window.addEventListener('mouseup', onPointerUp);
      window.addEventListener('mousemove', onMouseMoveWindow);

      canvas.addEventListener('touchstart', onPointerDown, { passive: true });
      window.addEventListener('touchmove', onPointerMove, { passive: true });
      window.addEventListener('touchend', onPointerUp);

      // 3D Projection Math
      function project(x: number, y: number, z: number, scaleRadius: number) {
        const { rotX, rotY } = stateRef.current;
        // Rotate X
        const cosX = Math.cos(rotX);
        const sinX = Math.sin(rotX);
        const y1 = y * cosX - z * sinX;
        const z1 = y * sinX + z * cosX;

        // Rotate Y
        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);
        const x2 = x * cosY + z1 * sinY;
        const z2 = -x * sinY + z1 * cosY;

        // Perspective Camera projection
        const fov = 3.2;
        const distance = 3.6;
        const perspective = fov / (distance - z2);

        return {
          px: (width / 2) + x2 * scaleRadius * perspective,
          py: (height / 2) + y1 * scaleRadius * perspective,
          depth: z2,
          scale: perspective
        };
      }

      // Animation Loop
      function render() {
        const s = stateRef.current;
        if (!s.isDragging) {
          s.rotY += s.velocityY;
          s.rotX += s.velocityX * 0.3;
        } else {
          s.rotX += (s.targetRotX - s.rotX) * 0.15;
          s.rotY += (s.targetRotY - s.rotY) * 0.15;
        }

        ctx!.clearRect(0, 0, width, height);

        // Scale radius (~1.7x scale)
        const radius = Math.min(width, height) * 0.48;

        // Project Icosahedron vertices
        const projectedNodes = icosahedronVertices.map(([vx, vy, vz]) => {
          return project(vx, vy, vz, radius);
        });

        // 1. Draw Gyroscopic Outer Axis Ring (Tilted Orbit)
        ctx!.beginPath();
        const steps = 72;
        for (let i = 0; i <= steps; i++) {
          const angle = (i / steps) * Math.PI * 2;
          const gx = Math.cos(angle) * 1.25;
          const gy = Math.sin(angle) * 1.25;
          const p = project(gx, gy, 0, radius);
          if (i === 0) ctx!.moveTo(p.px, p.py);
          else ctx!.lineTo(p.px, p.py);
        }
        ctx!.strokeStyle = 'rgba(40, 40, 40, 0.45)';
        ctx!.lineWidth = 1.2;
        ctx!.setLineDash([5, 5]);
        ctx!.stroke();
        ctx!.setLineDash([]);

        // 2. Draw Solid Black Wireframe Lattice Edges
        edges.forEach(([startIdx, endIdx]) => {
          const p1 = projectedNodes[startIdx];
          const p2 = projectedNodes[endIdx];

          const avgDepth = (p1.depth + p2.depth) / 2;
          const alpha = Math.max(0.35, Math.min(1.0, (avgDepth + 1.2) / 2.0));

          ctx!.beginPath();
          ctx!.moveTo(p1.px, p1.py);
          ctx!.lineTo(p2.px, p2.py);
          ctx!.strokeStyle = `rgba(0, 0, 0, ${alpha})`;
          ctx!.lineWidth = avgDepth > 0 ? 3.0 : 1.8;
          ctx!.stroke();
        });

        // 3. Draw Center Pulsing Core
        const coreProj = project(0, 0, 0, radius);
        const coreGradient = ctx!.createRadialGradient(
          coreProj.px, coreProj.py, 3,
          coreProj.px, coreProj.py, 36
        );
        coreGradient.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
        coreGradient.addColorStop(0.5, 'rgba(30, 30, 30, 0.5)');
        coreGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx!.fillStyle = coreGradient;
        ctx!.beginPath();
        ctx!.arc(coreProj.px, coreProj.py, 36, 0, Math.PI * 2);
        ctx!.fill();

        // 4. Draw Icosahedron Vertices / Solid Nodes
        projectedNodes.forEach((node) => {
          const nodeRadius = (node.depth + 1.5) * 4.2;
          const clampedRadius = Math.max(3.5, Math.min(9.5, nodeRadius));

          ctx!.beginPath();
          ctx!.arc(node.px, node.py, clampedRadius, 0, Math.PI * 2);
          ctx!.fillStyle = '#000000';
          ctx!.fill();

          // Subtle concentric orbit ring around closest foreground node
          if (node.depth > 0.7) {
            ctx!.strokeStyle = '#000000';
            ctx!.lineWidth = 1.5;
            ctx!.beginPath();
            ctx!.arc(node.px, node.py, clampedRadius + 5, 0, Math.PI * 2);
            ctx!.stroke();
          }
        });

        s.animId = requestAnimationFrame(render);
      }

      render();

      return () => {
        cancelAnimationFrame(stateRef.current.animId);
        window.removeEventListener('resize', resize);
        canvas.removeEventListener('mousedown', onPointerDown);
        window.removeEventListener('mousemove', onPointerMove);
        window.removeEventListener('mouseup', onPointerUp);
        window.removeEventListener('mousemove', onMouseMoveWindow);
        canvas.removeEventListener('touchstart', onPointerDown);
        window.removeEventListener('touchmove', onPointerMove);
        window.removeEventListener('touchend', onPointerUp);
      };
    }, []);

    return (
      <canvas
        ref={canvasRef}
        id="model-canvas"
        className={`touch-none select-none cursor-grab active:cursor-grabbing ${className || ''}`}
        width={1150}
        height={1150}
      />
    );
  }
);

LatticeCanvas.displayName = 'LatticeCanvas';
