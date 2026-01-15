import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, Loader2, Music, AlertCircle, CheckCircle2 } from "lucide-react";
import { useArtistSearch } from "@/hooks/useArtistSearch";
import { useLabelRosterActions } from "@/hooks/useLabelRosterActions";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";

interface AddArtistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddArtistModal({ open, onOpenChange }: AddArtistModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sentInvites, setSentInvites] = useState<Set<string>>(new Set());
  const { showFeedback } = useFeedbackSafe();
  
  const {
    sendInvite,
    rosterArtistIds,
    activeArtistCount,
    canAddMoreArtists,
    artistLimit,
  } = useLabelRosterActions();

  const { data: searchResults = [], isLoading: isSearching } = useArtistSearch(
    searchQuery,
    rosterArtistIds
  );

  const handleSendInvite = async (artistId: string, artistName: string) => {
    try {
      await sendInvite.mutateAsync(artistId);
      setSentInvites((prev) => new Set(prev).add(artistId));
      showFeedback({
        type: "success",
        title: "Invitation Sent",
        message: `${artistName || "Artist"} has been invited to join your roster.`,
        autoClose: true,
      });
    } catch (error) {
      console.error("Failed to send invite:", error);
      showFeedback({
        type: "error",
        title: "Failed to Send Invite",
        message: "Something went wrong. Please try again.",
        autoClose: true,
      });
    }
  };

  const handleClose = () => {
    setSearchQuery("");
    setSentInvites(new Set());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-accent" />
            Add Artist to Roster
          </DialogTitle>
          <DialogDescription>
            Search for artists to invite to your label. They must have a JumTunes artist account.
          </DialogDescription>
        </DialogHeader>

        {/* Artist Limit Indicator */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <span className="text-sm text-muted-foreground">Artists with uploads</span>
          <Badge variant={canAddMoreArtists ? "secondary" : "destructive"}>
            {activeArtistCount} / {artistLimit}
          </Badge>
        </div>

        {!canAddMoreArtists && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-destructive">Artist limit reached</p>
              <p className="text-muted-foreground">
                You've reached the 5-artist limit. Upgrade your plan to add more artists.
              </p>
            </div>
          </div>
        )}

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search artists by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Search Results */}
        <div className="min-h-[200px] max-h-[300px] overflow-y-auto">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
            </div>
          ) : searchQuery.length < 2 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Music className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Type at least 2 characters to search</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No artists found matching "{searchQuery}"</p>
              <p className="text-xs mt-1">Make sure they have a JumTunes artist account</p>
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.map((artist) => {
                const isInvited = sentInvites.has(artist.id);
                return (
                  <div
                    key={artist.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={artist.avatar_url || undefined} />
                      <AvatarFallback className="bg-accent/20 text-accent">
                        {artist.display_name?.[0]?.toUpperCase() || "A"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {artist.display_name || "Unknown Artist"}
                      </p>
                    </div>
                    {isInvited ? (
                      <Badge variant="outline" className="gap-1 text-green-500 border-green-500/50">
                        <CheckCircle2 className="w-3 h-3" />
                        Invited
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleSendInvite(artist.id, artist.display_name || "")}
                        disabled={sendInvite.isPending}
                      >
                        {sendInvite.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Invite"
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
