"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Upload, Pill, Bell, User } from "lucide-react"

export function BottomNav() {
  const pathname = usePathname()

  const navItems = [
    { href: "/home", icon: Home, label: "الرئيسية" },
    { href: "/upload", icon: Upload, label: "رفع وصفة" },
    { href: "/medicines", icon: Pill, label: "أدويتي" },
    { href: "/notifications", icon: Bell, label: "الإشعارات" },
    { href: "/profile", icon: User, label: "الملف" },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? "text-emerald-600" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`h-6 w-6 mb-1 ${isActive ? "fill-emerald-600" : ""}`} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
