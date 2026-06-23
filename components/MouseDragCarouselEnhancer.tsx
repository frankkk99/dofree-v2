'use client';

import { useEffect } from 'react';

export function MouseDragCarouselEnhancer() {
  useEffect(() => {
    const rails = Array.from(document.querySelectorAll<HTMLElement>('.dofree-now-playing-rail'));
    const cleanups: Array<() => void> = [];

    rails.forEach((rail) => {
      const track = rail.querySelector<HTMLElement>('.dofree-now-playing-track');
      let isDragging = false;
      let startX = 0;
      let startScrollLeft = 0;
      let moved = false;
      let resumeTimer: number | undefined;

      const pauseTrack = () => {
        if (resumeTimer) window.clearTimeout(resumeTimer);
        if (track) track.style.animationPlayState = 'paused';
      };

      const resumeTrack = () => {
        if (resumeTimer) window.clearTimeout(resumeTimer);
        resumeTimer = window.setTimeout(() => {
          if (track) track.style.animationPlayState = 'running';
        }, 1100);
      };

      const handleMouseDown = (event: MouseEvent) => {
        if (event.button !== 0) return;
        isDragging = true;
        moved = false;
        startX = event.clientX;
        startScrollLeft = rail.scrollLeft;
        rail.classList.add('is-mouse-dragging');
        pauseTrack();
      };

      const handleMouseMove = (event: MouseEvent) => {
        if (!isDragging) return;
        const deltaX = event.clientX - startX;
        if (Math.abs(deltaX) > 5) moved = true;
        if (moved) {
          event.preventDefault();
          rail.scrollLeft = startScrollLeft - deltaX;
        }
      };

      const handleMouseUp = () => {
        if (!isDragging) return;
        isDragging = false;
        rail.classList.remove('is-mouse-dragging');
        resumeTrack();
      };

      const handleClick = (event: MouseEvent) => {
        if (!moved) return;
        event.preventDefault();
        event.stopPropagation();
        window.setTimeout(() => {
          moved = false;
        }, 80);
      };

      const handleWheel = (event: WheelEvent) => {
        if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
        pauseTrack();
        rail.scrollLeft += event.deltaY;
        resumeTrack();
      };

      rail.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      rail.addEventListener('click', handleClick, true);
      rail.addEventListener('wheel', handleWheel, { passive: true });

      cleanups.push(() => {
        if (resumeTimer) window.clearTimeout(resumeTimer);
        rail.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        rail.removeEventListener('click', handleClick, true);
        rail.removeEventListener('wheel', handleWheel);
      });
    });

    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);

  return (
    <style>{`
      .dofree-now-playing-rail { cursor: grab; user-select: none; }
      .dofree-now-playing-rail.is-mouse-dragging { cursor: grabbing; scroll-behavior: auto !important; }
    `}</style>
  );
}
