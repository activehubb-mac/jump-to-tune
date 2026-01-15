-- Insert subscription record for user (since none exists)
INSERT INTO subscriptions (
  user_id, 
  tier, 
  status, 
  stripe_subscription_id,
  stripe_customer_id,
  trial_ends_at,
  current_period_start,
  current_period_end
)
VALUES (
  '90416e0c-845b-4126-8572-aea14e9c7cd3',
  'label',
  'active',
  'sub_1Spvh2EKeZaBsSwjimemSDva',
  'cus_TnWk78OV2TMU6D',
  NOW() + INTERVAL '90 days',
  NOW(),
  NOW() + INTERVAL '30 days'
)
ON CONFLICT (user_id) DO UPDATE SET
  tier = 'label',
  status = 'active',
  stripe_subscription_id = 'sub_1Spvh2EKeZaBsSwjimemSDva',
  stripe_customer_id = 'cus_TnWk78OV2TMU6D',
  current_period_end = NOW() + INTERVAL '30 days';

-- Update user role to label
UPDATE user_roles 
SET role = 'label' 
WHERE user_id = '90416e0c-845b-4126-8572-aea14e9c7cd3';