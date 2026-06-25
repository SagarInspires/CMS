'use client';

import { useEffect, useRef } from 'react';

export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  // Core physical state stored outside React
  const mouse = useRef({ x: -100, y: -100 });
  const ring = useRef({ x: -100, y: -100 });
  const state = useRef({ hovering: false, clicking: false, visible: false });

  useEffect(() => {
    // Only run on non-touch desktop devices
    if (!window.matchMedia('(pointer: fine)').matches) return;

    // Inject global cursor: none
    const style = document.createElement('style');
    style.innerHTML = `
      @media (pointer: fine) {
        * { cursor: none !important; }
      }
    `;
    document.head.appendChild(style);

    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      // First move initialization
      if (!state.current.visible) {
        ring.current.x = e.clientX;
        ring.current.y = e.clientY;
        state.current.visible = true;
      }
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
      
      const target = e.target as HTMLElement;
      state.current.hovering = !!target.closest('a, button, [role="button"], input, select, textarea, [data-cursor="read"], .prose');
    };

    const handleMouseDown = () => { state.current.clicking = true; };
    const handleMouseUp = () => { state.current.clicking = false; };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // High performance render loop
    const render = () => {
      // 1. The Dot follows instantly (0-lag)
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${mouse.current.x}px, ${mouse.current.y}px, 0)`;
        
        if (state.current.visible) dotRef.current.style.opacity = '1';
        
        if (state.current.hovering) {
          dotRef.current.classList.add('dot-hover');
        } else {
          dotRef.current.classList.remove('dot-hover');
        }
      }

      // 2. The Ring lerps smoothly towards the dot
      // Lerp formula: current = current + (target - current) * friction
      ring.current.x += (mouse.current.x - ring.current.x) * 0.15;
      ring.current.y += (mouse.current.y - ring.current.y) * 0.15;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ring.current.x}px, ${ring.current.y}px, 0)`;
        
        if (state.current.visible) ringRef.current.style.opacity = '1';

        if (state.current.hovering) {
          ringRef.current.classList.add('ring-hover');
        } else {
          ringRef.current.classList.remove('ring-hover');
        }

        if (state.current.clicking) {
          ringRef.current.classList.add('ring-click');
        } else {
          ringRef.current.classList.remove('ring-click');
        }
      }

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
    <>
      {/* 0-Lag Center Dot */}
      <div 
        ref={dotRef}
        className="fixed top-0 left-0 w-2 h-2 rounded-full pointer-events-none z-[99999] custom-cursor-element hidden md:block"
        style={{ willChange: 'transform', opacity: 0 }}
      >
        <div className="absolute inset-0 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 transition-transform duration-200 dot-inner" />
      </div>

      {/* Trailing Ring */}
      <div 
        ref={ringRef}
        className="fixed top-0 left-0 w-10 h-10 rounded-full border border-white/50 pointer-events-none z-[99998] custom-cursor-element hidden md:block"
        style={{ willChange: 'transform', opacity: 0 }}
      >
        <div className="absolute inset-0 rounded-full -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ring-inner" />
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-cursor-element {
          mix-blend-mode: exclusion;
        }
        
        /* Inner scaling logic to keep translate3d intact on the parent */
        .dot-hover .dot-inner {
          transform: translate(-50%, -50%) scale(0.3);
          opacity: 0;
        }

        .ring-hover .ring-inner {
          transform: translate(-50%, -50%) scale(1.5);
          background-color: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 1);
        }

        .ring-click .ring-inner {
          transform: translate(-50%, -50%) scale(0.8);
          background-color: rgba(255, 255, 255, 0.5);
        }
      `}} />
    </>
  );
}
