-- Update AI credit costs to match new pricing
UPDATE ai_credit_costs SET credit_cost = 10, updated_at = now() WHERE action_key = 'cover_art';
UPDATE ai_credit_costs SET credit_cost = 3, updated_at = now() WHERE action_key = 'cover_regeneration';
UPDATE ai_credit_costs SET credit_cost = 60, updated_at = now() WHERE action_key = 'release_builder';
UPDATE ai_credit_costs SET credit_cost = 25, updated_at = now() WHERE action_key = 'artist_identity';
UPDATE ai_credit_costs SET credit_cost = 5, updated_at = now() WHERE action_key = 'playlist_builder';
UPDATE ai_credit_costs SET credit_cost = 40, updated_at = now() WHERE action_key = 'video_30s';