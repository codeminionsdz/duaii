-- Add is_active column to pharmacy_profiles table
alter table public.pharmacy_profiles add column if not exists is_active boolean default false;

-- Update existing verified pharmacies to be active
update public.pharmacy_profiles set is_active = true where is_verified = true;

-- Enable RLS for the new column if needed (already enabled for the table)
-- The table already has RLS enabled, so policies should cover it
