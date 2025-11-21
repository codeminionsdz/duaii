-- Fix admin policies to use proper JWT role checking
-- Drop existing problematic policies
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_admin" ON public.profiles;
DROP POLICY IF EXISTS "pharmacy_profiles_select_admin" ON public.pharmacy_profiles;
DROP POLICY IF EXISTS "pharmacy_profiles_update_admin" ON public.pharmacy_profiles;
DROP POLICY IF EXISTS "pharmacy_profiles_delete_admin" ON public.pharmacy_profiles;

-- Create proper admin policies using JWT role
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "pharmacy_profiles_select_admin" ON public.pharmacy_profiles
  FOR SELECT TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "pharmacy_profiles_update_admin" ON public.pharmacy_profiles
  FOR UPDATE TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "pharmacy_profiles_delete_admin" ON public.pharmacy_profiles
  FOR DELETE TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');
