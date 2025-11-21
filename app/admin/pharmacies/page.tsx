"use client"

import React, { useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, MapPin, FileText, CheckCircle, X, RefreshCw, Save, Eye, EyeOff, Map } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { extractLatLngFromGoogleMapsUrl } from "@/lib/utils/geocoding"
import { PharmacyMap } from "@/components/admin/pharmacy-map"
import { createClient } from "@/lib/supabase/client"
import { togglePharmacyActive, extractCoordinates, saveCoordinates, verifyPharmacy, deletePharmacy, unverifyPharmacy } from "../actions"
import { SubscriptionManagement } from "./components/subscription-management"

export default function AdminPharmaciesPage() {
  const [pharmacies, setPharmacies] = useState<any[]>([])
  const [allPharmacies, setAllPharmacies] = useState<any[]>([])
  const [selectedPharmacy, setSelectedPharmacy] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  // Removed insertingSample state for real system

  // Fetch data on mount
  React.useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const supabase = createClient()

      // Get all pharmacies with their profiles - remove any restrictive filters
      const { data: pharmaciesData, error: pharmaciesError } = await supabase
        .from("pharmacy_profiles")
        .select(
          `
          *,
          profile:profiles(*)
        `,
        )
        .order("created_at", { ascending: false })

      if (pharmaciesError) {
        console.error('Error fetching pharmacies:', pharmaciesError)
        console.error('Error details:', JSON.stringify(pharmaciesError, null, 2))
      }

      // Use the fetched data directly - no sample data insertion for real system
      const finalPharmaciesData = pharmaciesData

      // Get all pharmacy profiles for the dropdown - filter by role pharmacy
      const { data: allPharmaciesData, error: allPharmaciesError } = await supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          phone,
          role,
          pharmacy_profile:pharmacy_profiles(*)
        `)
        .eq("role", "pharmacy")
        .order("full_name")

      if (allPharmaciesError) {
        console.error('Error fetching all pharmacies:', allPharmaciesError)
        console.error('Error details:', JSON.stringify(allPharmaciesError, null, 2))
      }

      console.log('Fetched pharmacies:', finalPharmaciesData?.length || 0)
      console.log('Fetched all pharmacies:', allPharmaciesData?.length || 0)

      setPharmacies(finalPharmaciesData || [])
      setAllPharmacies(allPharmaciesData || [])
    } catch (error) {
      console.error('Error fetching pharmacies:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
    } finally {
      setLoading(false)
    }
  }

  // Removed sample data insertion function for real system


  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/30 to-background pb-6">
      <header className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-b-3xl shadow-lg mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building2 className="h-7 w-7" />
              إدارة الصيدليات
            </h1>
            <p className="text-purple-100 text-sm mt-1">مراجعة وتفعيل الصيدليات</p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/admin">رجوع</Link>
          </Button>
          {/* Removed sample data button for real system */}
        </div>
      </header>

      {/* Pharmacy Map Section */}
      <main className="p-4">
        <Card className="mb-6">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold text-purple-800">خريطة إدارة الصيدليات</h2>
            <p className="text-sm text-muted-foreground">إضافة وإدارة مواقع الصيدليات على الخريطة</p>
          </div>
          <PharmacyMap selectedPharmacy={selectedPharmacy} onPharmacySelect={setSelectedPharmacy} onLocationUpdate={() => {
            setSelectedPharmacy(null)
            fetchData()
          }} />
        </Card>

        {/* Subscription Management */}
        <SubscriptionManagement />

        {/* Pharmacy Activation Dropdown */}
        <Card className="mb-6">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-purple-800">تفعيل/إلغاء تفعيل الصيدليات</h3>
            <p className="text-sm text-muted-foreground">اختر صيدلية لتغيير حالة ظهورها على الخريطة</p>
          </div>
          <div className="p-4">
            <form action={togglePharmacyActive}>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="pharmacy-select">اختر الصيدلية</Label>
                  <Select name="pharmacy_id" required>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر صيدلية" />
                    </SelectTrigger>
                    <SelectContent>
                      {allPharmacies?.map((profile: any) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.pharmacy_profile?.pharmacy_name || profile.full_name} - {profile.phone || 'لا يوجد رقم هاتف'}
                          {profile.pharmacy_profile?.is_active ? ' (مفعل)' : ' (غير مفعل)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    name="action"
                    value="activate"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Eye className="ml-2 h-4 w-4" />
                    تفعيل
                  </Button>
                  <Button
                    type="submit"
                    name="action"
                    value="deactivate"
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <EyeOff className="ml-2 h-4 w-4" />
                    إلغاء التفعيل
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </Card>

        <div className="mb-4">
          <h2 className="text-xl font-semibold text-purple-800 mb-4">قائمة الصيدليات</h2>
        </div>
        {pharmacies && pharmacies.length > 0 ? (
          <div className="space-y-3">
            {pharmacies.map((pharmacy: any) => (
              <Card key={pharmacy.id} className="overflow-hidden border-2">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg">{pharmacy.pharmacy_name}</h3>
                        <Badge
                          className={
                            pharmacy.is_verified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {pharmacy.is_verified ? "مفعلة" : "قيد المراجعة"}
                        </Badge>
                        <Badge
                          className={
                            pharmacy.is_active ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
                          }
                        >
                          {pharmacy.is_active ? "مرئية على الخريطة" : "مخفية من الخريطة"}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedPharmacy(pharmacy)}
                          className="bg-purple-50 hover:bg-purple-100 border-purple-200"
                        >
                          <Map className="ml-1 h-3 w-3" />
                          تعليم على الخريطة
                        </Button>
                      </div>

                      <p className="text-sm text-muted-foreground mb-1">
                        المسؤول: {pharmacy.profile?.full_name || "غير محدد"}
                      </p>

                      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
                        <FileText className="h-4 w-4" />
                        <span>رقم الترخيص: {pharmacy.license_number}</span>
                      </div>

                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{pharmacy.address}</span>
                      </div>

                      {pharmacy.profile?.map_link && (
                        <div className="flex items-center gap-1 text-sm text-blue-600 mt-1">
                          <MapPin className="h-4 w-4" />
                          <span>رابط الخريطة: {pharmacy.profile.map_link}</span>
                        </div>
                      )}

                      {pharmacy.profile?.lat && pharmacy.profile?.lng && (
                        <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
                          <MapPin className="h-4 w-4" />
                          <span>الإحداثيات: {pharmacy.profile.lat}, {pharmacy.profile.lng}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Location Coordinates Section */}
                  {pharmacy.profile?.map_link && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">إحداثيات الموقع</h4>
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor={`lat-${pharmacy.id}`} className="text-xs">خط العرض (Latitude)</Label>
                            <Input
                              id={`lat-${pharmacy.id}`}
                              name="lat"
                              type="number"
                              step="0.000001"
                              placeholder="24.7136"
                              defaultValue={pharmacy.profile?.lat || ""}
                              className="text-xs h-8"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor={`lng-${pharmacy.id}`} className="text-xs">خط الطول (Longitude)</Label>
                            <Input
                              id={`lng-${pharmacy.id}`}
                              name="lng"
                              type="number"
                              step="0.000001"
                              placeholder="46.6753"
                              defaultValue={pharmacy.profile?.lng || ""}
                              className="text-xs h-8"
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label htmlFor={`lat-display-${pharmacy.id}`} className="text-xs">الإحداثيات المحفوظة</Label>
                            <div className="text-xs p-2 bg-gray-100 rounded h-8 flex items-center">
                              {pharmacy.profile?.lat ? `${pharmacy.profile.lat}, ${pharmacy.profile.lng}` : 'لا توجد إحداثيات'}
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs">الحالة</Label>
                            <div className="text-xs p-2 bg-green-100 text-green-800 rounded h-8 flex items-center">
                              {pharmacy.is_verified ? 'مفعلة' : 'غير مفعلة'}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <form action={extractCoordinates}>
                            <input type="hidden" name="pharmacy_id" value={pharmacy.id} />
                            <Button
                              type="submit"
                              className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                              استخراج الإحداثيات
                            </Button>
                          </form>
                          <form action={saveCoordinates}>
                            <input type="hidden" name="pharmacy_id" value={pharmacy.id} />
                            <input type="hidden" name="lat" value={pharmacy.profile?.lat || ""} />
                            <input type="hidden" name="lng" value={pharmacy.profile?.lng || ""} />
                            <Button
                              type="submit"
                              className="flex-1 bg-blue-600 hover:bg-blue-700"
                            >
                              <Save className="ml-1 h-3 w-3" />
                              حفظ الإحداثيات
                            </Button>
                          </form>
                        </div>
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        انسخ الإحداثيات من Google Maps (اضغط بزر الفأرة الأيمن → "ما هذا المكان؟")
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 mt-3">
                    {!pharmacy.is_verified ? (
                      <>
                        <form className="flex-1">
                          <Button
                            type="submit"
                            formAction={verifyPharmacy.bind(null, pharmacy.id)}
                            className="w-full bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="ml-2 h-4 w-4" />
                            تفعيل
                          </Button>
                        </form>
                        <form className="flex-1">
                          <Button
                            type="submit"
                            formAction={deletePharmacy.bind(null, pharmacy.id)}
                            variant="destructive"
                            className="w-full"
                          >
                            <X className="ml-2 h-4 w-4" />
                            رفض
                          </Button>
                        </form>
                      </>
                    ) : (
                      <form className="w-full">
                        <Button
                          type="submit"
                          formAction={unverifyPharmacy.bind(null, pharmacy.id)}
                          variant="outline"
                          className="w-full"
                        >
                          <RefreshCw className="ml-2 h-4 w-4" />
                          إلغاء التفعيل
                        </Button>
                      </form>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold mb-2">لا توجد صيدليات</h3>
            <p className="text-sm text-muted-foreground">لم يتم تسجيل أي صيدليات بعد</p>
          </Card>
        )}
      </main>
    </div>
  )
}
