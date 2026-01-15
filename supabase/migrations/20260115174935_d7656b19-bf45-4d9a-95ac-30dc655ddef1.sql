-- Enable realtime for credit_wallets table
ALTER TABLE public.credit_wallets REPLICA IDENTITY FULL;

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.credit_wallets;