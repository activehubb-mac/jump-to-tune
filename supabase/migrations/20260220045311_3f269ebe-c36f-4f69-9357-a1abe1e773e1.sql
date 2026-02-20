
-- Artist Stores table
CREATE TABLE public.artist_stores (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id uuid NOT NULL UNIQUE,
  store_status text NOT NULL DEFAULT 'inactive',
  platform_fee_percentage integer NOT NULL DEFAULT 15,
  seller_agreement_accepted boolean NOT NULL DEFAULT false,
  seller_agreement_accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.artist_stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artists can manage their own store"
  ON public.artist_stores FOR ALL
  USING (auth.uid() = artist_id);

CREATE POLICY "Public can view active stores"
  ON public.artist_stores FOR SELECT
  USING (store_status = 'active');

CREATE TRIGGER update_artist_stores_updated_at
  BEFORE UPDATE ON public.artist_stores
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Store Products table
CREATE TABLE public.store_products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  description text,
  price_cents integer NOT NULL,
  image_url text,
  audio_url text,
  inventory_limit integer,
  inventory_sold integer NOT NULL DEFAULT 0,
  is_exclusive boolean NOT NULL DEFAULT false,
  is_early_release boolean NOT NULL DEFAULT false,
  variants jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Artists can manage their own products"
  ON public.store_products FOR ALL
  USING (auth.uid() = artist_id);

CREATE POLICY "Public can view active products from active stores"
  ON public.store_products FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.artist_stores
      WHERE artist_stores.artist_id = store_products.artist_id
        AND artist_stores.store_status = 'active'
    )
  );

CREATE TRIGGER update_store_products_updated_at
  BEFORE UPDATE ON public.store_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Store Orders table
CREATE TABLE public.store_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.store_products(id),
  buyer_id uuid NOT NULL,
  artist_id uuid NOT NULL,
  stripe_payment_intent_id text,
  amount_cents integer NOT NULL,
  platform_fee_cents integer NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  shipping_address jsonb,
  buyer_name text,
  buyer_email text,
  edition_number integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers can view their own orders"
  ON public.store_orders FOR SELECT
  USING (auth.uid() = buyer_id);

CREATE POLICY "Artists can view their store orders"
  ON public.store_orders FOR SELECT
  USING (auth.uid() = artist_id);

CREATE POLICY "Artists can update their store orders"
  ON public.store_orders FOR UPDATE
  USING (auth.uid() = artist_id);

CREATE POLICY "Admins can view all store orders"
  ON public.store_orders FOR SELECT
  USING (has_admin_role(auth.uid()));

CREATE POLICY "Service role can manage store orders"
  ON public.store_orders FOR ALL
  USING (auth.role() = 'service_role');

-- Storage bucket for store images
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-images', 'store-images', true);

CREATE POLICY "Anyone can view store images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'store-images');

CREATE POLICY "Authenticated users can upload store images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'store-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own store images"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'store-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own store images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'store-images' AND auth.uid()::text = (storage.foldername(name))[1]);
