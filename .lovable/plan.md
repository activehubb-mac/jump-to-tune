

# Guest Checkout and Enhanced Store Products

## Overview
Add guest checkout for one-time purchases (beats, digital tracks, digital products, physical merch) while keeping account-required flow for subscriptions and superfan features. Extends the existing `store_products`/`store_orders` system rather than creating parallel tables.

---

## Phase 1: Database Schema Changes

### 1a. Extend `store_products` table
Add new columns via migration:
- `checkout_type` (text, default `'guest_allowed'`) -- values: `guest_allowed`, `account_required`
- `digital_file_url` (text, nullable) -- secure file for delivery (beats, kits, etc.)
- `license_pdf_url` (text, nullable) -- for beat license PDFs
- `currency` (text, default `'USD'`)
- `stripe_price_id` (text, nullable)
- `stripe_product_id` (text, nullable)

Add new product type values: `beat`, `digital_product` (extend existing type options in UI; no enum change needed since it's a text column).

### 1b. Extend `store_orders` table
Add/modify columns:
- Make `buyer_id` nullable (currently NOT NULL -- needed for guest orders)
- Add `buyer_email` (text, nullable) -- already exists, ensure it's populated for guests
- Add `buyer_name` (text, nullable) -- already exists
- Add `fulfillment_status` (text, default `'none'`) -- `none`, `delivered`, `shipped`
- Add `download_count` (int, default 0)
- Add `max_downloads` (int, default 10)

### 1c. Create `store_downloads` table
New table for tracking download links:
- `id` (uuid, PK)
- `order_id` (uuid, FK to store_orders)
- `product_id` (uuid)
- `artist_id` (uuid)
- `user_id` (uuid, nullable)
- `buyer_email` (text)
- `download_token` (text, unique) -- secure random token for guest access
- `download_url` (text)
- `license_url` (text, nullable)
- `expires_at` (timestamptz, nullable)
- `download_count` (int, default 0)
- `max_downloads` (int, default 10)
- `last_download_at` (timestamptz, nullable)
- `created_at` (timestamptz, default now())

RLS: service_role full access; authenticated users can read own rows (user_id match); public can read by download_token (for guest access via edge function).

### 1d. RLS Policy Updates
- `store_orders`: Update INSERT policy to allow service_role (already exists). Update SELECT to allow rows where `buyer_id = auth.uid()` OR service_role. Add policy for guest order viewing via edge function only (service_role).
- `store_products`: No changes needed (public read already works).

---

## Phase 2: Edge Function Changes

### 2a. Update `create-store-checkout`
Major changes:
- Accept optional `buyer_email` and `buyer_name` params (for guest checkout)
- Remove hard auth requirement -- make auth optional
- If no auth token provided AND `checkout_type = 'guest_allowed'`: allow checkout with just email
- If `checkout_type = 'account_required'`: require auth token, return error if missing
- For guest checkout: skip `max_per_account` check (or check by email instead)
- Add `buyer_email` to Stripe session metadata for webhook processing
- For merch: collect shipping address (already implemented)

### 2b. Update `stripe-webhook` (store purchase handler)
In the `checkout.session.completed` handler for `metadata.type === "store"`:
- Support `buyer_id` being null (guest purchase)
- Use `session.customer_details.email` as `buyer_email`
- After creating `store_orders` row, also create `store_downloads` row with:
  - Generate secure `download_token` (crypto.randomUUID)
  - Set `expires_at` to 30 days from now
  - Set `max_downloads` to 10
- For beats: include `license_url` from product's `license_pdf_url`
- Send receipt email with download link (call `send-purchase-email` or new function)

### 2c. Create `guest-download` edge function
New function for guest download access:
- Accepts `token` (download_token) query param
- No auth required (verify_jwt = false)
- Looks up `store_downloads` by token
- Validates: not expired, download_count < max_downloads
- Increments download_count
- Returns signed URL for the file
- If beat: also return signed URL for license PDF

### 2d. Update `download-store-product`
- Keep existing auth-based flow for logged-in users
- Add download_count tracking against `store_downloads` table

---

## Phase 3: Frontend -- Guest Checkout Modal

### 3a. `GuestCheckoutModal` component
New component (`src/components/store/GuestCheckoutModal.tsx`):
- Fields: Email (required), Name (optional)
- "Pay & Download" button
- Small text: "No account needed. Want to track purchases? Create an account after checkout."
- For merch: add shipping address fields (street, city, state, zip, country)
- Calls `create-store-checkout` with `buyer_email` instead of auth token

### 3b. Update `StoreProductCard` Buy button logic
When "Buy" is clicked:
- If `product.checkout_type === 'guest_allowed'`:
  - If user is logged in: proceed with existing authenticated checkout
  - If user is NOT logged in: open `GuestCheckoutModal`
- If `product.checkout_type === 'account_required'`:
  - If user is NOT logged in: redirect to `/auth` with return URL
  - If logged in: proceed with checkout

### 3c. Update `ArtistStoreTab`
- Remove the requirement for `user` to view owned products (guests won't have ownership shown)
- Keep ownership badges for logged-in users

### 3d. Update `AddProductModal`
- Add `beat` and `digital_product` to product type options
- Add `checkout_type` toggle (default: `guest_allowed` for non-subscription types)
- Add file upload fields for `digital_file_url` and `license_pdf_url` (for beats)
- Add file upload to a private `store-files` storage bucket

### 3e. Purchase Success Page
Update or create a success page at `/store/purchase-success`:
- "Download Now" button (for digital products)
- "Your receipt was emailed to you"
- "Create an account to manage your purchases" CTA (for guests)
- For merch: "Order Confirmed" with tracking placeholder

---

## Phase 4: Beat Licensing

### 4a. Beat product form
In `AddProductModal`, when type is `beat`:
- Show "Upload Beat File" field
- Show "Upload License PDF" field
- Both upload to private `store-files` bucket

### 4b. Beat download delivery
After purchase, download link includes both:
- Beat audio file (signed URL)
- License PDF (signed URL)
- Email receipt includes both links

---

## Phase 5: Claim Purchase (Guest to Account Linking)

### 5a. Database trigger or edge function
On user signup or login, check if `store_orders` has rows where:
- `buyer_email` matches new user's email
- `buyer_id` is null
If found: update `buyer_id` to the new user's ID, and update corresponding `store_downloads` rows.

### 5b. Frontend notification
After login/signup, if purchases were claimed:
- Show feedback: "Your past purchases have been added to your account."

---

## Phase 6: Admin Controls

### 6a. Extend admin store management
- Admin can deactivate products (already possible via `store_products.is_active`)
- Admin can disable an artist's store (update `artist_stores.store_status`)
- No new admin pages needed initially -- use existing admin infrastructure

---

## Storage Bucket

Create a new **private** `store-files` bucket for:
- Beat audio files
- License PDFs
- Digital product files (kits, loop packs)

Files are never publicly accessible -- only served via signed URLs through edge functions.

---

## Files to Create
- `src/components/store/GuestCheckoutModal.tsx`
- `supabase/functions/guest-download/index.ts`
- `supabase/migrations/XXXX_guest_checkout_schema.sql`

## Files to Modify
- `supabase/functions/create-store-checkout/index.ts` (guest checkout support)
- `supabase/functions/stripe-webhook/index.ts` (guest order + download record creation)
- `supabase/functions/download-store-product/index.ts` (download tracking)
- `src/components/store/StoreProductCard.tsx` (checkout_type routing)
- `src/components/store/ArtistStoreTab.tsx` (guest-friendly UI)
- `src/components/store/AddProductModal.tsx` (new product types, file uploads, checkout_type)
- `src/components/store/ProductsTab.tsx` (new type labels)
- `src/hooks/useStoreCheckout.ts` (guest checkout flow)
- `src/hooks/useStoreProducts.ts` (new fields in interface)
- `src/contexts/AuthContext.tsx` (claim purchases on login)
- `supabase/config.toml` (guest-download function config)

## Files Unchanged
- All audio player components
- All streaming/playback logic
- Existing track download flow (`download-track`)
- Subscription checkout flow

---

## Implementation Order
1. Database migration (schema + RLS + storage bucket)
2. Update `create-store-checkout` for guest support
3. Update `stripe-webhook` for guest order processing + download records
4. Create `guest-download` edge function
5. Build `GuestCheckoutModal` component
6. Update `StoreProductCard` + `AddProductModal` with new types and checkout routing
7. Add purchase success page with download button
8. Add claim-purchase logic on auth
9. Test end-to-end: guest beat purchase, guest merch, account-required subscription

