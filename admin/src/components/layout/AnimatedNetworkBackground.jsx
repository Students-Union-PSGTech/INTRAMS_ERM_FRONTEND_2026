import React, { useEffect, useRef } from 'react';

export default function AnimatedNetworkBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;

    let frameId = 0;
    let width = 0;
    let height = 0;
    let particles = [];
    const pointer = { x: -1000, y: -1000, vx: 0, vy: 0, lastX: -1000, lastY: -1000, active: false };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Node count for high density mesh
      const count = Math.min(Math.max(45, Math.floor((width * height) / 11000)), 100);
      particles = Array.from({ length: count }, () => {
        const isWhite = Math.random() > 0.65;
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45,
          r: Math.random() * 2.2 + 1.2,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: 0.008 + Math.random() * 0.008,
          color: isWhite ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 174, 239, 0.9)',
          glowColor: isWhite ? 'rgba(255, 255, 255, ' : 'rgba(0, 174, 239, ',
        };
      });
    };

    const handlePointerMove = (event) => {
      if (pointer.lastX > -900) {
        pointer.vx = event.clientX - pointer.lastX;
        pointer.vy = event.clientY - pointer.lastY;
      }
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.lastX = event.clientX;
      pointer.lastY = event.clientY;
      pointer.active = true;
    };

    const handlePointerLeave = () => {
      pointer.active = false;
      pointer.x = -1000;
      pointer.y = -1000;
      pointer.lastX = -1000;
      pointer.lastY = -1000;
      pointer.vx = 0;
      pointer.vy = 0;
    };

    const draw = () => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // Decay cursor velocity
      pointer.vx *= 0.92;
      pointer.vy *= 0.92;

      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];

        p.pulse += p.pulseSpeed;
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off canvas edges
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Gentle Cursor orbital & magnetic pull interaction
        if (pointer.active) {
          const dx = pointer.x - p.x;
          const dy = pointer.y - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 220;

          if (dist < maxDist) {
            const force = (maxDist - dist) / maxDist;
            // Gentle magnetic attraction
            p.x += (dx / (dist || 1)) * force * 0.6;
            p.y += (dy / (dist || 1)) * force * 0.6;
            // Gentle tangential swirl
            p.vx += (pointer.vx * force * 0.03) - (dy / (dist || 1)) * force * 0.15;
            p.vy += (pointer.vy * force * 0.03) + (dx / (dist || 1)) * force * 0.15;
          }
        }

        // Draw Node Core & Dynamic Pulsing Glow
        const currentRadius = p.r + Math.sin(p.pulse) * 0.9;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, currentRadius), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        // Connect nodes to each other
        for (let j = i + 1; j < particles.length; j += 1) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxConnectionDist = 170;

          if (dist < maxConnectionDist) {
            const alpha = (1 - dist / maxConnectionDist) * 0.45;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(0, 174, 239, ${alpha})`;
            ctx.lineWidth = 0.95;
            ctx.stroke();
          }
        }

        // Connect nearby nodes directly to cursor with glowing white & cyan highlight lines
        if (pointer.active) {
          const dx = pointer.x - p.x;
          const dy = pointer.y - p.y;
          const distToCursor = Math.sqrt(dx * dx + dy * dy);
          if (distToCursor < 240) {
            const cursorAlpha = (1 - distToCursor / 240) * 0.85;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(pointer.x, pointer.y);
            // Alternate white/cyan line color to cursor
            ctx.strokeStyle = i % 2 === 0 ? `rgba(255, 255, 255, ${cursorAlpha})` : `rgba(24, 191, 255, ${cursorAlpha})`;
            ctx.lineWidth = 1.3;
            ctx.stroke();
          }
        }
      }

      // Draw active cursor glow halo
      if (pointer.active) {
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 45, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 174, 239, 0.04)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, 18, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.fill();
      }

      frameId = requestAnimationFrame(draw);
    };

    resize();
    draw();

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerleave', handlePointerLeave);
      cancelAnimationFrame(frameId);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 opacity-90" />;
}


