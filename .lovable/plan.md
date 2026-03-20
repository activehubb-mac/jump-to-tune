

## Add AI Video Studio to Navigation

### Change
Add "AI Video Studio" as a sub-item visible to authenticated artists/labels in the mobile menu's Create section, and add it directly to the `navLinks` array so it appears in the main nav bar.

### Approach
Since the nav already has "Create" pointing to `/ai-tools` (the hub), the cleanest approach is to add AI Video Studio as a dedicated nav link with a `Video` icon, visible only to artist/label roles — similar to how Library requires auth.

### File: `src/components/layout/Navbar.tsx`

1. Import `Video` from `lucide-react`
2. Add to `navLinks` array after the "Create" entry:
   ```
   { href: "/ai-video", label: "Video Studio", icon: Video, authRequired: true }
   ```

This keeps it simple — one line added, artists see it when logged in, fans don't.

