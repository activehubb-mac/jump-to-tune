import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useReports, ReportReason, ReportedType } from '@/hooks/useReports';
import { Flag, Loader2 } from 'lucide-react';

interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportedType: ReportedType;
  reportedId: string;
  reportedName?: string;
}

const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
  { value: 'inappropriate', label: 'Inappropriate Content', description: 'Offensive, explicit, or harmful content' },
  { value: 'copyright', label: 'Copyright Violation', description: 'Unauthorized use of copyrighted material' },
  { value: 'spam', label: 'Spam', description: 'Unwanted promotional or repetitive content' },
  { value: 'harassment', label: 'Harassment', description: 'Bullying, threats, or targeted harassment' },
  { value: 'other', label: 'Other', description: 'Something else not listed above' },
];

export function ReportModal({
  open,
  onOpenChange,
  reportedType,
  reportedId,
  reportedName,
}: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [description, setDescription] = useState('');
  const { createReport } = useReports();

  const handleSubmit = async () => {
    if (!reason) return;

    await createReport.mutateAsync({
      reported_type: reportedType,
      reported_id: reportedId,
      reason,
      description: description.trim() || undefined,
    });

    setReason('');
    setDescription('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-destructive" />
            Report {reportedType === 'track' ? 'Track' : 'User'}
          </DialogTitle>
          <DialogDescription>
            {reportedName ? (
              <>Report "{reportedName}" for violating community guidelines</>
            ) : (
              <>Help us keep the platform safe by reporting violations</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label>Reason for report</Label>
            <RadioGroup value={reason} onValueChange={(v) => setReason(v as ReportReason)}>
              {REPORT_REASONS.map((r) => (
                <div key={r.value} className="flex items-start space-x-3">
                  <RadioGroupItem value={r.value} id={r.value} className="mt-1" />
                  <div className="grid gap-0.5">
                    <Label htmlFor={r.value} className="cursor-pointer font-medium">
                      {r.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">{r.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Additional details (optional)</Label>
            <Textarea
              id="description"
              placeholder="Provide any additional context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!reason || createReport.isPending}
          >
            {createReport.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Report'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
