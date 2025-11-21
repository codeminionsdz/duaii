"use client"

import { Card } from "@/components/ui/card"
import { Building2, User } from "lucide-react"

interface RoleSelectorProps {
  selectedRole: "user" | "pharmacy"
  onRoleChange: (role: "user" | "pharmacy") => void
}

export function RoleSelector({ selectedRole, onRoleChange }: RoleSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      <Card
        className={`p-4 cursor-pointer transition-all hover:scale-105 ${
          selectedRole === "user" ? "bg-emerald-50 border-emerald-500 border-2 shadow-md" : "bg-card hover:bg-accent/50"
        }`}
        onClick={() => onRoleChange("user")}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <div
            className={`p-3 rounded-full ${
              selectedRole === "user" ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
            }`}
          >
            <User className="h-6 w-6" />
          </div>
          <span className={`font-semibold ${selectedRole === "user" ? "text-emerald-700" : "text-foreground"}`}>
            مستخدم
          </span>
        </div>
      </Card>

      <Card
        className={`p-4 cursor-pointer transition-all hover:scale-105 ${
          selectedRole === "pharmacy" ? "bg-blue-50 border-blue-500 border-2 shadow-md" : "bg-card hover:bg-accent/50"
        }`}
        onClick={() => onRoleChange("pharmacy")}
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <div
            className={`p-3 rounded-full ${
              selectedRole === "pharmacy" ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground"
            }`}
          >
            <Building2 className="h-6 w-6" />
          </div>
          <span className={`font-semibold ${selectedRole === "pharmacy" ? "text-blue-700" : "text-foreground"}`}>
            صيدلية
          </span>
        </div>
      </Card>
    </div>
  )
}
