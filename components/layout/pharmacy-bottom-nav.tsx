"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, FileText, Bell, User, CreditCard } from "lucide-react"

export function PharmacyBottomNav() {
  const pathname = usePathname()

  const navItems = [
    { href: "/pharmacy/dashboard", icon: Home, label: "الرئيسية" },
    { href: "/pharmacy/prescriptions", icon: FileText, label: "الوصفات" },
    { href: "/pharmacy/notifications", icon: Bell, label: "الإشعارات" },
    { href: "/pharmacy/profile", icon: User, label: "الملف" },
    { href: "/pharmacy/subscriptions", icon: CreditCard, label: "الاشتراكات" },
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
                isActive ? "text-blue-600" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`h-6 w-6 mb-1 ${isActive ? "fill-blue-600" : ""}`} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
