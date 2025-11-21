-- Fix infinite recursion in profiles policies
-- Drop problematic policies that cause recursion
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;

-- Recreate admin policies without recursion
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Also fix pharmacy profiles admin policies
DROP POLICY IF EXISTS "pharmacy_profiles_select_admin" ON public.pharmacy_profiles;
DROP POLICY IF EXISTS "pharmacy_profiles_update_admin" ON public.pharmacy_profiles;
DROP POLICY IF EXISTS "pharmacy_profiles_delete_admin" ON public.pharmacy_profiles;

CREATE POLICY "pharmacy_profiles_select_admin" ON public.pharmacy_profiles
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "pharmacy_profiles_update_admin" ON public.pharmacy_profiles
  FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "pharmacy_profiles_delete_admin" ON public.pharmacy_profiles
  FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');
