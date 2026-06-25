'use client';

import { useEffect, useRef } from 'react';

const PARTICLE_COUNT = 40;
const COLORS = ['#FFD700', '#FF69B4', '#00FFFF', '#FF4500', '#8A2BE2'];

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const particleRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Core state outside React
  const mouse = useRef({ x: -100, y: -100, lastX: -100, lastY: -100 });
  const state = useRef({ hovering: false, clicking: false, visible: false });
  
  // Particle pool
  const particles = useRef<{ active: boolean; x: number; y: number; vx: number; vy: number; life: number; maxLife: number; colorIndex: number; scale: number; rotation: number; rotSpeed: number }[]>(
    Array.from({ length: PARTICLE_COUNT }).map(() => ({ active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, colorIndex: 0, scale: 0, rotation: 0, rotSpeed: 0 }))
  );

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const style = document.createElement('style');
    style.innerHTML = `
      @media (pointer: fine) { * { cursor: none !important; } }
      .sparkle-trail-container { pointer-events: none; z-index: 99999; }
      .particle-svg { mix-blend-mode: screen; }
      .light .particle-svg { mix-blend-mode: multiply; }
    `;
    document.head.appendChild(style);

    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
      state.current.visible = true;
      
      const target = e.target as HTMLElement;
      state.current.hovering = !!target.closest('a, button, [role="button"], input, select, textarea, [data-cursor="read"], .prose');
    };

    const handleMouseDown = () => { state.current.clicking = true; };
    const handleMouseUp = () => { state.current.clicking = false; };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    const spawnParticle = (x: number, y: number, isClick: boolean) => {
      const p = particles.current.find(p => !p.active);
      if (p) {
        p.active = true;
        p.x = x;
        p.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = isClick ? Math.random() * 4 + 2 : Math.random() * 1.5 + 0.5;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        p.maxLife = Math.random() * 40 + (isClick ? 40 : 20); // frames
        p.life = p.maxLife;
        p.colorIndex = Math.floor(Math.random() * COLORS.length);
        p.scale = Math.random() * 0.5 + 0.5;
        p.rotation = Math.random() * 360;
        p.rotSpeed = (Math.random() - 0.5) * 10;
      }
    };

    const render = () => {
      // Main Dot
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouse.current.x}px, ${mouse.current.y}px, 0) scale(${state.current.clicking ? 0.7 : state.current.hovering ? 1.5 : 1})`;
        if (state.current.visible) dotRef.current.style.opacity = '1';
        
        // Glow effect
        dotRef.current.style.boxShadow = state.current.hovering ? '0 0 20px 5px rgba(255, 255, 255, 0.4)' : '0 0 10px 2px rgba(255, 255, 255, 0.2)';
      }

      // Calculate distance moved
      const dx = mouse.current.x - mouse.current.lastX;
      const dy = mouse.current.y - mouse.current.lastY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Spawn particles if moved enough, or randomly if hovering
      if (state.current.visible && (dist > 5 || (state.current.hovering && Math.random() > 0.8))) {
        spawnParticle(mouse.current.x, mouse.current.y, false);
        mouse.current.lastX = mouse.current.x;
        mouse.current.lastY = mouse.current.y;
      }

      // Spawn burst on click
      if (state.current.clicking && Math.random() > 0.5) {
        for(let i=0; i<3; i++) spawnParticle(mouse.current.x, mouse.current.y, true);
      }

      // Update Particles
      particles.current.forEach((p, i) => {
        const el = particleRefs.current[i];
        if (!el) return;

        if (p.active) {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.05; // slight gravity
          p.rotation += p.rotSpeed;
          p.life -= 1;

          if (p.life <= 0) {
            p.active = false;
            el.style.opacity = '0';
          } else {
            const progress = p.life / p.maxLife;
            const currentScale = p.scale * progress;
            el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) rotate(${p.rotation}deg) scale(${currentScale})`;
            el.style.opacity = progress.toString();
            el.style.color = COLORS[p.colorIndex];
          }
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };
    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      cancelAnimationFrame(animationFrameId);
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="hidden md:block sparkle-trail-container z-[99999] pointer-events-none fixed inset-0">
      {/* 0-Lag Glowing Core */}
      <div 
        ref={dotRef}
        className="fixed top-0 left-0 w-3 h-3 bg-foreground rounded-full transition-all duration-150 ease-out"
        style={{ willChange: 'transform', opacity: 0, transformOrigin: 'center center', transform: 'translate(-50%, -50%)' }}
      >
        <div className="absolute inset-0 bg-foreground rounded-full blur-[2px]" />
      </div>

      {/* Particle Pool */}
      {particles.current.map((_, i) => (
        <div 
          key={i}
          ref={el => { particleRefs.current[i] = el; }}
          className="fixed top-0 left-0 w-4 h-4 -ml-2 -mt-2 opacity-0 particle-svg"
          style={{ willChange: 'transform, opacity' }}
        >
          {/* Sparkle SVG */}
          <svg viewBox="0 0 24 24" fill="currentColor" width="100%" height="100%">
            <path d="M12 0 L14.59 9.41 L24 12 L14.59 14.59 L12 24 L9.41 14.59 L0 12 L9.41 9.41 Z" />
          </svg>
        </div>
      ))}
    </div>
  );
}
