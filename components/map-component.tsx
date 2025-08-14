"use client";
import { useVNIslandsMask } from "@/hooks/use-vn-islands-mask";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";

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
  _id: string;
  name: string;
  type: string;
  address: string;
  pricePerHour: number;
  rating: number;
  reviewCount: number;
  location: {
    coordinates: [string, string];
  };
}

interface MapComponentProps {
  courts: Court[];
  searchQuery?: string;
}

const sports = [
  { name: "Bóng đá mini", icon: "⚽", type: "football" },
  { name: "Cầu lông", icon: "🏸", type: "badminton" },
  { name: "Tennis", icon: "🎾", type: "tennis" },
  { name: "Bóng rổ", icon: "🏀", type: "basketball" },
  { name: "Bóng chuyền", icon: "🏐", type: "volleyball" },
  { name: "Pickleball", icon: "🏓", type: "pickleball" },
];

export default function MapComponent({
  courts,
  searchQuery,
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // user location layers
  const userMarkerRef = useRef<L.CircleMarker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);

  // chặn flyTo mặc định lần đầu (để không đè lên geolocation)
  const didInitialFlyRef = useRef(false);

  const [center, setCenter] = useState<[number, number]>([
    16.0919025, 108.2166425,
  ]);
  const [map, setMap] = useState<L.Map | null>(null);

  // Tìm toạ độ khi search (Nominatim)
  useEffect(() => {
    if (!searchQuery?.trim()) return;
    const fetchLocation = async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchQuery
          )}&limit=1`,
          { headers: { "Accept-Language": "vi,en;q=0.8" } }
        );
        const data = await res.json();
        if (data.length > 0) {
          setCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        }
      } catch (err) {
        console.error("Error fetching geocode:", err);
      }
    };
    fetchLocation();
  }, [searchQuery]);

  // Khởi tạo map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView(center, 12);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    setMap(map);
    // Legend
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

    map.whenReady(async () => {
      moveToCurrentLocation(map, { minZoom: 13 });
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersLayerRef.current = null;
      userMarkerRef.current = null;
      accuracyCircleRef.current = null;
    };
  }, []);

  // Fly đến center khi search đổi (bỏ qua lần đầu để không đè geolocation)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!didInitialFlyRef.current) {
      didInitialFlyRef.current = true;
      return;
    }

    map.whenReady(() => {
      map.flyTo(center, 13, { duration: 0.8 });
    });
  }, [center]);

  // Render markers
  useEffect(() => {
    if (!markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    courts.forEach((court) => {
      if (!court.location?.coordinates) return;

      const lng = parseFloat(court?.location?.coordinates[0]) || 0;
      const lat = parseFloat(court?.location?.coordinates[1]) || 0;
      if (isNaN(lat) || isNaN(lng)) return;

      const marker = L.marker([lat, lng], { icon: getSportIcon(court.type) });

      const popupContent = `
        <div class="p-2">
          <h3 class="font-semibold text-sm">${escapeHtml(court.name)}</h3>
          <p class="text-xs text-gray-600 mb-2">${escapeHtml(court.address)}</p>
          <div class="flex items-center justify-between">
            <span class="text-sm font-bold text-green-600">${Number(
              court.pricePerHour || 0
            ).toLocaleString("vi-VN")}đ/giờ</span>
            <span class="text-xs">⭐ ${court.rating ?? "-"}</span>
          </div>
          <div>
            <a href="/court/${court._id}" 
               style="display:block; width:100%;" 
               class="mt-2 px-3 py-1 bg-green-600 hover:bg-green-700 !text-white rounded text-xs text-center">
              Đặt sân
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on("click", () => {
        const map = mapInstanceRef.current;
        if (!map) return;
        const targetZoom = Math.max(map.getZoom(), 16);
        map.once("moveend", () => marker.openPopup());
        map.flyTo([lat, lng], targetZoom, { duration: 0.6 });
      });

      marker.addTo(markersLayerRef.current!);
    });
  }, [courts]);

  // ===== Helpers (drop-in) =====
  function moveToCurrentLocation(
    map: L.Map,
    opts: { minZoom?: number; showAccuracy?: boolean } = {}
  ) {
    if (!("geolocation" in navigator)) return;

    // gọi sau khi map ready
    if (!(map as any)._loaded || !map.getContainer()) {
      map.once("load", () => moveToCurrentLocation(map, opts));

      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!map || !(map as any)._loaded || !map.getContainer()) return;
        if (!("geolocation" in navigator)) return;
        const { latitude, longitude } = pos.coords;

        accuracyCircleRef.current = L.circle([latitude, longitude], {
          radius: 6,
          color: "#ffffff",
          weight: 2,
          fillColor: "#2563eb",
          fillOpacity: 1,
        });

        map.invalidateSize();

        setCenter([latitude, longitude]);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }

  function getSportIcon(type: string) {
    const sport = sports.find((s) => s.type === type);
    return L.divIcon({
      className: "custom-marker",
      html: `<div style="font-size:24px">${sport?.icon ?? "📍"}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -28],
    });
  }

  function escapeHtml(s: string) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  useVNIslandsMask(map, {
    color: "#a3c7df",
    expandDx: 0.06,
    expandDy: 0.06,
    labelColor: "#0f172a",
    labelHaloColor: "#ffffff",
    labelSize: 14,
    hsLabelText: "Quần đảo Hoàng Sa (Việt Nam)",
    tsLabelText: "Quần đảo Trường Sa (Việt Nam)",
  });

  return (
    <div ref={mapRef} className="h-[calc(100vh-324px)] w-full rounded-lg" />
  );
}
