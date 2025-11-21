"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function uploadPrescription(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "غير مصرح" }
  }

  const images = formData.getAll("images") as File[]
  const notes = formData.get("notes") as string
  const urgency = formData.get("urgency") as string

  try {
    // Upload images to Supabase Storage
    const imageUrls: string[] = []

    for (const image of images) {
      const fileExt = image.name.split(".").pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("prescriptions")
        .upload(fileName, image)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from("prescriptions").getPublicUrl(fileName)

      imageUrls.push(publicUrl)
    }

    // Create prescription record
    const { data, error } = await supabase
      .from("prescriptions")
      .insert({
        user_id: user.id,
        images: imageUrls,
        notes,
        urgency,
        status: "pending",
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath("/home")
    revalidatePath("/prescriptions")

    return { success: true, data }
  } catch (error) {
    console.error("Error uploading prescription:", error)
    return { error: "فشل في رفع الوصفة" }
  }
}

export async function getPrescriptions() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "غير مصرح" }
  }

  const { data, error } = await supabase
    .from("prescriptions")
    .select(`
      *,
      responses:prescription_responses(
        *,
        pharmacy:profiles!prescription_responses_pharmacy_id_fkey(*)
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function getPrescriptionById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("prescriptions")
    .select(`
      *,
      user:profiles!prescriptions_user_id_fkey(*),
      responses:prescription_responses(
        *,
        pharmacy:profiles!prescription_responses_pharmacy_id_fkey(*)
      )
    `)
    .eq("id", id)
    .single()

  if (error) {
    return { error: error.message }
  }

  return { data }
}
