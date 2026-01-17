import { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InfoTooltip } from './InfoTooltip';

const MOOD_SUGGESTIONS = [
  'Chill', 'Energetic', 'Melancholic', 'Uplifting', 'Dark',
  'Romantic', 'Aggressive', 'Dreamy', 'Nostalgic', 'Happy',
  'Sad', 'Powerful', 'Peaceful', 'Intense', 'Groovy'
];

interface MoodTagsInputProps {
  moods: string[];
  onChange: (moods: string[]) => void;
  maxTags?: number;
}

const MoodTagsInput = ({ moods, onChange, maxTags = 5 }: MoodTagsInputProps) => {
  const [inputValue, setInputValue] = useState('');

  const addMood = (mood: string) => {
    const trimmed = mood.trim();
    if (trimmed && moods.length < maxTags && !moods.includes(trimmed)) {
      onChange([...moods, trimmed]);
    }
    setInputValue('');
  };

  const removeMood = (index: number) => {
    onChange(moods.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addMood(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && moods.length > 0) {
      removeMood(moods.length - 1);
    }
  };

  const availableSuggestions = MOOD_SUGGESTIONS.filter(
    (suggestion) => !moods.includes(suggestion)
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label>Moods / Vibes</Label>
        <InfoTooltip content="Add up to 5 mood tags to help listeners discover your track" />
      </div>

      <div className="flex flex-wrap gap-2 min-h-[32px]">
        {moods.map((mood, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="flex items-center gap-1 px-3 py-1"
          >
            {mood}
            <button
              type="button"
              onClick={() => removeMood(index)}
              className="ml-1 hover:text-destructive transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>

      {moods.length < maxTags && (
        <>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a mood and press Enter..."
            className="max-w-xs"
          />

          {availableSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {availableSuggestions.slice(0, 8).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => addMood(suggestion)}
                  className="text-xs px-2 py-1 rounded-full border border-border hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  + {suggestion}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <p className="text-xs text-muted-foreground">
        {moods.length}/{maxTags} tags added
      </p>
    </div>
  );
};

export default MoodTagsInput;
