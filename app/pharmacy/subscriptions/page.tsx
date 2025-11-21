import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PharmacyBottomNav } from "@/components/layout/pharmacy-bottom-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Calendar, CheckCircle, Clock, Upload } from "lucide-react"
import { SubscriptionStatusCard } from "./components/subscription-status-card"
import { SubscriptionPlans } from "./components/subscription-plans"

export default async function PharmacySubscriptionsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get pharmacy profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/auth/login")
  }

  if (profile.role !== "pharmacy") {
    redirect("/home")
  }

  // Get current subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("pharmacy_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-b-3xl shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <CreditCard className="h-6 w-6" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold">الاشتراكات</h1>
              <p className="text-purple-100 text-sm">إدارة اشتراك الصيدلية</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Current Subscription Status */}
        <SubscriptionStatusCard subscription={subscription} />

        {/* Subscription Plans */}
        {!subscription || subscription.status === 'expired' || subscription.status === 'rejected' ? (
          <SubscriptionPlans />
        ) : null}

        {/* Subscription History */}
        {subscription && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                تاريخ الاشتراك
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <p className="font-medium">
                    اشتراك {subscription.plan_type === 'monthly' ? 'شهري' : 'سنوي'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    تم الإنشاء في {new Date(subscription.created_at).toLocaleDateString("ar-SA")}
                  </p>
                  {subscription.start_date && subscription.end_date && (
                    <p className="text-sm text-muted-foreground">
                      من {new Date(subscription.start_date).toLocaleDateString("ar-SA")} إلى {new Date(subscription.end_date).toLocaleDateString("ar-SA")}
                    </p>
                  )}
                </div>
                <Badge
                  variant={
                    subscription.status === 'active' ? 'default' :
                    subscription.status === 'pending' ? 'secondary' :
                    subscription.status === 'approved' ? 'outline' :
                    'destructive'
                  }
                >
                  {subscription.status === 'active' ? 'نشط' :
                   subscription.status === 'pending' ? 'قيد المراجعة' :
                   subscription.status === 'approved' ? 'معتمد' :
                   subscription.status === 'rejected' ? 'مرفوض' : 'منتهي'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <PharmacyBottomNav />
    </div>
  )
}
