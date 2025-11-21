-- Admin policies for accessing all data
-- These policies allow admin users to access all tables

-- Profiles admin policies
drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin" on public.profiles
  for select to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles
  for update to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

-- Pharmacy profiles admin policies
drop policy if exists "pharmacy_profiles_select_admin" on public.pharmacy_profiles;
create policy "pharmacy_profiles_select_admin" on public.pharmacy_profiles
  for select to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

drop policy if exists "pharmacy_profiles_update_admin" on public.pharmacy_profiles;
create policy "pharmacy_profiles_update_admin" on public.pharmacy_profiles
  for update to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

drop policy if exists "pharmacy_profiles_delete_admin" on public.pharmacy_profiles;
create policy "pharmacy_profiles_delete_admin" on public.pharmacy_profiles
  for delete to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

-- Prescriptions admin policies
drop policy if exists "prescriptions_select_admin" on public.prescriptions;
create policy "prescriptions_select_admin" on public.prescriptions
  for select to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

drop policy if exists "prescriptions_update_admin" on public.prescriptions;
create policy "prescriptions_update_admin" on public.prescriptions
  for update to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

-- Prescription responses admin policies
drop policy if exists "prescription_responses_select_admin" on public.prescription_responses;
create policy "prescription_responses_select_admin" on public.prescription_responses
  for select to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

-- User medicines admin policies
drop policy if exists "user_medicines_select_admin" on public.user_medicines;
create policy "user_medicines_select_admin" on public.user_medicines
  for select to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

-- Notifications admin policies
drop policy if exists "notifications_select_admin" on public.notifications;
create policy "notifications_select_admin" on public.notifications
  for select to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

drop policy if exists "notifications_insert_admin" on public.notifications;
create policy "notifications_insert_admin" on public.notifications
  for insert to authenticated
  with check (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

drop policy if exists "notifications_update_admin" on public.notifications;
create policy "notifications_update_admin" on public.notifications
  for update to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));

drop policy if exists "notifications_delete_admin" on public.notifications;
create policy "notifications_delete_admin" on public.notifications
  for delete to authenticated
  using (exists (select 1 from public.profiles where profiles.id = auth.uid() and profiles.role = 'admin'));
