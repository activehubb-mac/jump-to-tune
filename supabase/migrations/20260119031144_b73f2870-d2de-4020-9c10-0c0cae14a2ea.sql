-- Create a helper function to check if user is admin (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_admin_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'::app_role
  )
$$;

-- Create admin-only RLS policies for sensitive tables

-- Allow admins to view all profiles (for user management)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_admin_role(auth.uid()));

-- Allow admins to update any profile (for banning/verification)
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (public.has_admin_role(auth.uid()));

-- Allow admins to view all tracks (for moderation)
CREATE POLICY "Admins can view all tracks"
ON public.tracks
FOR SELECT
USING (public.has_admin_role(auth.uid()));

-- Allow admins to update any track (for moderation)
CREATE POLICY "Admins can update any track"
ON public.tracks
FOR UPDATE
USING (public.has_admin_role(auth.uid()));

-- Allow admins to delete any track (for moderation)
CREATE POLICY "Admins can delete any track"
ON public.tracks
FOR DELETE
USING (public.has_admin_role(auth.uid()));

-- Allow admins to view all purchases (for financial oversight)
CREATE POLICY "Admins can view all purchases"
ON public.purchases
FOR SELECT
USING (public.has_admin_role(auth.uid()));

-- Allow admins to view all earnings (for financial oversight)
CREATE POLICY "Admins can view all earnings"
ON public.artist_earnings
FOR SELECT
USING (public.has_admin_role(auth.uid()));

-- Allow admins to view all transactions (for financial oversight)
CREATE POLICY "Admins can view all transactions"
ON public.credit_transactions
FOR SELECT
USING (public.has_admin_role(auth.uid()));

-- Allow admins to view all wallets (for financial oversight)
CREATE POLICY "Admins can view all wallets"
ON public.credit_wallets
FOR SELECT
USING (public.has_admin_role(auth.uid()));

-- Allow admins to view all subscriptions (for user management)
CREATE POLICY "Admins can view all subscriptions"
ON public.subscriptions
FOR SELECT
USING (public.has_admin_role(auth.uid()));

-- Allow admins to manage user roles (for role management)
CREATE POLICY "Admins can manage all user roles"
ON public.user_roles
FOR ALL
USING (public.has_admin_role(auth.uid()));