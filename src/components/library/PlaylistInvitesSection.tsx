import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Check, X, ListMusic, Loader2 } from "lucide-react";
import { usePlaylistInvites } from "@/hooks/usePlaylistCollaborators";
import { usePlaylistCollaborators } from "@/hooks/usePlaylistCollaborators";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";

export function PlaylistInvitesSection() {
  const { invites, isLoading, declineInvite } = usePlaylistInvites();
  const { showFeedback } = useFeedbackSafe();

  if (isLoading || invites.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">
        Playlist Invites
      </h3>
      <div className="space-y-2">
        <AnimatePresence>
          {invites.map((invite) => (
            <InviteCard
              key={invite.id}
              invite={invite}
              onDecline={async () => {
                try {
                  await declineInvite.mutateAsync(invite.id);
                  showFeedback({
                    type: "info",
                    title: "Invite declined",
                    message: `You declined the invite to "${invite.playlist?.name}"`,
                  });
                } catch (error) {
                  showFeedback({
                    type: "error",
                    title: "Error",
                    message: "Failed to decline invite",
                  });
                }
              }}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface InviteCardProps {
  invite: any;
  onDecline: () => void;
}

function InviteCard({ invite, onDecline }: InviteCardProps) {
  const { acceptInvite } = usePlaylistCollaborators(invite.playlist_id);
  const { showFeedback } = useFeedbackSafe();
  
  const handleAccept = async () => {
    try {
      await acceptInvite.mutateAsync(invite.id);
      showFeedback({
        type: "success",
        title: "Invite accepted!",
        message: `You can now collaborate on "${invite.playlist?.name}"`,
      });
    } catch (error) {
      showFeedback({
        type: "error",
        title: "Error",
        message: "Failed to accept invite",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20"
    >
      {/* Playlist cover */}
      <div className="w-12 h-12 rounded bg-muted/50 flex-shrink-0 overflow-hidden">
        {invite.playlist?.cover_image_url ? (
          <img
            src={invite.playlist.cover_image_url}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ListMusic className="w-5 h-5 text-muted-foreground/50" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{invite.playlist?.name || "Unknown Playlist"}</p>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Avatar className="w-4 h-4">
            <AvatarImage src={invite.inviter?.avatar_url || undefined} />
            <AvatarFallback className="text-[8px]">
              {(invite.inviter?.display_name || "?")[0]}
            </AvatarFallback>
          </Avatar>
          <span className="truncate">
            {invite.inviter?.display_name || "Someone"} invited you
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-destructive"
          onClick={onDecline}
        >
          <X className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          className="h-8 w-8"
          onClick={handleAccept}
          disabled={acceptInvite.isPending}
        >
          {acceptInvite.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
        </Button>
      </div>
    </motion.div>
  );
}
