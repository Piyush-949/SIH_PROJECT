"use client";

import React, { useEffect, useRef } from "react";

interface Centre {
  id: string;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  address: string;
  district: string;
  state: string;
  status: "GREEN" | "YELLOW" | "RED" | "GREY";
  congestionPercentage: number;
  estimatedWaitMinutes: number;
  aiScore: number;
  supportedCrops: string[];
  activeQueueCount: number;
  distanceKm: number | null;
}

interface CentreMapLeafletProps {
  centres: Centre[];
  selectedCentreId: string | null;
  onCentreSelect: (centreId: string) => void;
  farmerLat?: number | null;
  farmerLng?: number | null;
}

const STATUS_COLORS = {
  GREEN: { bg: "#16a34a", border: "#15803d", label: "Low Congestion" },
  YELLOW: { bg: "#d97706", border: "#b45309", label: "Moderate Congestion" },
  RED: { bg: "#dc2626", border: "#b91c1c", label: "High Congestion" },
  GREY: { bg: "#6b7280", border: "#4b5563", label: "Maintenance" },
};

export default function CentreMapLeaflet({
  centres,
  selectedCentreId,
  onCentreSelect,
  farmerLat,
  farmerLng,
}: CentreMapLeafletProps) {
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const farmerMarkerRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Dynamically import Leaflet to avoid SSR issues
    let L: any;
    let map: any;

    const initMap = async () => {
      if (typeof window === "undefined" || !mapContainerRef.current) return;

      // Dynamic import of leaflet
      L = (await import("leaflet")).default;

      // Fix default icon issue in webpack/next.js
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });

      if (mapRef.current) return; // Already initialized

      // Default center: India
      const defaultLat = farmerLat || centres[0]?.latitude || 28.6139;
      const defaultLng = farmerLng || centres[0]?.longitude || 77.209;

      map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLng],
        zoom: 10,
        zoomControl: true,
      });

      mapRef.current = map;

      // OpenStreetMap tiles (free, no API key)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Add farmer's location marker if available
      if (farmerLat && farmerLng) {
        const farmerIcon = L.divIcon({
          html: `<div style="background:#1d4ed8;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:14px;">📍</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          className: "",
        });

        farmerMarkerRef.current = L.marker([farmerLat, farmerLng], { icon: farmerIcon })
          .addTo(map)
          .bindPopup(
            `<div style="font-size:12px;font-weight:bold;color:#1e293b;">📍 Your Location</div>`
          );
      }

      // Add centre markers
      centres.forEach((centre) => {
        if (!centre.latitude || !centre.longitude) return;

        const colors = STATUS_COLORS[centre.status] || STATUS_COLORS.GREY;
        const isSelected = centre.id === selectedCentreId;

        const icon = L.divIcon({
          html: `<div style="
            background:${colors.bg};
            border:3px solid ${isSelected ? "#ffffff" : colors.border};
            border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            width:${isSelected ? "34px" : "26px"};
            height:${isSelected ? "34px" : "26px"};
            box-shadow:0 3px 10px rgba(0,0,0,0.35);
            transition:all 0.2s;
          "></div>`,
          iconSize: isSelected ? [34, 34] : [26, 26],
          iconAnchor: isSelected ? [17, 34] : [13, 26],
          className: "",
        });

        const distanceText = centre.distanceKm
          ? `${centre.distanceKm} km away`
          : "";

        const popupContent = `
          <div style="font-family:sans-serif;min-width:200px;padding:4px">
            <div style="font-size:13px;font-weight:700;color:#1e293b;margin-bottom:4px">${centre.name}</div>
            <div style="font-size:11px;color:#64748b;margin-bottom:6px">${centre.district}, ${centre.state}</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:6px">
              <span style="background:${colors.bg}22;color:${colors.bg};border:1px solid ${colors.bg}44;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600">${colors.label}</span>
              ${distanceText ? `<span style="color:#475569;font-size:10px">📍 ${distanceText}</span>` : ""}
            </div>
            <div style="font-size:11px;color:#475569">
              ⏱ Wait: ~${centre.estimatedWaitMinutes} mins<br/>
              👥 Queue: ${centre.activeQueueCount} farmers<br/>
              🌾 Crops: ${centre.supportedCrops.slice(0, 3).join(", ")}
            </div>
          </div>`;

        const marker = L.marker([centre.latitude, centre.longitude], { icon })
          .addTo(map)
          .bindPopup(popupContent)
          .on("click", () => {
            onCentreSelect(centre.id);
          });

        markersRef.current.push({ id: centre.id, marker });
      });

      // Fit map to show all centres
      if (centres.length > 0) {
        const bounds = centres
          .filter((c) => c.latitude && c.longitude)
          .map((c) => [c.latitude, c.longitude] as [number, number]);

        if (farmerLat && farmerLng) {
          bounds.push([farmerLat, farmerLng]);
        }

        if (bounds.length > 0) {
          map.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 });
        }
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = [];
        farmerMarkerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker styles when selection changes
  useEffect(() => {
    if (!mapRef.current || markersRef.current.length === 0) return;

    // Re-style markers — simplest way is to re-render, but here we just pan to selected
    const selected = markersRef.current.find((m) => m.id === selectedCentreId);
    if (selected) {
      const centre = centres.find((c) => c.id === selectedCentreId);
      if (centre) {
        mapRef.current.panTo([centre.latitude, centre.longitude], { animate: true });
        selected.marker.openPopup();
      }
    }
  }, [selectedCentreId, centres]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full rounded-xl" style={{ minHeight: "300px" }} />

      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm rounded-lg p-2 shadow-md z-[1000] flex flex-col gap-1 text-[10px]">
        {Object.entries(STATUS_COLORS).map(([status, colors]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full inline-block shrink-0"
              style={{ background: colors.bg }}
            />
            <span className="text-slate-700">{colors.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 mt-0.5 pt-0.5 border-t border-slate-200">
          <span className="text-base">📍</span>
          <span className="text-slate-700">Your Location</span>
        </div>
      </div>
    </div>
  );
}
