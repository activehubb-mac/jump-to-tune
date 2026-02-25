import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminHomeSettings {
  new_releases_enabled: boolean;
  new_releases_lookback_days: number;
  new_releases_limit: number;
  trending_enabled: boolean;
  trending_limit: number;
  discover_artists_enabled: boolean;
  discover_artists_limit: number;
  spotify_embed_uri: string;
}

const DEFAULTS: AdminHomeSettings = {
  new_releases_enabled: true,
  new_releases_lookback_days: 7,
  new_releases_limit: 6,
  trending_enabled: true,
  trending_limit: 12,
  discover_artists_enabled: true,
  discover_artists_limit: 6,
  spotify_embed_uri: "",
};

export function useAdminHomeSettings() {
  return useQuery({
    queryKey: ["adminHomeSettings"],
    queryFn: async (): Promise<AdminHomeSettings> => {
      const { data, error } = await supabase
        .from("admin_home_settings" as any)
        .select("setting_key, setting_value");

      if (error) throw error;

      const settings = { ...DEFAULTS };
      if (data) {
        for (const row of data as any[]) {
          const key = row.setting_key as keyof AdminHomeSettings;
          if (key in settings) {
            const defaultVal = DEFAULTS[key];
            const raw = row.setting_value;
            // Coerce to match the expected type from DEFAULTS
            if (typeof defaultVal === "number") {
              (settings as any)[key] = Number(raw);
            } else if (typeof defaultVal === "boolean") {
              (settings as any)[key] = raw === true || raw === "true";
            } else {
              (settings as any)[key] = raw ?? defaultVal;
            }
          }
        }
      }
      return settings;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useUpdateAdminHomeSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: keyof AdminHomeSettings; value: any }) => {
      const { error } = await (supabase as any)
        .from("admin_home_settings")
        .update({ setting_value: value })
        .eq("setting_key", key);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminHomeSettings"] });
    },
  });
}
