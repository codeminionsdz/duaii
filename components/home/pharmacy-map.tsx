"use client"

import { useState } from "react"
import { InteractiveMap } from "./interactive-map"
import type { PharmacyProfile } from "@/lib/types"

interface PharmacyWithCoords extends PharmacyProfile {
  lat: number
  lng: number
}

interface PharmacyMapProps {
  pharmacyToFocus?: string | null
}

export function PharmacyMap({ pharmacyToFocus }: PharmacyMapProps) {
  const [selectedPharmacy, setSelectedPharmacy] = useState<PharmacyWithCoords | null>(null)

  return (
    <InteractiveMap
      selectedPharmacy={selectedPharmacy}
      onPharmacySelect={setSelectedPharmacy}
      pharmacyToFocus={pharmacyToFocus}
    />
  )
}
