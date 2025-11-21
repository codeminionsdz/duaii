-- Insert sample pharmacy users for testing
-- This will create profiles with role 'pharmacy' and corresponding pharmacy_profiles

-- Insert pharmacy profiles
INSERT INTO public.profiles (id, full_name, email, role, phone, lat, lng)
VALUES
  ('pharmacy-1', 'صيدلية الرحمة', 'pharmacy1@example.com', 'pharmacy', '+213123456789', 36.7538, 3.0588),
  ('pharmacy-2', 'صيدلية الأمل', 'pharmacy2@example.com', 'pharmacy', '+213987654321', 36.7762, 3.0599),
  ('pharmacy-3', 'صيدلية الصحة', 'pharmacy3@example.com', 'pharmacy', '+213555666777', 36.7642, 3.0503)
ON CONFLICT (id) DO NOTHING;

-- Insert corresponding pharmacy profiles
INSERT INTO public.pharmacy_profiles (id, pharmacy_name, license_number, address, latitude, longitude, is_verified, is_active)
VALUES
  ('pharmacy-1', 'صيدلية الرحمة', 'LIC-001', 'شارع العربي بن مهيدي، الجزائر العاصمة', 36.7538, 3.0588, true, true),
  ('pharmacy-2', 'صيدلية الأمل', 'LIC-002', 'شارع الشهداء، الجزائر العاصمة', 36.7762, 3.0599, true, true),
  ('pharmacy-3', 'صيدلية الصحة', 'LIC-003', 'شارع مصطفى بن بولعيد، الجزائر العاصمة', 36.7642, 3.0503, true, true)
ON CONFLICT (id) DO NOTHING;
