import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface WaveformVisualizerProps {
  audioFile: File;
  currentTime: number;
  duration: number;
  onSeek?: (time: number) => void;
  className?: string;
  barColor?: string;
  progressColor?: string;
  backgroundColor?: string;
}

export function WaveformVisualizer({
  audioFile,
  currentTime,
  duration,
  onSeek,
  className,
  barColor = 'hsl(var(--muted-foreground) / 0.3)',
  progressColor = 'hsl(var(--primary))',
  backgroundColor = 'transparent',
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredPosition, setHoveredPosition] = useState<number | null>(null);

  // Extract waveform data from audio file
  useEffect(() => {
    const extractWaveform = async () => {
      setIsLoading(true);
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const arrayBuffer = await audioFile.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Get audio data from the first channel
        const rawData = audioBuffer.getChannelData(0);
        const samples = 100; // Number of bars in the waveform
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
        const normalizedData = filteredData.map(val => val / maxValue);
        
        setWaveformData(normalizedData);
        audioContext.close();
      } catch (error) {
        console.error('Failed to extract waveform:', error);
        // Fallback: generate random waveform for visual purposes
        const fallbackData = Array.from({ length: 100 }, () => Math.random() * 0.5 + 0.2);
        setWaveformData(fallbackData);
      } finally {
        setIsLoading(false);
      }
    };

    extractWaveform();
  }, [audioFile]);

  // Draw the waveform
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || waveformData.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const barWidth = width / waveformData.length;
    const gap = 2;
    const actualBarWidth = Math.max(barWidth - gap, 1);
    const progressPosition = duration > 0 ? (currentTime / duration) * width : 0;
    const hoverPosition = hoveredPosition !== null ? hoveredPosition * width : null;

    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Draw bars
    waveformData.forEach((value, index) => {
      const x = index * barWidth;
      const barHeight = value * (height * 0.8);
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
      ctx.strokeStyle = 'hsl(var(--foreground) / 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(hoverPosition, 0);
      ctx.lineTo(hoverPosition, height);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw playhead
    ctx.fillStyle = progressColor;
    ctx.beginPath();
    ctx.arc(progressPosition, height / 2, 4, 0, Math.PI * 2);
    ctx.fill();
  }, [waveformData, currentTime, duration, hoveredPosition, barColor, progressColor, backgroundColor]);

  // Redraw on data or time change
  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => drawWaveform();
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
      className={cn("relative w-full h-12", className)}
    >
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex gap-1">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="w-1 bg-muted-foreground/20 rounded-full animate-pulse"
                style={{
                  height: `${20 + Math.random() * 60}%`,
                  animationDelay: `${i * 50}ms`,
                }}
              />
            ))}
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