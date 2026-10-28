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
  farmerLocationName?: string;
  onDetectLocation?: () => void;
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
  farmerLocationName,
  onDetectLocation,
}: CentreMapLeafletProps) {
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const farmerMarkerRef = useRef<any>(null);
  const connectLineRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletInstanceRef = useRef<any>(null);

  // Initialize Map
  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      if (typeof window === "undefined" || !mapContainerRef.current) return;
      if (mapRef.current) return; // already initialized

      const L = (await import("leaflet")).default;
      leafletInstanceRef.current = L;

      // Fix default Leaflet marker assets
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
        iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      });

      if (!isMounted || !mapContainerRef.current) return;

      const initialLat = farmerLat || centres[0]?.latitude || 28.6139;
      const initialLng = farmerLng || centres[0]?.longitude || 77.209;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: farmerLat && farmerLng ? 11 : 9,
        zoomControl: true,
      });

      mapRef.current = map;

      // OpenStreetMap tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      // Force layout invalidation so map renders completely in flex containers
      setTimeout(() => {
        if (mapRef.current) mapRef.current.invalidateSize();
      }, 250);
    };

    initMap();

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = [];
        farmerMarkerRef.current = null;
        connectLineRef.current = null;
      }
    };
  }, []);

  // Update or Add Farmer Location Marker when farmerLat/farmerLng changes
  useEffect(() => {
    const map = mapRef.current;
    const L = leafletInstanceRef.current;
    if (!map || !L) return;

    if (farmerLat && farmerLng) {
      const farmerHtml = `
        <div style="position:relative;width:34px;height:34px;display:flex;align-items:center;justify-content:center;">
          <div style="position:absolute;width:34px;height:34px;border-radius:50%;background:#3b82f6;opacity:0.35;animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
          <div style="position:relative;width:28px;height:28px;background:#2563eb;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #ffffff;box-shadow:0 3px 10px rgba(37,99,235,0.6);font-size:13px;font-weight:bold;">
            📍
          </div>
        </div>`;

      const farmerIcon = L.divIcon({
        html: farmerHtml,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        className: "",
      });

      const locName = farmerLocationName || "Your Current Location";
      const popupHtml = `
        <div style="font-family:sans-serif;padding:3px;min-width:160px;">
          <div style="font-size:12px;font-weight:bold;color:#1e3a8a;display:flex;align-items:center;gap:4px;">
            📍 ${locName}
          </div>
          <div style="font-size:10px;color:#64748b;margin-top:2px;">
            GPS: ${farmerLat.toFixed(4)}° N, ${farmerLng.toFixed(4)}° E
          </div>
          <div style="font-size:10px;color:#15803d;font-weight:600;margin-top:4px;">
            ✓ Real-time nearest centres calculated
          </div>
        </div>`;

      if (farmerMarkerRef.current) {
        farmerMarkerRef.current.setLatLng([farmerLat, farmerLng]);
        farmerMarkerRef.current.setPopupContent(popupHtml);
      } else {
        farmerMarkerRef.current = L.marker([farmerLat, farmerLng], {
          icon: farmerIcon,
          zIndexOffset: 1000,
        })
          .addTo(map)
          .bindPopup(popupHtml);
      }

      // Pan to user's location
      map.setView([farmerLat, farmerLng], 11, { animate: true });
    } else {
      if (farmerMarkerRef.current) {
        farmerMarkerRef.current.remove();
        farmerMarkerRef.current = null;
      }
    }
  }, [farmerLat, farmerLng, farmerLocationName]);

  // Render & Update Centre Markers
  useEffect(() => {
    const map = mapRef.current;
    const L = leafletInstanceRef.current;
    if (!map || !L) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.marker.remove());
    markersRef.current = [];

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

      const distanceBadge =
        centre.distanceKm !== null && centre.distanceKm !== undefined
          ? `<span style="background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700">📍 ${centre.distanceKm} km away</span>`
          : "";

      const popupContent = `
        <div style="font-family:sans-serif;min-width:210px;padding:4px">
          <div style="font-size:13px;font-weight:700;color:#1e293b;margin-bottom:3px">${centre.name}</div>
          <div style="font-size:11px;color:#64748b;margin-bottom:6px">${centre.district}, ${centre.state}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">
            <span style="background:${colors.bg}22;color:${colors.bg};border:1px solid ${colors.bg}44;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:600">${colors.label}</span>
            ${distanceBadge}
          </div>
          <div style="font-size:11px;color:#475569;line-height:1.4">
            ⏱ Wait: <b>~${centre.estimatedWaitMinutes} mins</b><br/>
            👥 Queue: <b>${centre.activeQueueCount} farmers</b><br/>
            🌾 Crops: <b>${(centre.supportedCrops || []).slice(0, 3).join(", ")}</b>
          </div>
          <button style="margin-top:8px;width:100%;background:#10b981;color:white;border:none;padding:5px 8px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;" onclick="window.selectCentreById('${centre.id}')">
            Select This Centre →
          </button>
        </div>`;

      const marker = L.marker([centre.latitude, centre.longitude], { icon })
        .addTo(map)
        .bindPopup(popupContent)
        .on("click", () => {
          onCentreSelect(centre.id);
        });

      markersRef.current.push({ id: centre.id, marker });
    });

    // Provide global handler for popup click button
    (window as any).selectCentreById = (id: string) => {
      onCentreSelect(id);
    };

    // Draw connection line between farmer and selected centre
    if (connectLineRef.current) {
      connectLineRef.current.remove();
      connectLineRef.current = null;
    }

    if (farmerLat && farmerLng && selectedCentreId) {
      const selected = centres.find((c) => c.id === selectedCentreId);
      if (selected?.latitude && selected?.longitude) {
        connectLineRef.current = L.polyline(
          [
            [farmerLat, farmerLng],
            [selected.latitude, selected.longitude],
          ],
          {
            color: "#2563eb",
            weight: 3,
            dashArray: "6, 8",
            opacity: 0.8,
          }
        ).addTo(map);
      }
    }
  }, [centres, selectedCentreId, farmerLat, farmerLng]);

  // Pan to selected centre
  useEffect(() => {
    const map = mapRef.current;
    if (!map || markersRef.current.length === 0) return;

    const selected = markersRef.current.find((m) => m.id === selectedCentreId);
    if (selected) {
      const centre = centres.find((c) => c.id === selectedCentreId);
      if (centre?.latitude && centre?.longitude) {
        map.panTo([centre.latitude, centre.longitude], { animate: true });
        selected.marker.openPopup();
      }
    }
  }, [selectedCentreId]);

  const handleRecenter = () => {
    if (mapRef.current && farmerLat && farmerLng) {
      mapRef.current.setView([farmerLat, farmerLng], 12, { animate: true });
      if (farmerMarkerRef.current) farmerMarkerRef.current.openPopup();
    } else if (onDetectLocation) {
      onDetectLocation();
    }
  };

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapContainerRef}
        className="w-full h-full rounded-xl"
        style={{ minHeight: "340px" }}
      />

      {/* Recenter Button */}
      <button
        type="button"
        onClick={handleRecenter}
        className="absolute top-3 right-3 bg-white hover:bg-slate-50 text-slate-700 p-2 rounded-lg shadow-md z-[1000] border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
        title="Recenter on My Location"
      >
        <span className="text-blue-600 font-bold text-sm">📍</span>
        <span className="hidden sm:inline">My Location</span>
      </button>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm rounded-lg p-2.5 shadow-md z-[1000] flex flex-col gap-1 text-[10px]">
        {Object.entries(STATUS_COLORS).map(([status, colors]) => (
          <div key={status} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
              style={{ background: colors.bg }}
            />
            <span className="text-slate-700 font-medium">{colors.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-slate-200">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block shrink-0 ring-2 ring-blue-300" />
          <span className="text-slate-900 font-bold">Your Location</span>
        </div>
      </div>
    </div>
  );
}
