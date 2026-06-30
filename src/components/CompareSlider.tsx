import React, { useState, useRef, useEffect } from 'react';
import { Eye, Check } from 'lucide-react';

interface CompareSliderProps {
  original: string;
  reconstructed: string;
  className?: string;
}

export const CompareSlider: React.FC<CompareSliderProps> = ({
  original,
  reconstructed,
  className = '',
}) => {
  const [sliderPosition, setSliderPosition] = useState(50); // 0 to 100 percentage
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const position = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, position)));
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  const handlePointerDown = () => {
    setIsDragging(true);
  };

  useEffect(() => {
    const handlePointerUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handlePointerUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handlePointerUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      className={`relative select-none overflow-hidden rounded-xl border border-white/10 ${className}`}
      style={{ aspectRatio: '1/1' }}
    >
      {/* Reconstructed Image (Background) */}
      <img
        src={reconstructed}
        alt="Reconstructed terrain"
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
      
      {/* Label for Reconstructed */}
      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 rounded bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-accent-cyan uppercase tracking-wider backdrop-blur-sm">
        <Check className="h-3 w-3" /> Cloud-Free AI Reconstruction
      </div>

      {/* Original Image (Foreground, clipped based on slider position) */}
      <div
        className="absolute inset-0 h-full overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <img
          src={original}
          alt="Original satellite tile"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ width: containerRef.current?.offsetWidth || '100%', maxWidth: 'none' }}
          draggable={false}
        />
        {/* Label for Original */}
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1 rounded bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-slate-300 uppercase tracking-wider backdrop-blur-sm">
          <Eye className="h-3 w-3" /> Cloudy Original
        </div>
      </div>

      {/* Slider Bar & Handle */}
      <div
        className="absolute bottom-0 top-0 z-20 w-[2px] bg-accent-cyan cursor-ew-resize"
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
      >
        <div 
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-8 w-8 cursor-ew-resize items-center justify-center rounded-full border-2 border-accent-cyan bg-dark-900 shadow-[0_0_10px_rgba(0,240,255,0.4)] hover:scale-105 transition-transform"
        >
          {/* Arrow Icons */}
          <div className="flex items-center gap-0.5 text-accent-cyan">
            <span className="text-[10px] font-bold">◀</span>
            <span className="text-[10px] font-bold">▶</span>
          </div>
        </div>
      </div>
    </div>
  );
};
