-- Script to create missing profiles for existing users
INSERT INTO public.profiles (id, full_name, role, phone)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
  COALESCE((u.raw_user_meta_data->>'role')::user_role, 'user'),
  u.raw_user_meta_data->>'phone'
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
