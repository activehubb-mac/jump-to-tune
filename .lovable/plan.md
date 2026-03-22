

## Harden Avatar as Video Face

### Problem
When a user selects an avatar identity, it should be clear and enforced that the video will feature that avatar's face. Currently there's no visual confirmation or enforcement.

### Changes — `src/pages/AIVideoStudio.tsx`

1. **Active Avatar Banner** (above Generate button, inside Step 4 card):
   - If `avatarUrl` is set, show a banner with the avatar thumbnail (32px), text "This avatar will be the face of your video", and an "×" button to clear it
   - If cleared, reset `avatarUrl`, `identityId`, and `identityBanner` to null

2. **Avatar Performance Validation**:
   - If `videoType === "avatar_performance"` and `!avatarUrl`, show amber warning: "Select an identity above to use as the face of your video"
   - Disable Generate button in this state

3. **Include avatar in CreditConfirmModal summary**:
   - Append `" · Avatar face"` to the summary string when `avatarUrl` is set

### Files Changed

| File | Change |
|---|---|
| `src/pages/AIVideoStudio.tsx` | Add avatar confirmation banner, validation warning, updated summary |

