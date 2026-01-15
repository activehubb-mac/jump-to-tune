import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface UpgradePlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCount: number;
  limit: number;
}

export function UpgradePlanModal({
  open,
  onOpenChange,
  currentCount,
  limit,
}: UpgradePlanModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="w-16 h-16 mx-auto rounded-full bg-accent/20 flex items-center justify-center mb-4">
            <Crown className="w-8 h-8 text-accent" />
          </div>
          <DialogTitle className="text-center">Artist Limit Reached</DialogTitle>
          <DialogDescription className="text-center">
            You've uploaded music for {currentCount} different artists, reaching your current plan limit of {limit} artists.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="font-medium text-foreground">Current Usage</p>
              <p className="text-sm text-muted-foreground">
                {currentCount} of {limit} artists with uploads
              </p>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p className="mb-2">Upgrade to a custom label plan to:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Manage more than 5 artists</li>
              <li>Access advanced analytics</li>
              <li>Priority support</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button className="w-full bg-accent hover:bg-accent/90" asChild>
            <Link to="/subscription">
              Upgrade Plan
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
