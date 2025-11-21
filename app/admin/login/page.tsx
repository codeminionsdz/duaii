import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, Eye, EyeOff } from "lucide-react"
import { headers } from "next/headers"
import Image from "next/image"

export default async function AdminLoginPage() {
  const headersList = await headers()

  async function loginAdmin(formData: FormData) {
    'use server'

    const password = formData.get('password') as string

    // Check if password matches admin password
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123"

    console.log('Admin login attempt with password:', password)
    console.log('Expected password:', ADMIN_PASSWORD)

    if (password === ADMIN_PASSWORD) {
      console.log('Password correct, redirecting to admin')
      // Password correct, redirect to admin
      redirect("/admin")
    } else {
      console.log('Password incorrect, redirecting back to login')
      // Invalid password - return to login with error
      redirect("/admin/login?error=invalid")
    }
  }

  const error = headersList.get('referer')?.includes('error=invalid')

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/30 to-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative w-16 h-16">
              <Image src="/images/logo.png" alt="دوائي" fill className="object-contain" />
            </div>
          </div>
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Shield className="h-6 w-6 text-purple-600" />
            دخول الإدارة
          </CardTitle>
          <p className="text-sm text-muted-foreground">منطقة الإدارة المحدودة</p>
        </CardHeader>

        <CardContent>
          <form action={loginAdmin} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 text-center">بيانات الدخول غير صحيحة</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="أدخل كلمة المرور"
                required
                className="text-sm"
              />
            </div>

            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
              <Shield className="ml-2 h-4 w-4" />
              دخول الإدارة
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 font-medium mb-1">معلومات الدخول الافتراضية:</p>
            <p className="text-xs text-blue-600">كلمة المرور: admin123</p>
          </div>

          <div className="mt-4 text-center">
            <Button variant="ghost" asChild>
              <a href="/">العودة للصفحة الرئيسية</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
