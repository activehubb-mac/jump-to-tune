
-- Phase 1: Add columns to store_products
ALTER TABLE public.store_products
  ADD COLUMN IF NOT EXISTS max_per_account integer,
  ADD COLUMN IF NOT EXISTS scheduled_release_at timestamptz,
  ADD COLUMN IF NOT EXISTS parent_product_id uuid REFERENCES public.store_products(id),
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

-- Create index for version lineage
CREATE INDEX IF NOT EXISTS idx_store_products_parent ON public.store_products(parent_product_id) WHERE parent_product_id IS NOT NULL;

-- ============================================
-- New table: drop_waitlists
-- ============================================
CREATE TABLE public.drop_waitlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.store_products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, user_id)
);

ALTER TABLE public.drop_waitlists ENABLE ROW LEVEL SECURITY;

-- Users can join waitlists
CREATE POLICY "Users can join waitlists"
  ON public.drop_waitlists FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can leave waitlists
CREATE POLICY "Users can leave waitlists"
  ON public.drop_waitlists FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can view their own waitlist entries
CREATE POLICY "Users can view own waitlist entries"
  ON public.drop_waitlists FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Artists can view waitlists for their products
CREATE POLICY "Artists can view waitlists for their products"
  ON public.drop_waitlists FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.store_products
    WHERE store_products.id = drop_waitlists.product_id
      AND store_products.artist_id = auth.uid()
  ));

-- Anyone can count waitlist entries (public read for counts)
CREATE POLICY "Public can view waitlist entries"
  ON public.drop_waitlists FOR SELECT
  USING (true);

-- Service role full access
CREATE POLICY "Service role can manage waitlists"
  ON public.drop_waitlists FOR ALL
  USING (auth.role() = 'service_role'::text);

-- ============================================
-- New table: announcements
-- ============================================
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  image_url text,
  cta_label text,
  cta_url text,
  is_highlighted boolean NOT NULL DEFAULT false,
  audience_filter jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Artists can manage their own announcements
CREATE POLICY "Artists can manage their announcements"
  ON public.announcements FOR ALL
  TO authenticated
  USING (auth.uid() = artist_id)
  WITH CHECK (auth.uid() = artist_id);

-- Public can view announcements
CREATE POLICY "Public can view announcements"
  ON public.announcements FOR SELECT
  USING (true);

-- Service role full access
CREATE POLICY "Service role can manage announcements"
  ON public.announcements FOR ALL
  USING (auth.role() = 'service_role'::text);

-- ============================================
-- New table: announcement_reactions
-- ============================================
CREATE TABLE public.announcement_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(announcement_id, user_id)
);

ALTER TABLE public.announcement_reactions ENABLE ROW LEVEL SECURITY;

-- Users can add reactions
CREATE POLICY "Users can add reactions"
  ON public.announcement_reactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can remove their reactions
CREATE POLICY "Users can remove reactions"
  ON public.announcement_reactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their reactions
CREATE POLICY "Users can update reactions"
  ON public.announcement_reactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Public can view reactions
CREATE POLICY "Public can view reactions"
  ON public.announcement_reactions FOR SELECT
  USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_announcements_artist ON public.announcements(artist_id);
CREATE INDEX IF NOT EXISTS idx_announcements_created ON public.announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcement_reactions_announcement ON public.announcement_reactions(announcement_id);
CREATE INDEX IF NOT EXISTS idx_drop_waitlists_product ON public.drop_waitlists(product_id);
