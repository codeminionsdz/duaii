"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CreditCard, CheckCircle, Clock, AlertCircle, Calendar } from "lucide-react"
import { Subscription } from "@/lib/types"

interface SubscriptionStatusCardProps {
  subscription: Subscription | null
}

export function SubscriptionStatusCard({ subscription }: SubscriptionStatusCardProps) {
  if (!subscription) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center">
          <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-semibold mb-2">لا توجد اشتراكات نشطة</h3>
          <p className="text-sm text-muted-foreground">
            اختر خطة اشتراك لتفعيل خدمات الصيدلية
          </p>
        </CardContent>
      </Card>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-blue-600" />
      case 'rejected':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      case 'expired':
        return <AlertCircle className="h-5 w-5 text-gray-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">نشط</Badge>
      case 'pending':
        return <Badge variant="secondary">قيد المراجعة</Badge>
      case 'approved':
        return <Badge variant="outline">معتمد</Badge>
      case 'rejected':
        return <Badge variant="destructive">مرفوض</Badge>
      case 'expired':
        return <Badge variant="secondary">منتهي</Badge>
      default:
        return <Badge variant="secondary">غير محدد</Badge>
    }
  }

  const isActive = subscription.status === 'active'
  const daysLeft = subscription.end_date
    ? Math.ceil((new Date(subscription.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <Card className={isActive ? "border-green-200 bg-green-50/50" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(subscription.status)}
            حالة الاشتراك
          </div>
          {getStatusBadge(subscription.status)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">نوع الخطة</p>
            <p className="font-medium">
              {subscription.plan_type === 'monthly' ? 'شهري' : 'سنوي'}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">السعر</p>
            <p className="font-medium">
              {subscription.plan_type === 'monthly' ? '1500 دج' : '10,000 دج'}
            </p>
          </div>
        </div>

        {subscription.start_date && subscription.end_date && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                من {new Date(subscription.start_date).toLocaleDateString("ar-SA")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                إلى {new Date(subscription.end_date).toLocaleDateString("ar-SA")}
              </span>
            </div>
            {daysLeft !== null && daysLeft > 0 && (
              <p className="text-sm text-muted-foreground">
                متبقي {daysLeft} يوم
              </p>
            )}
          </div>
        )}

        {subscription.status === 'pending' && (
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-sm text-yellow-800">
              تم رفع وصل الدفع وهو قيد المراجعة من قبل الإدارة
            </p>
          </div>
        )}

        {subscription.status === 'rejected' && (
          <div className="bg-red-50 p-3 rounded-lg">
            <p className="text-sm text-red-800">
              تم رفض الاشتراك. يرجى التواصل مع الدعم الفني
            </p>
          </div>
        )}

        {subscription.status === 'expired' && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-800">
              انتهى الاشتراك. يرجى تجديد الاشتراك للاستمرار في الخدمات
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
