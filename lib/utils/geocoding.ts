import axios from 'axios'

/**
 * Resolve short links like goo.gl to their final URL
 */
async function resolveShortLink(url: string): Promise<string | null> {
  try {
    const response = await axios.get(url, {
      maxRedirects: 5,
      timeout: 5000,
      validateStatus: (status) => status < 400 || status === 302 || status === 301
    })
    return response.request.res.responseUrl || response.headers.location || url
  } catch (error) {
    console.error('Error resolving short link:', error)
    return null
  }
}

/**
 * Extract latitude and longitude from Google Maps URL
 * Supports formats like:
 * - https://www.google.com/maps/place/.../@LAT,LNG,...
 * - https://maps.app.goo.gl/... (resolves short links)
 * - https://www.google.com/maps/dir/.../LAT,LNG
 */
export async function extractLatLngFromGoogleMapsUrl(url: string): Promise<{ lat: number; lng: number } | null> {
  try {
    let finalUrl = url

    // Handle goo.gl short links - resolve to final URL first
    if (url.includes('goo.gl') || url.includes('maps.app.goo.gl')) {
      const resolved = await resolveShortLink(url)
      if (resolved) {
        finalUrl = resolved
      }
    }

    // Extract from place URLs with @lat,lng format
    const placeMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
    if (placeMatch) {
      return {
        lat: parseFloat(placeMatch[1]),
        lng: parseFloat(placeMatch[2])
      }
    }

    // Extract from dir URLs with /LAT,LNG format
    const dirMatch = finalUrl.match(/\/(-?\d+\.\d+),(-?\d+\.\d+)/)
    if (dirMatch) {
      return {
        lat: parseFloat(dirMatch[1]),
        lng: parseFloat(dirMatch[2])
      }
    }

    // Try to extract any coordinates from the URL
    const coordMatch = finalUrl.match(/(-?\d+\.\d+),(-?\d+\.\d+)/)
    if (coordMatch) {
      return {
        lat: parseFloat(coordMatch[1]),
        lng: parseFloat(coordMatch[2])
      }
    }

    return null
  } catch (error) {
    console.error('Error extracting lat/lng from URL:', error)
    return null
  }
}

/**
 * Get coordinates using Google Geocoding API
 * Requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable
 */
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    console.warn('Google Maps API key not configured')
    return null
  }

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address,
        key: apiKey
      }
    })

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const location = response.data.results[0].geometry.location
      return {
        lat: location.lat,
        lng: location.lng
      }
    }

    return null
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
