import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PharmacyBottomNav } from "@/components/layout/pharmacy-bottom-nav"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, MapPin, FileText, Phone, Mail, LogOut, Save } from "lucide-react"
import Image from "next/image"
import { extractLatLngFromGoogleMapsUrl, geocodeAddress } from "@/lib/utils/geocoding"

export default async function PharmacyProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "pharmacy") {
    redirect("/home")
  }

  const { data: pharmacyProfile } = await supabase.from("pharmacy_profiles").select("*").eq("id", user.id).single()

  let finalPharmacyProfile = pharmacyProfile
  if (!pharmacyProfile) {
    console.log('Creating pharmacy profile for user:', user.id)
    const { error: createError } = await supabase.from("pharmacy_profiles").insert({
      id: user.id,
      pharmacy_name: '',
      license_number: '',
      address: ''
    })

    if (createError) {
      if (createError.code === '23505') {
        // Already exists, fetch it
        const { data: existingProfile } = await supabase.from("pharmacy_profiles").select("*").eq("id", user.id).single()
        finalPharmacyProfile = existingProfile
      } else {
        console.error('Error creating pharmacy profile:', createError)
      }
    } else {
      console.log('Pharmacy profile created successfully')
      // Refetch the profile
      const { data: newProfile } = await supabase.from("pharmacy_profiles").select("*").eq("id", user.id).single()
      finalPharmacyProfile = newProfile
    }
  }

  // Handle form submission for updating profile
  async function updateProfile(formData: FormData) {
    'use server'

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect("/auth/login")
    }

    const mapLink = formData.get('map_link') as string
    const phone = formData.get('phone') as string
    const pharmacyName = formData.get('pharmacy_name') as string || finalPharmacyProfile?.pharmacy_name || ""
    const licenseNumber = formData.get('license_number') as string || finalPharmacyProfile?.license_number || ""
    const address = formData.get('address') as string || finalPharmacyProfile?.address || ""

    let lat: number | null = null
    let lng: number | null = null

    // Extract coordinates from Google Maps URL
    if (mapLink) {
      const extractedCoords = extractLatLngFromGoogleMapsUrl(mapLink)
      if (extractedCoords) {
        lat = extractedCoords.lat
        lng = extractedCoords.lng
        console.log('Extracted coordinates from map link:', extractedCoords)
      } else {
        // Fallback to geocoding the address
        console.log('No coordinates found in map link, trying to geocode address:', address)
        const geocodedCoords = await geocodeAddress(address)
        if (geocodedCoords) {
          lat = geocodedCoords.lat
          lng = geocodedCoords.lng
          console.log('Geocoded coordinates from address:', geocodedCoords)
        } else {
          console.log('Could not geocode address:', address)
        }
      }
    } else {
      // No map link provided, try geocoding the address
      console.log('No map link provided, trying to geocode address:', address)
      const geocodedCoords = await geocodeAddress(address)
      if (geocodedCoords) {
        lat = geocodedCoords.lat
        lng = geocodedCoords.lng
        console.log('Geocoded coordinates from address:', geocodedCoords)
      } else {
        console.log('Could not geocode address:', address)
      }
    }

    console.log('Updating pharmacy profile:', {
      userId: user.id,
      pharmacyName,
      licenseNumber,
      address,
      mapLink,
      phone
    })

    // Update profiles table
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        map_link: mapLink || null,
        lat,
        lng,
        phone: phone || null
      })
      .eq('id', user.id)

    if (profileError) {
      console.error('Error updating profile:', profileError)
      // Don't redirect on error, let user try again
      return
    }

    // Update pharmacy_profiles table
    const { error: pharmacyError } = await supabase
      .from('pharmacy_profiles')
      .update({
        pharmacy_name: pharmacyName,
        license_number: licenseNumber,
        address: address
      })
      .eq('id', user.id)

    if (pharmacyError) {
      console.error('Error updating pharmacy profile:', pharmacyError)
      // Don't redirect on error, let user try again
      return
    }

    console.log('Pharmacy profile updated successfully')

    // Revalidate the page
    redirect("/pharmacy/profile")
  }

  return (
    <div className="min-h-screen pb-20">
      <header className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-b-3xl shadow-lg mb-6">
        <div className="flex flex-col items-center text-center">
          <div className="relative w-20 h-20 mb-3">
            <Image src="/images/logo.png" alt="دوائي" fill className="object-contain" />
          </div>
          <h1 className="text-2xl font-bold">{pharmacyProfile?.pharmacy_name || "صيدلية"}</h1>
          <p className="text-blue-100 text-sm">{profile.full_name}</p>
        </div>
      </header>

      <main className="p-4 space-y-4">
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-blue-600" />
              معلومات الصيدلية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pharmacy_name">اسم الصيدلية</Label>
                <Input
                  id="pharmacy_name"
                  name="pharmacy_name"
                  type="text"
                  placeholder="صيدلية النور"
                  defaultValue={finalPharmacyProfile?.pharmacy_name || ""}
                  className="text-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="license_number">رقم الترخيص</Label>
                <Input
                  id="license_number"
                  name="license_number"
                  type="text"
                  placeholder="123456"
                  defaultValue={finalPharmacyProfile?.license_number || ""}
                  className="text-sm"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">العنوان</Label>
                <Input
                  id="address"
                  name="address"
                  type="text"
                  placeholder="شارع الملك فهد، الرياض"
                  defaultValue={finalPharmacyProfile?.address || ""}
                  className="text-sm"
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                <Save className="ml-2 h-4 w-4" />
                حفظ التغييرات
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              معلومات الموقع والخريطة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="map_link">رابط Google Maps (اختياري)</Label>
                <Input
                  id="map_link"
                  name="map_link"
                  type="url"
                  placeholder="https://www.google.com/maps/place/..."
                  defaultValue={profile.map_link || ""}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  انسخ الرابط من Google Maps لعرض موقع الصيدلية على الخريطة
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">رقم الجوال</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+966501234567"
                  defaultValue={profile.phone || ""}
                  className="text-sm"
                />
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                <Save className="ml-2 h-4 w-4" />
                حفظ التغييرات
              </Button>
            </form>

            {profile.map_link && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-1">الرابط المحفوظ:</p>
                <p className="text-xs text-blue-600 break-all">{profile.map_link}</p>
              </div>
            )}

            {profile.phone && (
              <div className="mt-2 p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-800 mb-1">رقم الجوال المحفوظ:</p>
                <p className="text-sm text-green-600">{profile.phone}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              معلومات الاتصال
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">البريد الإلكتروني</p>
                <p className="font-semibold">{user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <form action="/auth/signout" method="post">
          <Button variant="destructive" className="w-full" type="submit">
            <LogOut className="ml-2 h-5 w-5" />
            تسجيل الخروج
          </Button>
        </form>
      </main>

      <PharmacyBottomNav />
    </div>
  )
}
