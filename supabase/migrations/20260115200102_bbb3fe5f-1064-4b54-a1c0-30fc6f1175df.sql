-- One-time fix: Migrate existing tracks for users who upgraded to label
-- but their tracks still have label_id = NULL
UPDATE tracks 
SET label_id = artist_id, updated_at = now()
WHERE label_id IS NULL 
  AND artist_id IN (
    SELECT user_id FROM user_roles WHERE role = 'label'
  );