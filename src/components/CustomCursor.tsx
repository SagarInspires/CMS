'use client';

import { useEffect, useState } from 'react';

export function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Only enable custom cursor on desktop
    const checkIsDesktop = () => setIsDesktop(window.matchMedia('(min-width: 768px)').matches);
    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      
      // Check if hovering over a cursor-target
      const target = e.target as HTMLElement;
      const isTarget = target.closest('a, button, [data-cursor]');
      setIsHovering(!!isTarget);
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', checkIsDesktop);
    };
  }, []);

  if (!isDesktop) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 768px) {
          * {
            cursor: none !important;
          }
        }
      `}} />
      <div 
        className="fixed top-0 left-0 w-5 h-5 bg-white rounded-full pointer-events-none z-[99999] mix-blend-exclusion transition-transform duration-100 ease-out flex items-center justify-center"
        style={{ 
          transform: `translate3d(${position.x - 10}px, ${position.y - 10}px, 0) scale(${isHovering ? 1.5 : 1})`,
        }}
      >
        {isHovering && <span className="text-[6px] font-bold text-black font-sans uppercase tracking-widest absolute">Read</span>}
      </div>
      <div 
        className="fixed top-0 left-0 w-12 h-12 border-2 border-stone-300 rounded-full pointer-events-none z-[99998] transition-all duration-300 ease-out opacity-50"
        style={{ 
          transform: `translate3d(${position.x - 24}px, ${position.y - 24}px, 0) scale(${isHovering ? 1.5 : 1})`,
        }}
      />
    </>
  );
}
