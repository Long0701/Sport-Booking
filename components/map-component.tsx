"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in Leaflet (nếu dùng icon mặc định)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface Court {
  id: string;
  name: string;
  type: string;
  address: string;
  price: number;
  rating: number;
  lat: number;
  lng: number;
}

interface MapComponentProps {
  courts: Court[];
  searchQuery?: string;
}

const sports = [
  { name: "Bóng đá mini", icon: "⚽", type: "football", count: "120+ sân" },
  { name: "Cầu lông", icon: "🏸", type: "badminton", count: "85+ sân" },
  { name: "Tennis", icon: "🎾", type: "tennis", count: "45+ sân" },
  { name: "Bóng rổ", icon: "🏀", type: "basketball", count: "60+ sân" },
  { name: "Bóng chuyền", icon: "🏐", type: "volleyball", count: "35+ sân" },
  { name: "Pickleball", icon: "🏓", type: "pickleball", count: "25+ sân" },
];

export default function MapComponent({
  courts,
  searchQuery,
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [center, setCenter] = useState<[number, number]>([10.7769, 106.7009]);

  // Lấy tọa độ từ searchQuery
  useEffect(() => {
    const fetchLocation = async () => {
      if (!searchQuery?.trim()) return;

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchQuery
          )}&limit=1`
        );
        const data = await res.json();
        if (data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          setCenter([lat, lon]);
        }
      } catch (err) {
        console.error("Error fetching geocode:", err);
      }
    };

    fetchLocation();
  }, [searchQuery]);

  // Khởi tạo map + legend
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView(center, 12);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);

    // 📌 Legend ở góc trái
    const legend = new L.Control({ position: "bottomleft" });

    legend.onAdd = () => {
      const div = L.DomUtil.create(
        "div",
        "bg-white p-2 rounded shadow text-sm"
      );
      div.innerHTML = `
        <div style="font-weight:600; margin-bottom:4px;">Chú thích</div>
        ${sports
          .map(
            (s) => `
          <div style="display:flex; align-items:center; margin-bottom:2px;">
            <span style="font-size:18px; margin-right:6px;">${s.icon}</span>
            <span>${s.name}</span>
          </div>
        `
          )
          .join("")}
      `;
      return div;
    };

    legend.addTo(map);
  }, []);

  // Fly đến center khi thay đổi
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(center, 13, { duration: 0.8 });
    }
  }, [center]);

  // Render markers
  useEffect(() => {
    if (!markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    courts.forEach((court) => {
      const marker = L.marker([court.lat, court.lng], {
        icon: getSportIcon(court.type),
      });

      const popupContent = `
        <div class="p-2">
          <h3 class="font-semibold text-sm">${court.name}</h3>
          <p class="text-xs text-gray-600 mb-1">${court.type}</p>
          <p class="text-xs text-gray-600 mb-2">${court.address}</p>
          <div class="flex items-center justify-between">
            <span class="text-sm font-bold text-green-600">${
              court.price || 0
            }đ/giờ</span>
            <span class="text-xs">⭐ ${court.rating}</span>
          </div>
          <button class="w-full mt-2 bg-green-600 text-white text-xs py-1 px-2 rounded hover:bg-green-700">
            Xem chi tiết
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);

      // 📌 Click marker → zoom gần + mở popup
      marker.on("click", () => {
        const map = mapInstanceRef.current;
        if (!map) return;
        const targetZoom = Math.max(map.getZoom(), 16);
        map.once("moveend", () => marker.openPopup());
        map.flyTo([court.lat, court.lng], targetZoom, { duration: 0.6 });
      });

      marker.addTo(markersLayerRef.current!);
    });
  }, [courts]);

  const getSportIcon = (type: string) => {
    const sport = sports.find((s) => s.type === type);
    return L.divIcon({
      className: "custom-marker",
      html: `<div style="font-size:24px">${sport?.icon ?? "📍"}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -28],
    });
  };

  return <div ref={mapRef} className="h-96 w-full rounded-lg" />;
}
