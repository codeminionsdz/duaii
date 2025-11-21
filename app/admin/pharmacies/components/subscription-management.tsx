"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CreditCard, CheckCircle, X, Clock, Eye, Download } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Subscription } from "@/lib/types"
import { approveSubscription, rejectSubscription } from "../../actions"
import { useToast } from "@/hooks/use-toast"

interface SubscriptionWithPharmacy extends Subscription {
  pharmacy?: {
    pharmacy_name: string
    full_name: string
    phone: string
  }
}

export function SubscriptionManagement() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithPharmacy[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const fetchSubscriptions = async () => {
    try {
      const supabase = createClient()

      const { data, error } = await supabase
        .from("subscriptions")
        .select(`
          *,
          pharmacy:profiles(pharmacy_name, full_name, phone)
        `)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching subscriptions:", error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        return
      }

      setSubscriptions(data || [])
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (subscriptionId: string) => {
    try {
      const formData = new FormData()
      formData.append("subscription_id", subscriptionId)

      await approveSubscription(formData)
      await fetchSubscriptions()
    } catch (error) {
      console.error("Error approving subscription:", error)
    }
  }

  const handleReject = async (subscriptionId: string) => {
    try {
      const formData = new FormData()
      formData.append("subscription_id", subscriptionId)

      await rejectSubscription(formData)
      await fetchSubscriptions()
    } catch (error) {
      console.error("Error rejecting subscription:", error)
    }
  }

  const handleViewReceipt = async (receiptUrl: string) => {
    try {
      const supabase = createClient()
      const { data } = await supabase.storage
        .from('receipts')
        .getPublicUrl(receiptUrl)

      window.open(data.publicUrl, '_blank')
    } catch (error) {
      console.error("Error:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">قيد المراجعة</Badge>
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">معتمد</Badge>
      case 'rejected':
        return <Badge variant="destructive">مرفوض</Badge>
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800">نشط</Badge>
      case 'expired':
        return <Badge variant="secondary">منتهي</Badge>
      default:
        return <Badge variant="secondary">غير محدد</Badge>
    }
  }

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">جاري تحميل طلبات الاشتراك...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          إدارة طلبات الاشتراك
        </CardTitle>
      </CardHeader>
      <CardContent>
        {subscriptions.length > 0 ? (
          <div className="space-y-4">
            {subscriptions.map((subscription) => (
              <div key={subscription.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">
                        {subscription.pharmacy?.pharmacy_name || "صيدلية غير محددة"}
                      </h4>
                      {getStatusBadge(subscription.status)}
                    </div>

                    <p className="text-sm text-muted-foreground mb-1">
                      المالك: {subscription.pharmacy?.full_name || "غير محدد"}
                    </p>

                    <p className="text-sm text-muted-foreground mb-2">
                      رقم الهاتف: {subscription.pharmacy?.phone || "غير محدد"}
                    </p>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">نوع الخطة:</span>
                        <span className="font-medium ml-1">
                          {subscription.plan_type === 'monthly' ? 'شهري' : 'سنوي'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">السعر:</span>
                        <span className="font-medium ml-1">
                          {subscription.plan_type === 'monthly' ? '1500 دج' : '10,000 دج'}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mt-2">
                      تاريخ الطلب: {new Date(subscription.created_at).toLocaleDateString("ar-SA")}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {subscription.receipt_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewReceipt(subscription.receipt_url!)}
                    >
                      <Eye className="ml-1 h-3 w-3" />
                      عرض الوصل
                    </Button>
                  )}

                  {subscription.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(subscription.id)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="ml-1 h-3 w-3" />
                        اعتماد
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(subscription.id)}
                      >
                        <X className="ml-1 h-3 w-3" />
                        رفض
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-2">لا توجد طلبات اشتراك</h3>
            <p className="text-sm text-muted-foreground">
              لم يتم تقديم أي طلبات اشتراك حتى الآن
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
