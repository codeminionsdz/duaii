import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function RootPage() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      redirect("/home")
    } else {
      redirect("/auth/login")
    }
  } catch (error) {
    console.error("Error in RootPage:", error)
    // Redirect to login if there's an error
    redirect("/auth/login")
  }
}
