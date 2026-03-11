
UPDATE credit_wallets SET ai_credits = 15, updated_at = NOW();
UPDATE subscriptions SET trial_ends_at = NOW() + INTERVAL '30 days', status = 'trialing', updated_at = NOW() WHERE status IN ('trialing', 'canceled');
