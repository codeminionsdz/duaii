import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createClient()

    // Note: This is a workaround since we can't execute raw SQL directly
    // The policies need to be fixed manually in the Supabase dashboard
    // For now, we'll return a message with instructions

    return NextResponse.json({
      message: 'Please execute the following SQL in your Supabase SQL editor to fix the storage policies:',
      sql: `
        -- Fix receipts storage policy
        DROP POLICY IF EXISTS "Users can view their own receipts" ON storage.objects;
        DROP POLICY IF EXISTS "Users can upload their own receipts" ON storage.objects;
        DROP POLICY IF EXISTS "Admins can view all receipts" ON storage.objects;
        DROP POLICY IF EXISTS "Users can view receipts" ON storage.objects;

        -- Create proper policies
        CREATE POLICY "Users can upload their own receipts" ON storage.objects
          FOR INSERT WITH CHECK (
            bucket_id = 'receipts' AND
            auth.uid()::text = (storage.foldername(name))[1]
          );

        CREATE POLICY "Users can view their own receipts" ON storage.objects
          FOR SELECT USING (
            bucket_id = 'receipts' AND
            auth.uid()::text = (storage.foldername(name))[1]
          );

        CREATE POLICY "Admins can view all receipts" ON storage.objects
          FOR SELECT USING (
            bucket_id = 'receipts' AND
            EXISTS (
              SELECT 1 FROM profiles
              WHERE id = auth.uid() AND role = 'admin'
            )
          );
      `
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
