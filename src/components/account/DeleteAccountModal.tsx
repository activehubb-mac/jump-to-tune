import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { supabase } from "@/integrations/supabase/client";

interface DeleteAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteAccountModal({ open, onOpenChange }: DeleteAccountModalProps) {
  const { user, signOut } = useAuth();
  const { showFeedback } = useFeedbackSafe();
  const navigate = useNavigate();
  
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const CONFIRM_PHRASE = "DELETE MY ACCOUNT";
  const isConfirmValid = confirmText === CONFIRM_PHRASE;

  const handleDeleteAccount = async () => {
    if (!user || !isConfirmValid) return;

    setIsDeleting(true);

    try {
      // Show progress feedback
      showFeedback({
        type: "warning",
        title: "Deleting Account",
        message: "Please wait while we remove your data...",
      });

      // Get current session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error("No active session");
      }

      // Call the edge function to delete all user data
      const response = await supabase.functions.invoke("delete-account", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to delete account");
      }

      // Close the modal
      onOpenChange(false);

      // Show success feedback
      showFeedback({
        type: "success",
        title: "Account Deleted",
        message: "Your account and all associated data have been permanently removed.",
        autoClose: true,
        autoCloseDelay: 5000,
      });

      // Sign out and redirect to home
      await signOut();
      navigate("/");

    } catch (error) {
      console.error("Delete account error:", error);
      
      showFeedback({
        type: "error",
        title: "Deletion Failed",
        message: error instanceof Error 
          ? error.message 
          : "Could not delete your account. Please try again or contact support.",
      });
    } finally {
      setIsDeleting(false);
      setConfirmText("");
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isDeleting) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setConfirmText("");
      }
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="bg-card border-destructive/50">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Delete Account Permanently
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              This action is <strong className="text-foreground">irreversible</strong>. 
              All your data will be permanently deleted, including:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
              <li>Your profile and personal information</li>
              <li>All uploaded tracks and music</li>
              <li>Your collection and purchases</li>
              <li>Follows, likes, and bookmarks</li>
              <li>Wallet balance and transaction history</li>
              <li>Subscription and payment records</li>
              <li>Label roster associations (if applicable)</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4 space-y-3">
          <Label htmlFor="confirm-delete" className="text-sm font-medium">
            Type <span className="font-mono text-destructive">{CONFIRM_PHRASE}</span> to confirm:
          </Label>
          <Input
            id="confirm-delete"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type the confirmation phrase"
            className="border-destructive/30 focus:border-destructive"
            disabled={isDeleting}
            autoComplete="off"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteAccount}
            disabled={!isConfirmValid || isDeleting}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete My Account"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
