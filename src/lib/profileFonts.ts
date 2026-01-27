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
