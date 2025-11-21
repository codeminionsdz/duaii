import { redirect } from "next/navigation"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { PharmacyBottomNav } from "@/components/layout/pharmacy-bottom-nav"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, CheckCircle, Clock, TrendingUp, MapPin } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { ShareLocationButton } from "@/components/pharmacy/share-location-button"

export default async function PharmacyDashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get pharmacy profile
  let { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    // Profile is missing - this shouldn't happen with proper trigger setup
    // For now, redirect to login to avoid infinite loops
    console.error('Profile not found for authenticated user:', user.id)
    redirect("/auth/login")
  }

  if (profile.role !== "pharmacy") {
    redirect("/home")
  }

  const { data: pharmacyProfile } = await supabase.from("pharmacy_profiles").select("*").eq("id", user.id).single()

  // Get pending prescriptions count
  const { count: pendingCount } = await supabase
    .from("prescriptions")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending")

  // Get responded prescriptions count
  const { count: respondedCount } = await supabase
    .from("prescription_responses")
    .select("*", { count: "exact", head: true })
    .eq("pharmacy_id", user.id)

  // Get recent prescriptions
  const { data: recentPrescriptions } = await supabase
    .from("prescriptions")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(5)

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12">
              <Image src="/images/logo.png" alt="دوائي" fill className="object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{pharmacyProfile?.pharmacy_name || "صيدلية"}</h1>
              <p className="text-blue-100 text-sm">{profile.full_name}</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-3 text-center">
              <Clock className="h-5 w-5 mx-auto mb-1 text-white" />
              <p className="text-2xl font-bold text-white">{pendingCount || 0}</p>
              <p className="text-xs text-blue-100">قيد الانتظار</p>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-3 text-center">
              <CheckCircle className="h-5 w-5 mx-auto mb-1 text-white" />
              <p className="text-2xl font-bold text-white">{respondedCount || 0}</p>
              <p className="text-xs text-blue-100">تم الرد</p>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-3 text-center">
              <TrendingUp className="h-5 w-5 mx-auto mb-1 text-white" />
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-xs text-blue-100">مكتملة</p>
            </CardContent>
          </Card>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Quick Actions */}
        <section>
          <div className="grid grid-cols-2 gap-3">
            <Button asChild className="h-24 bg-blue-600 hover:bg-blue-700 flex-col gap-2">
              <Link href="/pharmacy/prescriptions">
                <FileText className="h-8 w-8" />
                <span>الوصفات الجديدة</span>
                {pendingCount && pendingCount > 0 && (
                  <span className="absolute top-2 left-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-24 flex-col gap-2 border-2 bg-transparent">
              <Link href="/pharmacy/profile">
                <CheckCircle className="h-8 w-8" />
                <span>ملف الصيدلية</span>
              </Link>
            </Button>
          </div>

          {/* Location Sharing */}
          <div className="mt-4">
            <ShareLocationButton />
          </div>
        </section>

        {/* Recent Prescriptions */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              الوصفات الأخيرة
            </h2>
            {recentPrescriptions && recentPrescriptions.length > 0 && (
              <Link href="/pharmacy/prescriptions" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                عرض الكل
              </Link>
            )}
          </div>

          {recentPrescriptions && recentPrescriptions.length > 0 ? (
            <div className="space-y-3">
              {recentPrescriptions.map((prescription) => (
                <Link key={prescription.id} href={`/pharmacy/prescriptions/${prescription.id}`}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="flex gap-3 p-4">
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                        <Image
                          src={prescription.images?.[0] || "/placeholder.svg"}
                          alt="وصفة طبية"
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-sm">وصفة طبية جديدة</h3>
                          <span className="text-xs text-muted-foreground">
                            {new Date(prescription.created_at).toLocaleDateString("ar-SA")}
                          </span>
                        </div>

                        {prescription.notes && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{prescription.notes}</p>
                        )}

                        <Button size="sm" className="mt-2 bg-blue-600 hover:bg-blue-700">
                          الرد على الوصفة
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-2">لا توجد وصفات جديدة</h3>
              <p className="text-sm text-muted-foreground">سيتم إشعارك عند وصول وصفات جديدة</p>
            </Card>
          )}
        </section>
      </main>

      <PharmacyBottomNav />
    </div>
  )
}
