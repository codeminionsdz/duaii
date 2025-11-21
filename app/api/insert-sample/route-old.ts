import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    const supabase = await createAdminClient()

    // Insert pharmacy profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .insert([
        {
          id: 'pharmacy-1',
          full_name: 'صيدلية الرحمة',
          email: 'pharmacy1@example.com',
          role: 'pharmacy',
          phone: '+213123456789',
          lat: 36.7538,
          lng: 3.0588
        },
        {
          id: 'pharmacy-2',
          full_name: 'صيدلية الأمل',
          email: 'pharmacy2@example.com',
          role: 'pharmacy',
          phone: '+213987654321',
          lat: 36.7762,
          lng: 3.0599
        },
        {
          id: 'pharmacy-3',
          full_name: 'صيدلية الصحة',
          email: 'pharmacy3@example.com',
          role: 'pharmacy',
          phone: '+213555666777',
          lat: 36.7642,
          lng: 3.0503
        }
      ])

    if (profilesError) {
      console.error('Error inserting profiles:', profilesError)
      return NextResponse.json({ error: profilesError.message }, { status: 500 })
    }

    // Insert corresponding pharmacy profiles
    const { data: pharmacyData, error: pharmacyError } = await supabase
      .from('pharmacy_profiles')
      .insert([
        {
          id: 'pharmacy-1',
          pharmacy_name: 'صيدلية الرحمة',
          license_number: 'LIC-001',
          address: 'شارع العربي بن مهيدي، الجزائر العاصمة',
          latitude: 36.7538,
          longitude: 3.0588,
          is_verified: true,
          is_active: true
        },
        {
          id: 'pharmacy-2',
          pharmacy_name: 'صيدلية الأمل',
          license_number: 'LIC-002',
          address: 'شارع الشهداء، الجزائر العاصمة',
          latitude: 36.7762,
          longitude: 3.0599,
          is_verified: true,
          is_active: true
        },
        {
          id: 'pharmacy-3',
          pharmacy_name: 'صيدلية الصحة',
          license_number: 'LIC-003',
          address: 'شارع مصطفى بن بولعيد، الجزائر العاصمة',
          latitude: 36.7642,
          longitude: 3.0503,
          is_verified: true,
          is_active: true
        }
      ])

    if (pharmacyError) {
      console.error('Error inserting pharmacy profiles:', pharmacyError)
      return NextResponse.json({ error: pharmacyError.message }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Sample pharmacies inserted successfully',
      profiles: profilesData,
      pharmacies: pharmacyData
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
