-- Create enum for credit transaction types
CREATE TYPE credit_transaction_type AS ENUM ('purchase', 'spend', 'refund');

-- Create enum for artist earnings status
CREATE TYPE earnings_status AS ENUM ('pending', 'paid', 'failed');

-- Create credit_wallets table
CREATE TABLE public.credit_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  balance_cents INTEGER NOT NULL DEFAULT 0 CHECK (balance_cents >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on credit_wallets
ALTER TABLE public.credit_wallets ENABLE ROW LEVEL SECURITY;

-- RLS policies for credit_wallets
CREATE POLICY "Users can view their own wallet"
ON public.credit_wallets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage wallets"
ON public.credit_wallets FOR ALL
USING (auth.role() = 'service_role');

-- Create credit_transactions table
CREATE TABLE public.credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type credit_transaction_type NOT NULL,
  amount_cents INTEGER NOT NULL,
  fee_cents INTEGER DEFAULT 0,
  stripe_payment_intent_id TEXT,
  reference_id UUID,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on credit_transactions
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for credit_transactions
CREATE POLICY "Users can view their own transactions"
ON public.credit_transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage transactions"
ON public.credit_transactions FOR ALL
USING (auth.role() = 'service_role');

-- Create artist_earnings table
CREATE TABLE public.artist_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL,
  purchase_id UUID NOT NULL,
  gross_amount_cents INTEGER NOT NULL,
  platform_fee_cents INTEGER NOT NULL,
  artist_payout_cents INTEGER NOT NULL,
  status earnings_status NOT NULL DEFAULT 'pending',
  stripe_transfer_id TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on artist_earnings
ALTER TABLE public.artist_earnings ENABLE ROW LEVEL SECURITY;

-- RLS policies for artist_earnings
CREATE POLICY "Artists can view their own earnings"
ON public.artist_earnings FOR SELECT
USING (auth.uid() = artist_id);

CREATE POLICY "Service role can manage earnings"
ON public.artist_earnings FOR ALL
USING (auth.role() = 'service_role');

-- Add Stripe Connect fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN stripe_account_id TEXT,
ADD COLUMN stripe_account_status TEXT DEFAULT 'not_connected',
ADD COLUMN stripe_payouts_enabled BOOLEAN DEFAULT false;

-- Create trigger for updated_at on credit_wallets
CREATE TRIGGER update_credit_wallets_updated_at
BEFORE UPDATE ON public.credit_wallets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to initialize wallet for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.credit_wallets (user_id, balance_cents)
  VALUES (NEW.id, 0);
  RETURN NEW;
END;
$$;

-- Create trigger to auto-create wallet on user signup
CREATE TRIGGER on_auth_user_created_wallet
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_wallet();

-- Create indexes for performance
CREATE INDEX idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);
CREATE INDEX idx_artist_earnings_artist_id ON public.artist_earnings(artist_id);
CREATE INDEX idx_artist_earnings_status ON public.artist_earnings(status);
CREATE INDEX idx_artist_earnings_created_at ON public.artist_earnings(created_at DESC);