"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { BottomNav } from "@/components/layout/bottom-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Plus, ArrowRight } from "lucide-react"

export default function AddMedicinePage() {
  const [medicineName, setMedicineName] = useState("")
  const [dosage, setDosage] = useState("")
  const [frequency, setFrequency] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [notes, setNotes] = useState("")
  const [reminderEnabled, setReminderEnabled] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!medicineName.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم الدواء",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("يجب تسجيل الدخول أولاً")

      const { error } = await supabase.from("user_medicines").insert({
        user_id: user.id,
        medicine_name: medicineName,
        dosage: dosage || null,
        frequency: frequency || null,
        start_date: startDate || null,
        end_date: endDate || null,
        notes: notes || null,
        reminder_enabled: reminderEnabled,
      })

      if (error) throw error

      toast({
        title: "تم إضافة الدواء بنجاح",
        description: "يمكنك الآن تتبع مواعيد دوائك",
      })

      router.push("/medicines")
      router.refresh()
    } catch (error: unknown) {
      console.error("[v0] Add medicine error:", error)
      toast({
        title: "خطأ في إضافة الدواء",
        description: error instanceof Error ? error.message : "حدث خطأ ما",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen pb-20">
      <header className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-6 rounded-b-3xl shadow-lg mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Plus className="h-7 w-7" />
          إضافة دواء جديد
        </h1>
        <p className="text-emerald-100 text-sm mt-1">أضف دواء لتتبع مواعيده</p>
      </header>

      <main className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>معلومات الدواء</CardTitle>
              <CardDescription>أدخل تفاصيل الدواء الأساسية</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="medicineName">اسم الدواء *</Label>
                <Input
                  id="medicineName"
                  placeholder="مثال: بنادول"
                  value={medicineName}
                  onChange={(e) => setMedicineName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dosage">الجرعة</Label>
                <Input
                  id="dosage"
                  placeholder="مثال: 500 ملغ"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">التكرار</Label>
                <Input
                  id="frequency"
                  placeholder="مثال: 3 مرات يومياً"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>المدة الزمنية</CardTitle>
              <CardDescription>حدد فترة استخدام الدواء</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="startDate">تاريخ البدء</Label>
                  <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">تاريخ الانتهاء</Label>
                  <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>ملاحظات وتذكيرات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">ملاحظات إضافية</Label>
                <Textarea
                  id="notes"
                  placeholder="أي ملاحظات أو تعليمات خاصة..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="reminder"
                  checked={reminderEnabled}
                  onChange={(e) => setReminderEnabled(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <Label htmlFor="reminder" className="cursor-pointer">
                  تفعيل التذكير بمواعيد الدواء
                </Label>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={isSubmitting} className="w-full h-12 bg-emerald-600 hover:bg-emerald-700">
            {isSubmitting ? (
              "جاري الإضافة..."
            ) : (
              <>
                إضافة الدواء
                <ArrowRight className="mr-2 h-5 w-5" />
              </>
            )}
          </Button>
        </form>
      </main>

      <BottomNav />
    </div>
  )
}
