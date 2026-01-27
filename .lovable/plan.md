

# Plan: Add Banner Image Upload to User Profile

## Overview
Enable users to customize their profile page by uploading a custom banner/background image. The current gradient will remain as the default fallback when no image is set.

## What You'll Get
- A camera/upload button overlay on the profile banner area (visible only when viewing your own profile)
- Click to select and upload an image (JPEG, PNG, WebP, or GIF up to 5MB)
- Instant preview while uploading with progress indicator
- The uploaded banner will be visible to all users who view your profile
- Current dark charcoal gradient overlay will remain to ensure text readability

## Technical Implementation

### 1. Create Banner Upload Hook
Create `src/hooks/useBannerUpload.ts` - similar to the existing avatar upload hook:
- Upload to the existing `banners` storage bucket
- Delete previous banner before uploading new one
- Update `profiles.banner_image_url` with the new URL
- Progress tracking and error handling

### 2. Create Banner Upload Component
Create `src/components/profile/BannerUpload.tsx`:
- Reusable component for banner image upload
- Shows camera icon overlay on hover (only for own profile)
- Displays upload progress during upload
- File validation (image types, max 5MB)

### 3. Update UserProfile Page
Modify `src/pages/UserProfile.tsx`:
- Wrap the banner area with the BannerUpload component when viewing own profile
- Show upload controls only for authenticated user's own profile
- Apply dark charcoal gradient overlay for text readability (like featured sections)
- Update text colors to white with text shadows for consistency

### 4. Optional: Add Banner Upload to Profile Edit Modal
Update `src/components/profile/ProfileEditModal.tsx`:
- Add banner preview and upload option in the edit modal
- Allow users to upload/change banner from the edit modal as well

## Files to Create/Modify
| File | Action |
|------|--------|
| `src/hooks/useBannerUpload.ts` | Create - new upload hook |
| `src/components/profile/BannerUpload.tsx` | Create - new upload component |
| `src/pages/UserProfile.tsx` | Modify - integrate banner upload |
| `src/components/profile/ProfileEditModal.tsx` | Modify - add banner option |
| `src/contexts/AuthContext.tsx` | Modify - add banner_image_url to Profile interface |

## Visual Behavior
- **Default (no banner)**: Shows gradient background based on user role (primary/accent/secondary)
- **With banner**: Shows uploaded image with dark charcoal gradient overlay for text legibility
- **Upload interaction**: Camera icon appears on hover (own profile only), click to upload
- **During upload**: Shows loading spinner with progress percentage

## Design Considerations
- Banner images are resized/optimized on the client before upload for faster loading
- Consistent with the dark charcoal overlay styling used in hero carousels
- Text uses white color with shadows for readability against any background

