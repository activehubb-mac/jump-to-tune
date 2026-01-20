import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ForYouTrack {
  id: string;
  title: string;
  audio_url: string;
  cover_art_url: string | null;
  price: number;
  duration: number | null;
  genre: string | null;
  moods: string[] | null;
  artist_id: string;
  artist: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  score: number; // Recommendation score for sorting
  reason: string; // Why this track was recommended
}

const RECENTLY_PLAYED_KEY = "jumtunes_recently_played";

export function useForYouPlaylist(limit: number = 20) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["forYouPlaylist", user?.id, limit],
    queryFn: async (): Promise<ForYouTrack[]> => {
      // Get recently played from localStorage
      let recentlyPlayed: { id: string; artist_id: string }[] = [];
      try {
        const stored = localStorage.getItem(RECENTLY_PLAYED_KEY);
        if (stored) {
          recentlyPlayed = JSON.parse(stored);
        }
      } catch (e) {
        console.error("Failed to load recently played:", e);
      }

      // Get liked tracks if user is logged in
      let likedTrackIds: string[] = [];
      let likedTrackGenres: string[] = [];
      let likedTrackMoods: string[] = [];

      if (user) {
        const { data: likes } = await supabase
          .from("likes")
          .select("track_id")
          .eq("user_id", user.id);

        likedTrackIds = likes?.map((l) => l.track_id) || [];

        // Get genres and moods from liked tracks
        if (likedTrackIds.length > 0) {
          const { data: likedTracks } = await supabase
            .from("tracks")
            .select("genre, moods")
            .in("id", likedTrackIds);

          likedTracks?.forEach((t) => {
            if (t.genre) likedTrackGenres.push(t.genre);
            if (t.moods) likedTrackMoods.push(...t.moods);
          });
        }

        // Get followed artists' tracks
        const { data: follows } = await supabase
          .from("follows")
          .select("following_id")
          .eq("follower_id", user.id);

        if (follows && follows.length > 0) {
          const followedArtistIds = follows.map((f) => f.following_id);
          
          // Get genres from followed artists
          const { data: artistGenres } = await supabase
            .from("profile_genres")
            .select("genre")
            .in("profile_id", followedArtistIds);

          artistGenres?.forEach((g) => {
            if (g.genre) likedTrackGenres.push(g.genre);
          });
        }
      }

      // Get genres and moods from recently played
      const recentTrackIds = recentlyPlayed.map((t) => t.id).slice(0, 10);
      const recentArtistIds = [...new Set(recentlyPlayed.map((t) => t.artist_id).filter(Boolean))];

      if (recentTrackIds.length > 0) {
        const { data: recentTracks } = await supabase
          .from("tracks")
          .select("genre, moods")
          .in("id", recentTrackIds);

        recentTracks?.forEach((t) => {
          if (t.genre) likedTrackGenres.push(t.genre);
          if (t.moods) likedTrackMoods.push(...t.moods);
        });
      }

      // Dedupe and count frequencies
      const genreCount = new Map<string, number>();
      likedTrackGenres.forEach((g) => {
        genreCount.set(g, (genreCount.get(g) || 0) + 1);
      });

      const moodCount = new Map<string, number>();
      likedTrackMoods.forEach((m) => {
        moodCount.set(m, (moodCount.get(m) || 0) + 1);
      });

      // Get top genres and moods (max 5 each)
      const topGenres = Array.from(genreCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([genre]) => genre);

      const topMoods = Array.from(moodCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([mood]) => mood);

      // Build exclusion list (already liked/played)
      const excludeIds = [...new Set([...likedTrackIds, ...recentTrackIds])];

      // Fetch candidate tracks
      let query = supabase
        .from("tracks")
        .select("id, title, audio_url, cover_art_url, price, duration, genre, moods, artist_id")
        .eq("is_draft", false);

      // Exclude already consumed tracks
      if (excludeIds.length > 0) {
        query = query.not("id", "in", `(${excludeIds.join(",")})`);
      }

      const { data: candidates, error } = await query.limit(200);

      if (error) throw error;
      if (!candidates || candidates.length === 0) return [];

      // Score tracks based on preferences
      const scoredTracks = candidates.map((track) => {
        let score = 0;
        const reasons: string[] = [];

        // Genre match (high weight)
        if (track.genre && topGenres.includes(track.genre)) {
          const genreRank = topGenres.indexOf(track.genre);
          score += (5 - genreRank) * 10; // 50 for top genre, 10 for 5th
          reasons.push(`Matches your favorite genre: ${track.genre}`);
        }

        // Mood match (medium weight)
        if (track.moods) {
          const matchingMoods = track.moods.filter((m) => topMoods.includes(m));
          matchingMoods.forEach((mood) => {
            const moodRank = topMoods.indexOf(mood);
            score += (5 - moodRank) * 5; // 25 for top mood, 5 for 5th
          });
          if (matchingMoods.length > 0) {
            reasons.push(`Has mood: ${matchingMoods.slice(0, 2).join(", ")}`);
          }
        }

        // Same artist as recently played (medium weight)
        if (recentArtistIds.includes(track.artist_id)) {
          score += 15;
          reasons.push("From an artist you recently listened to");
        }

        // Add some randomness to keep it fresh (±10%)
        score = score * (0.9 + Math.random() * 0.2);

        // If no matches, give a small base score so new content can appear
        if (score === 0) {
          score = Math.random() * 5;
          reasons.push("Discover something new");
        }

        return {
          ...track,
          score,
          reason: reasons[0] || "Recommended for you",
        };
      });

      // Sort by score and take top tracks
      const topTracks = scoredTracks
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      if (topTracks.length === 0) return [];

      // Fetch artist info
      const artistIds = [...new Set(topTracks.map((t) => t.artist_id))];
      const { data: artists } = await supabase
        .from("profiles_public")
        .select("id, display_name, avatar_url")
        .in("id", artistIds);

      const artistMap = new Map(artists?.map((a) => [a.id, a]) || []);

      return topTracks.map((track) => ({
        ...track,
        artist: artistMap.get(track.artist_id) || null,
      }));
    },
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    enabled: true, // Works for both logged in and logged out users
  });
}
