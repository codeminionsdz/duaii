"use client"

import { useEffect, useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Navigation } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { PharmacyProfile } from '@/lib/types'

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })
const Polyline = dynamic(() => import('react-leaflet').then(mod => mod.Polyline), { ssr: false })

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

// User location marker icon - created on client side
const getUserIcon = () => {
  if (typeof window !== 'undefined') {
    const L = require('leaflet')
    return new L.Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    })
  }
  return null
}

// Pharmacy marker icon - shows individual logos or unified icon
const getPharmacyIcon = (pharmacy: PharmacyWithCoords) => {
  if (typeof window !== 'undefined') {
    const L = require('leaflet')
    if (pharmacy.logo_url) {
      return new L.DivIcon({
        html: `<div style="position: relative; width: 40px; height: 40px; border-radius: 50%; overflow: hidden; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
          <img src="${pharmacy.logo_url}" style="width: 100%; height: 100%; object-fit: cover;" />
        </div>`,
        className: 'custom-pharmacy-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 40]
      })
    } else {
      return new L.Icon({
        iconUrl: '/images/pharmacy_icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40],
        shadowSize: [41, 41]
      })
    }
  }
  return null
}

interface PharmacyWithCoords extends PharmacyProfile {
  lat: number
  lng: number
  distance?: number
}

interface UserLocation {
  lat: number
  lng: number
}

interface InteractiveMapProps {
  selectedPharmacy?: PharmacyWithCoords | null | undefined
  onPharmacySelect?: (pharmacy: PharmacyWithCoords) => void
  pharmacyToFocus?: string | null
}

export function InteractiveMap({ selectedPharmacy, onPharmacySelect, pharmacyToFocus }: InteractiveMapProps) {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [pharmacies, setPharmacies] = useState<PharmacyWithCoords[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt' | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [route, setRoute] = useState<[number, number][]>([])
  const [routingControl, setRoutingControl] = useState<any>(null)
  const mapRef = useRef<any>(null)

  useEffect(() => {
    setIsClient(true)
    setupLeafletIcons()
  }, [])

  // Handle pharmacy focusing when pharmacyToFocus changes
  useEffect(() => {
    if (pharmacyToFocus && pharmacies.length > 0 && mapRef.current) {
      const pharmacy = pharmacies.find(p => p.id === pharmacyToFocus)
      if (pharmacy && mapRef.current) {
        // Pan to the pharmacy location and zoom
        mapRef.current.setView([pharmacy.lat, pharmacy.lng], 15)
      }
    }
  }, [pharmacyToFocus, pharmacies])

  useEffect(() => {
    if (!isClient) return

    // Check if location permission was previously granted
    const savedLocation = localStorage.getItem('userLocation')
    const savedPermission = localStorage.getItem('locationPermission') as 'granted' | 'denied' | null

    if (savedLocation && savedPermission === 'granted') {
      const location = JSON.parse(savedLocation)
      setUserLocation(location)
      setLocationPermission('granted')
      // Fetch pharmacies after location is set
      fetchPharmacies()
      setIsLoading(false)
      return
    }

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          setUserLocation(location)
          setLocationPermission('granted')
          // Save to localStorage
          localStorage.setItem('userLocation', JSON.stringify(location))
          localStorage.setItem('locationPermission', 'granted')
          // Fetch pharmacies after location is set
          fetchPharmacies()
        },
        (error) => {
          console.error('Error getting location:', error)
          setLocationPermission('denied')
          localStorage.setItem('locationPermission', 'denied')
          // Fallback to Riyadh coordinates
          const fallbackLocation = { lat: 24.7136, lng: 46.6753 }
          setUserLocation(fallbackLocation)
          localStorage.setItem('userLocation', JSON.stringify(fallbackLocation))
          // Fetch pharmacies even with fallback location
          fetchPharmacies()
        }
      )
    } else {
      // Geolocation not supported
      setLocationPermission('denied')
      const fallbackLocation = { lat: 24.7136, lng: 46.6753 }
      setUserLocation(fallbackLocation)
      // Fetch pharmacies with fallback location
      fetchPharmacies()
    }

    setIsLoading(false)
  }, [isClient])

  const fetchPharmacies = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('pharmacy_profiles')
        .select(`
          *,
          profiles!inner(map_link, lat, lng, phone, logo_url)
        `)
        .eq('is_verified', true) // Only show verified pharmacies
        .eq('is_active', true) // Only show active pharmacies
        .not('profiles.lat', 'is', null)
        .not('profiles.lng', 'is', null)

      if (error) {
        console.error('Error fetching pharmacies:', error)
        console.error('Error details:', error.message, error.details, error.hint)
      } else {
        console.log('Raw pharmacy data from database:', data)
        const pharmaciesWithCoords = data?.map(pharmacy => {
          console.log(`Processing pharmacy: ${pharmacy.pharmacy_name}`)
          console.log(`Pharmacy coordinates - lat: ${pharmacy.profiles.lat}, lng: ${pharmacy.profiles.lng}`)
          const distance = userLocation ? calculateDistance(userLocation.lat, userLocation.lng, pharmacy.profiles.lat, pharmacy.profiles.lng) : 0
          console.log(`Calculated distance: ${distance.toFixed(2)} km for pharmacy ${pharmacy.pharmacy_name}`)
          return {
            ...pharmacy,
            lat: pharmacy.profiles.lat,
            lng: pharmacy.profiles.lng,
            map_link: pharmacy.profiles.map_link,
            phone: pharmacy.profiles.phone,
            logo_url: pharmacy.profiles.logo_url,
            distance
          }
        }) || [] // Removed distance filter to show all verified pharmacies globally
        console.log(`Total pharmacies found: ${pharmaciesWithCoords.length}`)
        // Sort by distance if user location is available
        if (userLocation) {
          pharmaciesWithCoords.sort((a, b) => a.distance - b.distance)
        }
        setPharmacies(pharmaciesWithCoords)
      }
    } catch (err) {
      console.error('Unexpected error fetching pharmacies:', err)
    }
  }

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    const distance = R * c // Distance in km
    return distance
  }

  const handleGoToPharmacy = (pharmacy: PharmacyWithCoords) => {
    if (!userLocation) {
      alert('يجب السماح بالوصول إلى الموقع لتحديد طريق الصيدلية')
      return
    }

    if (mapRef.current) {
      // Clear existing route
      if (routingControl) {
        mapRef.current.removeControl(routingControl)
      }

      // Create new routing control
      const L = require('leaflet')
      const Routing = require('leaflet-routing-machine')

      const newRoutingControl = Routing.control({
        waypoints: [
          L.latLng(userLocation.lat, userLocation.lng),
          L.latLng(pharmacy.lat, pharmacy.lng)
        ],
        routeWhileDragging: false,
        createMarker: () => null, // No markers on route
        lineOptions: {
          styles: [{ color: '#2563eb', weight: 6, opacity: 0.8 }] // Blue route line
        },
        show: false, // Hide the routing panel
        addWaypoints: false
      }).addTo(mapRef.current)

      setRoutingControl(newRoutingControl)

      // Fit map to show the full route
      setTimeout(() => {
        const bounds = L.latLngBounds([
          [userLocation.lat, userLocation.lng],
          [pharmacy.lat, pharmacy.lng]
        ])
        mapRef.current.fitBounds(bounds, { padding: [20, 20] })
      }, 1000)
    }
  }

  if (isLoading) {
    return (
      <Card className="overflow-hidden h-64 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center">
          <div className="text-center space-y-2">
            <MapPin className="h-8 w-8 text-emerald-600 mx-auto animate-pulse" />
            <p className="text-sm text-muted-foreground">جاري تحميل الخريطة...</p>
          </div>
        </div>
      </Card>
    )
  }

  if (!userLocation) {
    return (
      <Card className="overflow-hidden h-64 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center">
          <div className="text-center space-y-2">
            <MapPin className="h-8 w-8 text-emerald-600 mx-auto" />
            <p className="text-sm text-muted-foreground">يرجى السماح بالوصول للموقع</p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden h-64 relative">
      <MapContainer
        center={[userLocation.lat, userLocation.lng]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* User location marker */}
        <Marker
          position={[userLocation.lat, userLocation.lng]}
          icon={getUserIcon() || undefined}
        >
          <Popup>
            <div className="text-center">
              <p className="font-semibold">موقعي الحالي</p>
            </div>
          </Popup>
        </Marker>

        {/* Pharmacy markers */}
        {pharmacies.map((pharmacy) => (
          <Marker
            key={pharmacy.id}
            position={[pharmacy.lat, pharmacy.lng]}
            icon={getPharmacyIcon(pharmacy) || undefined}
            eventHandlers={{
              click: () => onPharmacySelect?.(pharmacy)
            }}
          >
            <Popup>
              <div className="text-center space-y-2 min-w-[200px]">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="font-bold text-lg">{pharmacy.pharmacy_name}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{pharmacy.address}</p>
                {pharmacy.distance && (
                  <p className="text-sm text-emerald-600 font-medium">📍 {pharmacy.distance.toFixed(1)} كم</p>
                )}
                {pharmacy.phone && (
                  <p className="text-sm">📞 {pharmacy.phone}</p>
                )}
                <Button
                  size="sm"
                  onClick={() => handleGoToPharmacy(pharmacy)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  <Navigation className="ml-1 h-3 w-3" />
                  اذهب إلى الصيدلية
                </Button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Card>
  )
}
