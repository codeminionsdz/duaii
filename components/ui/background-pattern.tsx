"use client"

import { useEffect, useState } from "react"

export function BackgroundPattern() {
  const [dots, setDots] = useState<Array<{ left: string; top: string }>>([])

  useEffect(() => {
    // Generate dots only on client side to avoid hydration mismatch
    const generatedDots = [...Array(20)].map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
    }))
    setDots(generatedDots)
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-30">
      {/* Cute pill shapes floating in background */}
      <svg className="absolute -right-20 -top-20 h-96 w-96 text-primary/10" viewBox="0 0 200 200" fill="currentColor">
        <ellipse cx="100" cy="60" rx="80" ry="40" transform="rotate(-30 100 60)" />
        <ellipse cx="100" cy="140" rx="80" ry="40" transform="rotate(-30 100 140)" />
        <rect x="60" y="60" width="80" height="80" rx="40" />
      </svg>

      <svg className="absolute -bottom-20 -left-20 h-80 w-80 text-primary/10" viewBox="0 0 200 200" fill="currentColor">
        <circle cx="100" cy="100" r="60" />
        <rect x="70" y="40" width="60" height="120" rx="30" />
      </svg>

      {/* Medical cross */}
      <svg className="absolute right-1/4 top-1/4 h-32 w-32 text-primary/5" viewBox="0 0 100 100" fill="currentColor">
        <rect x="40" y="20" width="20" height="60" rx="4" />
        <rect x="20" y="40" width="60" height="20" rx="4" />
      </svg>

      {/* Cute hearts for care */}
      <svg className="absolute bottom-1/3 left-1/3 h-24 w-24 text-primary/5" viewBox="0 0 100 100" fill="currentColor">
        <path d="M50 85 C20 60, 10 40, 10 25 C10 10, 20 5, 30 5 C40 5, 45 10, 50 20 C55 10, 60 5, 70 5 C80 5, 90 10, 90 25 C90 40, 80 60, 50 85 Z" />
      </svg>

      {/* Decorative dots pattern */}
      <div className="absolute inset-0">
        {dots.map((dot, i) => (
          <div
            key={i}
            className="absolute h-2 w-2 rounded-full bg-primary/5"
            style={{
              left: dot.left,
              top: dot.top,
            }}
          />
        ))}
      </div>
    </div>
  )
}
