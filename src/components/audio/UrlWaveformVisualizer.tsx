import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface UrlWaveformVisualizerProps {
  audioUrl: string;
  currentTime: number;
  duration: number;
  onSeek?: (time: number) => void;
  className?: string;
  barColor?: string;
  progressColor?: string;
  backgroundColor?: string;
}

export function UrlWaveformVisualizer({
  audioUrl,
  currentTime,
  duration,
  onSeek,
  className,
  barColor = 'hsl(var(--muted-foreground) / 0.3)',
  progressColor = 'hsl(var(--primary))',
  backgroundColor = 'transparent',
}: UrlWaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredPosition, setHoveredPosition] = useState<number | null>(null);
  const lastUrlRef = useRef<string>('');

  // Generate fallback waveform for immediate visual feedback
  const generateFallbackWaveform = useCallback(() => {
    return Array.from({ length: 80 }, (_, i) => {
      const base = 0.4 + Math.sin(i * 0.15) * 0.15;
      const variation = Math.sin(i * 0.3) * 0.2 + Math.cos(i * 0.1) * 0.1;
      return Math.max(0.15, Math.min(1, base + variation));
    });
  }, []);

  // Extract waveform data from audio URL
  useEffect(() => {
    if (!audioUrl) return;
    
    // Only refetch if URL actually changed
    if (audioUrl === lastUrlRef.current && waveformData.length > 0) {
      setIsLoading(false);
      return;
    }
    
    lastUrlRef.current = audioUrl;
    
    // Show fallback immediately while loading
    setWaveformData(generateFallbackWaveform());
    setIsLoading(true);

    const controller = new AbortController();
    
    const extractWaveform = async () => {
      try {
        const response = await fetch(audioUrl, { 
          signal: controller.signal,
          mode: 'cors',
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch audio: ${response.status}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        try {
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          // Get audio data from the first channel
          const rawData = audioBuffer.getChannelData(0);
          const samples = 80; // Number of bars in the waveform
          const blockSize = Math.floor(rawData.length / samples);
          const filteredData: number[] = [];
          
          for (let i = 0; i < samples; i++) {
            const blockStart = blockSize * i;
            let sum = 0;
            for (let j = 0; j < blockSize; j++) {
              sum += Math.abs(rawData[blockStart + j]);
            }
            filteredData.push(sum / blockSize);
          }
          
          // Normalize the data
          const maxValue = Math.max(...filteredData);
          if (maxValue > 0) {
            const normalizedData = filteredData.map(val => Math.max(0.1, val / maxValue));
            setWaveformData(normalizedData);
          }
          
          audioContext.close();
        } catch (decodeError) {
          console.warn('Failed to decode audio data:', decodeError);
          // Keep using fallback waveform
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.warn('Failed to extract waveform:', error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Small delay to allow the component to mount properly
    const timeoutId = setTimeout(extractWaveform, 100);
    
    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [audioUrl, generateFallbackWaveform, waveformData.length]);

  // Draw the waveform using requestAnimationFrame for smooth animation
  const progressRef = useRef(0);
  const animationRef = useRef<number>();

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || waveformData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const barWidth = width / waveformData.length;
    const gap = 2;
    const actualBarWidth = Math.max(barWidth - gap, 1);
    const targetProgress = duration > 0 ? currentTime / duration : 0;
    
    // Smooth interpolation for fluid animation
    progressRef.current += (targetProgress - progressRef.current) * 0.3;
    const progressPosition = progressRef.current * width;
    const hoverPosition = hoveredPosition !== null ? hoveredPosition * width : null;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    if (backgroundColor !== 'transparent') {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }

    // Draw bars with subtle animation
    const time = Date.now() / 1000;
    waveformData.forEach((value, index) => {
      const x = index * barWidth;
      // Add subtle pulse animation based on position near playhead
      const distFromPlayhead = Math.abs(x - progressPosition) / width;
      const pulse = distFromPlayhead < 0.1 ? 1 + Math.sin(time * 8) * 0.1 * (1 - distFromPlayhead * 10) : 1;
      const animatedValue = value * pulse;
      
      const barHeight = Math.max(animatedValue * (height * 0.85), 2);
      const y = (height - barHeight) / 2;

      // Determine if this bar is before the current progress
      const isPlayed = x + actualBarWidth <= progressPosition;
      const isPartiallyPlayed = x < progressPosition && x + actualBarWidth > progressPosition;

      if (isPlayed) {
        ctx.fillStyle = progressColor;
        ctx.beginPath();
        ctx.roundRect(x, y, actualBarWidth, barHeight, 1);
        ctx.fill();
      } else if (isPartiallyPlayed) {
        // Draw the played portion
        const playedWidth = progressPosition - x;
        ctx.fillStyle = progressColor;
        ctx.beginPath();
        ctx.roundRect(x, y, playedWidth, barHeight, 1);
        ctx.fill();
        
        // Draw the unplayed portion
        ctx.fillStyle = barColor;
        ctx.beginPath();
        ctx.roundRect(x + playedWidth, y, actualBarWidth - playedWidth, barHeight, 1);
        ctx.fill();
      } else {
        ctx.fillStyle = barColor;
        ctx.beginPath();
        ctx.roundRect(x, y, actualBarWidth, barHeight, 1);
        ctx.fill();
      }
    });

    // Draw hover indicator
    if (hoverPosition !== null) {
      ctx.strokeStyle = 'hsl(var(--foreground) / 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(hoverPosition, 0);
      ctx.lineTo(hoverPosition, height);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw animated playhead glow
    if (progressPosition > 0) {
      // Glow effect
      const gradient = ctx.createRadialGradient(progressPosition, height / 2, 0, progressPosition, height / 2, 8);
      gradient.addColorStop(0, progressColor.replace(')', ' / 0.6)').replace('hsl(', 'hsla('));
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(progressPosition, height / 2, 8, 0, Math.PI * 2);
      ctx.fill();
      
      // Playhead dot
      ctx.fillStyle = progressColor;
      ctx.beginPath();
      ctx.arc(progressPosition, height / 2, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [waveformData, currentTime, duration, hoveredPosition, barColor, progressColor, backgroundColor]);

  // Continuous animation loop for smooth playback visualization
  useEffect(() => {
    let isActive = true;
    
    const animate = () => {
      if (!isActive) return;
      drawWaveform();
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      isActive = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [drawWaveform]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      requestAnimationFrame(drawWaveform);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawWaveform]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSeek || !containerRef.current || duration === 0) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    onSeek(Math.max(0, Math.min(newTime, duration)));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setHoveredPosition(x / rect.width);
  };

  const handleMouseLeave = () => {
    setHoveredPosition(null);
  };

  return (
    <div 
      ref={containerRef}
      className={cn("relative w-full h-8", className)}
    >
      {isLoading && waveformData.length === 0 ? (
        <div className="absolute inset-0 flex items-center">
          <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary/50 rounded-full transition-all duration-150"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-pointer"
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
      )}
    </div>
  );
}
