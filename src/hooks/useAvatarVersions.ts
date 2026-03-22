import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface AvatarVersion {
  id: string;
  identity_id: string;
  avatar_url: string;
  edit_mode: string;
  settings: Record<string, unknown> | null;
  created_at: string;
}

export function useAvatarVersions(identityId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: versions = [], isLoading } = useQuery<AvatarVersion[]>({
    queryKey: ["avatar-versions", identityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("identity_versions" as any)
        .select("id, identity_id, avatar_url, edit_mode, settings, created_at")
        .eq("identity_id", identityId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any[]) ?? [];
    },
    enabled: !!identityId && !!user,
    staleTime: 15000,
  });

  const setVersionAsDefault = async (version: AvatarVersion) => {
    if (!user) return;

    let avatarUrl = version.avatar_url;

    // Upload base64 to storage if needed
    if (avatarUrl.startsWith("data:")) {
      const base64Data = avatarUrl.split(",")[1];
      const byteArray = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      const fileName = `${user.id}/version-${version.id}.png`;
      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(fileName, byteArray, { contentType: "image/png", upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
      avatarUrl = urlData.publicUrl;
    }

    await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl, default_identity_id: version.identity_id } as any)
      .eq("id", user.id);

    queryClient.invalidateQueries({ queryKey: ["default-identity"] });
    queryClient.invalidateQueries({ queryKey: ["avatar-versions"] });
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["avatar-versions", identityId] });
  };

  return { versions, isLoading, setVersionAsDefault, invalidate };
}
