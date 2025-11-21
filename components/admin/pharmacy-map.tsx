"use client"

import { useEffect, useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPin, Save, Trash2, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })

// Import useMapEvents normally as it's a hook
import { useMapEvents } from 'react-leaflet'

// Import leaflet CSS
import 'leaflet/dist/leaflet.css'

// Fix for default markers in react-leaflet - moved to client side
const setupLeafletIcons = () => {
  if (typeof window !== 'undefined') {
    const L = require('leaflet')
    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    })
  }
}

// Pharmacy marker icon - using the new pharmacy icon URL
const getPharmacyIcon = () => {
  if (typeof window !== 'undefined') {
    const L = require('leaflet')
    return new L.Icon({
      iconUrl: 'https://thumbs.dreamstime.com/b/simbolo-farmacologico-con-calice-e-serpente-icona-ombra-sullo-sfondo-beige-illustrazione-di-medicina-impiego-medicinali-piatti-166311716.jpg',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40],
      shadowSize: [41, 41]
    })
  }
  return null
}

// Component to handle map events
function MapEventHandler({ onMapClick }: { onMapClick: (e: any) => void }) {
  useMapEvents({
    click: onMapClick,
  })
  return null
}

interface PharmacyMarker {
  id: string
  lat: number
  lng: number
  pharmacy_name: string
  isNew?: boolean
}

interface PharmacyMapProps {
  onLocationUpdate?: () => void
  selectedPharmacy?: any
  onPharmacySelect?: (pharmacy: any) => void
}

export function PharmacyMap({ onLocationUpdate, selectedPharmacy, onPharmacySelect }: PharmacyMapProps) {
  const [pharmacies, setPharmacies] = useState<PharmacyMarker[]>([])
  const [isClient, setIsClient] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [pharmacyName, setPharmacyName] = useState('')
  const [isAddingPharmacy, setIsAddingPharmacy] = useState(false)
  const mapRef = useRef<any>(null)
  const mapKey = useRef(Date.now()) // Add unique key to force remount
  const { toast } = useToast()

  useEffect(() => {
    setIsClient(true)
    setupLeafletIcons()
    fetchPharmacies()
  }, [])

  useEffect(() => {
    if (isClient) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        setMapReady(true)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isClient])

  const fetchPharmacies = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('pharmacy_profiles')
        .select(`
          id,
          pharmacy_name,
          latitude,
          longitude,
          profile:profiles(lat, lng)
        `)
        // Temporarily remove filters to see all pharmacies
        // .eq('is_verified', true) // Only show verified pharmacies
        // .eq('is_active', true) // Only show active pharmacies
        // .not('profile.lat', 'is', null)
        // .not('profile.lng', 'is', null)

      if (error) {
        console.error('Error fetching pharmacies:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
      } else {
        console.log('Fetched pharmacy markers data:', data)
        const pharmacyMarkers = data?.map(pharmacy => {
          // Use pharmacy profile coordinates first, then profile coordinates
          const lat = pharmacy.latitude || (Array.isArray(pharmacy.profile) ? pharmacy.profile[0]?.lat : pharmacy.profile?.lat) || 0
          const lng = pharmacy.longitude || (Array.isArray(pharmacy.profile) ? pharmacy.profile[0]?.lng : pharmacy.profile?.lng) || 0
          return {
            id: pharmacy.id,
            lat: lat,
            lng: lng,
            pharmacy_name: pharmacy.pharmacy_name
          }
        }) || []
        console.log('Processed pharmacy markers:', pharmacyMarkers)
        setPharmacies(pharmacyMarkers)
      }
    } catch (err) {
      console.error('Unexpected error fetching pharmacies:', err)
      console.error('Error details:', JSON.stringify(err, null, 2))
    }
  }

  const handleMapClick = (e: any) => {
    if (isAddingPharmacy) {
      const { lat, lng } = e.latlng

      // Create a new pharmacy marker
      const newPharmacy: PharmacyMarker = {
        id: `temp-${Date.now()}`,
        lat,
        lng,
        pharmacy_name: '',
        isNew: true
      }

      onPharmacySelect?.(newPharmacy)
      setIsAddingPharmacy(false)
    }
  }

  const handleSaveCoordinates = async () => {
    if (!selectedPharmacy || !pharmacyName.trim()) return

    try {
      const supabase = createClient()

      if (selectedPharmacy.isNew) {
        // Create a new pharmacy record with coordinates
        // First create the profile, then the pharmacy profile
        const profileId = crypto.randomUUID()

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: profileId,
            full_name: pharmacyName,
            role: 'pharmacy',
            lat: selectedPharmacy.lat,
            lng: selectedPharmacy.lng,
            phone: '+213000000000' // Default phone
          })
          .select()
          .single()

        if (profileError) {
          console.error('Error creating profile:', profileError)
          console.error('Profile error details:', JSON.stringify(profileError, null, 2))
          toast({
            title: "خطأ في إنشاء الصيدلية",
            description: "حدث خطأ أثناء إنشاء ملف الصيدلية: " + profileError.message,
            variant: "destructive",
          })
          return
        }

        const { error: pharmacyError } = await supabase
          .from('pharmacy_profiles')
          .insert({
            id: profileId,
            pharmacy_name: pharmacyName,
            address: 'العنوان سيتم تحديثه لاحقاً', // Placeholder
            license_number: `TEMP-${Date.now()}`, // Temporary license
            latitude: selectedPharmacy.lat,
            longitude: selectedPharmacy.lng,
            is_verified: true, // Auto-verify admin created pharmacies
            is_active: true
          })

        if (pharmacyError) {
          console.error('Error creating pharmacy profile:', pharmacyError)
          console.error('Pharmacy error details:', JSON.stringify(pharmacyError, null, 2))
          toast({
            title: "خطأ في إنشاء الصيدلية",
            description: "حدث خطأ أثناء إنشاء ملف الصيدلية: " + pharmacyError.message,
            variant: "destructive",
          })
          return
        }

        toast({
          title: "تم إنشاء الصيدلية بنجاح",
          description: `تم إضافة الصيدلية ${pharmacyName} إلى الخريطة`,
        })
      } else {
        // Update existing pharmacy coordinates
        const { error } = await supabase
          .from('profiles')
          .update({
            lat: selectedPharmacy.lat,
            lng: selectedPharmacy.lng
          })
          .eq('id', selectedPharmacy.id)

        if (error) {
          console.error('Error updating coordinates:', error)
          toast({
            title: "خطأ في تحديث الموقع",
            description: "حدث خطأ أثناء تحديث موقع الصيدلية",
            variant: "destructive",
          })
          return
        }

        toast({
          title: "تم تحديث موقع الصيدلية بنجاح",
          description: `تم تحديث موقع ${selectedPharmacy.pharmacy_name}`,
        })
      }

      // Refresh pharmacies list
      fetchPharmacies()
      onLocationUpdate?.()

      onPharmacySelect?.(null)
      setPharmacyName('')
    } catch (err) {
      console.error('Error saving coordinates:', err)
      toast({
        title: "خطأ في حفظ الموقع",
        description: "حدث خطأ غير متوقع",
        variant: "destructive",
      })
    }
  }

  const handleMarkerClick = (pharmacy: PharmacyMarker) => {
    onPharmacySelect?.(pharmacy)
    setPharmacyName(pharmacy.pharmacy_name)
  }

  const handleDeletePharmacy = async (pharmacy: PharmacyMarker) => {
    if (!confirm(`هل أنت متأكد من حذف الصيدلية "${pharmacy.pharmacy_name}"؟`)) return

    try {
      const supabase = createClient()

      // Delete pharmacy profile first (cascade will handle profile deletion)
      const { error } = await supabase
        .from('pharmacy_profiles')
        .delete()
        .eq('id', pharmacy.id)

      if (error) {
        console.error('Error deleting pharmacy:', error)
        toast({
          title: "خطأ في حذف الصيدلية",
          description: "حدث خطأ أثناء حذف الصيدلية",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "تم حذف الصيدلية بنجاح",
        description: `تم حذف الصيدلية ${pharmacy.pharmacy_name}`,
      })

      fetchPharmacies()
      onLocationUpdate?.()
    } catch (err) {
      console.error('Error deleting pharmacy:', err)
      toast({
        title: "خطأ في حذف الصيدلية",
        description: "حدث خطأ غير متوقع",
        variant: "destructive",
      })
    }
  }

  if (!isClient) {
    return (
      <Card className="overflow-hidden h-96 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
          <div className="text-center space-y-2">
            <MapPin className="h-8 w-8 text-purple-600 mx-auto animate-pulse" />
            <p className="text-sm text-muted-foreground">جاري تحميل الخريطة...</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden h-96 relative">
      <div className="p-4 border-b space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-purple-800">إدارة مواقع الصيدليات</h3>
          <p className="text-sm text-muted-foreground">
            انقر على زر "إضافة صيدلية" ثم انقر على الخريطة لتحديد موقعها
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setIsAddingPharmacy(true)}
            disabled={isAddingPharmacy}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="ml-1 h-4 w-4" />
            إضافة صيدلية
          </Button>
          {isAddingPharmacy && (
            <Button
              variant="outline"
              onClick={() => setIsAddingPharmacy(false)}
            >
              إلغاء
            </Button>
          )}
        </div>

        {isAddingPharmacy && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm font-medium text-blue-800">
              انقر على الموقع المطلوب على الخريطة لإضافة صيدلية جديدة
            </p>
          </div>
        )}
      </div>

      {mapReady && (
        <MapContainer
          key={mapKey.current} // Add unique key to force remount
          center={[28.0339, 1.6596]} // Algeria coordinates
          zoom={6}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <MapEventHandler onMapClick={handleMapClick} />

          {/* Existing pharmacy markers */}
          {pharmacies.map((pharmacy) => (
            <Marker
              key={pharmacy.id}
              position={[pharmacy.lat, pharmacy.lng]}
              icon={getPharmacyIcon() || undefined}
              eventHandlers={{
                click: () => handleMarkerClick(pharmacy)
              }}
            >
              <Popup>
                <div className="text-center space-y-2 min-w-[200px]">
                  <h3 className="font-bold text-lg">{pharmacy.pharmacy_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {pharmacy.lat.toFixed(6)}, {pharmacy.lng.toFixed(6)}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleMarkerClick(pharmacy)}
                      className="flex-1 bg-purple-600 hover:bg-purple-700"
                    >
                      تحديث الموقع
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeletePharmacy(pharmacy)}
                      className="flex-1"
                    >
                      <Trash2 className="ml-1 h-3 w-3" />
                      حذف
                    </Button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Temporary marker for new pharmacy */}
          {selectedPharmacy && selectedPharmacy.isNew && (
            <Marker
              position={[selectedPharmacy.lat, selectedPharmacy.lng]}
              icon={getPharmacyIcon() || undefined}
            >
              <Popup>
                <div className="space-y-3 min-w-[250px]">
                  <h3 className="font-bold text-center">إضافة صيدلية جديدة</h3>
                  <div>
                    <Label htmlFor="pharmacy-name">اسم الصيدلية</Label>
                    <Input
                      id="pharmacy-name"
                      value={pharmacyName}
                      onChange={(e) => setPharmacyName(e.target.value)}
                      placeholder="أدخل اسم الصيدلية"
                      className="mt-1"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    {selectedPharmacy.lat.toFixed(6)}, {selectedPharmacy.lng.toFixed(6)}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveCoordinates}
                      disabled={!pharmacyName.trim()}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <Save className="ml-1 h-3 w-3" />
                      حفظ الإحداثيات
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onPharmacySelect?.(null)}
                      className="flex-1"
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      )}

      {/* Update existing pharmacy popup */}
      {selectedPharmacy && !selectedPharmacy.isNew && (
        <div className="absolute top-4 left-4 right-4 bg-white p-4 rounded-lg shadow-lg border z-10">
          <h3 className="font-bold text-lg mb-3">تحديث موقع الصيدلية</h3>
          <div className="space-y-3">
            <div>
              <Label>اسم الصيدلية</Label>
              <Input
                value={pharmacyName}
                onChange={(e) => setPharmacyName(e.target.value)}
                placeholder="أدخل اسم الصيدلية"
              />
            </div>
            <p className="text-sm text-muted-foreground">
              انقر على الموقع الجديد على الخريطة لتحديث الإحداثيات
            </p>
            <div className="flex gap-2">
              <Button
                onClick={handleSaveCoordinates}
                disabled={!pharmacyName.trim()}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                <Save className="ml-1 h-3 w-3" />
                حفظ التحديث
              </Button>
              <Button
                variant="outline"
                onClick={() => onPharmacySelect?.(null)}
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
