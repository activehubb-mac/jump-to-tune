import { GoDJSegment } from "@/hooks/useGoDJSegments";

interface VoiceClipInfo {
  file_url: string;
  duration_sec: number;
  label: string;
}

interface DuckingOptions {
  duckLevel?: number;
  fadeDurationMs?: number;
}

type VoiceCallback = () => void;

interface VoiceOverlay {
  segment: GoDJSegment;
  clipUrl: string;
}

export class DuckingEngine {
  private mainAudio: HTMLAudioElement;
  private voiceAudio: HTMLAudioElement;
  private overlays: VoiceOverlay[] = [];
  private triggeredIds = new Set<string>();
  private isVoicePlaying = false;
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private fadeRafId: number | null = null;
  private duckLevel: number;
  private fadeDurationMs: number;
  private targetVolume: number = 1.0;

  onVoiceStart: VoiceCallback | null = null;
  onVoiceEnd: VoiceCallback | null = null;

  constructor(
    mainAudio: HTMLAudioElement,
    voiceAudio: HTMLAudioElement,
    segments: GoDJSegment[],
    voiceClipData: Record<string, VoiceClipInfo>,
    options?: DuckingOptions
  ) {
    this.mainAudio = mainAudio;
    this.voiceAudio = voiceAudio;
    this.duckLevel = options?.duckLevel ?? 0.35;
    this.fadeDurationMs = options?.fadeDurationMs ?? 300;

    // Filter to voice segments with overlay timestamps and valid clip data
    this.overlays = segments
      .filter(
        (s) =>
          s.segment_type === "voice" &&
          s.voice_clip_id &&
          s.overlay_start_sec != null &&
          voiceClipData[s.voice_clip_id]
      )
      .map((s) => ({
        segment: s,
        clipUrl: voiceClipData[s.voice_clip_id!].file_url,
      }));

    // Voice ended handler
    this.voiceAudio.addEventListener("ended", this.handleVoiceEnded);
    this.voiceAudio.addEventListener("error", this.handleVoiceError);
  }

  start() {
    this.stop();
    if (this.overlays.length === 0) return;

    this.pollInterval = setInterval(() => {
      if (this.mainAudio.paused) return;
      const currentTime = this.mainAudio.currentTime;

      for (const overlay of this.overlays) {
        const id = overlay.segment.id;
        if (this.triggeredIds.has(id)) continue;
        if (currentTime < overlay.segment.overlay_start_sec!) continue;

        // Trigger this overlay
        this.triggeredIds.add(id);

        if (this.isVoicePlaying) continue; // No stacking

        this.playVoiceOverlay(overlay);
        break; // Only one trigger per tick
      }
    }, 100);
  }

  stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    if (this.fadeRafId) {
      cancelAnimationFrame(this.fadeRafId);
      this.fadeRafId = null;
    }
    if (this.isVoicePlaying) {
      this.voiceAudio.pause();
      this.voiceAudio.src = "";
      this.isVoicePlaying = false;
    }
    this.mainAudio.volume = 1.0;
    this.targetVolume = 1.0;
  }

  resetTriggers() {
    this.triggeredIds.clear();
  }

  /** Mark overlays before a given time as already triggered */
  markTriggeredBefore(time: number) {
    this.triggeredIds.clear();
    for (const overlay of this.overlays) {
      if (overlay.segment.overlay_start_sec! < time) {
        this.triggeredIds.add(overlay.segment.id);
      }
    }
  }

  destroy() {
    this.stop();
    this.voiceAudio.removeEventListener("ended", this.handleVoiceEnded);
    this.voiceAudio.removeEventListener("error", this.handleVoiceError);
  }

  private playVoiceOverlay(overlay: VoiceOverlay) {
    this.isVoicePlaying = true;
    this.onVoiceStart?.();

    // Duck music volume if ducking is enabled
    if (overlay.segment.ducking_enabled) {
      const dbValue = overlay.segment.ducking_db;
      // Convert dB to linear: 10^(dB/20), but clamp to our duckLevel minimum
      const linearFromDb = Math.pow(10, dbValue / 20);
      const target = Math.max(this.duckLevel, Math.min(1.0, linearFromDb));
      this.fadeVolume(this.mainAudio.volume, target);
    }

    // Set voice volume
    this.voiceAudio.volume = Math.min(1.0, overlay.segment.voice_volume / 100);
    this.voiceAudio.src = overlay.clipUrl;
    this.voiceAudio.currentTime = 0;
    this.voiceAudio.play().catch(() => {
      // If play fails, restore immediately
      this.handleVoiceError();
    });
  }

  private handleVoiceEnded = () => {
    this.isVoicePlaying = false;
    this.fadeVolume(this.mainAudio.volume, 1.0);
    this.onVoiceEnd?.();
  };

  private handleVoiceError = () => {
    this.isVoicePlaying = false;
    this.mainAudio.volume = 1.0;
    this.targetVolume = 1.0;
    this.onVoiceEnd?.();
  };

  private fadeVolume(from: number, to: number) {
    if (this.fadeRafId) {
      cancelAnimationFrame(this.fadeRafId);
    }
    this.targetVolume = to;
    const startTime = performance.now();
    const duration = this.fadeDurationMs;

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      // Simple ease-in-out
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      this.mainAudio.volume = Math.max(0, Math.min(1, from + (to - from) * eased));

      if (t < 1) {
        this.fadeRafId = requestAnimationFrame(step);
      } else {
        this.mainAudio.volume = Math.max(0, Math.min(1, to));
        this.fadeRafId = null;
      }
    };

    this.fadeRafId = requestAnimationFrame(step);
  }
}
