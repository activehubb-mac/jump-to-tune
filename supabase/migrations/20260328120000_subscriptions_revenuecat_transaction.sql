-- Track App Store / Play original transaction id for store-billed subscriptions (RevenueCat webhooks).
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS revenuecat_original_transaction_id text;

COMMENT ON COLUMN public.subscriptions.revenuecat_original_transaction_id IS
  'Store original_transaction_id synced from RevenueCat webhooks; Stripe fields may remain set for hybrid users.';
