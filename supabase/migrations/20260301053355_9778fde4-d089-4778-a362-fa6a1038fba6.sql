
-- Phase 1a: Extend store_products
ALTER TABLE public.store_products
  ADD COLUMN IF NOT EXISTS checkout_type text NOT NULL DEFAULT 'guest_allowed',
  ADD COLUMN IF NOT EXISTS digital_file_url text,
  ADD COLUMN IF NOT EXISTS license_pdf_url text,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS stripe_price_id text,
  ADD COLUMN IF NOT EXISTS stripe_product_id text;

-- Phase 1b: Extend store_orders - make buyer_id nullable
ALTER TABLE public.store_orders
  ALTER COLUMN buyer_id DROP NOT NULL;

-- Add fulfillment_status and artist_payout_cents
ALTER TABLE public.store_orders
  ADD COLUMN IF NOT EXISTS fulfillment_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS artist_payout_cents integer;

-- Phase 1c: Create store_downloads table
CREATE TABLE IF NOT EXISTS public.store_downloads (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.store_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL,
  artist_id uuid NOT NULL,
  user_id uuid,
  buyer_email text NOT NULL,
  download_token text NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  download_url text NOT NULL,
  license_url text,
  expires_at timestamptz,
  download_count integer NOT NULL DEFAULT 0,
  max_downloads integer NOT NULL DEFAULT 10,
  last_download_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for store_downloads
ALTER TABLE public.store_downloads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage store downloads"
  ON public.store_downloads FOR ALL
  USING (auth.role() = 'service_role'::text);

CREATE POLICY "Users can view their own downloads"
  ON public.store_downloads FOR SELECT
  USING (auth.uid() = user_id);

-- Phase 1d: Create private store-files bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-files', 'store-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for store-files bucket (artists upload)
CREATE POLICY "Artists can upload store files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'store-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Artists can read their own store files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'store-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Artists can update their own store files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'store-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Artists can delete their own store files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'store-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Claim purchases function: link guest orders when user signs up
CREATE OR REPLACE FUNCTION public.claim_guest_purchases()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  claimed_count integer;
BEGIN
  -- Update store_orders where buyer_email matches and buyer_id is null
  UPDATE public.store_orders
  SET buyer_id = NEW.id
  WHERE buyer_email = NEW.email
    AND buyer_id IS NULL;

  GET DIAGNOSTICS claimed_count = ROW_COUNT;

  -- Also update store_downloads
  IF claimed_count > 0 THEN
    UPDATE public.store_downloads
    SET user_id = NEW.id
    WHERE buyer_email = NEW.email
      AND user_id IS NULL;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger to claim purchases on new user creation
CREATE TRIGGER claim_guest_purchases_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.claim_guest_purchases();
