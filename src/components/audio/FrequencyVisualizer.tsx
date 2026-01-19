import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface FrequencyVisualizerProps {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
  className?: string;
  barColor?: string;
  barCount?: number;
}

export function FrequencyVisualizer({
  audioElement,
  isPlaying,
  className,
  barColor = 'hsl(var(--primary))',
  barCount = 32,
}: FrequencyVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Connect audio element to analyzer
  useEffect(() => {
    if (!audioElement || isConnected) return;

    try {
      // Create audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      // Create analyser node
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      // Connect audio element to analyser
      const source = audioContext.createMediaElementSource(audioElement);
      source.connect(analyser);
      analyser.connect(audioContext.destination);
      sourceRef.current = source;

      setIsConnected(true);
    } catch (error) {
      // Audio element might already be connected to another context
      console.warn('Could not connect audio visualizer:', error);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioElement, isConnected]);

  // Resume audio context on play
  useEffect(() => {
    if (isPlaying && audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, [isPlaying]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const analyser = analyserRef.current;

    if (!canvas || !container || !analyser) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const width = rect.width;
      const height = rect.height;

      // Get frequency data
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Calculate bar dimensions
      const barWidth = width / barCount;
      const gap = 2;
      const actualBarWidth = Math.max(barWidth - gap, 2);

      // Draw bars
      for (let i = 0; i < barCount; i++) {
        // Sample from frequency data
        const dataIndex = Math.floor((i / barCount) * bufferLength);
        const value = dataArray[dataIndex] / 255;
        
        // Apply some easing for visual appeal
        const barHeight = Math.max(value * height * 0.9, 2);
        const x = i * barWidth + gap / 2;
        const y = height - barHeight;

        // Create gradient for each bar
        const gradient = ctx.createLinearGradient(x, y, x, height);
        gradient.addColorStop(0, barColor);
        gradient.addColorStop(1, `${barColor.replace(')', ' / 0.3)')}`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, actualBarWidth, barHeight, 2);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    if (isPlaying && isConnected) {
      draw();
    } else {
      // Draw static bars when paused
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const width = rect.width;
      const height = rect.height;
      const barWidth = width / barCount;
      const gap = 2;
      const actualBarWidth = Math.max(barWidth - gap, 2);

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < barCount; i++) {
        const barHeight = 4;
        const x = i * barWidth + gap / 2;
        const y = height - barHeight;

        ctx.fillStyle = `${barColor.replace(')', ' / 0.3)')}`;
        ctx.beginPath();
        ctx.roundRect(x, y, actualBarWidth, barHeight, 1);
        ctx.fill();
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, isConnected, barColor, barCount]);

  // Fallback animated bars when not connected
  if (!isConnected) {
    return (
      <div className={cn("flex items-end justify-center gap-1 h-full", className)}>
        {Array.from({ length: barCount }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "w-1 rounded-t-sm transition-all duration-150",
              isPlaying ? "animate-pulse" : ""
            )}
            style={{
              backgroundColor: barColor,
              height: isPlaying ? `${20 + Math.sin(i * 0.5) * 30 + Math.random() * 20}%` : '4px',
              opacity: isPlaying ? 0.8 : 0.3,
              animationDelay: `${i * 30}ms`,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("relative w-full h-full", className)}>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
