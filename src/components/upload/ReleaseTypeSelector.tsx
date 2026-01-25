import { Disc, Music2, Album } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ReleaseType = 'single' | 'ep' | 'album';

interface ReleaseTypeSelectorProps {
  value: ReleaseType;
  onChange: (type: ReleaseType) => void;
  disabled?: boolean;
}

const releaseTypes = [
  {
    type: 'single' as ReleaseType,
    label: 'Single',
    description: '1-3 tracks',
    icon: Music2,
  },
  {
    type: 'ep' as ReleaseType,
    label: 'EP',
    description: '4-6 tracks',
    icon: Disc,
  },
  {
    type: 'album' as ReleaseType,
    label: 'Album',
    description: '7+ tracks',
    icon: Album,
  },
];

export const ReleaseTypeSelector = ({ value, onChange, disabled }: ReleaseTypeSelectorProps) => {
  return (
    <div className="glass-card p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">Release Type</h2>
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {releaseTypes.map(({ type, label, description, icon: Icon }) => (
          <button
            key={type}
            type="button"
            onClick={() => !disabled && onChange(type)}
            disabled={disabled}
            className={cn(
              "relative p-4 rounded-xl border-2 transition-all text-left",
              "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/50",
              value === type
                ? "border-primary bg-primary/10"
                : "border-glass-border bg-muted/30",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center mb-3",
              value === type ? "bg-primary/20" : "bg-muted"
            )}>
              <Icon className={cn(
                "w-5 h-5",
                value === type ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <p className="font-medium text-foreground">{label}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
            {value === type && (
              <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
