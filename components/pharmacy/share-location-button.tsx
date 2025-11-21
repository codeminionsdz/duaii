"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MapPin, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export function ShareLocationButton() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const handleShareLocation = async () => {
    setIsLoading(true)

    try {
      // Request geolocation permission
      if (!navigator.geolocation) {
        toast({
          title: "خطأ",
          description: "المتصفح لا يدعم تحديد الموقع",
          variant: "destructive",
        })
        return
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        })
      })

      const { latitude, longitude } = position.coords

      // Update pharmacy profile with coordinates
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast({
          title: "خطأ",
          description: "يجب تسجيل الدخول أولاً",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase
        .from('pharmacy_profiles')
        .update({
          latitude,
          longitude,
        })
        .eq('id', user.id)

      if (error) {
        console.error('Error updating pharmacy location:', error)
        toast({
          title: "خطأ",
          description: "فشل في حفظ الموقع",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "✅ تم حفظ موقعك بنجاح!",
        description: "",
      })
    } catch (error) {
      console.error('Error sharing location:', error)
      toast({
        title: "❌ فشل تحديد الموقع.",
        description: "",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleShareLocation}
      disabled={isLoading}
      className="w-full h-12 bg-green-600 hover:bg-green-700"
    >
      {isLoading ? (
        <Loader2 className="ml-2 h-5 w-5 animate-spin" />
      ) : (
        <MapPin className="ml-2 h-5 w-5" />
      )}
      {isLoading ? "جاري مشاركة الموقع..." : "مشاركة موقعي"}
    </Button>
  )
}
