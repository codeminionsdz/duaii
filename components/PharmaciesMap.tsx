"use client"

import { useState, useEffect, useCallback } from 'react'
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api'
import { createClient } from '@/lib/supabase/client'
import { extractLatLngFromGoogleMapsUrl } from '@/lib/utils/geocoding'

const containerStyle = {
  width: '100%',
  height: '400px'
}

const defaultCenter = {
  lat: 24.7136,
  lng: 46.6753
}

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  styles: [
    {
      featureType: "all",
      elementType: "labels",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "road",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "poi",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "transit",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "landscape",
      elementType: "geometry",
      stylers: [{ color: "#f5f5f5" }]
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#e0e0e0" }]
    }
  ]
}

interface Pharmacy {
  id: string
  name: string
  lat: number
  lng: number
  address: string
}

export default function PharmaciesMap() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [center, setCenter] = useState(defaultCenter)

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
  })

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    setMap(map)
  }, [])

  const onUnmount = useCallback(function callback(map: google.maps.Map) {
    setMap(null)
  }, [])

  useEffect(() => {
    const fetchPharmacies = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('pharmacy_profiles')
          .select(`
            *,
            profiles!inner(map_link)
          `)
          .eq('is_verified', true)

        if (error) {
          console.error('Error fetching pharmacies:', error)
          return
        }

        const pharmaciesWithCoords: Pharmacy[] = []

        for (const pharmacy of data) {
          const coords = extractLatLngFromGoogleMapsUrl(pharmacy.profiles.map_link)
          if (coords) {
            pharmaciesWithCoords.push({
              id: pharmacy.id,
              name: pharmacy.pharmacy_name,
              lat: coords.lat,
              lng: coords.lng,
              address: pharmacy.address
            })
          }
        }

        setPharmacies(pharmaciesWithCoords)

        // Calculate center based on all pharmacies
        if (pharmaciesWithCoords.length > 0) {
          const avgLat = pharmaciesWithCoords.reduce((sum, p) => sum + p.lat, 0) / pharmaciesWithCoords.length
          const avgLng = pharmaciesWithCoords.reduce((sum, p) => sum + p.lng, 0) / pharmaciesWithCoords.length
          setCenter({ lat: avgLat, lng: avgLng })
        }
      } catch (err) {
        console.error('Error fetching pharmacies:', err)
      }
    }

    if (isLoaded) {
      fetchPharmacies()
    }
  }, [isLoaded])

  const pharmacyIcon = isLoaded ? {
    url: '/images/pharmacy_icon.png',
    scaledSize: new window.google.maps.Size(32, 32),
    anchor: new window.google.maps.Point(16, 32)
  } : null

  return isLoaded ? (
    <div className="w-full h-96 rounded-lg overflow-hidden border">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={10}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      >
        {pharmacies.map((pharmacy) => (
          <Marker
            key={pharmacy.id}
            position={{ lat: pharmacy.lat, lng: pharmacy.lng }}
            icon={pharmacyIcon}
            title={pharmacy.name}
          />
        ))}
      </GoogleMap>
    </div>
  ) : (
    <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600">جاري تحميل الخريطة...</p>
      </div>
    </div>
  )
}
