import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Building2, FileText, Settings, TrendingUp } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default async function AdminDashboardPage() {
  const supabase = await createAdminClient()

  // For development, skip authentication checks
  // In production, you would implement proper admin authentication

  // Get statistics
  const { data: usersData, error: usersError } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "user")

  const { data: pharmaciesData, error: pharmaciesError } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "pharmacy")

  const { data: prescriptionsData, error: prescriptionsError } = await supabase.from("prescriptions").select("*")

  const { data: pendingPharmaciesData, error: pendingError } = await supabase
    .from("pharmacy_profiles")
    .select("*")
    .eq("is_verified", false)

  const { data: verifiedPharmaciesData, error: verifiedError } = await supabase
    .from("pharmacy_profiles")
    .select("*")
    .eq("is_verified", true)

  console.log('Admin stats:', {
    users: usersData?.length,
    pharmacies: pharmaciesData?.length,
    prescriptions: prescriptionsData?.length,
    pending: pendingPharmaciesData?.length,
    verified: verifiedPharmaciesData?.length,
    errors: { usersError, pharmaciesError, prescriptionsError, pendingError, verifiedError }
  })

  const usersCount = usersData?.length || 0
  const pharmaciesCount = pharmaciesData?.length || 0
  const prescriptionsCount = prescriptionsData?.length || 0
  const pendingPharmacies = pendingPharmaciesData?.length || 0
  const verifiedPharmacies = verifiedPharmaciesData?.length || 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/30 to-background">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12">
              <Image src="/images/logo.png" alt="دوائي" fill className="object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">لوحة الإدارة</h1>
              <p className="text-purple-100 text-sm">المدير</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-3 text-center">
              <Users className="h-5 w-5 mx-auto mb-1 text-white" />
              <p className="text-2xl font-bold text-white">{usersCount || 0}</p>
              <p className="text-xs text-purple-100">مستخدم</p>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-3 text-center">
              <Building2 className="h-5 w-5 mx-auto mb-1 text-white" />
              <p className="text-2xl font-bold text-white">{verifiedPharmacies || 0}</p>
              <p className="text-xs text-purple-100">صيدلية مفعلة</p>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-3 text-center">
              <FileText className="h-5 w-5 mx-auto mb-1 text-white" />
              <p className="text-2xl font-bold text-white">{prescriptionsCount || 0}</p>
              <p className="text-xs text-purple-100">وصفة</p>
            </CardContent>
          </Card>
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-3 text-center">
              <TrendingUp className="h-5 w-5 mx-auto mb-1 text-white" />
              <p className="text-2xl font-bold text-white">{pendingPharmacies || 0}</p>
              <p className="text-xs text-purple-100">قيد المراجعة</p>
            </CardContent>
          </Card>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-bold mb-3">الإدارة السريعة</h2>
          <div className="grid grid-cols-2 gap-3">
            <Button asChild className="h-24 bg-purple-600 hover:bg-purple-700 flex-col gap-2">
              <Link href="/admin/users">
                <Users className="h-8 w-8" />
                <span>إدارة المستخدمين</span>
              </Link>
            </Button>
            <Button asChild className="h-24 bg-blue-600 hover:bg-blue-700 flex-col gap-2">
              <Link href="/admin/pharmacies">
                <Building2 className="h-8 w-8" />
                <span>إدارة الصيدليات</span>
                {pendingPharmacies && pendingPharmacies > 0 && (
                  <span className="absolute top-2 left-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                    {pendingPharmacies}
                  </span>
                )}
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-24 flex-col gap-2 border-2 bg-transparent">
              <Link href="/admin/prescriptions">
                <FileText className="h-8 w-8" />
                <span>الوصفات</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-24 flex-col gap-2 border-2 bg-transparent">
              <Link href="/admin/settings">
                <Settings className="h-8 w-8" />
                <span>الإعدادات</span>
              </Link>
            </Button>
          </div>
        </section>

        {/* Recent Activity */}
        <section>
          <h2 className="text-lg font-bold mb-3">النشاط الأخير</h2>
          <Card className="p-8 text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-2">لوحة النشاط</h3>
            <p className="text-sm text-muted-foreground">سيتم عرض آخر الأنشطة هنا</p>
          </Card>
        </section>
      </main>
    </div>
  )
}
