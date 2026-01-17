import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { InfoTooltip } from './InfoTooltip';

interface ExplicitToggleProps {
  isExplicit: boolean;
  onChange: (isExplicit: boolean) => void;
}

const ExplicitToggle = ({ isExplicit, onChange }: ExplicitToggleProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Label htmlFor="explicit-toggle">Explicit Content</Label>
        <InfoTooltip content="Mark this track as explicit if it contains strong language, violence, or adult themes" />
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          {isExplicit ? 'Explicit' : 'Clean'}
        </span>
        {isExplicit && (
          <Badge variant="destructive" className="text-xs px-1.5 py-0">
            E
          </Badge>
        )}
        <Switch
          id="explicit-toggle"
          checked={isExplicit}
          onCheckedChange={onChange}
        />
      </div>
    </div>
  );
};

export default ExplicitToggle;
