"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getMedicines() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "غير مصرح" }
  }

  const { data, error } = await supabase
    .from("user_medicines")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return { data }
}

export async function addMedicine(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "غير مصرح" }
  }

  const name = formData.get("name") as string
  const dosage = formData.get("dosage") as string
  const frequency = formData.get("frequency") as string
  const startDate = formData.get("startDate") as string
  const endDate = formData.get("endDate") as string
  const notes = formData.get("notes") as string

  const { data, error } = await supabase
    .from("user_medicines")
    .insert({
      user_id: user.id,
      medicine_name: name,
      dosage,
      frequency,
      start_date: startDate,
      end_date: endDate,
      notes,
    })
    .select()
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/medicines")
  return { success: true, data }
}

export async function deleteMedicine(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "غير مصرح" }
  }

  const { error } = await supabase.from("user_medicines").delete().eq("id", id).eq("user_id", user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/medicines")
  return { success: true }
}
