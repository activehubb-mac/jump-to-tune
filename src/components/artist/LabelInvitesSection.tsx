import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Check, X, Loader2 } from "lucide-react";
import { useLabelInvites } from "@/hooks/useLabelInvites";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";

export function LabelInvitesSection() {
  const { invites, isLoading, acceptInvite, declineInvite } = useLabelInvites();
  const { showFeedback } = useFeedbackSafe();

  const handleAccept = async (rosterId: string, labelName: string) => {
    try {
      await acceptInvite.mutateAsync(rosterId);
      showFeedback({
        type: "success",
        title: "Invitation Accepted",
        message: `You're now part of ${labelName || "the label"}'s roster!`,
        autoClose: true,
      });
    } catch (error) {
      console.error("Failed to accept invite:", error);
      showFeedback({
        type: "error",
        title: "Failed",
        message: "Could not accept the invitation. Please try again.",
        autoClose: true,
      });
    }
  };

  const handleDecline = async (rosterId: string) => {
    try {
      await declineInvite.mutateAsync(rosterId);
      showFeedback({
        type: "info",
        title: "Invitation Declined",
        message: "The label invitation has been declined.",
        autoClose: true,
      });
    } catch (error) {
      console.error("Failed to decline invite:", error);
      showFeedback({
        type: "error",
        title: "Failed",
        message: "Could not decline the invitation. Please try again.",
        autoClose: true,
      });
    }
  };

  if (isLoading) {
    return null;
  }

  if (invites.length === 0) {
    return null;
  }

  return (
    <div className="glass-card p-6 mb-6 border-accent/30">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
          <Building2 className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Label Invitations</h2>
          <p className="text-sm text-muted-foreground">
            {invites.length} pending {invites.length === 1 ? "invitation" : "invitations"}
          </p>
        </div>
        <Badge className="ml-auto bg-accent/20 text-accent border-accent/30">
          {invites.length} New
        </Badge>
      </div>

      <div className="space-y-3">
        {invites.map((invite) => (
          <div
            key={invite.id}
            className="flex items-center gap-4 p-4 rounded-lg bg-muted/30"
          >
            <Avatar className="w-12 h-12">
              <AvatarImage src={invite.label?.avatar_url || undefined} />
              <AvatarFallback className="bg-accent/20 text-accent">
                {invite.label?.display_name?.[0]?.toUpperCase() || "L"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">
                {invite.label?.display_name || "Unknown Label"}
              </p>
              <p className="text-sm text-muted-foreground">
                Wants you to join their roster
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-destructive/50 text-destructive hover:bg-destructive/10"
                onClick={() => handleDecline(invite.id)}
                disabled={declineInvite.isPending}
              >
                {declineInvite.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
              </Button>
              <Button
                size="sm"
                className="bg-accent hover:bg-accent/90"
                onClick={() => handleAccept(invite.id, invite.label?.display_name || "")}
                disabled={acceptInvite.isPending}
              >
                {acceptInvite.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Accept
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
