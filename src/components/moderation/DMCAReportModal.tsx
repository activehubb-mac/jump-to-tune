import { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useDMCAReport } from '@/hooks/useDMCAReport';
import { Flag, Loader2 } from 'lucide-react';

interface DMCAReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentUrl: string;
  contentName?: string;
}

const REASONS = [
  'Copyright infringement',
  'Unauthorized use',
  'Other',
];

export function DMCAReportModal({
  open,
  onOpenChange,
  contentUrl,
  contentName,
}: DMCAReportModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const { submitReport, isPending } = useDMCAReport();

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !reason) return;

    const success = await submitReport({
      name: name.trim(),
      email: email.trim(),
      content_url: contentUrl,
      reason,
      description: description.trim() || undefined,
    });

    if (success) {
      setName('');
      setEmail('');
      setReason('');
      setDescription('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-5 h-5 text-destructive" />
            Report Content
          </DialogTitle>
          <DialogDescription>
            {contentName
              ? <>Report "{contentName}" for a policy violation</>
              : <>Help us keep the platform safe by reporting violations</>}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="dmca-name">Your Name *</Label>
            <Input
              id="dmca-name"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dmca-email">Your Email *</Label>
            <Input
              id="dmca-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Content URL</Label>
            <Input value={contentUrl} readOnly className="text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <Label>Reason *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dmca-desc">Description</Label>
            <Textarea
              id="dmca-desc"
              placeholder="Provide details about the violation..."
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
            disabled={!name.trim() || !email.trim() || !reason || isPending}
          >
            {isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
            ) : (
              'Submit Report'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
