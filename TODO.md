# TODO: Update Interactive Map to Show Only Active Pharmacies

## Current Issue
The InteractiveMap component in `components/home/interactive-map.tsx` currently only filters pharmacies by `is_verified = true`, but does not check the `is_active` status. This means inactive pharmacies may still appear on the map.

## Required Changes
- [x] Add `.eq('is_active', true)` filter to the pharmacy query in `fetchPharmacies` function
- [x] Fix schema cache issue for email column in profiles table
- [x] Test the change to ensure only active pharmacies are displayed
- [x] Update sample data to include is_active: true for pharmacy profiles

## Files to Modify
- `components/home/interactive-map.tsx` - Add the is_active filter to the Supabase query
- `app/api/insert-sample/route.ts` - Add is_active: true to sample pharmacy profiles

## Testing
- Verify that inactive pharmacies are not shown on the map
- Verify that active pharmacies are still displayed correctly
