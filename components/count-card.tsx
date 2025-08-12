"use client"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"

type CourtCardProps = {
  court: {
    name: string
    type: string
    images?: string[]
    // add other court properties as needed
  }
  onSelect?: (court: any) => void
}

export function getSportIcon(type: string) {
  // Example: return emoji or icon based on type
  switch (type.toLowerCase()) {
    case "tennis":
      return "🎾";
    case "basketball":
      return "🏀";
    case "badminton":
      return "🏸";
    default:
      return "🏟️";
  }
}

export function getSportLabel(type: string) {
  // Example: return a formatted label
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export default function CourtCard({ court, onSelect }: CourtCardProps) {
  const displayImage =
    court.images && court.images.length > 0
      ? court.images[0]
      : `/placeholder.svg?height=200&width=300&query=${court.type} court`

  return (
    <Card
      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => onSelect?.(court)}
    >
      <div className="relative">
        <img src={displayImage || "/placeholder.svg"} alt={court.name} className="w-full h-48 object-cover" />
        <div className="absolute top-2 right-2">
          <Badge variant="secondary" className="bg-white/90">
            {getSportIcon(court.type)} {getSportLabel(court.type)}
          </Badge>
        </div>
      </div>
      {/* rest of code here */}
    </Card>
  )
}
