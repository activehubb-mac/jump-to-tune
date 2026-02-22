

# Make Spotify Player Fully Interactive for All Users

## Problem
The Spotify embed iframe currently has a restrictive `sandbox` attribute (`allow-scripts allow-same-origin allow-popups`) that blocks users from signing into their Spotify account. Users see the player but can't log in or interact with it fully.

## Fix

### Update `src/components/home/SpotifyEmbedSection.tsx`

1. **Fix sandbox permissions** -- add `allow-popups-to-escape-sandbox` and `allow-forms` so the Spotify login popup and authentication flow work correctly
2. **Increase mobile height** from 152px to 352px so the full player (with login prompt and controls) is visible on all devices
3. **Result**: Users land on the homepage, see the Spotify player, tap "Log in", sign into their Spotify account, and stream music while browsing JumTunes

### What changes in the iframe tag
```
Before:  sandbox="allow-scripts allow-same-origin allow-popups"
After:   sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-forms"

Before:  className="border-0 md:h-[352px] h-[152px]"
After:   className="border-0 w-full h-[352px]"
```

## Technical Details

| File | Change |
|------|--------|
| `src/components/home/SpotifyEmbedSection.tsx` | Update `sandbox` attribute to allow login; set consistent 352px height on all devices |

No database changes needed.

