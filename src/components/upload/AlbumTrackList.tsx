import { useRef } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { FileText, Upload, Info } from 'lucide-react';
import { AlbumTrackRow, AlbumTrackData } from './AlbumTrackRow';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { InfoTooltip } from './InfoTooltip';
import { isValidLRC } from '@/lib/lrcParser';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

interface AlbumTrackListProps {
  tracks: AlbumTrackData[];
  onChange: (tracks: AlbumTrackData[]) => void;
  disabled?: boolean;
  excludeArtistId?: string;
}

// Normalize filename for matching (remove extension, lowercase, trim)
const normalizeFilename = (filename: string): string => {
  return filename
    .replace(/\.(lrc|txt)$/i, '')
    .replace(/\.(mp3|wav|flac|m4a)$/i, '')
    .toLowerCase()
    .trim();
};

// Calculate similarity between two strings (simple contains check + position matching)
const calculateSimilarity = (trackTitle: string, lrcFilename: string): number => {
  const normalizedTrack = normalizeFilename(trackTitle);
  const normalizedLrc = normalizeFilename(lrcFilename);
  
  // Exact match
  if (normalizedTrack === normalizedLrc) return 1;
  
  // One contains the other
  if (normalizedTrack.includes(normalizedLrc) || normalizedLrc.includes(normalizedTrack)) {
    return 0.8;
  }
  
  // Check if track number prefix matches (e.g., "01 - Song Name" matches "01 - Song Name")
  const trackNumMatch = normalizedTrack.match(/^(\d+)/);
  const lrcNumMatch = normalizedLrc.match(/^(\d+)/);
  if (trackNumMatch && lrcNumMatch && trackNumMatch[1] === lrcNumMatch[1]) {
    return 0.6;
  }
  
  return 0;
};

export const AlbumTrackList = ({ tracks, onChange, disabled, excludeArtistId }: AlbumTrackListProps) => {
  const bulkLrcInputRef = useRef<HTMLInputElement>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tracks.findIndex((t) => t.id === active.id);
      const newIndex = tracks.findIndex((t) => t.id === over.id);
      
      const reordered = arrayMove(tracks, oldIndex, newIndex).map((track, index) => ({
        ...track,
        trackNumber: index + 1,
      }));
      
      onChange(reordered);
    }
  };

  const handleTrackUpdate = (updatedTrack: AlbumTrackData) => {
    onChange(tracks.map(t => t.id === updatedTrack.id ? updatedTrack : t));
  };

  const handleTrackRemove = (id: string) => {
    const updated = tracks
      .filter(t => t.id !== id)
      .map((t, index) => ({ ...t, trackNumber: index + 1 }));
    onChange(updated);
  };

  const handleBulkLrcImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let matchedCount = 0;
    const updatedTracks = [...tracks];

    for (const file of Array.from(files)) {
      try {
        const text = await file.text();
        
        if (!isValidLRC(text)) {
          continue;
        }

        // Find best matching track
        let bestMatch: { index: number; score: number } | null = null;
        
        for (let i = 0; i < updatedTracks.length; i++) {
          const track = updatedTracks[i];
          const trackFilename = track.file.name;
          const trackTitle = track.title;
          
          // Check similarity against both filename and title
          const filenameScore = calculateSimilarity(trackFilename, file.name);
          const titleScore = calculateSimilarity(trackTitle, file.name);
          const score = Math.max(filenameScore, titleScore);
          
          if (score > 0 && (!bestMatch || score > bestMatch.score)) {
            bestMatch = { index: i, score };
          }
        }

        if (bestMatch && bestMatch.score >= 0.5) {
          updatedTracks[bestMatch.index] = {
            ...updatedTracks[bestMatch.index],
            hasKaraoke: true,
            lyrics: text,
          };
          matchedCount++;
        }
      } catch (err) {
        console.error('Failed to read LRC file:', file.name, err);
      }
    }

    onChange(updatedTracks);
    
    if (matchedCount > 0) {
      toast.success(`Matched ${matchedCount} LRC file${matchedCount > 1 ? 's' : ''} to tracks`);
    } else {
      toast.error('No LRC files could be matched to tracks. Check filenames match track names.');
    }

    if (bulkLrcInputRef.current) {
      bulkLrcInputRef.current.value = '';
    }
  };

  if (tracks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Label className="text-foreground">Track Order & Details</Label>
          <InfoTooltip content="Drag tracks to reorder. Click the chevron to expand and add karaoke lyrics for individual tracks." />
        </div>
        
        {/* Bulk LRC Import */}
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-medium mb-1">How LRC matching works:</p>
                <ul className="text-xs space-y-1 list-disc pl-3">
                  <li>LRC files are matched by comparing filenames to track names</li>
                  <li>Best match: <code className="bg-muted px-1 rounded">song.lrc</code> → <code className="bg-muted px-1 rounded">song.mp3</code></li>
                  <li>Also works with prefixes: <code className="bg-muted px-1 rounded">01 - Song.lrc</code></li>
                  <li>Matching is case-insensitive</li>
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <input
            ref={bulkLrcInputRef}
            type="file"
            accept=".lrc,.txt"
            multiple
            onChange={handleBulkLrcImport}
            className="hidden"
            disabled={disabled}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => bulkLrcInputRef.current?.click()}
            disabled={disabled}
            className="h-8 text-xs"
          >
            <FileText className="w-3.5 h-3.5 mr-1.5" />
            Bulk Import LRC
          </Button>
        </div>
      </div>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={tracks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {tracks.map((track) => (
              <AlbumTrackRow
                key={track.id}
                track={track}
                onUpdate={handleTrackUpdate}
                onRemove={handleTrackRemove}
                disabled={disabled}
                excludeArtistId={excludeArtistId}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
