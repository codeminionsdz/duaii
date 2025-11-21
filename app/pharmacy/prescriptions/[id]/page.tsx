"use client"

import { use, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { PharmacyBottomNav } from "@/components/layout/pharmacy-bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Plus, X, Send } from "lucide-react"
import Image from "next/image"
import type { Prescription } from "@/lib/types"

interface Medicine {
  name: string
  price: number
  available: boolean
}

export default function PrescriptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [prescription, setPrescription] = useState<Prescription | null>(null)
  const [medicines, setMedicines] = useState<Medicine[]>([{ name: "", price: 0, available: true }])
  const [notes, setNotes] = useState("")
  const [estimatedTime, setEstimatedTime] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchPrescription = async () => {
      const supabase = createClient()
      const { data, error } = await supabase.from("prescriptions").select("*").eq("id", resolvedParams.id).single()

      if (error) {
        toast({
          title: "خطأ",
          description: "فشل في تحميل الوصفة",
          variant: "destructive",
        })
        return
      }

      setPrescription(data)
      setIsLoading(false)
    }

    fetchPrescription()
  }, [resolvedParams.id, toast])

  const addMedicine = () => {
    setMedicines([...medicines, { name: "", price: 0, available: true }])
  }

  const removeMedicine = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index))
  }

  const updateMedicine = (index: number, field: keyof Medicine, value: string | number | boolean) => {
    const updated = [...medicines]
    updated[index] = { ...updated[index], [field]: value }
    setMedicines(updated)
  }

  const handleSubmit = async () => {
    const validMedicines = medicines.filter((m) => m.name.trim() !== "")

    if (validMedicines.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى إضافة دواء واحد على الأقل",
        variant: "destructive",
      })
      return
    }

    const totalPrice = validMedicines.reduce((sum, m) => sum + (m.available ? m.price : 0), 0)

    setIsSubmitting(true)
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("يجب تسجيل الدخول")

      console.log("User ID:", user.id)
      console.log("Prescription ID:", resolvedParams.id)
      console.log("Valid medicines:", validMedicines)
      console.log("Total price:", totalPrice)

      // First check if user has a pharmacy profile
      const { data: pharmacyProfile, error: profileError } = await supabase
        .from("pharmacy_profiles")
        .select("id, pharmacy_name")
        .eq("id", user.id)
        .single()

      console.log("Pharmacy profile check:", { data: pharmacyProfile, error: profileError })

      if (profileError) {
        console.error("Profile check error details:", profileError)
        // Check if it's a "not found" error (PGRST116) or other error
        if (profileError.code === 'PGRST116' || profileError.message?.includes('No rows found')) {
          throw new Error("يجب إكمال إعداد ملف الصيدلية أولاً")
        }
        throw new Error(`خطأ في التحقق من ملف الصيدلية: ${profileError.message}`)
      }

      if (!pharmacyProfile) {
        throw new Error("يجب أن تكون مسجلاً كصيدلية للرد على الوصفات")
      }

      // Insert response
      const { data: responseData, error: responseError } = await supabase.from("prescription_responses").insert({
        prescription_id: resolvedParams.id,
        pharmacy_id: user.id,
        available_medicines: validMedicines,
        total_price: totalPrice,
        notes: notes || null,
        estimated_ready_time: estimatedTime || null,
      }).select()

      console.log("Response insert result:", { data: responseData, error: responseError })

      if (responseError) {
        console.error("Response insert error details:", responseError)
        throw new Error(`خطأ في إدراج الرد: ${responseError.message}`)
      }

      // Update prescription status
      const { data: updateData, error: updateError } = await supabase
        .from("prescriptions")
        .update({ status: "responded" })
        .eq("id", resolvedParams.id)
        .select()

      console.log("Prescription update result:", { data: updateData, error: updateError })

      if (updateError) {
        console.error("Prescription update error details:", updateError)
        throw new Error(`خطأ في تحديث حالة الوصفة: ${updateError.message}`)
      }

      toast({
        title: "تم إرسال الرد بنجاح",
        description: "سيتم إشعار المستخدم بردك",
      })

      router.push("/pharmacy/dashboard")
      router.refresh()
    } catch (error: unknown) {
      console.error("[v0] Response error:", error)
      const errorMessage = error instanceof Error ? error.message : "حدث خطأ ما"
      console.error("Full error details:", error)
      console.error("Error type:", typeof error)
      console.error("Error constructor:", error?.constructor?.name)
      toast({
        title: "خطأ في إرسال الرد",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

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

  return (
    <div className="min-h-screen pb-20">
      <header className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-b-3xl shadow-lg mb-6">
        <h1 className="text-2xl font-bold">الرد على الوصفة</h1>
        <p className="text-blue-100 text-sm mt-1">أضف الأدوية المتوفرة والأسعار</p>
      </header>

      <main className="p-4 space-y-4">
        {/* Prescription Images */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>صور الوصفة</CardTitle>
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
                <p className="text-sm font-medium mb-1">ملاحظات المريض:</p>
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

        {/* Medicines */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>الأدوية المتوفرة</CardTitle>
            <CardDescription>أضف الأدوية المطلوبة مع الأسعار</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {medicines.map((medicine, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3 relative">
                {medicines.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 left-2 h-6 w-6"
                    onClick={() => removeMedicine(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}

                <div className="space-y-2">
                  <Label>اسم الدواء</Label>
                  <Input
                    placeholder="مثال: بنادول"
                    value={medicine.name}
                    onChange={(e) => updateMedicine(index, "name", e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>السعر (DA)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={medicine.price || ""}
                      onChange={(e) => updateMedicine(index, "price", Number.parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>الحالة</Label>
                    <select
                      className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                      value={medicine.available ? "available" : "unavailable"}
                      onChange={(e) => updateMedicine(index, "available", e.target.value === "available")}
                    >
                      <option value="available">متوفر</option>
                      <option value="unavailable">غير متوفر</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}

            <Button variant="outline" className="w-full bg-transparent" onClick={addMedicine}>
              <Plus className="ml-2 h-4 w-4" />
              إضافة دواء آخر
            </Button>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>معلومات إضافية</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>وقت التجهيز المتوقع</Label>
              <Input
                placeholder="مثال: 30 دقيقة"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>ملاحظات إضافية</Label>
              <Textarea
                placeholder="أي ملاحظات أو تعليمات للمريض..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Total Price */}
        <Card className="border-2 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold">الإجمالي:</span>
              <span className="text-2xl font-bold text-blue-600">
                {medicines.reduce((sum, m) => sum + (m.available ? m.price : 0), 0).toFixed(2)} DA
              </span>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-base"
        >
          {isSubmitting ? (
            "جاري الإرسال..."
          ) : (
            <>
              إرسال الرد
              <Send className="mr-2 h-5 w-5" />
            </>
          )}
        </Button>
      </main>

      <PharmacyBottomNav />
    </div>
  )
}
