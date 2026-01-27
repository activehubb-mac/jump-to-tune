
# Plan: Profile Display Name Font Customization

## Overview
Allow users to personalize their profile by choosing a custom font for their display name. This gives artists, labels, and fans creative control over how their name appears on their profile page.

## How It Will Work

1. **Font Selection in Profile Edit Modal** - Users will see a new "Name Style" section in their profile edit modal where they can pick from a curated list of fonts
2. **Live Preview** - As users select different fonts, they'll see their name update in real-time
3. **Stored Preference** - The selected font is saved to their profile and displayed on their public profile page

## Available Font Options

We'll offer a diverse selection of web-safe and Google Fonts to cover different personalities:

| Font Name | Style | Best For |
|-----------|-------|----------|
| Inter | Clean, modern | Default professional look |
| Playfair Display | Elegant serif | Sophisticated artists |
| Bebas Neue | Bold, uppercase | Bold statements |
| Pacifico | Script/handwritten | Casual, friendly vibe |
| Oswald | Condensed, strong | Urban/street style |
| Lobster | Cursive | Creative, artistic |
| Raleway | Thin, elegant | Minimal, refined |
| Permanent Marker | Hand-drawn | Edgy, raw |

---

## Technical Implementation

### 1. Database Schema Update

Add a new column to store the user's font preference:

```sql
ALTER TABLE profiles
ADD COLUMN display_name_font text DEFAULT 'Inter';
```

The `profiles_public` view will automatically include this new column.

### 2. Load Google Fonts

Update `index.html` to preload the font families:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Lobster&family=Oswald:wght@500&family=Pacifico&family=Permanent+Marker&family=Playfair+Display:wght@600&family=Raleway:wght@500&display=swap" rel="stylesheet">
```

### 3. Create Font Constants

Create a shared constants file with available fonts:

**New file: `src/lib/profileFonts.ts`**
```typescript
export const PROFILE_FONTS = [
  { id: "Inter", label: "Inter", style: "font-family: 'Inter', sans-serif" },
  { id: "Playfair Display", label: "Playfair Display", style: "font-family: 'Playfair Display', serif" },
  { id: "Bebas Neue", label: "Bebas Neue", style: "font-family: 'Bebas Neue', cursive" },
  { id: "Pacifico", label: "Pacifico", style: "font-family: 'Pacifico', cursive" },
  { id: "Oswald", label: "Oswald", style: "font-family: 'Oswald', sans-serif" },
  { id: "Lobster", label: "Lobster", style: "font-family: 'Lobster', cursive" },
  { id: "Raleway", label: "Raleway", style: "font-family: 'Raleway', sans-serif" },
  { id: "Permanent Marker", label: "Permanent Marker", style: "font-family: 'Permanent Marker', cursive" },
] as const;

export type ProfileFontId = typeof PROFILE_FONTS[number]["id"];
```

### 4. Update Profile Edit Modal

**File: `src/components/profile/ProfileEditModal.tsx`**

Add a font selector section with visual previews:

- Add new state: `const [displayNameFont, setDisplayNameFont] = useState("Inter")`
- Sync font from profile when modal opens
- Add a "Name Style" section with clickable font option cards
- Each card shows the font name rendered in that font
- Save font to database along with other profile fields

### 5. Update Type Definitions

**File: `src/contexts/AuthContext.tsx`**

Add `display_name_font` to the Profile interface:
```typescript
interface Profile {
  id: string;
  display_name: string | null;
  display_name_font: string | null; // NEW
  avatar_url: string | null;
  // ... rest
}
```

### 6. Update Profile Pages

**Files to update:**
- `src/pages/UserProfile.tsx`
- `src/pages/ArtistProfile.tsx`  
- `src/pages/LabelProfile.tsx`

Apply the custom font to the display name heading:

```tsx
<h1 
  className="text-4xl md:text-5xl font-bold text-foreground mb-2"
  style={{ fontFamily: `'${profile.display_name_font || 'Inter'}', sans-serif` }}
>
  {profile.display_name || "Unknown User"}
</h1>
```

### 7. Update Data Hooks

**File: `src/hooks/useUserProfile.ts`**

Include the new font field in the returned profile data.

**File: `src/hooks/useArtistProfile.ts`**

Ensure the font field is fetched and returned.

**File: `src/hooks/useLabelProfile.ts`**

Ensure the font field is fetched and returned.

---

## User Experience Flow

1. User opens their profile page
2. Clicks "Edit Profile" button (if viewing own profile)
3. In the edit modal, scrolls to "Name Style" section
4. Sees their current name rendered in different font options
5. Taps a font to select it (highlighted with a border)
6. Clicks "Save Changes"
7. Returns to profile and sees their name in the new font

---

## Summary of Files to Change

| File | Change |
|------|--------|
| `index.html` | Add Google Fonts preload links |
| `src/lib/profileFonts.ts` | NEW - Font constants |
| `src/components/profile/ProfileEditModal.tsx` | Add font selector UI |
| `src/contexts/AuthContext.tsx` | Add font to Profile type |
| `src/hooks/useUserProfile.ts` | Include font in returned data |
| `src/hooks/useArtistProfile.ts` | Include font in returned data |
| `src/hooks/useLabelProfile.ts` | Include font in returned data |
| `src/pages/UserProfile.tsx` | Apply custom font to name |
| `src/pages/ArtistProfile.tsx` | Apply custom font to name |
| `src/pages/LabelProfile.tsx` | Apply custom font to name |

**Database migration:** Add `display_name_font` column to profiles table
