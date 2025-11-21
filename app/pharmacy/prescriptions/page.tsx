import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PharmacyBottomNav } from "@/components/layout/pharmacy-bottom-nav"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Clock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default async function PharmacyPrescriptionsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get all prescriptions
  const { data: prescriptions } = await supabase
    .from("prescriptions")
    .select("*")
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen pb-20">
      <header className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-b-3xl shadow-lg mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-7 w-7" />
          جميع الوصفات
        </h1>
        <p className="text-blue-100 text-sm mt-1">اختر وصفة للرد عليها</p>
      </header>

      <main className="p-4">
        {prescriptions && prescriptions.length > 0 ? (
          <div className="space-y-3">
            {prescriptions.map((prescription) => (
              <Link key={prescription.id} href={`/pharmacy/prescriptions/${prescription.id}`}>
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="flex gap-3 p-4">
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                      <Image
                        src={prescription.images?.[0] || "/placeholder.svg"}
                        alt="وصفة طبية"
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold">وصفة طبية</h3>
                        <Badge
                          className={
                            prescription.status === "pending"
                              ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                              : "bg-blue-100 text-blue-800 border-blue-300"
                          }
                        >
                          {prescription.status === "pending" ? "جديدة" : "تم الرد"}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(prescription.created_at).toLocaleDateString("ar-SA")}</span>
                      </div>

                      {prescription.notes && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{prescription.notes}</p>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-2">لا توجد وصفات</h3>
            <p className="text-sm text-muted-foreground">سيتم إشعارك عند وصول وصفات جديدة</p>
          </Card>
        )}
      </main>

      <PharmacyBottomNav />
    </div>
  )
}
