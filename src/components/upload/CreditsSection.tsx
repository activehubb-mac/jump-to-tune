import { useState, KeyboardEvent } from 'react';
import { ChevronDown, ChevronUp, X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { InfoTooltip } from './InfoTooltip';

export interface TrackCredits {
  writers: string[];
  composers: string[];
  producers: string[];
  engineers: string[];
  displayLabelName: string;
}

interface CreditsSectionProps {
  credits: TrackCredits;
  onChange: (credits: TrackCredits) => void;
}

type CreditRole = 'writers' | 'composers' | 'producers' | 'engineers';

const ROLE_LABELS: Record<CreditRole, { label: string; tooltip: string }> = {
  writers: { label: 'Writers', tooltip: 'Songwriters who wrote the lyrics' },
  composers: { label: 'Composers', tooltip: 'Those who composed the music/melody' },
  producers: { label: 'Producers', tooltip: 'Music producers who created the beat/production' },
  engineers: { label: 'Engineers', tooltip: 'Mixing/mastering engineers' },
};

const CreditsSection = ({ credits, onChange }: CreditsSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValues, setInputValues] = useState<Record<CreditRole, string>>({
    writers: '',
    composers: '',
    producers: '',
    engineers: '',
  });

  const hasAnyCredits =
    credits.writers.length > 0 ||
    credits.composers.length > 0 ||
    credits.producers.length > 0 ||
    credits.engineers.length > 0 ||
    credits.displayLabelName.trim() !== '';

  const addCredit = (role: CreditRole) => {
    const value = inputValues[role].trim();
    if (value && !credits[role].includes(value)) {
      onChange({
        ...credits,
        [role]: [...credits[role], value],
      });
      setInputValues({ ...inputValues, [role]: '' });
    }
  };

  const removeCredit = (role: CreditRole, index: number) => {
    onChange({
      ...credits,
      [role]: credits[role].filter((_, i) => i !== index),
    });
  };

  const handleKeyDown = (role: CreditRole, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCredit(role);
    }
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border border-border rounded-lg">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex items-center justify-between w-full p-4 hover:bg-accent/50 transition-colors rounded-lg"
        >
          <div className="flex items-center gap-2">
            <span className="font-medium">Credits</span>
            <span className="text-xs text-muted-foreground">(Optional)</span>
            {hasAnyCredits && (
              <Badge variant="secondary" className="text-xs">
                Added
              </Badge>
            )}
          </div>
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="px-4 pb-4 space-y-6">
        <p className="text-sm text-muted-foreground">
          Add the people who worked on this track. This information will be displayed publicly.
        </p>

        {(Object.keys(ROLE_LABELS) as CreditRole[]).map((role) => (
          <div key={role} className="space-y-2">
            <div className="flex items-center gap-2">
              <Label>{ROLE_LABELS[role].label}</Label>
              <InfoTooltip content={ROLE_LABELS[role].tooltip} />
            </div>

            {credits[role].length > 0 && (
              <div className="flex flex-wrap gap-2">
                {credits[role].map((name, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {name}
                    <button
                      type="button"
                      onClick={() => removeCredit(role, index)}
                      className="ml-1 hover:text-destructive transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Input
                value={inputValues[role]}
                onChange={(e) =>
                  setInputValues({ ...inputValues, [role]: e.target.value })
                }
                onKeyDown={(e) => handleKeyDown(role, e)}
                placeholder={`Add ${ROLE_LABELS[role].label.toLowerCase()}...`}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => addCredit(role)}
                disabled={!inputValues[role].trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        <div className="space-y-2 pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <Label>Display Label Name</Label>
            <InfoTooltip content="Override the label name shown on this track (leave empty to use your label profile name)" />
          </div>
          <Input
            value={credits.displayLabelName}
            onChange={(e) =>
              onChange({ ...credits, displayLabelName: e.target.value })
            }
            placeholder="Label name (optional)"
            className="max-w-xs"
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default CreditsSection;
