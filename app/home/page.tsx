
import { redirect } from "next/navigation"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { BottomNav } from "@/components/layout/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PrescriptionCard } from "@/components/home/prescription-card"
import { PharmacyMap } from "@/components/home/pharmacy-map"
import { Upload, MapPin, Pill, TrendingUp } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { BackgroundPattern } from "@/components/ui/background-pattern"

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const params = await searchParams

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  let { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    // Profile is missing - this shouldn't happen with proper trigger setup
    // For now, redirect to login to avoid infinite loops
    console.error('Profile not found for authenticated user:', user.id)
    redirect("/auth/login")
  }

  // If pharmacy, redirect to pharmacy dashboard
  if (profile.role === "pharmacy") {
    redirect("/pharmacy/dashboard")
  }

  // Get pharmacy to focus on from URL params
  const pharmacyToFocus = typeof params.pharmacy === 'string' ? params.pharmacy : null

  // Get recent prescriptions
  const { data: prescriptions } = await supabase
    .from("prescriptions")
    .select(
      `
      *,
      responses:prescription_responses(count)
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(3)

  const prescriptionsWithCount =
    prescriptions?.map((p) => ({
      ...p,
      responses_count: Array.isArray(p.responses) ? p.responses.length : 0,
    })) || []

  // Get nearby pharmacies count (pharmacies within 50km of user location)
  const { data: pharmaciesData } = await supabase
    .from("pharmacy_profiles")
    .select(`
      id,
      profiles!inner(lat, lng)
    `)
    .not('profiles.lat', 'is', null)
    .not('profiles.lng', 'is', null)

  // Calculate distance from user location (fallback to Riyadh if no location)
  const userLat = 24.7136 // Riyadh latitude as fallback
  const userLng = 46.6753 // Riyadh longitude as fallback

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    const distance = R * c // Distance in km
    return distance
  }

  const nearbyPharmacies = pharmaciesData?.filter(pharmacy => {
    const distance = calculateDistance(userLat, userLng, pharmacy.profiles.lat, pharmacy.profiles.lng)
    return distance <= 50 // Within 50km
  }) || []

  const pharmaciesCount = nearbyPharmacies.length

  // Get user medicines count
  const { data: medicines } = await supabase
    .from("user_medicines")
    .select("id", { count: "exact" })
    .eq("user_id", user.id)

  const medicinesCount = medicines?.length || 0

  return (
    <div className="relative min-h-screen pb-20">
      <BackgroundPattern />

      <div className="relative z-10">
        {/* Header */}
        <header className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-6 rounded-b-3xl shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12">
                <Image src="/images/logo.png" alt="دوائي" fill className="object-contain" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">مرحباً، {profile.full_name}</h1>
                <p className="text-emerald-100 text-sm">كيف يمكننا مساعدتك اليوم؟</p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-3 text-center">
                <Upload className="h-5 w-5 mx-auto mb-1 text-white" />
                <p className="text-2xl font-bold text-white">{prescriptions?.length || 0}</p>
                <p className="text-xs text-emerald-100">وصفة</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-3 text-center">
                <MapPin className="h-5 w-5 mx-auto mb-1 text-white" />
                <p className="text-2xl font-bold text-white">{pharmaciesCount}</p>
                <p className="text-xs text-emerald-100">صيدلية قريبة</p>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-3 text-center">
                <Pill className="h-5 w-5 mx-auto mb-1 text-white" />
                <p className="text-2xl font-bold text-white">{medicinesCount}</p>
                <p className="text-xs text-emerald-100">دواء</p>
              </CardContent>
            </Card>
          </div>
        </header>

        <main className="p-4 space-y-6">
          {/* Quick Actions */}
          <section>
            <div className="grid grid-cols-2 gap-3">
              <Button asChild className="h-24 bg-emerald-600 hover:bg-emerald-700 flex-col gap-2">
                <Link href="/upload">
                  <Upload className="h-8 w-8" />
                  <span>رفع وصفة جديدة</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-24 flex-col gap-2 border-2 bg-transparent">
                <Link href="/medicines">
                  <Pill className="h-8 w-8" />
                  <span>أدويتي</span>
                </Link>
              </Button>
            </div>
          </section>

          {/* Map Section */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-600" />
                الصيدليات القريبة
              </h2>
            </div>
            <PharmacyMap pharmacyToFocus={pharmacyToFocus} />
          </section>

          {/* Recent Prescriptions */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                الوصفات الأخيرة
              </h2>
              {prescriptions && prescriptions.length > 0 && (
                <Link href="/prescriptions" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                  عرض الكل
                </Link>
              )}
            </div>

            {prescriptionsWithCount.length > 0 ? (
              <div className="space-y-3">
                {prescriptionsWithCount.map((prescription) => (
                  <Link key={prescription.id} href={`/prescriptions/${prescription.id}`}>
                    <PrescriptionCard prescription={prescription} />
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="font-semibold mb-2">لا توجد وصفات بعد</h3>
                <p className="text-sm text-muted-foreground mb-4">ابدأ برفع وصفتك الطبية الأولى</p>
                <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                  <Link href="/upload">رفع وصفة الآن</Link>
                </Button>
              </Card>
            )}
          </section>
        </main>
      </div>

      <BottomNav />
    </div>
  )
}
