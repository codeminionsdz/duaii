import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin } from "lucide-react"
import type { Prescription } from "@/lib/types"
import Image from "next/image"

interface PrescriptionCardProps {
  prescription: Prescription & {
    responses_count?: number
  }
}

export function PrescriptionCard({ prescription }: PrescriptionCardProps) {
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
    responded: "bg-blue-100 text-blue-800 border-blue-300",
    accepted: "bg-green-100 text-green-800 border-green-300",
    rejected: "bg-red-100 text-red-800 border-red-300",
    completed: "bg-gray-100 text-gray-800 border-gray-300",
  }

  const statusLabels = {
    pending: "قيد الانتظار",
    responded: "تم الرد",
    accepted: "مقبولة",
    rejected: "مرفوضة",
    completed: "مكتملة",
  }

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex gap-3 p-4">
        <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
          <Image src={prescription.images?.[0] || "/placeholder.svg"} alt="وصفة طبية" fill className="object-cover" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-sm">وصفة طبية</h3>
            <Badge className={`${statusColors[prescription.status]} text-xs`}>
              {statusLabels[prescription.status]}
            </Badge>
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
            <Clock className="h-3 w-3" />
            <span>{new Date(prescription.created_at).toLocaleDateString("ar-SA")}</span>
          </div>

          {prescription.responses_count && prescription.responses_count > 0 && (
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <MapPin className="h-3 w-3" />
              <span>{prescription.responses_count} صيدلية ردت</span>
            </div>
          )}

          {prescription.notes && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{prescription.notes}</p>
          )}
        </div>
      </div>
    </Card>
  )
}
