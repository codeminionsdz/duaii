"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { RoleSelector } from "@/components/auth/role-selector"
import { UserPlus, Mail, Lock, User, Building2, MapPin, FileText } from "lucide-react"

export default function SignupPage() {
  const [role, setRole] = useState<"user" | "pharmacy">("user")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")

  // Pharmacy specific fields
  const [pharmacyName, setPharmacyName] = useState("")
  const [licenseNumber, setLicenseNumber] = useState("")
  const [address, setAddress] = useState("")

  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: "خطأ",
        description: "كلمات المرور غير متطابقة",
        variant: "destructive",
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: "خطأ",
        description: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
        variant: "destructive",
      })
      return
    }

    const supabase = createClient()
    setIsLoading(true)

    try {
      const metadata: Record<string, any> = {
        full_name: fullName,
        role: role,
        phone: phone,
      }

      if (role === "pharmacy") {
        metadata.pharmacy_name = pharmacyName
        metadata.license_number = licenseNumber
        metadata.address = address
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/verify`,
          data: metadata,
        },
      })

      if (error) {
        throw new Error(error.message || "خطأ في إنشاء الحساب")
      }

      if (data.user) {
        // If pharmacy, create pharmacy profile
        if (role === "pharmacy") {
          const { error: pharmacyError } = await supabase.from("pharmacy_profiles").insert({
            id: data.user.id,
            pharmacy_name: pharmacyName,
            license_number: licenseNumber,
            address: address,
          })

          if (pharmacyError) {
            console.error("[v0] Pharmacy profile creation error:", pharmacyError)
          }
        }

        toast({
          title: "تم إنشاء الحساب بنجاح",
          description: "يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب",
        })

        setTimeout(() => {
          router.push("/auth/verify")
        }, 500)
      }
    } catch (error: unknown) {
      console.error("Signup error:", error)
      toast({
        title: "خطأ في إنشاء الحساب",
        description: error instanceof Error ? error.message : "حدث خطأ ما",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-16 h-16 mb-3">
            <Image src="/images/logo.png" alt="دوائي" fill className="object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-emerald-600">إنشاء حساب جديد</h1>
        </div>

        <Card className="shadow-lg border-2">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">انضم إلى دوائي</CardTitle>
            <CardDescription className="text-center">اختر نوع الحساب وأدخل بياناتك</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <RoleSelector selectedRole={role} onRoleChange={setRole} />

              <div className="space-y-2">
                <Label htmlFor="fullName">{role === "pharmacy" ? "اسم المسؤول" : "الاسم الكامل"}</Label>
                <div className="relative">
                  <User className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder={role === "pharmacy" ? "أحمد محمد" : "الاسم الكامل"}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pr-10"
                    required
                  />
                </div>
              </div>

              {role === "pharmacy" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="pharmacyName">اسم الصيدلية</Label>
                    <div className="relative">
                      <Building2 className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="pharmacyName"
                        type="text"
                        placeholder="صيدلية النور"
                        value={pharmacyName}
                        onChange={(e) => setPharmacyName(e.target.value)}
                        className="pr-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber">رقم الترخيص</Label>
                    <div className="relative">
                      <FileText className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="licenseNumber"
                        type="text"
                        placeholder="123456"
                        value={licenseNumber}
                        onChange={(e) => setLicenseNumber(e.target.value)}
                        className="pr-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">العنوان</Label>
                    <div className="relative">
                      <MapPin className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                      <Input
                        id="address"
                        type="text"
                        placeholder="شارع الملك فهد، الرياض"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="pr-10"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="phone">رقم الجوال</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="05xxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pr-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>
                {isLoading ? (
                  "جاري إنشاء الحساب..."
                ) : (
                  <>
                    <UserPlus className="ml-2 h-5 w-5" />
                    إنشاء حساب
                  </>
                )}
              </Button>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">لديك حساب بالفعل؟ </span>
                <Link href="/auth/login" className="text-emerald-600 hover:text-emerald-700 font-semibold">
                  تسجيل الدخول
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
