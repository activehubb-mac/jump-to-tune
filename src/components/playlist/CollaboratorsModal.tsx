import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Users, UserPlus, X, Crown, Edit, Eye } from "lucide-react";
import { usePlaylistCollaborators, PlaylistCollaborator } from "@/hooks/usePlaylistCollaborators";
import { useFeedbackSafe } from "@/contexts/FeedbackContext";
import { supabase } from "@/integrations/supabase/client";

interface CollaboratorsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlistId: string;
  playlistName: string;
  isOwner: boolean;
  isCollaborative: boolean;
  onToggleCollaborative: (enabled: boolean) => Promise<void>;
}

export function CollaboratorsModal({
  open,
  onOpenChange,
  playlistId,
  playlistName,
  isOwner,
  isCollaborative,
  onToggleCollaborative,
}: CollaboratorsModalProps) {
  const { collaborators, isLoading, inviteByUserId, removeCollaborator, updateRole } = usePlaylistCollaborators(playlistId);
  const { showFeedback } = useFeedbackSafe();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from("profiles_public")
        .select("id, display_name, avatar_url")
        .ilike("display_name", `%${searchQuery}%`)
        .limit(5);

      if (error) throw error;
      
      // Filter out users who are already collaborators
      const existingIds = collaborators.map(c => c.user_id);
      setSearchResults((data || []).filter(u => !existingIds.includes(u.id)));
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInvite = async (userId: string, displayName: string) => {
    try {
      await inviteByUserId.mutateAsync({ userId, role: "editor" });
      showFeedback({
        type: "success",
        title: "Invited!",
        message: `${displayName || "User"} has been invited to collaborate`,
      });
      setSearchQuery("");
      setSearchResults([]);
    } catch (error: any) {
      showFeedback({
        type: "error",
        title: "Error",
        message: error.message || "Failed to invite collaborator",
      });
    }
  };

  const handleRemove = async (collaborator: PlaylistCollaborator) => {
    try {
      await removeCollaborator.mutateAsync(collaborator.id);
      showFeedback({
        type: "success",
        title: "Removed",
        message: `${collaborator.user?.display_name || "User"} has been removed`,
      });
    } catch (error) {
      showFeedback({
        type: "error",
        title: "Error",
        message: "Failed to remove collaborator",
      });
    }
  };

  const handleToggleCollaborative = async (enabled: boolean) => {
    setIsToggling(true);
    try {
      await onToggleCollaborative(enabled);
      showFeedback({
        type: "success",
        title: enabled ? "Collaborative Mode Enabled" : "Collaborative Mode Disabled",
        message: enabled 
          ? "Others can now add tracks to this playlist" 
          : "Only you can add tracks now",
      });
    } catch (error) {
      showFeedback({
        type: "error",
        title: "Error",
        message: "Failed to update playlist settings",
      });
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Collaborators
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Collaborative toggle */}
          {isOwner && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Collaborative Playlist</Label>
                <p className="text-xs text-muted-foreground">
                  Allow collaborators to add tracks
                </p>
              </div>
              <Switch
                checked={isCollaborative}
                onCheckedChange={handleToggleCollaborative}
                disabled={isToggling}
              />
            </div>
          )}

          {/* Search for users */}
          {isOwner && isCollaborative && (
            <div className="space-y-2">
              <Label>Invite People</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="glass border-glass-border"
                />
                <Button 
                  onClick={handleSearch} 
                  disabled={isSearching}
                  size="icon"
                >
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Search results */}
              {searchResults.length > 0 && (
                <div className="space-y-1 p-2 rounded-lg bg-muted/30">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleInvite(user.id, user.display_name)}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-primary/10 transition-colors text-left"
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar_url || undefined} />
                        <AvatarFallback>
                          {(user.display_name || "?")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="flex-1 truncate">
                        {user.display_name || "Unknown User"}
                      </span>
                      <UserPlus className="w-4 h-4 text-primary" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Collaborators list */}
          <div className="space-y-2">
            <Label>
              {collaborators.length > 0 
                ? `${collaborators.length} Collaborator${collaborators.length > 1 ? "s" : ""}`
                : "No collaborators yet"
              }
            </Label>
            
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : collaborators.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {isCollaborative 
                  ? "Invite friends to add tracks together!" 
                  : "Enable collaborative mode to invite others"
                }
              </p>
            ) : (
              <ScrollArea className="max-h-[200px]">
                <div className="space-y-2">
                  {collaborators.map((collab) => (
                    <div
                      key={collab.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted/20"
                    >
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={collab.user?.avatar_url || undefined} />
                        <AvatarFallback>
                          {(collab.user?.display_name || "?")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {collab.user?.display_name || "Unknown User"}
                        </p>
                        <div className="flex items-center gap-1">
                          {collab.role === "editor" ? (
                            <Edit className="w-3 h-3 text-muted-foreground" />
                          ) : (
                            <Eye className="w-3 h-3 text-muted-foreground" />
                          )}
                          <span className="text-xs text-muted-foreground capitalize">
                            {collab.role}
                          </span>
                          {!collab.accepted_at && (
                            <Badge variant="secondary" className="text-xs ml-1">
                              Pending
                            </Badge>
                          )}
                        </div>
                      </div>

                      {isOwner && (
                        <div className="flex items-center gap-1">
                          <Select
                            value={collab.role}
                            onValueChange={(role: "editor" | "viewer") => 
                              updateRole.mutate({ collaboratorId: collab.id, role })
                            }
                          >
                            <SelectTrigger className="w-24 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="editor">Editor</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleRemove(collab)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
