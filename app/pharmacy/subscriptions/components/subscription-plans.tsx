"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CreditCard, Upload, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

const PLANS = [
  {
    id: 'monthly',
    name: 'اشتراك شهري',
    price: 1500,
    duration: 'شهر',
    features: [
      'استقبال الوصفات والرد عليها',
      'إشعارات فورية',
      'عرض على الخريطة',
      'دعم فني أساسي'
    ]
  },
  {
    id: 'yearly',
    name: 'اشتراك سنوي',
    price: 10000,
    duration: 'سنة',
    popular: true,
    features: [
      'جميع مزايا الاشتراك الشهري',
      'خصم 33% على السعر الشهري',
      'أولوية في الإشعارات',
      'دعم فني متقدم',
      'إحصائيات مفصلة'
    ]
  }
]

export function SubscriptionPlans() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "خطأ في الملف",
          description: "يرجى اختيار صورة فقط",
          variant: "destructive",
        })
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "حجم الملف كبير جداً",
          description: "يجب أن يكون حجم الملف أقل من 5 ميجابايت",
          variant: "destructive",
        })
        return
      }

      setReceiptFile(file)
    }
  }

  const handleSubmit = async () => {
    if (!selectedPlan || !receiptFile) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى اختيار الخطة ورفع وصل الدفع",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()

      // Upload receipt file
      const fileExt = receiptFile.name.split('.').pop()
      const fileName = `receipt-${Date.now()}.${fileExt}`
      const userId = (await supabase.auth.getUser()).data.user?.id
      const filePath = `${userId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(filePath, receiptFile)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        toast({
          title: "خطأ في رفع الملف",
          description: "حدث خطأ أثناء رفع وصل الدفع",
          variant: "destructive",
        })
        return
      }

      // Create subscription record
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          pharmacy_id: (await supabase.auth.getUser()).data.user?.id,
          plan_type: selectedPlan as 'monthly' | 'yearly',
          status: 'pending',
          receipt_url: filePath
        })

      if (subscriptionError) {
        console.error('Subscription error:', subscriptionError)
        toast({
          title: "خطأ في إنشاء الاشتراك",
          description: "حدث خطأ أثناء إنشاء طلب الاشتراك",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "تم إرسال طلب الاشتراك",
        description: "سيتم مراجعة طلبك من قبل الإدارة خلال 24 ساعة",
      })

      // Refresh the page to show updated status
      router.refresh()

    } catch (error) {
      console.error('Error:', error)
      toast({
        title: "خطأ غير متوقع",
        description: "حدث خطأ غير متوقع",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold mb-4">اختر خطة الاشتراك</h2>

        <div className="grid gap-4">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={`cursor-pointer transition-all ${
                selectedPlan === plan.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'hover:border-gray-300'
              } ${plan.popular ? 'relative' : ''}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-600">الأكثر شعبية</Badge>
                </div>
              )}

              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  {selectedPlan === plan.id && (
                    <Check className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{plan.price.toLocaleString()}</span>
                  <span className="text-muted-foreground">دج/{plan.duration}</span>
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {selectedPlan && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              رفع وصل الدفع
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="receipt">اختر صورة وصل الدفع</Label>
              <Input
                id="receipt"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                يجب أن يكون الملف صورة وبحجم أقل من 5 ميجابايت
              </p>
            </div>

            {receiptFile && (
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-green-800">
                  تم اختيار الملف: {receiptFile.name}
                </p>
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={!receiptFile || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? "جاري الإرسال..." : "إرسال طلب الاشتراك"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
