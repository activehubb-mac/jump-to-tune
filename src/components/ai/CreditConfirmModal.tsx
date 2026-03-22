import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Zap } from "lucide-react";

interface CreditConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  creditCost: number;
  currentCredits: number;
  summary?: string;
}

export function CreditConfirmModal({
  open,
  onOpenChange,
  onConfirm,
  creditCost,
  currentCredits,
  summary,
}: CreditConfirmModalProps) {
  const remaining = currentCredits - creditCost;
  const canAfford = remaining >= 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-card border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-foreground">
            <Zap className="h-5 w-5 text-primary" />
            Confirm Credit Usage
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 pt-2">
              {summary && (
                <p className="text-sm text-muted-foreground">{summary}</p>
              )}
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cost</span>
                  <span className="font-semibold text-foreground">{creditCost} credits</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current balance</span>
                  <span className="text-foreground">{currentCredits} credits</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between text-sm">
                  <span className="text-muted-foreground">Remaining after</span>
                  <span className={`font-semibold ${canAfford ? "text-emerald-500" : "text-destructive"}`}>
                    {remaining} credits
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Credits are deducted before generation begins. Refunded automatically if generation fails.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={!canAfford}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Confirm ({creditCost} credits)
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
