'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface Court {
  id: string
  name: string
  type: string
  address: string
  price: number
  rating: number
  lat: number
  lng: number
}

interface MapComponentProps {
  courts: Court[]
}

export default function MapComponent({ courts }: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current) return

    // Initialize map
    const map = L.map(mapRef.current).setView([10.7769, 106.7009], 12)
    mapInstanceRef.current = map

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map)

    // Add markers for courts
    courts.forEach(court => {
      const marker = L.marker([court.lat, court.lng]).addTo(map)
      
      const popupContent = `
        <div class="p-2">
          <h3 class="font-semibold text-sm">${court.name}</h3>
          <p class="text-xs text-gray-600 mb-1">${court.type}</p>
          <p class="text-xs text-gray-600 mb-2">${court.address}</p>
          <div class="flex items-center justify-between">
            <span class="text-sm font-bold text-green-600">${court.price.toLocaleString('vi-VN')}đ/giờ</span>
            <span class="text-xs">⭐ ${court.rating}</span>
          </div>
          <button class="w-full mt-2 bg-green-600 text-white text-xs py-1 px-2 rounded hover:bg-green-700">
            Xem chi tiết
          </button>
        </div>
      `
      
      marker.bindPopup(popupContent)
    })

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [courts])

  return <div ref={mapRef} className="h-96 w-full rounded-lg" />
}
