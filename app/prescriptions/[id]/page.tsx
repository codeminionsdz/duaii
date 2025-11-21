"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { BottomNav } from "@/components/layout/bottom-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, MapPin, Clock, Phone } from "lucide-react"
import Image from "next/image"
import type { Prescription, PrescriptionResponse } from "@/lib/types"

export default function PrescriptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [prescription, setPrescription] = useState<Prescription | null>(null)
  const [responses, setResponses] = useState<PrescriptionResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()

      // Get prescription
      const { data: prescriptionData } = await supabase
        .from("prescriptions")
        .select("*")
        .eq("id", resolvedParams.id)
        .single()

      if (prescriptionData) {
        setPrescription(prescriptionData)
      }

      // Get responses with pharmacy info
      const { data: responsesData } = await supabase
        .from("prescription_responses")
        .select(
          `
          *,
          pharmacy:pharmacy_profiles(*)
        `,
        )
        .eq("prescription_id", resolvedParams.id)

      if (responsesData) {
        setResponses(responsesData as any)
      }

      setIsLoading(false)
    }

    fetchData()
  }, [resolvedParams.id])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>جاري التحميل...</p>
      </div>
    )
  }

  if (!prescription) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>لم يتم العثور على الوصفة</p>
      </div>
    )
  }

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    responded: "bg-blue-100 text-blue-800 border-blue-300",
    accepted: "bg-green-100 text-green-800 border-green-300",
    rejected: "bg-red-100 text-red-800 border-red-300",
    completed: "bg-gray-100 text-gray-800 border-gray-300",
  }

  const statusLabels = {
    pending: "قيد الانتظار",
    responded: "تم الرد",
    accepted: "مقبولة",
    rejected: "مرفوضة",
    completed: "مكتملة",
  }

  return (
    <div className="min-h-screen pb-20">
      <header className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-6 rounded-b-3xl shadow-lg mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">تفاصيل الوصفة</h1>
            <p className="text-emerald-100 text-sm mt-1">
              {new Date(prescription.created_at).toLocaleDateString("ar-SA")}
            </p>
          </div>
          <Badge className={`${statusColors[prescription.status]} text-sm`}>{statusLabels[prescription.status]}</Badge>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Prescription Images */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-600" />
              صور الوصفة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {prescription.images && prescription.images.length > 0 ? (
                prescription.images.map((imageUrl, index) => (
                  <div key={index} className="relative w-full h-64 rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={imageUrl || "/placeholder.svg"}
                      alt={`وصفة طبية ${index + 1}`}
                      fill
                      className="object-contain"
                    />
                  </div>
                ))
              ) : (
                <div className="relative w-full h-64 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                  <p className="text-muted-foreground">لا توجد صور متاحة</p>
                </div>
              )}
            </div>
            {prescription.notes && (
              <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium mb-1">ملاحظاتك:</p>
                <p className="text-sm text-muted-foreground">{prescription.notes}</p>
              </div>
            )}
            {prescription.urgency && (
              <div className="mt-3 p-3 bg-red-50 rounded-lg">
                <p className="text-sm font-medium mb-1">مستوى الأولوية:</p>
                <p className="text-sm text-red-600 font-semibold">
                  {prescription.urgency === "urgent" ? "عاجل" : "عادي"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Responses */}
        <div>
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-emerald-600" />
            ردود الصيدليات ({responses.length})
          </h2>

          {responses.length > 0 ? (
            <div className="space-y-3">
              {responses.map((response) => (
                <Card key={response.id} className="border-2 hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-lg">{response.pharmacy?.pharmacy_name}</h3>
                        {response.pharmacy?.address && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {response.pharmacy.address}
                          </p>
                        )}
                      </div>
                      <div className="text-left">
                        <p className="text-2xl font-bold text-emerald-600">{response.total_price} DA</p>
                      </div>
                    </div>

                    {response.estimated_ready_time && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                        <Clock className="h-4 w-4" />
                        <span>وقت التجهيز: {response.estimated_ready_time}</span>
                      </div>
                    )}

                    {response.notes && (
                      <div className="p-3 bg-muted/50 rounded-lg mb-3">
                        <p className="text-sm">{response.notes}</p>
                      </div>
                    )}

                    <div className="space-y-2 mb-3">
                      <p className="text-sm font-medium">الأدوية المتوفرة:</p>
                      {Array.isArray(response.available_medicines) &&
                        response.available_medicines.map((medicine: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded"
                          >
                            <span>{medicine.name}</span>
                            <span className="font-semibold">{medicine.price} DA</span>
                          </div>
                        ))}
                    </div>

                    <div className="space-y-2">
                      <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => {
                          // Navigate to home page with pharmacy ID to focus on
                          window.location.href = `/?pharmacy=${response.pharmacy?.id}`
                        }}
                      >
                        <MapPin className="ml-2 h-4 w-4" />
                        اذهب إلى الصيدلية
                      </Button>
                      <Button variant="outline" className="w-full">
                        <Phone className="ml-2 h-4 w-4" />
                        التواصل مع الصيدلية
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-2">لا توجد ردود بعد</h3>
              <p className="text-sm text-muted-foreground">سيتم إشعارك عندما ترد الصيدليات على وصفتك</p>
            </Card>
          )}
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
