'use client';

import { useEffect, useRef } from 'react';

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);

  // We use refs instead of state to guarantee absolute zero-lag tracking.
  // This completely bypasses React's rendering lifecycle, keeping it at 144Hz+.
  const mouse = useRef({ x: -100, y: -100, targetX: -100, targetY: -100 });
  const state = useRef({ hovering: false, clicking: false });

  useEffect(() => {
    // Only run on non-touch desktop devices
    if (!window.matchMedia('(pointer: fine)').matches) return;

    // Inject global cursor: none so our custom cursor replaces it
    const style = document.createElement('style');
    style.innerHTML = `
      @media (pointer: fine) {
        * { cursor: none !important; }
      }
    `;
    document.head.appendChild(style);

    let animationFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      mouse.current.targetX = e.clientX;
      mouse.current.targetY = e.clientY;
      
      const target = e.target as HTMLElement;
      // Detect interactive elements
      state.current.hovering = !!target.closest('a, button, [role="button"], input, select, textarea, [data-cursor="read"]');
    };

    const handleMouseDown = () => { state.current.clicking = true; };
    const handleMouseUp = () => { state.current.clicking = false; };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // The core zero-lag render loop
    const render = () => {
      // Direct 1-to-1 mapping to eliminate lag completely
      mouse.current.x = mouse.current.targetX;
      mouse.current.y = mouse.current.targetY;

      if (cursorRef.current) {
        // Hardware-accelerated direct DOM manipulation
        cursorRef.current.style.transform = `translate3d(${mouse.current.x}px, ${mouse.current.y}px, 0)`;

        if (state.current.clicking) {
          cursorRef.current.classList.add('cursor-clicking');
        } else {
          cursorRef.current.classList.remove('cursor-clicking');
        }

        if (state.current.hovering) {
          cursorRef.current.classList.add('cursor-hovering');
        } else {
          cursorRef.current.classList.remove('cursor-hovering');
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
    <div 
      ref={cursorRef}
      className="fixed top-0 left-0 pointer-events-none z-[99999] custom-feather-cursor hidden md:block"
      style={{ willChange: 'transform' }}
    >
      <svg 
        width="48" 
        height="120" 
        viewBox="0 0 100 250" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="feather-svg"
      >
        <g className="feather-quill-group">
          {/* Central Stem (Quill tip at 0,0) */}
          <path className="quill-stem" d="M 0 0 Q 30 80, 20 230" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          
          {/* Detailed Threads (Left) */}
          <path className="thread-left t1" d="M 5 30 Q 30 40, 60 70" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path className="thread-left t2" d="M 12 70 Q 40 80, 65 110" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path className="thread-left t3" d="M 18 110 Q 45 120, 65 150" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path className="thread-left t4" d="M 21 150 Q 40 160, 55 190" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path className="thread-left t5" d="M 22 190 Q 35 195, 45 220" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          
          {/* Detailed Threads (Right) */}
          <path className="thread-right t6" d="M 5 30 Q -10 40, -30 70" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path className="thread-right t7" d="M 12 70 Q -20 80, -35 110" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path className="thread-right t8" d="M 18 110 Q -25 120, -35 150" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path className="thread-right t9" d="M 21 150 Q -20 160, -25 190" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path className="thread-right t10" d="M 22 190 Q -10 195, -15 220" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />

          {/* Faint ambient plume fill */}
          <path className="plume-ambient" d="M 0 0 C 40 20, 80 100, 20 230 C -50 100, -20 20, 0 0 Z" fill="currentColor" fillOpacity="0.1" />
        </g>
      </svg>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-feather-cursor {
          /* Mix blend mode looks amazing for custom cursors */
          mix-blend-mode: exclusion;
          color: white;
          transform-origin: 0 0;
          transition: none; /* Absolutely NO transition on position to prevent lag */
        }

        .feather-svg {
          /* Transform origin at the tip (0,0) */
          transform-origin: 0 0;
          transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
          filter: drop-shadow(0 4px 12px rgba(255,255,255,0.2));
          /* Default angle */
          transform: rotate(-15deg) translate(-2px, -2px);
        }

        /* Ambient subtle floating animation */
        @keyframes floatFeather {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-2px) rotate(2deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }

        .feather-quill-group {
          animation: floatFeather 3s ease-in-out infinite;
          transform-origin: 0 0;
          transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
        }

        .thread-left, .thread-right, .plume-ambient {
          transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
          transform-origin: 10px 100px;
        }

        /* Hover State: The feather ruffles and fans outwards */
        .cursor-hovering .feather-svg {
          transform: rotate(0deg) translate(-2px, -2px) scale(1.1);
          filter: drop-shadow(0 0 15px rgba(255,255,255,0.6));
        }
        
        .cursor-hovering .thread-left {
          transform: rotate(15deg) scaleX(1.3);
        }
        
        .cursor-hovering .thread-right {
          transform: rotate(-15deg) scaleX(1.3);
        }
        
        .cursor-hovering .plume-ambient {
          transform: scaleX(1.4);
          fill-opacity: 0.2;
        }

        /* Click State: Dip the quill */
        .cursor-clicking .feather-svg {
          transform: rotate(-35deg) translate(-2px, -2px) scale(0.9);
          filter: drop-shadow(0 2px 5px rgba(255,255,255,0.4));
        }

        .cursor-clicking .feather-quill-group {
          animation-play-state: paused;
        }
      `}} />
    </div>
  );
}
