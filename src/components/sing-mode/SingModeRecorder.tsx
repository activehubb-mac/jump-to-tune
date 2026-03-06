import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, Video, Square, Camera, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LyricsDisplay } from "./LyricsDisplay";
import { cn } from "@/lib/utils";

interface SingModeRecorderProps {
  instrumentalUrl: string;
  lyrics: string;
  trackTitle: string;
  artistName: string;
  onRecordingComplete: (blob: Blob) => void;
  onCancel: () => void;
}

export function SingModeRecorder({
  instrumentalUrl,
  lyrics,
  trackTitle,
  artistName,
  onRecordingComplete,
  onCancel,
}: SingModeRecorderProps) {
  const [mode, setMode] = useState<"audio" | "video">("audio");
  const [isRecording, setIsRecording] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const animFrameRef = useRef<number>(0);

  // Setup camera for video mode
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
    } catch (err) {
      console.error("Camera access denied:", err);
      setMode("audio");
    }
  }, []);

  useEffect(() => {
    if (mode === "video") {
      setupCamera();
    }
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      setCameraReady(false);
    };
  }, [mode, setupCamera]);

  // Update currentTime from audio playback
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

  // Canvas rendering loop for video mode
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !isRecording) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw camera feed (mirrored)
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Semi-transparent overlay at bottom for lyrics
    const gradientH = canvas.height * 0.4;
    const gradient = ctx.createLinearGradient(0, canvas.height - gradientH, 0, canvas.height);
    gradient.addColorStop(0, "rgba(0,0,0,0)");
    gradient.addColorStop(1, "rgba(0,0,0,0.7)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, canvas.height - gradientH, canvas.width, gradientH);

    // "Sing Mode" top text
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = "bold 24px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Sing Mode", canvas.width / 2, 50);

    // Watermark
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "18px system-ui";
    ctx.fillText("JumTunes.com", canvas.width / 2, canvas.height - 30);

    animFrameRef.current = requestAnimationFrame(renderCanvas);
  }, [isRecording]);

  useEffect(() => {
    if (isRecording && mode === "video") {
      animFrameRef.current = requestAnimationFrame(renderCanvas);
    }
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isRecording, mode, renderCanvas]);

  const startRecording = async () => {
    // 3-second countdown
    for (let i = 3; i > 0; i--) {
      setCountdown(i);
      await new Promise((r) => setTimeout(r, 1000));
    }
    setCountdown(null);

    chunksRef.current = [];

    if (mode === "video" && canvasRef.current && streamRef.current) {
      // Canvas stream + mic audio
      const canvasStream = canvasRef.current.captureStream(30);
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach((t) => canvasStream.addTrack(t));

      const recorder = new MediaRecorder(canvasStream, {
        mimeType: "video/webm;codecs=vp9,opus",
      });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        onRecordingComplete(blob);
      };
      mediaRecorderRef.current = recorder;
      recorder.start(100);
    } else {
      // Audio-only recording
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        onRecordingComplete(blob);
      };
      mediaRecorderRef.current = recorder;
      recorder.start(100);
    }

    // Start instrumental playback
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsRecording(false);
    setCurrentTime(0);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Hidden audio element for instrumental */}
      <audio ref={audioRef} src={instrumentalUrl} preload="auto" crossOrigin="anonymous" />

      {/* Mode selector (only before recording) */}
      {!isRecording && (
        <div className="flex gap-2 p-4 justify-center">
          <Button
            variant={mode === "audio" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("audio")}
            className={cn(mode === "audio" && "bg-primary text-primary-foreground")}
          >
            <Mic className="w-4 h-4 mr-1" /> Audio Only
          </Button>
          <Button
            variant={mode === "video" ? "default" : "outline"}
            size="sm"
            onClick={() => setMode("video")}
            className={cn(mode === "video" && "bg-primary text-primary-foreground")}
          >
            <Video className="w-4 h-4 mr-1" /> Selfie Video
          </Button>
        </div>
      )}

      {/* Video preview / Canvas */}
      {mode === "video" && (
        <div className="relative flex-1 min-h-0">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover mirror"
            muted
            playsInline
            style={{ transform: "scaleX(-1)" }}
          />
          <canvas
            ref={canvasRef}
            width={720}
            height={1280}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ display: isRecording ? "block" : "none" }}
          />
          {/* Lyrics overlay for video mode */}
          {isRecording && lyrics && (
            <div className="absolute bottom-24 left-0 right-0 max-h-[40%]">
              <LyricsDisplay lyrics={lyrics} currentTime={currentTime} className="text-white" />
            </div>
          )}
        </div>
      )}

      {/* Lyrics display for audio mode */}
      {mode === "audio" && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="text-center py-4">
            <h3 className="text-lg font-bold text-foreground">{trackTitle}</h3>
            <p className="text-sm text-muted-foreground">{artistName}</p>
          </div>
          {lyrics ? (
            <LyricsDisplay lyrics={lyrics} currentTime={currentTime} className="flex-1" />
          ) : (
            <div className="flex items-center justify-center flex-1 text-muted-foreground">
              <p>No lyrics available — sing from memory!</p>
            </div>
          )}
        </div>
      )}

      {/* Countdown overlay */}
      {countdown !== null && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-50">
          <span className="text-8xl font-black text-primary animate-pulse">{countdown}</span>
        </div>
      )}

      {/* Controls */}
      <div className="p-4 flex items-center justify-center gap-4 bg-muted/30 border-t border-border">
        {!isRecording ? (
          <>
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              size="lg"
              onClick={startRecording}
              disabled={mode === "video" && !cameraReady}
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
