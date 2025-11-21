import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/server"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Mail, Phone } from "lucide-react"
import Link from "next/link"

export default async function AdminUsersPage() {
  const supabase = await createAdminClient()

  // For development, skip authentication checks
  // In production, you would implement proper admin authentication

  // Get all users
  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "user")
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/30 to-background pb-6">
      <header className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-b-3xl shadow-lg mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-7 w-7" />
              إدارة المستخدمين
            </h1>
            <p className="text-purple-100 text-sm mt-1">عرض وإدارة جميع المستخدمين</p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/admin">رجوع</Link>
          </Button>
        </div>
      </header>

      <main className="p-4">
        {users && users.length > 0 ? (
          <div className="space-y-3">
            {users.map((userProfile) => (
              <Card key={userProfile.id} className="overflow-hidden border-2">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg">{userProfile.full_name}</h3>
                        <Badge className="bg-emerald-100 text-emerald-800">مستخدم</Badge>
                      </div>

                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                        <Mail className="h-4 w-4" />
                        <span>البريد الإلكتروني متاح في قاعدة البيانات</span>
                      </div>

                      {userProfile.phone && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{userProfile.phone}</span>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground mt-2">
                        تاريخ التسجيل: {new Date(userProfile.created_at).toLocaleDateString("ar-SA")}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-2">لا يوجد مستخدمين</h3>
            <p className="text-sm text-muted-foreground">لم يتم تسجيل أي مستخدمين بعد</p>
          </Card>
        )}
      </main>
    </div>
  )
}
