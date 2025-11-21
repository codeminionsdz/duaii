import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { BottomNav } from "@/components/layout/bottom-nav"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, FileText, CheckCircle, Clock } from "lucide-react"
import { BackgroundPattern } from "@/components/ui/background-pattern"

export default async function NotificationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get notifications
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const getIcon = (type: string) => {
    switch (type) {
      case "prescription":
        return <FileText className="h-5 w-5 text-blue-600" />
      case "response":
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case "reminder":
        return <Clock className="h-5 w-5 text-orange-600" />
      default:
        return <Bell className="h-5 w-5 text-gray-600" />
    }
  }

  return (
    <div className="relative min-h-screen pb-20">
      <BackgroundPattern />

      <div className="relative z-10">
        <header className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-6 rounded-b-3xl shadow-lg mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-7 w-7" />
            الإشعارات
          </h1>
          <p className="text-emerald-100 text-sm mt-1">جميع إشعاراتك في مكان واحد</p>
        </header>

        <main className="p-4">
          {notifications && notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`p-4 ${notification.read ? "bg-card" : "bg-emerald-50 border-emerald-200"}`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">{getIcon(notification.type)}</div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-sm">{notification.title}</h3>
                        {!notification.read && <Badge className="bg-emerald-600 text-white text-xs">جديد</Badge>}
                      </div>

                      <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>

                      <p className="text-xs text-muted-foreground">
                        {new Date(notification.created_at).toLocaleString("ar-SA")}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-2">لا توجد إشعارات</h3>
              <p className="text-sm text-muted-foreground">سيتم إشعارك عند وجود تحديثات جديدة</p>
            </Card>
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  )
}
