import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, Video, Square, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LyricsDisplay } from "@/components/sing-mode/LyricsDisplay";
import { cn } from "@/lib/utils";
import type { StageMode } from "@/hooks/useStage";
import type { StageTemplate } from "./StageTemplatePicker";

interface StageRecorderProps {
  instrumentalUrl: string;
  lyrics: string;
  trackTitle: string;
  artistName: string;
  mode: StageMode;
  template: StageTemplate;
  onRecordingComplete: (blob: Blob) => void;
  onCancel: () => void;
}

const TEMPLATE_COLORS: Record<StageTemplate, { bg: string; accent: string }> = {
  spotlight: { bg: "#1a1a1a", accent: "#ffffff" },
  neon: { bg: "#2d0a3e", accent: "#ff6ec7" },
  cyber: { bg: "#0a1628", accent: "#00d4ff" },
  galaxy: { bg: "#0f0a2e", accent: "#c084fc" },
};

const MODE_LABELS: Record<StageMode, string> = {
  sing: "Sing Mode",
  duet: "Duet Mode",
  dance: "Dance Mode",
  rap: "Rap Mode",
  ai_avatar: "AI Avatar Mode",
};

export function StageRecorder({
  instrumentalUrl,
  lyrics,
  trackTitle,
  artistName,
  mode,
  template,
  onRecordingComplete,
  onCancel,
}: StageRecorderProps) {
  const [captureMode, setCaptureMode] = useState<"audio" | "video">(mode === "dance" ? "video" : "audio");
  const [isRecording, setIsRecording] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const colors = TEMPLATE_COLORS[template];

  const setupCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 720, height: 1280 },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraReady(true);
    } catch {
      setCaptureMode("audio");
    }
  }, []);

  useEffect(() => {
    if (captureMode === "video") setupCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      setCameraReady(false);
    };
  }, [captureMode, setupCamera]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => stopRecording();
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  useEffect(() => {
    if (!isRecording) return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 500);
    return () => clearInterval(interval);
  }, [isRecording]);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !isRecording) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    const gradH = canvas.height * 0.35;
    const grad = ctx.createLinearGradient(0, canvas.height - gradH, 0, canvas.height);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.85)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, canvas.height - gradH, canvas.width, gradH);

    const topGrad = ctx.createLinearGradient(0, 0, 0, 120);
    topGrad.addColorStop(0, "rgba(0,0,0,0.6)");
    topGrad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, canvas.width, 120);

    ctx.fillStyle = colors.accent;
    ctx.font = "bold 22px system-ui";
    ctx.textAlign = "left";
    ctx.fillText(MODE_LABELS[mode], 24, 45);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(trackTitle, canvas.width / 2, canvas.height - 90);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "20px system-ui";
    ctx.fillText(`by ${artistName}`, canvas.width / 2, canvas.height - 60);

    ctx.fillStyle = colors.accent;
    ctx.font = "bold 18px system-ui";
    ctx.fillText("JumTunes.com", canvas.width / 2, canvas.height - 24);

    animFrameRef.current = requestAnimationFrame(renderCanvas);
  }, [isRecording, colors, mode, trackTitle, artistName]);

  useEffect(() => {
    if (isRecording && captureMode === "video") {
      animFrameRef.current = requestAnimationFrame(renderCanvas);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isRecording, captureMode, renderCanvas]);

  const startRecording = async () => {
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise((r) => setTimeout(r, 1000));
    }
    setCountdown(null);
    chunksRef.current = [];
    startTimeRef.current = Date.now();

    if (captureMode === "video" && canvasRef.current && streamRef.current) {
      const canvasStream = canvasRef.current.captureStream(30);
      streamRef.current.getAudioTracks().forEach((t) => canvasStream.addTrack(t));
      const recorder = new MediaRecorder(canvasStream, { mimeType: "video/webm;codecs=vp9,opus" });
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => onRecordingComplete(new Blob(chunksRef.current, { type: "video/webm" }));
      mediaRecorderRef.current = recorder;
      recorder.start(100);
    } else {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => onRecordingComplete(new Blob(chunksRef.current, { type: "audio/webm" }));
      mediaRecorderRef.current = recorder;
      recorder.start(100);
    }

    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") mediaRecorderRef.current.stop();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    setIsRecording(false);
    setCurrentTime(0);
    setElapsed(0);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const showLyrics = (mode === "sing" || mode === "rap") && lyrics;

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: colors.bg }}>
      <audio ref={audioRef} src={instrumentalUrl} preload="auto" crossOrigin="anonymous" />

      {!isRecording && (
        <div className="flex gap-2 p-4 justify-center">
          <Button
            variant={captureMode === "audio" ? "default" : "outline"}
            size="sm"
            onClick={() => setCaptureMode("audio")}
            className={cn(captureMode === "audio" && "bg-primary text-primary-foreground")}
          >
            <Mic className="w-4 h-4 mr-1" /> Audio
          </Button>
          <Button
            variant={captureMode === "video" ? "default" : "outline"}
            size="sm"
            onClick={() => setCaptureMode("video")}
            className={cn(captureMode === "video" && "bg-primary text-primary-foreground")}
          >
            <Video className="w-4 h-4 mr-1" /> Video
          </Button>
        </div>
      )}

      {captureMode === "video" && (
        <div className="relative flex-1 min-h-0">
          <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline style={{ transform: "scaleX(-1)", display: isRecording ? "none" : "block" }} />
          <canvas ref={canvasRef} width={720} height={1280} className="absolute inset-0 w-full h-full object-cover" style={{ display: isRecording ? "block" : "none" }} />
          {isRecording && showLyrics && (
            <div className="absolute bottom-28 left-0 right-0 max-h-[35%] px-4">
              <LyricsDisplay lyrics={lyrics} currentTime={currentTime} className="text-white" />
            </div>
          )}
        </div>
      )}

      {captureMode === "audio" && (
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <div className="text-center py-4">
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: colors.accent }}>{MODE_LABELS[mode]}</p>
            <h3 className="text-lg font-bold text-white mt-1">{trackTitle}</h3>
            <p className="text-sm text-white/60">{artistName}</p>
          </div>
          {showLyrics ? (
            <LyricsDisplay lyrics={lyrics} currentTime={currentTime} className="flex-1 text-white" />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className={cn("w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-4", isRecording && "animate-pulse")} style={{ backgroundColor: `${colors.accent}33` }}>
                  <Mic className="w-10 h-10" style={{ color: colors.accent }} />
                </div>
                {isRecording && <p className="text-white/80 text-lg font-mono">{formatTime(elapsed)}</p>}
                {!isRecording && <p className="text-white/50 text-sm">{mode === "dance" ? "Dance to the beat!" : mode === "rap" ? "Rap along to the beat!" : "Perform with the artist!"}</p>}
              </div>
            </div>
          )}
        </div>
      )}

      {countdown !== null && (
        <div className="absolute inset-0 flex items-center justify-center z-50" style={{ backgroundColor: `${colors.bg}dd` }}>
          <span className="text-8xl font-black animate-pulse" style={{ color: colors.accent }}>{countdown}</span>
        </div>
      )}

      <div className="p-4 flex items-center justify-center gap-4 border-t border-white/10">
        {!isRecording ? (
          <>
            <Button variant="ghost" onClick={onCancel} className="text-white/70 hover:text-white">
              <X className="w-5 h-5 mr-1" /> Cancel
            </Button>
            <Button
              size="lg"
              onClick={startRecording}
              disabled={captureMode === "video" && !cameraReady}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full w-16 h-16"
            >
              <Mic className="w-6 h-6" />
            </Button>
          </>
        ) : (
          <Button
            size="lg"
            onClick={stopRecording}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full w-16 h-16 animate-pulse"
          >
            <Square className="w-6 h-6" />
          </Button>
        )}
      </div>
    </div>
  );
}
