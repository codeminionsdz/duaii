"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getPendingPrescriptions() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "غير مصرح" }
  }

  // Get prescriptions that don't have a response from this pharmacy yet
  const { data, error } = await supabase
    .from("prescriptions")
    .select(`
      *,
      user:profiles!prescriptions_user_id_fkey(*),
      responses:prescription_responses!left(id, pharmacy_id)
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (error) {
    return { error: error.message }
  }

  // Filter out prescriptions that already have a response from this pharmacy
  const filtered = data?.filter((p) => !p.responses?.some((r: any) => r.pharmacy_id === user.id))

  return { data: filtered }
}

export async function respondToPrescription(prescriptionId: string, formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "غير مصرح" }
  }

  const totalPrice = Number.parseFloat(formData.get("totalPrice") as string)
  const preparationTime = Number.parseInt(formData.get("preparationTime") as string)
  const notes = formData.get("notes") as string
  const itemsJson = formData.get("items") as string
  const items = JSON.parse(itemsJson)

  try {
    // Create response
    const { data: response, error: responseError } = await supabase
      .from("prescription_responses")
      .insert({
        prescription_id: prescriptionId,
        pharmacy_id: user.id,
        total_price: totalPrice,
        preparation_time: preparationTime,
        notes,
      })
      .select()
      .single()

    if (responseError) throw responseError

    // Create response items
    const responseItems = items.map((item: any) => ({
      response_id: response.id,
      medicine_name: item.name,
      quantity: item.quantity,
      price: item.price,
      available: item.available,
      alternative: item.alternative,
    }))

    const { error: itemsError } = await supabase.from("response_items").insert(responseItems)

    if (itemsError) throw itemsError

    // Create notification for user
    const { data: prescription } = await supabase
      .from("prescriptions")
      .select("user_id")
      .eq("id", prescriptionId)
      .single()

    if (prescription) {
      await supabase.from("notifications").insert({
        user_id: prescription.user_id,
        type: "prescription_response",
        title: "رد جديد على وصفتك",
        message: "قامت صيدلية بالرد على وصفتك الطبية",
        data: { prescription_id: prescriptionId, response_id: response.id },
      })
    }

    revalidatePath("/pharmacy/prescriptions")

    return { success: true, data: response }
  } catch (error) {
    console.error("Error responding to prescription:", error)
    return { error: "فشل في إرسال الرد" }
  }
}

export async function updatePharmacyProfile(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "غير مصرح" }
  }

  const name = formData.get("name") as string
  const phone = formData.get("phone") as string
  const address = formData.get("address") as string
  const latitude = Number.parseFloat(formData.get("latitude") as string)
  const longitude = Number.parseFloat(formData.get("longitude") as string)

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: name,
      phone,
      address,
      latitude,
      longitude,
    })
    .eq("id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/pharmacy/profile")
  return { success: true }
}
