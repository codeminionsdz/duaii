-- Fix the prescriptions table column mismatch
-- Add missing columns to match the application code

-- Add the 'images' column as text array if it doesn't exist
alter table public.prescriptions add column if not exists images text[];

-- Add the 'urgency' column if it doesn't exist
alter table public.prescriptions add column if not exists urgency text default 'normal';

-- Drop the old 'image_url' column if it exists
alter table public.prescriptions drop column if exists image_url;
