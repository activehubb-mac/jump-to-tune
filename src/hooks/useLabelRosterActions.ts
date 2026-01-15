import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useLabelRosterActions() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  // Get count of unique artists with at least one uploaded track
  const { data: activeArtistCount = 0 } = useQuery({
    queryKey: ["label-active-artist-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      const { data: tracks } = await supabase
        .from("tracks")
        .select("artist_id")
        .eq("label_id", user.id);

      if (!tracks) return 0;

      const uniqueArtists = new Set(tracks.map((t) => t.artist_id));
      return uniqueArtists.size;
    },
    enabled: !!user?.id,
  });

  // Get all roster artist IDs (for excluding from search)
  const { data: rosterArtistIds = [] } = useQuery({
    queryKey: ["label-roster-ids", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data } = await supabase
        .from("label_roster")
        .select("artist_id")
        .eq("label_id", user.id)
        .in("status", ["pending", "active"]);

      return data?.map((r) => r.artist_id) ?? [];
    },
    enabled: !!user?.id,
  });

  // Send invitation to an artist
  const sendInvite = useMutation({
    mutationFn: async (artistId: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Insert into label_roster with pending status
      const { data: roster, error: rosterError } = await supabase
        .from("label_roster")
        .insert({
          label_id: user.id,
          artist_id: artistId,
          status: "pending",
        })
        .select()
        .single();

      if (rosterError) throw rosterError;

      // Create notification for the artist
      const labelName = profile?.display_name || "A label";
      const { error: notifError } = await supabase.from("notifications").insert({
        user_id: artistId,
        type: "label_invite",
        title: "Label Invitation",
        message: `${labelName} wants to add you to their roster`,
        metadata: {
          label_id: user.id,
          roster_id: roster.id,
          label_name: labelName,
        },
      });

      if (notifError) {
        console.error("Failed to create notification:", notifError);
        // Don't throw - the invite was still sent successfully
      }

      // Send email notification via edge function
      try {
        const { error: emailError } = await supabase.functions.invoke("send-invite-email", {
          body: {
            artistId,
            labelId: user.id,
            labelName,
          },
        });

        if (emailError) {
          console.error("Failed to send invite email:", emailError);
          // Don't throw - the invite was still created successfully
        }
      } catch (emailErr) {
        console.error("Email send error:", emailErr);
        // Non-blocking error
      }

      return roster;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["label-roster"] });
      queryClient.invalidateQueries({ queryKey: ["label-roster-ids"] });
    },
  });

  // Remove artist from roster
  const removeArtist = useMutation({
    mutationFn: async (rosterId: string) => {
      if (!user?.id) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("label_roster")
        .update({ status: "removed" })
        .eq("id", rosterId)
        .eq("label_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["label-roster"] });
      queryClient.invalidateQueries({ queryKey: ["label-roster-ids"] });
      queryClient.invalidateQueries({ queryKey: ["label-stats"] });
    },
  });

  const ARTIST_LIMIT = 5;
  const canAddMoreArtists = activeArtistCount < ARTIST_LIMIT;

  return {
    sendInvite,
    removeArtist,
    activeArtistCount,
    rosterArtistIds,
    canAddMoreArtists,
    artistLimit: ARTIST_LIMIT,
  };
}
