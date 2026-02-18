

# Homepage Messaging Repositioning

**Goal**: Update all homepage text to reposition JumTunes as a superfan platform that complements streaming, not competes with it. No layout, color, structure, or design changes -- wording only.

---

## Changes Overview

### 1. Hero Section (Guest / Not Logged In)

Update the `getHeroContent()` function for the `!user` case:

| Element | Current | New |
|---------|---------|-----|
| Badge text | "Join 10K+ Creators" | "Built for the Superfans Behind the Streams" |
| Heading | "Where Artists Thrive." | "Where Superfans Go Deeper." |
| Subheading | "Your sound. Your earnings. Your legacy..." | "Streaming helps artists get discovered. JumTunes helps artists build direct relationships, exclusive drops, and real fan support." |
| Supporting line | *(none)* | Add: "This is your VIP room -- the place where your biggest supporters show up first." |
| Primary button | "Start Creating" | "Launch Your VIP Drop" |
| Secondary button | "Explore Music" | "Explore Exclusive Releases" |

### 2. Remove Fake Metrics (Hero Quick Stats)

Remove the inline stats block that shows "50K+", "10K+", "$2M+" in the hero section (lines 929-944).

### 3. Remove Stats Section

Remove the standalone stats section (lines 1081-1091) that displays the `stats` array (50K+ Tracks, 10K+ Artists, 500K+ Collectors, $2M+ Artist Earnings). Also remove the `stats` constant at the top of the file.

### 4. Replace Features Section with Value Blocks

Update the `features` array (lines 24-40) with new superfan-focused messaging:

| Block | Title | Description |
|-------|-------|-------------|
| 1 | Direct Fan Support | Every download represents a real supporter -- not just a stream count. |
| 2 | Exclusive Releases | Drop early versions, remixes, bonus tracks, or limited editions before streaming. |
| 3 | Own Your Relationship | Know who supports you. Build community beyond algorithms. |
| 4 | Streaming-Friendly Model | JumTunes complements streaming platforms -- it doesn't replace them. |

Update section title from "Why JumTunes?" to "Why Artists Use JumTunes" and update subtitle accordingly.

### 5. Update PWA Install Banner

In `src/components/home/PWAInstallBanner.tsx`, change the default install message from "Install for quick access and offline support" to "Support artists directly. Unlock exclusive music before it hits streaming."

### 6. Add Mid-Page Brand Statement Section

Add a new section between the Features section and the Role CTA section (for guests only) with:

- **Headline**: "The VIP Room Inside the Streaming Club."
- **Body**: Streaming is discovery. / JumTunes is connection. / Streaming is reach. / JumTunes is loyalty. / Streaming is exposure. / JumTunes is ownership.

This will use existing glass-card styling to match the page design.

### 7. Update Final CTA (Role CTA Section)

Update the "Join the Revolution" section heading and subtitle:

| Element | Current | New |
|---------|---------|-----|
| Heading | "Join the Revolution" | "Turn listeners into super fans." |
| Subtitle | "Whether you're a fan, artist, or label..." | *(remove or keep as secondary context)* |

Add a standalone CTA button "Start Your Exclusive Drop" linking to signup.

---

## Files Modified

1. **`src/pages/Index.tsx`** -- All hero text, stats removal, features array, new brand statement section, final CTA update
2. **`src/components/home/PWAInstallBanner.tsx`** -- Install banner message update

## Technical Notes

- The `features` array icons will be updated to match new messaging (e.g., Heart, Disc3, Users, Zap -- all already imported)
- The `stats` array and its rendering blocks will be fully removed
- The new brand statement section will be a simple JSX block inserted between existing sections, using existing utility classes
- No new dependencies, components, or structural changes required

