-- Allow anyone to view roles (for artist/label discovery)
-- Roles are not sensitive data and needed for public pages
CREATE POLICY "Roles are viewable by everyone"
  ON user_roles FOR SELECT
  USING (true);