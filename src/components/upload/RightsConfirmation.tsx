import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface RightsConfirmationProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}

const RightsConfirmation = ({ checked, onChange, error }: RightsConfirmationProps) => {
  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3 p-4 border border-border rounded-lg bg-card">
        <Checkbox
          id="rights-confirmation"
          checked={checked}
          onCheckedChange={(value) => onChange(value === true)}
          className="mt-0.5"
        />
        <div className="space-y-1">
          <Label
            htmlFor="rights-confirmation"
            className="text-sm font-medium cursor-pointer"
          >
            I confirm that I own or control all rights to this music
          </Label>
          <p className="text-xs text-muted-foreground">
            By checking this box, you confirm that you have the legal right to upload and
            distribute this content. This includes ownership or proper licensing of all
            musical compositions, sound recordings, samples, and any other copyrighted
            material contained in this track.
          </p>
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};

export default RightsConfirmation;
