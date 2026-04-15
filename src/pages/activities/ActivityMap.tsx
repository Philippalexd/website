// components/ActivityMap.tsx
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import polyline from "@mapbox/polyline";

interface Props {
  summaryPolyline: string;
}

export default function ActivityMap({ summaryPolyline }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || !summaryPolyline) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const coords = polyline.decode(summaryPolyline);

    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: true,
    });
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const route = L.polyline(coords, {
      color: "#fc4c02",
      weight: 3,
    }).addTo(map);

    L.circleMarker(coords[0], {
      radius: 6,
      color: "#22c55e",
      fillColor: "#22c55e",
      fillOpacity: 1,
    }).addTo(map);

    L.circleMarker(coords[coords.length - 1], {
      radius: 6,
      color: "#ef4444",
      fillColor: "#ef4444",
      fillOpacity: 1,
    }).addTo(map);

    map.fitBounds(route.getBounds(), { padding: [20, 20] });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [summaryPolyline]);

  return (
    <div
      ref={mapRef}
      style={{
        height: "250px",
        width: "100%",
        borderRadius: "8px",
        marginTop: "0.5rem",
      }}
    />
  );
}
