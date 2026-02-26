/**
 * Normalize a Spotify URL to its embed form.
 * Accepts:
 *   https://open.spotify.com/playlist/{id}
 *   https://open.spotify.com/track/{id}
 *   https://open.spotify.com/album/{id}
 *   https://open.spotify.com/embed/playlist/{id}  (already embed)
 * Returns the embed URL or null if invalid.
 */
export function normalizeSpotifyUrl(url: string): string | null {
  if (!url) return null;

  try {
    const trimmed = url.trim();

    // Already an embed URL
    const embedMatch = trimmed.match(
      /^https:\/\/open\.spotify\.com\/embed\/(playlist|track|album)\/([a-zA-Z0-9]+)/
    );
    if (embedMatch) return trimmed.split("?")[0];

    // Normal Spotify URL
    const normalMatch = trimmed.match(
      /^https:\/\/open\.spotify\.com\/(playlist|track|album)\/([a-zA-Z0-9]+)/
    );
    if (normalMatch) {
      const [, type, id] = normalMatch;
      return `https://open.spotify.com/embed/${type}/${id}`;
    }

    // Spotify URI format (spotify:track:xxx)
    const uriMatch = trimmed.match(/^spotify:(playlist|track|album):([a-zA-Z0-9]+)/);
    if (uriMatch) {
      const [, type, id] = uriMatch;
      return `https://open.spotify.com/embed/${type}/${id}`;
    }

    return null;
  } catch {
    return null;
  }
}

/** Check if a URL is a valid Spotify link */
export function isValidSpotifyUrl(url: string): boolean {
  return normalizeSpotifyUrl(url) !== null;
}

/** Detect if a Spotify embed URL is a single track (for height hint) */
export function isSpotifySingleTrack(embedUrl: string): boolean {
  return /\/embed\/track\//.test(embedUrl);
}
