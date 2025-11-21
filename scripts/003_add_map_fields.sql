-- Add map-related fields to profiles and pharmacy_profiles tables
alter table public.profiles add column if not exists map_link text;
alter table public.profiles add column if not exists lat numeric;
alter table public.profiles add column if not exists lng numeric;
alter table public.profiles add column if not exists logo_url text;
alter table public.profiles add column if not exists phone text;


-- Add storage bucket for prescriptions (skip if already exists)
insert into storage.buckets (id, name, public)
values ('prescriptions', 'prescriptions', true)
on conflict (id) do nothing;

-- Create storage policies for prescriptions bucket (skip if already exist)
do $$ begin
  create policy "prescriptions_select" on storage.objects for select using (bucket_id = 'prescriptions');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "prescriptions_insert" on storage.objects for insert with check (bucket_id = 'prescriptions');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "prescriptions_update" on storage.objects for update using (bucket_id = 'prescriptions');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "prescriptions_delete" on storage.objects for delete using (bucket_id = 'prescriptions');
exception
  when duplicate_object then null;
end $$;

-- Update existing pharmacy profiles to have the new fields
-- Note: This will only work if pharmacy_profiles.id references profiles.id
-- If not, you may need to adjust the foreign key relationship
