-- Recover 5 missing credit purchases (each $5 payment = 495 cents credits after 1% fee)
-- These payments succeeded in Stripe but webhook failed at the time

-- Add missing transactions
INSERT INTO public.credit_transactions (user_id, type, amount_cents, fee_cents, stripe_payment_intent_id, description)
VALUES 
  ('90416e0c-845b-4126-8572-aea14e9c7cd3', 'purchase', 495, 5, 'pi_3SpuRKEKeZaBsSwj0pXfYvEc', 'Added $4.95 credits (recovered)'),
  ('90416e0c-845b-4126-8572-aea14e9c7cd3', 'purchase', 495, 5, 'pi_3SpqdNEKeZaBsSwj1ISTNU7K', 'Added $4.95 credits (recovered)'),
  ('90416e0c-845b-4126-8572-aea14e9c7cd3', 'purchase', 495, 5, 'pi_3SppyAEKeZaBsSwj0MZQoEpZ', 'Added $4.95 credits (recovered)'),
  ('90416e0c-845b-4126-8572-aea14e9c7cd3', 'purchase', 495, 5, 'pi_3SpelIEKeZaBsSwj0zPoqU5w', 'Added $4.95 credits (recovered)'),
  ('90416e0c-845b-4126-8572-aea14e9c7cd3', 'purchase', 495, 5, 'pi_3SpeWPEKeZaBsSwj1kMscJPC', 'Added $4.95 credits (recovered)');

-- Update wallet balance: current 495 + (5 × 495) = 2970 cents ($29.70)
UPDATE public.credit_wallets
SET balance_cents = 2970, updated_at = now()
WHERE user_id = '90416e0c-845b-4126-8572-aea14e9c7cd3';