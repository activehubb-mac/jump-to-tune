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
import { AlbumTrackRow, AlbumTrackData } from './AlbumTrackRow';
import { Label } from '@/components/ui/label';
import { InfoTooltip } from './InfoTooltip';

interface AlbumTrackListProps {
  tracks: AlbumTrackData[];
  onChange: (tracks: AlbumTrackData[]) => void;
  disabled?: boolean;
}

export const AlbumTrackList = ({ tracks, onChange, disabled }: AlbumTrackListProps) => {
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

  if (tracks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Label className="text-foreground">Track Order & Details</Label>
        <InfoTooltip content="Drag tracks to reorder. Click the chevron to expand and add karaoke lyrics for individual tracks." />
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
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};
