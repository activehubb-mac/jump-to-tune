import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Square, Play, Pause, Trash2, Save } from "lucide-react";
import { useUploadVoiceClip, useGoDJVoiceClips, useDeleteVoiceClip } from "@/hooks/useGoDJVoiceClips";
import { toast } from "@/hooks/use-toast";

interface VoiceRecorderProps {
  sessionId: string;
  maxClipSeconds?: number;
  maxTotalSeconds?: number;
}

export function VoiceRecorder({
  sessionId,
  maxClipSeconds = 20,
  maxTotalSeconds = 120,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timer, setTimer] = useState(0);
  const [clipLabel, setClipLabel] = useState("Voice Clip");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const uploadClip = useUploadVoiceClip();
  const deleteClip = useDeleteVoiceClip();
  const { data: clips } = useGoDJVoiceClips(sessionId);

  const totalVoiceSec = (clips || []).reduce((sum, c) => sum + c.duration_sec, 0);
  const remainingSec = maxTotalSeconds - totalVoiceSec;

  const startRecording = useCallback(async () => {
    if (remainingSec <= 0) {
      toast({ title: "Voice limit reached", description: `Max ${maxTotalSeconds}s total voice per session`, variant: "destructive" });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setTimer(0);
      setRecordedBlob(null);
      setRecordedUrl(null);

      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          const next = prev + 1;
          const effectiveMax = Math.min(maxClipSeconds, remainingSec);
          if (next >= effectiveMax) {
            mediaRecorderRef.current?.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
          }
          return next;
        });
      }, 1000);
    } catch (err) {
      toast({ title: "Microphone access denied", description: "Please allow microphone access to record voice clips", variant: "destructive" });
    }
  }, [maxClipSeconds, remainingSec, maxTotalSeconds]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const togglePlayback = useCallback(() => {
    if (!audioRef.current || !recordedUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.src = recordedUrl;
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying, recordedUrl]);

  const handleSave = async () => {
    if (!recordedBlob) return;
    try {
      await uploadClip.mutateAsync({
        sessionId,
        audioBlob: recordedBlob,
        durationSec: timer,
        label: clipLabel || "Voice Clip",
      });
      toast({ title: "Voice clip saved!" });
      setRecordedBlob(null);
      setRecordedUrl(null);
      setTimer(0);
      setClipLabel("Voice Clip");
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      mediaRecorderRef.current?.stop();
    };
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Mic className="w-4 h-4" />
          Record a Drop
        </h3>
        <span className="text-xs text-muted-foreground">
          {Math.max(0, remainingSec)}s remaining
        </span>
      </div>

      {/* Recording controls */}
      <div className="flex items-center gap-3">
        {!isRecording && !recordedBlob && (
          <Button
            size="sm"
            onClick={startRecording}
            disabled={remainingSec <= 0}
            className="gap-2"
          >
            <Mic className="w-4 h-4" />
            Record
          </Button>
        )}

        {isRecording && (
          <>
            <Button size="sm" variant="destructive" onClick={stopRecording} className="gap-2">
              <Square className="w-3 h-3" />
              Stop
            </Button>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-mono text-foreground">
                {timer}s / {Math.min(maxClipSeconds, remainingSec)}s
              </span>
            </div>
          </>
        )}

        {recordedBlob && !isRecording && (
          <div className="flex items-center gap-2 flex-1">
            <Button size="icon" variant="ghost" onClick={togglePlayback}>
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Input
              value={clipLabel}
              onChange={(e) => setClipLabel(e.target.value)}
              placeholder="Clip name"
              className="h-8 text-sm flex-1"
              maxLength={50}
            />
            <Button size="sm" onClick={handleSave} disabled={uploadClip.isPending} className="gap-1">
              <Save className="w-3 h-3" />
              {uploadClip.isPending ? "…" : "Save"}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => { setRecordedBlob(null); setRecordedUrl(null); setTimer(0); }}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        )}
      </div>

      {/* Saved clips list */}
      {clips && clips.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-medium">Saved Clips ({clips.length})</p>
          {clips.map((clip) => (
            <div key={clip.id} className="flex items-center gap-2 px-2 py-1.5 rounded bg-muted/30 text-sm">
              <Mic className="w-3 h-3 text-muted-foreground shrink-0" />
              <span className="flex-1 truncate">{clip.label}</span>
              <span className="text-xs text-muted-foreground">{clip.duration_sec}s</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => deleteClip.mutate({ id: clip.id, sessionId, fileUrl: clip.file_url })}
              >
                <Trash2 className="w-3 h-3 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <audio ref={audioRef} onEnded={() => setIsPlaying(false)} className="hidden" />
    </div>
  );
}
