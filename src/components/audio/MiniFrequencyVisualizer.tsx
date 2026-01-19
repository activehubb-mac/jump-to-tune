import { useEffect, useRef, memo } from 'react';
import { cn } from '@/lib/utils';

interface MiniFrequencyVisualizerProps {
  isPlaying: boolean;
  className?: string;
  barCount?: number;
  color?: string;
}

export const MiniFrequencyVisualizer = memo(function MiniFrequencyVisualizer({
  isPlaying,
  className,
  barCount = 4,
  color = 'hsl(var(--primary))',
}: MiniFrequencyVisualizerProps) {
  const barsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    if (!isPlaying) return;

    const animations: number[] = [];
    
    barsRef.current.forEach((bar, index) => {
      if (!bar) return;
      
      const animate = () => {
        if (!bar) return;
        // Random height between 20% and 100%
        const height = 20 + Math.random() * 80;
        bar.style.height = `${height}%`;
        
        // Staggered timing for more natural look
        const delay = 80 + Math.random() * 120;
        animations[index] = window.setTimeout(() => {
          animations[index] = requestAnimationFrame(animate);
        }, delay);
      };
      
      animate();
    });

    return () => {
      animations.forEach(id => {
        cancelAnimationFrame(id);
        clearTimeout(id);
      });
    };
  }, [isPlaying]);

  return (
    <div className={cn("flex items-end gap-[2px] h-4", className)}>
      {Array.from({ length: barCount }).map((_, index) => (
        <div
          key={index}
          ref={(el) => {
            if (el) barsRef.current[index] = el;
          }}
          className="w-[3px] rounded-full transition-all duration-75"
          style={{
            backgroundColor: color,
            height: isPlaying ? '60%' : '20%',
            opacity: isPlaying ? 1 : 0.4,
          }}
        />
      ))}
    </div>
  );
});
