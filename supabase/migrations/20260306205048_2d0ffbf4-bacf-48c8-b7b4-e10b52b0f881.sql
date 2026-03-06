-- Admin can manage ai_credit_costs (update pricing)
CREATE POLICY "Admins can manage AI credit costs"
ON public.ai_credit_costs
FOR ALL
TO authenticated
USING (has_admin_role(auth.uid()))
WITH CHECK (has_admin_role(auth.uid()));

-- Admin can read all ai_credit_usage
CREATE POLICY "Admins can view all AI credit usage"
ON public.ai_credit_usage
FOR SELECT
TO authenticated
USING (has_admin_role(auth.uid()));

-- Admin can update track_karaoke (toggle sing mode)
CREATE POLICY "Admins can update track karaoke"
ON public.track_karaoke
FOR UPDATE
TO authenticated
USING (has_admin_role(auth.uid()));

-- Admin can read all track_karaoke
CREATE POLICY "Admins can read all track karaoke"
ON public.track_karaoke
FOR SELECT
TO authenticated
USING (has_admin_role(auth.uid()));

-- Admin can read migration_logs
CREATE POLICY "Admins can view migration logs"
ON public.migration_logs
FOR SELECT
TO authenticated
USING (has_admin_role(auth.uid()));