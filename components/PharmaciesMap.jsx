// Required env variables: VITE_GOOGLE_MAPS_API_KEY
// Note: Supabase client is already set up in the project

import { useState, useEffect, useCallback } from 'react'
import { GoogleMap, useJsApiLoader, Marker, DirectionsService, DirectionsRenderer } from '@react-google-maps/api'
import { createClient } from '@/lib/supabase/client'

const containerStyle = {
  width: '100%',
  height: '400px'
}

const defaultCenter = {
  lat: 24.7136,
  lng: 46.6753
}

const blankMapStyle = [
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

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  styles: blankMapStyle
}

export default function PharmaciesMap() {
  const [pharmacies, setPharmacies] = useState([])
  const [userLocation, setUserLocation] = useState(null)
  const [directions, setDirections] = useState(null)
  const [selectedPharmacy, setSelectedPharmacy] = useState(null)
  const [map, setMap] = useState(null)
  const [loading, setLoading] = useState(true)

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
  })

  const onLoad = useCallback(function callback(mapInstance) {
    setMap(mapInstance)
  }, [])

  const onUnmount = useCallback(function callback(mapInstance) {
    setMap(null)
  }, [])

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.warn('Geolocation denied or failed:', error.message)
          setUserLocation(null) // Fallback
        }
      )
    } else {
      console.warn('Geolocation not supported')
      setUserLocation(null)
    }
  }, [])

  useEffect(() => {
    const fetchPharmacies = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('pharmacy_profiles')
          .select(`
            *,
            profiles!inner(lat, lng)
          `)
          .not('profiles.lat', 'is', null)
          .not('profiles.lng', 'is', null)
          .eq('is_verified', true)

        if (error) {
          console.error('Error fetching pharmacies:', error)
          return
        }

        const validPharmacies = []
        data.forEach(pharmacy => {
          if (pharmacy.profiles.lat && pharmacy.profiles.lng) {
            validPharmacies.push({
              id: pharmacy.id,
              name: pharmacy.pharmacy_name,
              lat: pharmacy.profiles.lat,
              lng: pharmacy.profiles.lng
            })
          } else {
            console.warn(`Pharmacy ${pharmacy.pharmacy_name} lacks latitude/longitude, skipping`)
          }
        })

        setPharmacies(validPharmacies)
      } catch (err) {
        console.error('Error fetching pharmacies:', err)
      }
    }

    if (isLoaded) {
      fetchPharmacies()
    }
  }, [isLoaded])

  useEffect(() => {
    if (map && pharmacies.length > 0) {
      const bounds = new window.google.maps.LatLngBounds()
      pharmacies.forEach(pharmacy => {
        bounds.extend({ lat: pharmacy.lat, lng: pharmacy.lng })
      })
      if (userLocation) {
        bounds.extend(userLocation)
      }
      map.fitBounds(bounds)
      setLoading(false)
    } else if (map && pharmacies.length === 0) {
      setLoading(false)
    }
  }, [map, pharmacies, userLocation])

  const handlePharmacyClick = (pharmacy) => {
    setSelectedPharmacy(pharmacy)
    if (userLocation) {
      const directionsService = new window.google.maps.DirectionsService()
      directionsService.route(
        {
          origin: userLocation,
          destination: { lat: pharmacy.lat, lng: pharmacy.lng },
          travelMode: window.google.maps.TravelMode.DRIVING
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            setDirections(result)
          } else {
            console.error('Directions request failed:', status)
          }
        }
      )
    } else {
      // Fallback: open in Google Maps
      const url = `https://www.google.com/maps/dir/?api=1&destination=${pharmacy.lat},${pharmacy.lng}`
      window.open(url, '_blank')
    }
  }

  const pharmacyIcon = isLoaded ? {
    url: '/pharmacy_icon.png',
    scaledSize: new window.google.maps.Size(32, 32),
    anchor: new window.google.maps.Point(16, 32)
  } : null

  const userIcon = isLoaded ? {
    path: window.google.maps.SymbolPath.CIRCLE,
    scale: 8,
    fillColor: '#4285F4',
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2
  } : null

  if (!isLoaded || loading) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">جاري تحميل الخريطة...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={10}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      >
        {userLocation && (
          <Marker
            position={userLocation}
            icon={userIcon}
            title="موقعك الحالي"
          />
        )}
        {pharmacies.map((pharmacy) => (
          <Marker
            key={pharmacy.id}
            position={{ lat: pharmacy.lat, lng: pharmacy.lng }}
            icon={pharmacyIcon}
            title={pharmacy.name}
            onClick={() => handlePharmacyClick(pharmacy)}
            label={{
              text: pharmacy.name,
              color: '#000000',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          />
        ))}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: '#4285F4',
                strokeWeight: 5
              }
            }}
          />
        )}
      </GoogleMap>
    </div>
  )
}
