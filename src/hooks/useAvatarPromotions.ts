import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AvatarPromotion {
  id: string;
  artist_id: string;
  track_id: string | null;
  promotion_type: "floating" | "stage_performer" | "global_background";
  animation_type: "perform" | "walk" | "dj_mix" | "dance";
  exposure_zone: "home" | "discovery" | "trending" | "global";
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string;
  // Joined
  artist?: { display_name: string | null; avatar_url: string | null } | null;
  track?: { title: string; cover_art_url: string | null } | null;
}

/** Fetch active promotions for rendering (public) */
export function useActiveAvatarPromotions(zone?: string) {
  return useQuery({
    queryKey: ["avatar-promotions-active", zone],
    queryFn: async () => {
      const { data: promos, error } = await supabase
        .from("avatar_promotions" as any)
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      if (!promos || promos.length === 0) return [] as AvatarPromotion[];

      // Filter by zone
      const filtered = (promos as any[]).filter(
        (p) => !zone || p.exposure_zone === "global" || p.exposure_zone === zone
      );

      // Fetch artist profiles
      const artistIds = [...new Set(filtered.map((p) => p.artist_id))];
      const trackIds = filtered.map((p) => p.track_id).filter(Boolean);

      const [{ data: artists }, { data: tracks }] = await Promise.all([
        supabase.from("profiles_public").select("id, display_name, avatar_url").in("id", artistIds),
        trackIds.length > 0
          ? supabase.from("tracks").select("id, title, cover_art_url").in("id", trackIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const artistMap = new Map((artists || []).map((a) => [a.id, a]));
      const trackMap = new Map((tracks || []).map((t) => [t.id, t]));

      return filtered.map((p) => ({
        ...p,
        artist: artistMap.get(p.artist_id) || null,
        track: p.track_id ? trackMap.get(p.track_id) || null : null,
      })) as AvatarPromotion[];
    },
    staleTime: 60_000,
  });
}

/** Admin: fetch ALL promotions */
export function useAdminAvatarPromotions() {
  return useQuery({
    queryKey: ["avatar-promotions-admin"],
    queryFn: async () => {
      const { data: promos, error } = await supabase
        .from("avatar_promotions" as any)
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!promos || promos.length === 0) return [] as AvatarPromotion[];

      const artistIds = [...new Set((promos as any[]).map((p) => p.artist_id))];
      const trackIds = (promos as any[]).map((p) => p.track_id).filter(Boolean);

      const [{ data: artists }, { data: tracks }] = await Promise.all([
        supabase.from("profiles_public").select("id, display_name, avatar_url").in("id", artistIds),
        trackIds.length > 0
          ? supabase.from("tracks").select("id, title, cover_art_url").in("id", trackIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const artistMap = new Map((artists || []).map((a) => [a.id, a]));
      const trackMap = new Map((tracks || []).map((t) => [t.id, t]));

      return (promos as any[]).map((p) => ({
        ...p,
        artist: artistMap.get(p.artist_id) || null,
        track: p.track_id ? trackMap.get(p.track_id) || null : null,
      })) as AvatarPromotion[];
    },
  });
}

/** Admin: create promotion */
export function useCreateAvatarPromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      artist_id: string;
      track_id?: string;
      promotion_type: string;
      animation_type: string;
      exposure_zone: string;
      starts_at?: string;
      ends_at?: string;
      created_by: string;
    }) => {
      const { data, error } = await supabase
        .from("avatar_promotions" as any)
        .insert(params as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["avatar-promotions-admin"] });
      qc.invalidateQueries({ queryKey: ["avatar-promotions-active"] });
    },
  });
}

/** Admin: update promotion */
export function useUpdateAvatarPromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; [key: string]: any }) => {
      const { error } = await supabase
        .from("avatar_promotions" as any)
        .update(updates as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["avatar-promotions-admin"] });
      qc.invalidateQueries({ queryKey: ["avatar-promotions-active"] });
    },
  });
}

/** Admin: delete promotion */
export function useDeleteAvatarPromotion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("avatar_promotions" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["avatar-promotions-admin"] });
      qc.invalidateQueries({ queryKey: ["avatar-promotions-active"] });
    },
  });
}
