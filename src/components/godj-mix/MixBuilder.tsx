import { useState, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGoDJSegments, useAddSegment, useUpdateSegment, useRemoveSegment, useReorderSegments } from "@/hooks/useGoDJSegments";
import { useGoDJVoiceClips } from "@/hooks/useGoDJVoiceClips";
import { GoDJSession } from "@/hooks/useGoDJSessions";
import { TrackSegmentBlock } from "./TrackSegmentBlock";
import { VoiceSegmentBlock } from "./VoiceSegmentBlock";
import { VoiceRecorder } from "./VoiceRecorder";
import { MixPreviewPlayer } from "./MixPreviewPlayer";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Search, Plus, Music, Mic } from "lucide-react";

interface MixBuilderProps {
  session: GoDJSession;
}

export function MixBuilder({ session }: MixBuilderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedSegmentId, setHighlightedSegmentId] = useState<string | null>(null);

  const { data: segments = [] } = useGoDJSegments(session.id);
  const { data: voiceClips = [] } = useGoDJVoiceClips(session.id);
  const addSegment = useAddSegment();
  const updateSegment = useUpdateSegment();
  const removeSegment = useRemoveSegment();
  const reorderSegments = useReorderSegments();

  // Search JumTunes tracks
  const { data: searchResults = [] } = useQuery({
    queryKey: ["track-search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const { data } = await supabase
        .from("tracks")
        .select("id, title, artist_id, cover_art_url, audio_url, duration")
        .ilike("title", `%${searchQuery}%`)
        .eq("is_draft", false)
        .limit(20);
      return data || [];
    },
    enabled: searchQuery.trim().length >= 2,
  });

  // Fetch profiles for search results artists
  const artistIds = [...new Set(searchResults.map((t: any) => t.artist_id))];
  const { data: artistProfiles = {} } = useQuery({
    queryKey: ["track-artists", artistIds.join(",")],
    queryFn: async () => {
      if (!artistIds.length) return {};
      const { data } = await supabase.from("profiles").select("id, display_name").in("id", artistIds);
      const map: Record<string, string> = {};
      data?.forEach((p: any) => { map[p.id] = p.display_name || "Unknown"; });
      return map;
    },
    enabled: artistIds.length > 0,
  });

  // Fetch track data for existing segments
  const segmentTrackIds = segments.filter(s => s.segment_type === "track" && s.track_id).map(s => s.track_id!);
  const { data: segmentTracks = {} } = useQuery({
    queryKey: ["segment-tracks", segmentTrackIds.join(",")],
    queryFn: async () => {
      if (!segmentTrackIds.length) return {};
      const { data } = await supabase
        .from("tracks")
        .select("id, title, artist_id, cover_art_url, audio_url, duration")
        .in("id", segmentTrackIds);
      
      // Also fetch artist names
      const aids = [...new Set((data || []).map((t: any) => t.artist_id))];
      const { data: profiles } = aids.length
        ? await supabase.from("profiles").select("id, display_name").in("id", aids)
        : { data: [] };
      const nameMap: Record<string, string> = {};
      profiles?.forEach((p: any) => { nameMap[p.id] = p.display_name || "Unknown"; });

      const map: Record<string, { title: string; artist_name: string; cover_art_url: string | null; audio_url: string; duration: number | null }> = {};
      data?.forEach((t: any) => {
        map[t.id] = {
          title: t.title,
          artist_name: nameMap[t.artist_id] || "Unknown",
          cover_art_url: t.cover_art_url,
          audio_url: t.audio_url,
          duration: t.duration,
        };
      });
      return map;
    },
    enabled: segmentTrackIds.length > 0,
  });

  // Voice clip data map
  const voiceClipMap = useMemo(() => {
    const map: Record<string, { label: string; duration_sec: number; file_url: string }> = {};
    voiceClips.forEach(c => { map[c.id] = { label: c.label, duration_sec: c.duration_sec, file_url: c.file_url }; });
    return map;
  }, [voiceClips]);

  const handleAddTrack = useCallback(async (track: any) => {
    const nextIndex = segments.length;
    await addSegment.mutateAsync({
      session_id: session.id,
      segment_type: "track",
      order_index: nextIndex,
      track_id: track.id,
      trim_start_sec: 0,
      trim_end_sec: null,
      fade_in_sec: 0,
      fade_out_sec: 0,
    });
  }, [segments.length, session.id, addSegment]);

  const handleAddVoiceClip = useCallback(async (clipId: string) => {
    const nextIndex = segments.length;
    await addSegment.mutateAsync({
      session_id: session.id,
      segment_type: "voice",
      order_index: nextIndex,
      voice_clip_id: clipId,
    });
  }, [segments.length, session.id, addSegment]);

  const handleMoveSegment = useCallback(async (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= segments.length) return;

    const reordered = segments.map((s, i) => {
      if (i === index) return { id: s.id, order_index: newIndex };
      if (i === newIndex) return { id: s.id, order_index: index };
      return { id: s.id, order_index: i };
    });

    await reorderSegments.mutateAsync({ session_id: session.id, segments: reordered });
  }, [segments, session.id, reorderSegments]);

  const isProMode = session.mode === "pro";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Track Picker + Voice Recorder */}
      <div className="space-y-6 lg:col-span-1">
        {/* Track Search */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Music className="w-4 h-4" />
            Add Tracks
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search JumTunes tracks…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          {searchResults.length > 0 && (
            <div className="max-h-60 overflow-y-auto space-y-1 rounded-lg border border-border bg-card p-1">
              {searchResults.map((track: any) => (
                <button
                  key={track.id}
                  onClick={() => handleAddTrack(track)}
                  className="w-full flex items-center gap-3 p-2 rounded hover:bg-accent/50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded bg-muted overflow-hidden shrink-0">
                    {track.cover_art_url ? (
                      <img src={track.cover_art_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{track.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {artistProfiles[track.artist_id] || "Unknown"}
                    </p>
                  </div>
                  <Plus className="w-4 h-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Voice Recorder */}
        <div id="voice-recorder-section">
          <VoiceRecorder sessionId={session.id} onClipSaved={(clipId) => handleAddVoiceClip(clipId)} />
        </div>

        {/* Add voice clip to timeline */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Mic className="w-4 h-4" />
            Insert Voice to Timeline
          </h3>
          {voiceClips.length === 0 ? (
            <p className="text-xs text-muted-foreground px-2">Record a voice drop above, then insert it here</p>
          ) : (
            <div className="space-y-1">
              {voiceClips.map(clip => {
                const alreadyAdded = segments.some(s => s.voice_clip_id === clip.id);
                return (
                  <button
                    key={clip.id}
                    onClick={() => !alreadyAdded && handleAddVoiceClip(clip.id)}
                    disabled={alreadyAdded}
                    className={`w-full flex items-center gap-2 p-2 rounded text-left text-sm transition-colors ${
                      alreadyAdded
                        ? "opacity-50 cursor-not-allowed bg-muted/20"
                        : "hover:bg-accent/50"
                    }`}
                  >
                    <Mic className="w-3 h-3 text-primary shrink-0" />
                    <span className="flex-1 truncate">{clip.label}</span>
                    <span className="text-xs text-muted-foreground">{clip.duration_sec}s</span>
                    {!alreadyAdded && <Plus className="w-3 h-3 text-muted-foreground" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right: Timeline + Preview */}
      <div className="space-y-6 lg:col-span-2">
        {/* Preview Player */}
        <div className="glass-card p-4">
          <MixPreviewPlayer
            segments={segments}
            trackData={Object.fromEntries(
              Object.entries(segmentTracks).map(([k, v]) => [k, { title: v.title, audio_url: v.audio_url, duration: v.duration }])
            )}
            voiceClipData={voiceClipMap}
            onSegmentHighlight={setHighlightedSegmentId}
          />
        </div>

        {/* Timeline */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            Timeline ({segments.length} segments)
          </h3>

          {segments.length === 0 ? (
            <div className="border border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
              <Music className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Search for tracks on the left, or record a voice drop to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {segments.map((seg, i) =>
                seg.segment_type === "track" ? (
                  <TrackSegmentBlock
                    key={seg.id}
                    segment={seg}
                    trackInfo={seg.track_id ? segmentTracks[seg.track_id] : undefined}
                    isFirst={i === 0}
                    isLast={i === segments.length - 1}
                    isHighlighted={highlightedSegmentId === seg.id}
                    onUpdate={(updates) => updateSegment.mutate({ id: seg.id, session_id: session.id, ...updates })}
                    onMoveUp={() => handleMoveSegment(i, "up")}
                    onMoveDown={() => handleMoveSegment(i, "down")}
                    onRemove={() => removeSegment.mutate({ id: seg.id, session_id: session.id })}
                  />
                ) : (
                  <VoiceSegmentBlock
                    key={seg.id}
                    segment={seg}
                    clipInfo={seg.voice_clip_id ? voiceClipMap[seg.voice_clip_id] : undefined}
                    isFirst={i === 0}
                    isLast={i === segments.length - 1}
                    isHighlighted={highlightedSegmentId === seg.id}
                    isProMode={isProMode}
                    onUpdate={(updates) => updateSegment.mutate({ id: seg.id, session_id: session.id, ...updates })}
                    onMoveUp={() => handleMoveSegment(i, "up")}
                    onMoveDown={() => handleMoveSegment(i, "down")}
                    onRemove={() => removeSegment.mutate({ id: seg.id, session_id: session.id })}
                  />
                )
              )}
            </div>
          )}

          {/* Quick-record shortcut at bottom of timeline */}
          {segments.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 mt-2"
              onClick={() => {
                document.getElementById("voice-recorder-section")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <Mic className="w-4 h-4" />
              + Voice Drop
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
