/**
 * useDefaultIdentity — returns the user's default AI identity (if set)
 * and exposes a setter to persist it on profiles.default_identity_id.
 */
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DefaultIdentity {
  identityId: string | null;
  avatarUrl: string | null;
  visualTheme: string | null;
  settings: Record<string, unknown> | null;
  artistName: string | null;
  bio: string | null;
}

export function useDefaultIdentity() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<DefaultIdentity>({
    queryKey: ["default-identity", user?.id],
    queryFn: async () => {
      // Step 1: get the default_identity_id from profiles
      const { data: profile, error: pErr } = await supabase
        .from("profiles")
        .select("default_identity_id")
        .eq("id", user!.id)
        .single();

      if (pErr || !profile?.default_identity_id) {
        return { identityId: null, avatarUrl: null, visualTheme: null, settings: null };
      }

      // Step 2: fetch the identity row
      const { data: identity, error: iErr } = await supabase
        .from("artist_identities")
        .select("id, avatar_url, visual_theme, settings, bio, name_suggestions")
        .eq("id", profile.default_identity_id)
        .single();

      if (iErr || !identity) {
        return { identityId: null, avatarUrl: null, visualTheme: null, settings: null, artistName: null, bio: null };
      }

      return {
        identityId: identity.id,
        avatarUrl: identity.avatar_url,
        visualTheme: identity.visual_theme,
        settings: identity.settings as Record<string, unknown> | null,
        artistName: (identity.name_suggestions as string[] | null)?.[0] ?? null,
        bio: identity.bio ?? null,
      };
    },
    enabled: !!user,
    staleTime: 30000,
  });

  const setDefaultIdentity = async (identityId: string) => {
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ default_identity_id: identityId } as any)
      .eq("id", user.id);
    queryClient.invalidateQueries({ queryKey: ["default-identity", user.id] });
  };

  return {
    identityId: data?.identityId ?? null,
    avatarUrl: data?.avatarUrl ?? null,
    visualTheme: data?.visualTheme ?? null,
    settings: data?.settings ?? null,
    isLoading,
    setDefaultIdentity,
  };
}
