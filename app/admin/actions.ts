'use server'

import { createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function togglePharmacyActive(formData: FormData) {
  const supabase = await createAdminClient()
  const pharmacyId = formData.get('pharmacy_id') as string
  const action = formData.get('action') as string

  if (!pharmacyId) return

  const isActive = action === 'activate'

  const { error } = await supabase
    .from('pharmacy_profiles')
    .update({ is_active: isActive })
    .eq('id', pharmacyId)

  if (error) {
    console.error('Error updating pharmacy active status:', error)
  }

  revalidatePath('/admin/pharmacies')
}

export async function extractCoordinates(formData: FormData) {
  const supabase = await createAdminClient()
  const pharmacyId = formData.get('pharmacy_id') as string

  if (!pharmacyId) return

  // Get pharmacy data to access map_link
  const { data: pharmacyData } = await supabase
    .from('pharmacy_profiles')
    .select('*, profile:profiles(*)')
    .eq('id', pharmacyId)
    .single()

  if (!pharmacyData?.profile?.map_link) {
    console.error('ERROR: No map_link found for pharmacy')
    return
  }

  const { extractLatLngFromGoogleMapsUrl } = await import("@/lib/utils/geocoding")
  const extracted = await extractLatLngFromGoogleMapsUrl(pharmacyData.profile.map_link)
  if (!extracted) {
    console.error('ERROR: Could not extract coordinates from map_link')
    return
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      lat: extracted.lat,
      lng: extracted.lng
    })
    .eq('id', pharmacyId)

  if (error) {
    console.error('Error updating coordinates:', error)
  }

  revalidatePath('/admin/pharmacies')
}

export async function saveCoordinates(formData: FormData) {
  const supabase = await createAdminClient()
  const pharmacyId = formData.get('pharmacy_id') as string
  const lat = formData.get('lat') as string
  const lng = formData.get('lng') as string

  if (!pharmacyId || !lat || !lng || lat.trim() === '' || lng.trim() === '') {
    console.error('ERROR: Missing lat/lng values')
    return
  }

  const latNum = parseFloat(lat)
  const lngNum = parseFloat(lng)

  if (isNaN(latNum) || isNaN(lngNum)) {
    console.error('ERROR: Invalid lat/lng values - not numbers')
    return
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      lat: latNum,
      lng: lngNum
    })
    .eq('id', pharmacyId)

  if (error) {
    console.error('Error updating coordinates:', error)
  }

  revalidatePath('/admin/pharmacies')
}

export async function verifyPharmacy(pharmacyId: string) {
  const supabase = await createAdminClient()
  const { error } = await supabase.from("pharmacy_profiles").update({ is_verified: true }).eq("id", pharmacyId)
  if (error) {
    console.error('Error verifying pharmacy:', error)
  }
  revalidatePath('/admin/pharmacies')
}

export async function deletePharmacy(pharmacyId: string) {
  const supabase = await createAdminClient()
  const { error } = await supabase.from("pharmacy_profiles").delete().eq("id", pharmacyId)
  if (error) {
    console.error('Error deleting pharmacy:', error)
  }
  revalidatePath('/admin/pharmacies')
}

export async function unverifyPharmacy(pharmacyId: string) {
  const supabase = await createAdminClient()
  const { error } = await supabase.from("pharmacy_profiles").update({ is_verified: false }).eq("id", pharmacyId)
  if (error) {
    console.error('Error unverifying pharmacy:', error)
  }
  revalidatePath('/admin/pharmacies')
}

export async function approveSubscription(formData: FormData) {
  const supabase = await createAdminClient()
  const subscriptionId = formData.get('subscription_id') as string

  if (!subscriptionId) return

  // Get subscription details
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', subscriptionId)
    .single()

  if (!subscription) return

  // Calculate start and end dates
  const now = new Date()
  const startDate = now
  const endDate = new Date(now)

  if (subscription.plan_type === 'monthly') {
    endDate.setMonth(endDate.getMonth() + 1)
  } else {
    endDate.setFullYear(endDate.getFullYear() + 1)
  }

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    })
    .eq('id', subscriptionId)

  if (error) {
    console.error('Error approving subscription:', error)
  }

  revalidatePath('/admin/pharmacies')
}

export async function rejectSubscription(formData: FormData) {
  const supabase = await createAdminClient()
  const subscriptionId = formData.get('subscription_id') as string

  if (!subscriptionId) return

  const { error } = await supabase
    .from('subscriptions')
    .update({ status: 'rejected' })
    .eq('id', subscriptionId)

  if (error) {
    console.error('Error rejecting subscription:', error)
  }

  revalidatePath('/admin/pharmacies')
}
