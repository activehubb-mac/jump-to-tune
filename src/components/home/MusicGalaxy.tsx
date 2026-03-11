import { useEffect, useRef, useState, useCallback } from "react";
import { Play, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAudioPlayer } from "@/contexts/AudioPlayerContext";
import { useTrendingTracks } from "@/hooks/useTrendingTracks";
import { useNewReleases } from "@/hooks/useNewReleases";

interface GalaxyNode {
  id: string;
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  title: string;
  artist_name: string | null;
  cover_art_url: string | null;
  audio_url: string;
  artist_id: string;
  genre?: string;
  color: string;
  connections: string[];
  imageLoaded?: boolean;
  image?: HTMLImageElement;
}

const COLORS = [
  "hsl(45, 30%, 55%)",    // primary gold
  "hsl(25, 35%, 50%)",    // accent copper
  "hsl(30, 8%, 50%)",     // secondary
  "hsl(45, 40%, 65%)",    // lighter gold
  "hsl(15, 30%, 55%)",    // warm orange
];

export function MusicGalaxy({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const nodesRef = useRef<GalaxyNode[]>([]);
  const offsetRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, startOffsetX: 0, startOffsetY: 0 });
  const hoveredNodeRef = useRef<GalaxyNode | null>(null);

  const [hoveredNode, setHoveredNode] = useState<GalaxyNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const { playTrack } = useAudioPlayer();
  const { data: trending } = useTrendingTracks(20);
  const { data: newReleases } = useNewReleases(15);

  // Initialize nodes from track data
  useEffect(() => {
    const allTracks = [
      ...(trending || []).map(t => ({ ...t, source: "trending" })),
      ...(newReleases || []).map(t => ({ ...t, source: "new" })),
    ];

    // Deduplicate
    const seen = new Set<string>();
    const unique = allTracks.filter(t => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });

    if (unique.length === 0) return;

    const w = containerRef.current?.clientWidth || 800;
    const h = containerRef.current?.clientHeight || 600;

    const nodes: GalaxyNode[] = unique.map((track, i) => {
      const angle = (i / unique.length) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 100 + Math.random() * Math.min(w, h) * 0.3;
      const node: GalaxyNode = {
        id: track.id,
        x: w / 2 + Math.cos(angle) * dist,
        y: h / 2 + Math.sin(angle) * dist,
        radius: 18 + Math.random() * 14,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        title: track.title,
        artist_name: track.artist_name,
        cover_art_url: track.cover_art_url,
        audio_url: track.audio_url,
        artist_id: track.artist_id,
        genre: undefined,
        color: COLORS[i % COLORS.length],
        connections: [],
      };

      // Load cover image
      if (track.cover_art_url) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => { node.image = img; node.imageLoaded = true; };
        img.src = track.cover_art_url;
      }

      return node;
    });

    // Create connections based on same artist or random proximity
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const sameArtist = nodes[i].artist_id === nodes[j].artist_id;
        const randomConnect = Math.random() < 0.15;
        if (sameArtist || randomConnect) {
          nodes[i].connections.push(nodes[j].id);
        }
      }
    }

    nodesRef.current = nodes;
  }, [trending, newReleases]);

  // Canvas rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const container = containerRef.current;
      if (!container) return;
      canvas.width = container.clientWidth * window.devicePixelRatio;
      canvas.height = container.clientHeight * window.devicePixelRatio;
      canvas.style.width = `${container.clientWidth}px`;
      canvas.style.height = `${container.clientHeight}px`;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    const animate = () => {
      const w = canvas.width / window.devicePixelRatio;
      const h = canvas.height / window.devicePixelRatio;
      ctx.clearRect(0, 0, w, h);

      ctx.save();
      ctx.translate(offsetRef.current.x, offsetRef.current.y);
      ctx.scale(scaleRef.current, scaleRef.current);

      const nodes = nodesRef.current;

      // Draw connections
      nodes.forEach(node => {
        node.connections.forEach(targetId => {
          const target = nodes.find(n => n.id === targetId);
          if (!target) return;
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(target.x, target.y);
          ctx.strokeStyle = "hsla(45, 30%, 55%, 0.08)";
          ctx.lineWidth = 1;
          ctx.stroke();
        });
      });

      // Update & draw nodes
      nodes.forEach(node => {
        node.x += node.vx;
        node.y += node.vy;

        // Gentle boundary bounce
        if (node.x < -200 || node.x > w + 200) node.vx *= -1;
        if (node.y < -200 || node.y > h + 200) node.vy *= -1;

        const isHovered = hoveredNodeRef.current?.id === node.id;
        const r = isHovered ? node.radius * 1.3 : node.radius;

        // Glow
        if (isHovered) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, r + 8, 0, Math.PI * 2);
          const glow = ctx.createRadialGradient(node.x, node.y, r, node.x, node.y, r + 8);
          glow.addColorStop(0, node.color.replace(")", ", 0.4)").replace("hsl", "hsla"));
          glow.addColorStop(1, "transparent");
          ctx.fillStyle = glow;
          ctx.fill();
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);

        if (node.imageLoaded && node.image) {
          ctx.save();
          ctx.clip();
          ctx.drawImage(node.image, node.x - r, node.y - r, r * 2, r * 2);
          ctx.restore();
          // Border
          ctx.beginPath();
          ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
          ctx.strokeStyle = isHovered ? "hsl(45, 30%, 65%)" : "hsla(0, 0%, 30%, 0.5)";
          ctx.lineWidth = isHovered ? 3 : 1.5;
          ctx.stroke();
        } else {
          ctx.fillStyle = node.color;
          ctx.fill();
          ctx.strokeStyle = "hsla(0, 0%, 30%, 0.5)";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      });

      ctx.restore();
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Mouse/touch handlers
  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const x = (clientX - rect.left - offsetRef.current.x) / scaleRef.current;
    const y = (clientY - rect.top - offsetRef.current.y) / scaleRef.current;
    return { x, y };
  }, []);

  const findNode = useCallback((clientX: number, clientY: number) => {
    const { x, y } = getCanvasCoords(clientX, clientY);
    return nodesRef.current.find(n => {
      const dx = n.x - x;
      const dy = n.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= n.radius * 1.3;
    }) || null;
  }, [getCanvasCoords]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragRef.current.isDragging) {
      offsetRef.current.x = dragRef.current.startOffsetX + (e.clientX - dragRef.current.startX);
      offsetRef.current.y = dragRef.current.startOffsetY + (e.clientY - dragRef.current.startY);
      return;
    }
    const node = findNode(e.clientX, e.clientY);
    hoveredNodeRef.current = node;
    setHoveredNode(node);
    if (node) {
      setTooltipPos({ x: e.clientX, y: e.clientY });
    }
  }, [findNode]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const node = findNode(e.clientX, e.clientY);
    if (node) {
      playTrack({
        id: node.id,
        title: node.title,
        audio_url: node.audio_url,
        cover_art_url: node.cover_art_url,
        artist: { id: node.artist_id, display_name: node.artist_name },
      });
      return;
    }
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      startOffsetX: offsetRef.current.x,
      startOffsetY: offsetRef.current.y,
    };
  }, [findNode, playTrack]);

  const handleMouseUp = useCallback(() => {
    dragRef.current.isDragging = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    scaleRef.current = Math.max(0.3, Math.min(3, scaleRef.current * delta));
  }, []);

  return (
    <div className="fixed inset-0 z-[60] bg-background" ref={containerRef}>
      {/* Close button */}
      <div className="absolute top-4 right-4 z-10 flex gap-2" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <Button variant="outline" size="sm" onClick={onClose} className="glass">
          <X className="w-4 h-4 mr-1" />
          Exit Galaxy
        </Button>
      </div>

      {/* Title */}
      <div className="absolute top-4 left-4 z-10" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <span className="text-gradient">Music Galaxy</span>
        </h2>
        <p className="text-xs text-muted-foreground mt-1">Click nodes to play • Drag to pan • Scroll to zoom</p>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Tooltip */}
      {hoveredNode && (
        <div
          className="fixed z-20 glass-card-bordered p-3 pointer-events-none animate-fade-in"
          style={{
            left: Math.min(tooltipPos.x + 16, window.innerWidth - 220),
            top: Math.min(tooltipPos.y - 60, window.innerHeight - 100),
            maxWidth: 200,
          }}
        >
          <div className="flex items-center gap-3">
            {hoveredNode.cover_art_url && (
              <img
                src={hoveredNode.cover_art_url}
                alt=""
                className="w-10 h-10 rounded-md object-cover"
              />
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{hoveredNode.title}</p>
              <p className="text-xs text-muted-foreground truncate">{hoveredNode.artist_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-xs text-primary">
            <Play className="w-3 h-3" />
            Click to play
          </div>
        </div>
      )}
    </div>
  );
}
