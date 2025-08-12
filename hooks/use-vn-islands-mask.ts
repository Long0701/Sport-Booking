// useVNIslandsMask.ts
"use client";
import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";

// ====== cấu hình mặc định ======
const DEFAULT_HS: [number, number][] = [
  [111.40, 17.10], [112.60, 16.90], [112.90, 16.20],
  [112.10, 15.80], [111.60, 16.30], [111.80, 16.60],
];
const DEFAULT_TS: [number, number][] = [
  [112.90, 10.90], [113.60, 10.20], [114.20,  9.70],
  [114.90, 10.30], [115.30,  9.20], [112.90,  8.80], [112.30, 10.10],
];

export type VNMaskOptions = {
  // mask
  pane?: string;          // tên pane cho mask
  zIndex?: number;        // z-index của pane (overlayPane ~ 400)
  color?: string;         // màu che (gần màu nước)
  expandDx?: number;      // nới theo kinh độ (độ)
  expandDy?: number;      // nới theo vĩ độ (độ)
  hsPoints?: [number, number][];
  tsPoints?: [number, number][];

  // label
  showLabels?: boolean;        // bật nhãn
  labelPane?: string;          // pane cho nhãn
  labelZIndex?: number;        // z-index cho nhãn (>= markerPane ~ 600 nếu muốn nổi)
  labelColor?: string;         // màu chữ
  labelHaloColor?: string;     // halo (viền chữ)
  labelSize?: number;          // px
  hsLabelText?: string;
  tsLabelText?: string;
};

const WATER_PATCH_DEFAULT = "#a3c7df";

// ====== convex hull: Monotone chain (lon,lat) ======
function convexHull(pts: [number, number][]) {
  const p = pts.slice().sort((a,b)=> a[0]-b[0] || a[1]-b[1]);
  if (p.length <= 1) return p;
  const cross = (o:[number,number], a:[number,number], b:[number,number]) =>
    (a[0]-o[0])*(b[1]-o[1]) - (a[1]-o[1])*(b[0]-o[0]);
  const lower: [number,number][] = [];
  for (const pt of p) { while (lower.length>=2 && cross(lower[lower.length-2], lower[lower.length-1], pt) <= 0) lower.pop(); lower.push(pt); }
  const upper: [number,number][] = [];
  for (let i=p.length-1;i>=0;i--) { const pt=p[i]; while (upper.length>=2 && cross(upper[upper.length-2], upper[upper.length-1], pt) <= 0) upper.pop(); upper.push(pt); }
  upper.pop(); lower.pop();
  return lower.concat(upper);
}

// nới polygon nhẹ để che sạch chữ khi zoom sâu
function expandLatLngs(latlngs: [number,number][], dx=0.05, dy=0.05) {
  if (latlngs.length === 0) return latlngs;
  const [baseLat, baseLng] = latlngs[0];
  return latlngs.map(([lat,lng]) => [
    lat + Math.sign(lat - baseLat) * dy,
    lng + Math.sign(lng - baseLng) * dx
  ] as [number,number]);
}

// centroid đơn giản (mean) cho mảng [lat,lng]
function centroidLatLngs(latlngs: [number, number][]): [number, number] {
  const n = latlngs.length || 1;
  const sum = latlngs.reduce(([sa, so], [lat, lng]) => [sa + lat, so + lng], [0, 0]);
  return [sum[0] / n, sum[1] / n];
}

/**
 * Hook thêm lớp mask che nền khu HS/TS + nhãn tiếng Việt
 * - map: L.Map | null (truyền state map vào)
 */
export function useVNIslandsMask(
  map: L.Map | null,
  {
    // mask
    pane = "maskPane",
    zIndex = 350,
    color = WATER_PATCH_DEFAULT,
    expandDx = 0.05,
    expandDy = 0.05,
    hsPoints = DEFAULT_HS,
    tsPoints = DEFAULT_TS,
    // labels
    showLabels = true,
    labelPane = "labelPane",
    labelZIndex = 650, // mặc định ~ tooltipPane
    labelColor = "#0f172a",
    labelHaloColor = "#ffffff",
    labelSize = 14,
    hsLabelText = "Quần đảo Hoàng Sa (Việt Nam)",
    tsLabelText = "Quần đảo Trường Sa (Việt Nam)",
  }: VNMaskOptions = {}
) {
  const layersRef = useRef<{ hs?: L.Polygon; ts?: L.Polygon; hsLabel?: L.Marker; tsLabel?: L.Marker } | null>(null);

  // tính hull -> [lat,lng] để vẽ Leaflet
  const hsLatLngs = useMemo(() => {
    const hull = convexHull(hsPoints).map(([lng,lat]) => [lat, lng] as [number,number]);
    return expandLatLngs(hull, expandDx, expandDy);
  }, [hsPoints, expandDx, expandDy]);

  const tsLatLngs = useMemo(() => {
    const hull = convexHull(tsPoints).map(([lng,lat]) => [lat, lng] as [number,number]);
    return expandLatLngs(hull, expandDx, expandDy);
  }, [tsPoints, expandDx, expandDy]);

  useEffect(() => {
    if (!map) return;

    // ----- pane cho mask -----
    if (!map.getPane(pane)) {
      map.createPane(pane);
    }
    map.getPane(pane)!.style.zIndex = String(zIndex);

    // ----- tạo polygons mask -----
    // const hsMask = L.polygon(hsLatLngs, {
    //   pane,
    //   fillColor: 'color',
    //   fillOpacity: 1,
    //   color,
    //   weight: 0,
    //   interactive: false,
    // });
    // const tsMask = L.polygon(tsLatLngs, {
    //   pane,
    //   fillColor: color,
    //   fillOpacity: 1,
    //   color,
    //   weight: 0,
    //   interactive: false,
    // });

    // hsMask.addTo(map);
    // tsMask.addTo(map);

    // ----- labels (nếu bật) -----
    let hsLabel: L.Marker | undefined;
    let tsLabel: L.Marker | undefined;

    if (showLabels) {
      if (!map.getPane(labelPane)) {
        map.createPane(labelPane);
      }
      map.getPane(labelPane)!.style.zIndex = String(labelZIndex);

      const labelHtml = (text: string) =>
        `<div style="
            font-weight:600;
            font-size:${labelSize}px;
            color:${labelColor};
            text-shadow:
              -1px -1px 0 ${labelHaloColor},
               1px -1px 0 ${labelHaloColor},
              -1px  1px 0 ${labelHaloColor},
               1px  1px 0 ${labelHaloColor};
            white-space:nowrap;
            user-select:none;
          ">${text}</div>`;

      const hsCenter = centroidLatLngs(hsLatLngs);
      const tsCenter = centroidLatLngs(tsLatLngs);

      hsLabel = L.marker(hsCenter, {
        pane: labelPane,
        interactive: false,
        icon: L.divIcon({
          className: "vn-island-label",
          html: labelHtml(hsLabelText),
          iconSize: [0, 0], // không chiếm chỗ
        }),
      }).addTo(map);

      tsLabel = L.marker(tsCenter, {
        pane: labelPane,
        interactive: false,
        icon: L.divIcon({
          className: "vn-island-label",
          html: labelHtml(tsLabelText),
          iconSize: [0, 0],
        }),
      }).addTo(map);
    }

    // layersRef.current = { hs: hsMask, ts: tsMask, hsLabel, tsLabel };
    layersRef.current = { hsLabel, tsLabel };

    return () => {
      layersRef.current?.hsLabel?.remove();
      layersRef.current?.tsLabel?.remove();
      layersRef.current?.hs?.remove();
      layersRef.current?.ts?.remove();
      layersRef.current = null;
    };
  }, [
    map,
    // mask deps
    pane, zIndex, color, hsLatLngs, tsLatLngs,
    // label deps
    showLabels, labelPane, labelZIndex, labelColor, labelHaloColor, labelSize, hsLabelText, tsLabelText
  ]);

  return layersRef; // nếu cần thao tác thêm
}
