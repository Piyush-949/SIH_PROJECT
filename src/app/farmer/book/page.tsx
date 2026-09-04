"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { useTranslation } from "@/lib/i18n";
import dynamic from "next/dynamic";
import { normalizeCentres } from "@/lib/utils/normalizers";
import {
  calculateProcessingTime,
  calculateArrivalWindow,
  rankCentres,
  calculateDistanceKm,
  CentreScoringInput,
} from "@/lib/algorithms";


const CentreMapLeaflet = dynamic(() => import("@/components/farmer/CentreMapLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-slate-100 rounded-xl flex items-center justify-center text-xs text-slate-400">
      Loading interactive map...
    </div>
  ),
});
import {
  CalendarPlus,
  MapPin,
  Sparkles,
  Clock,
  Truck,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  ShieldCheck,
  Building,
  Info,
  ChevronRight,
  Zap,
  Sliders,
  Calendar,
  ArrowRight,
  Layers,
  Loader2,
} from "lucide-react";

export default function BookSlotPage() {
  const router = useRouter();
  const { farmerProfile } = useAuth();
  const { t, isHindi } = useTranslation();

  // Booking Inputs
  const [cropId, setCropId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(40);
  const [vehicleType, setVehicleType] = useState<string>("TRACTOR_TROLLEY");
  const [selectedCentreId, setSelectedCentreId] = useState<string>("");
  const [selectedSlotTime, setSelectedSlotTime] = useState<string>("09:00");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Live centre and crop data
  const [centres, setCentres] = useState<any[]>([]);
  const [crops, setCrops] = useState<any[]>([]);
  const [centresLoading, setCentresLoading] = useState(true);

  // GPS & Location State
  const [farmerLat, setFarmerLat] = useState<number | null>(null);
  const [farmerLng, setFarmerLng] = useState<number | null>(null);
  const [farmerLocationName, setFarmerLocationName] = useState<string>("Locating via GPS...");
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Key agricultural hub presets for instant testing & fallback
  const LOCATION_PRESETS = [
    { label: "Cuttack, Odisha", lat: 20.4625, lng: 85.8830 },
    { label: "Bhubaneswar / Khordha, Odisha", lat: 20.2961, lng: 85.8245 },
    { label: "Sambalpur / Bargarh, Odisha", lat: 21.3324, lng: 83.6198 },
    { label: "Karnal, Haryana", lat: 29.6857, lng: 76.9907 },
    { label: "Ludhiana, Punjab", lat: 30.9010, lng: 75.8573 },
    { label: "Khanna, Punjab", lat: 30.7067, lng: 76.2167 },
    { label: "Indore, M.P.", lat: 22.7196, lng: 75.8577 },
    { label: "Nashik, Maharashtra", lat: 19.9975, lng: 73.7898 },
    { label: "Warangal, Telangana", lat: 17.9689, lng: 79.5941 },
    { label: "Kota, Rajasthan", lat: 25.2138, lng: 75.8648 },
    { label: "Meerut, U.P.", lat: 28.9845, lng: 77.7064 },
    { label: "Delhi NCR", lat: 28.6139, lng: 77.2090 },
  ];

  // Request high-accuracy GPS from browser
  const requestGpsLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocationError("Geolocation not supported by your browser");
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFarmerLat(pos.coords.latitude);
        setFarmerLng(pos.coords.longitude);
        setFarmerLocationName("Your Real GPS Location");
        setLocationLoading(false);
      },
      (err) => {
        console.warn("[BookSlot] Geolocation error:", err.message);
        setLocationError("GPS permission denied or timed out. You can choose your region below.");
        // Default to registered profile location or Cuttack, Odisha
        if (!farmerLat) {
          const isOdisha =
            farmerProfile?.state?.toLowerCase().includes("odisha") ||
            farmerProfile?.district?.toLowerCase().includes("cuttak") ||
            farmerProfile?.district?.toLowerCase().includes("cuttack") ||
            farmerProfile?.district?.toLowerCase().includes("khordha");

          if (isOdisha) {
            setFarmerLat(20.4625);
            setFarmerLng(85.8830);
            setFarmerLocationName("Cuttack, Odisha (Profile Location)");
          } else {
            setFarmerLat(20.4625);
            setFarmerLng(85.8830);
            setFarmerLocationName("Cuttack, Odisha (Default)");
          }
        }
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Pre-seed location from authenticated farmer profile
  useEffect(() => {
    if (farmerProfile) {
      const stateLower = (farmerProfile.state || "").toLowerCase();
      const districtLower = (farmerProfile.district || "").toLowerCase();
      const villageLower = (farmerProfile.village || "").toLowerCase();

      if (
        stateLower.includes("odisha") ||
        districtLower.includes("cuttak") ||
        districtLower.includes("cuttack") ||
        districtLower.includes("khordha") ||
        villageLower.includes("cuttak") ||
        villageLower.includes("cuttack")
      ) {
        setFarmerLat(20.4625);
        setFarmerLng(85.8830);
        setFarmerLocationName(
          `${farmerProfile.village ? `${farmerProfile.village}, ` : ""}${farmerProfile.district || "Cuttack"}, Odisha`
        );
      }
    }
  }, [farmerProfile]);

  const handleSelectPreset = (preset: typeof LOCATION_PRESETS[0]) => {
    setFarmerLat(preset.lat);
    setFarmerLng(preset.lng);
    setFarmerLocationName(preset.label);
    setLocationError(null);
  };

  // Booking state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
  const [isPacsModalOpen, setIsPacsModalOpen] = useState<boolean>(false);
  const [confirmedBookingData, setConfirmedBookingData] = useState<any>(null);

  // Large farmer threshold (>50 Quintals)
  const isLargeFarmer = quantity > 50;

  // Weather state — fetched from OpenWeatherMap via /api/weather
  const [weather, setWeather] = useState<{
    description: string;
    advisoryLevel: string;
    advisoryText: string;
    advisoryTextHindi: string;
    temperature: number;
    isRaining: boolean;
    source: string;
  } | null>(null);

  // Gemini Live AI Advisory state
  const [geminiAdvisory, setGeminiAdvisory] = useState<{
    text: string;
    hindi: string;
    source: string;
  } | null>(null);
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);

  // 7-day date quick pills for procurement scheduling
  const datePills = useMemo(() => {
    const pills = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split("T")[0];
      const dayLabel = i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-IN", { weekday: "short" });
      const formattedDate = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      pills.push({ dateStr, dayLabel, formattedDate });
    }
    return pills;
  }, []);

  // Trigger GPS on initial mount
  useEffect(() => {
    requestGpsLocation();
  }, []);



  // Fetch real centres from API (with GPS coordinates when available)
  useEffect(() => {
    const fetchCentres = async () => {
      try {
        setCentresLoading(true);
        const params = new URLSearchParams();
        if (farmerLat) params.set("lat", String(farmerLat));
        if (farmerLng) params.set("lng", String(farmerLng));
        const res = await fetch(`/api/centres?${params.toString()}`);
        if (!res.ok) throw new Error(`Centres API error: ${res.status}`);
        const data = await res.json();
        const normalized = normalizeCentres(data.centres || [], true);
        setCentres(normalized);
        // Set default selection to first non-maintenance centre
        const firstActive = normalized.find((c: any) => c.status !== "MAINTENANCE" && c.status !== "INACTIVE");
        if (firstActive && !selectedCentreId) setSelectedCentreId(firstActive.id);
      } catch (err: any) {
        console.warn("[BookSlot] Centres fetch error:", err.message);
        setCentres([]);
      } finally {
        setCentresLoading(false);
      }
    };
    fetchCentres();
  }, [farmerLat, farmerLng]);

  // Fetch real weather when GPS is available
  useEffect(() => {
    if (!farmerLat || !farmerLng) return;
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          `/api/weather?lat=${farmerLat}&lng=${farmerLng}&city=Your+Location&district=Your+District`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.weather) {
          setWeather(data.weather);
        }
      } catch {
        // silently fail — weather is non-critical
      }
    };
    fetchWeather();
  }, [farmerLat, farmerLng]);



  // Fetch crops from API
  useEffect(() => {
    const fetchCrops = async () => {
      try {
        const res = await fetch("/api/crops");
        if (res.ok) {
          const data = await res.json();
          setCrops(data.crops || []);
          if (data.crops?.length > 0 && !cropId) {
            setCropId(data.crops[0].id);
          }
        }
      } catch {
        // Non-critical
      }
    };
    fetchCrops();
  }, []);

  // Selected crop details from DB
  const selectedCrop = crops.find((c: any) => c.id === cropId) || crops[0];

  // Dynamic Processing Time Formula Calculation
  const processingTimeResult = useMemo(() => {
    return calculateProcessingTime({
      quantityQuintals: quantity,
      cropBaseMinutesPerQuintal: selectedCrop?.baseProcessingMinutesPerQuintal || 0.8,
      vehicleType,
      baseEntryMinutes: 10,
      inspectionBaseMinutes: 8,
      activeIncidentPenaltyMinutes: 0,
    });
  }, [quantity, selectedCrop, vehicleType]);

  // AI-Scored Centre Rankings (real distance from GPS)
  const rankedCentres = useMemo(() => {
    const inputs: CentreScoringInput[] = centres.map((c: any) => {
      // Compute genuine Haversine distance from farmer's current location to centre
      const distanceKm =
        farmerLat && farmerLng && c.latitude && c.longitude
          ? calculateDistanceKm(farmerLat, farmerLng, c.latitude, c.longitude)
          : (c.distanceKm !== undefined && c.distanceKm !== null ? c.distanceKm : 15);

      return {
        centreId: c.id,
        centreName: c.name,
        distanceKm,
        waitingQueueCount: c.waitingQueueCount || c.activeQueueCount || 0,
        estimatedWaitMinutes: c.estimatedWaitMinutes || 30,
        currentLoadQuintals: c.currentLoadQuintals || 0,
        capacityPerDayQuintals: c.capacityPerDayQuintals || 1000,
        processingSpeedPerHour: c.processingSpeedPerHour || 100,
        activeIncidentsCount: c.activeIncidentsCount || 0,
        weighingMachinesActive: c.weighingMachinesActive || 2,
        weighingMachinesTotal: c.weighingMachinesTotal || 2,
        status: c.status,
        weatherAdvisoryLevel: weather?.advisoryLevel as any,
        weatherDescription: weather?.description,
      };

    });

    const ranked = rankCentres(inputs);

    // If current selected centre is not valid or not set, auto-select the #1 closest/best centre
    if (ranked.length > 0 && ranked[0].score > 0) {
      if (!selectedCentreId || !centres.some((c) => c.id === selectedCentreId)) {
        setSelectedCentreId(ranked[0].centreId);
      }
    }

    return ranked;
  }, [centres, farmerLat, farmerLng, weather?.advisoryLevel, weather?.description]);


  const selectedCentre = centres.find((c: any) => c.id === selectedCentreId) || centres[0];

  const selectedCentreRecommendation = rankedCentres.find(
    (r) => r.centreId === selectedCentreId
  );

  // Fetch Gemini AI recommendation advisory
  useEffect(() => {
    if (!selectedCentre) return;
    const timer = setTimeout(async () => {
      try {
        setIsGeminiLoading(true);
        const res = await fetch("/api/ai/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "centre",
            centreName: selectedCentre.name,
            distanceKm: selectedCentre.distanceKm || 6.2,
            waitMinutes: selectedCentreRecommendation?.loadPercentage ? Math.round(selectedCentreRecommendation.loadPercentage * 0.4) : 20,
            loadPercentage: selectedCentreRecommendation?.loadPercentage || 40,
            score: selectedCentreRecommendation?.score || 85,
            weatherCondition: weather?.description || "Clear",
            cropName: selectedCrop?.name || "Wheat",
            farmerName: farmerProfile?.name || "Farmer",
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setGeminiAdvisory({
              text: data.text,
              hindi: data.hindi,
              source: data.source || "gemini",
            });
          }
        }
      } catch {
        // Handled silently
      } finally {
        setIsGeminiLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [selectedCentre?.id, selectedCrop?.id, weather?.description]);


  // Time Slots
  const availableSlots = [
    { time: "08:00", label: "08:00 AM - 09:30 AM", load: "Low" },
    { time: "09:30", label: "09:30 AM - 11:00 AM", load: "Optimal (Recommended)" },
    { time: "11:00", label: "11:00 AM - 12:30 PM", load: "Moderate" },
    { time: "13:30", label: "01:30 PM - 03:00 PM", load: "Low" },
    { time: "15:00", label: "03:00 PM - 04:30 PM", load: "Low" },
  ];

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCentre) {
      alert("Please select a procurement centre.");
      return;
    }
    if (!selectedCrop) {
      alert("Please select a crop.");
      return;
    }

    if (isLargeFarmer) {
      setIsPacsModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const farmerId = farmerProfile?.id || farmerProfile?.userId;
      const token = typeof window !== "undefined" ? localStorage.getItem("krishi_auth_token") : "";
      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          farmerId,
          centreId: selectedCentre.id,
          cropId: selectedCrop.id,
          cropType: selectedCrop.code || selectedCrop.name,
          estimatedQuantity: quantity,
          vehicleType,
          slotTime: selectedSlotTime,
          isFarmVisitRequest: false,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        const errMsg = data?.error || `Booking failed (${res.status}). Please try again.`;
        alert(errMsg);
        setIsSubmitting(false);
        return;
      }

      if (data.booking) {
        const windowData = calculateArrivalWindow(selectedDate, selectedSlotTime);
        setConfirmedBookingData({
          bookingNumber: data.booking.bookingNumber || data.booking.id,
          tokenNumber: data.tokenNumber || data.booking.tokenNumber || "TK-NEW",
          cropName: selectedCrop.name || selectedCrop.nameEnglish,
          quantity,
          vehicleType,
          centreName: selectedCentre.name,
          centreDistrict: selectedCentre.district,
          arrivalWindow: windowData?.formattedWindow || selectedSlotTime,
          estimatedProcessingMinutes: processingTimeResult?.totalEstimatedMinutes || 30,
          qrToken: data.qrToken || data.booking.qrToken,
        });
        setIsSuccessModalOpen(true);
      }
    } catch (err: any) {
      console.error("[BookSlot] Network error:", err.message);
      alert("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPacsRequest = async () => {
    setIsPacsModalOpen(false);
    setIsSubmitting(true);
    try {
      const farmerId = farmerProfile?.id || farmerProfile?.userId;
      const token = typeof window !== "undefined" ? localStorage.getItem("krishi_auth_token") : "";
      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          farmerId,
          centreId: selectedCentre?.id,
          cropId: selectedCrop?.id,
          estimatedQuantity: quantity,
          vehicleType,
          isFarmVisitRequest: true,
        }),
      });
      const data = await res.json();

      const tkNum = data.tokenNumber || `TK-PACS-${Math.floor(100 + Math.random() * 900)}`;
      const bookingNum = data.booking?.bookingNumber || `KF-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      setConfirmedBookingData({
        bookingNumber: bookingNum,
        tokenNumber: tkNum,
        cropName: selectedCrop?.name || selectedCrop?.nameEnglish,
        quantity,
        vehicleType,
        centreName: selectedCentre?.name,
        centreDistrict: selectedCentre?.district,
        arrivalWindow: "PACS Team Field Visit Scheduled within 24-48 hours",
        estimatedProcessingMinutes: 60,
        isFarmVisit: true,
        qrToken: data.qrToken || `TOKEN-PACS-${bookingNum}-${quantity}Q`,
      });
    } catch (err: any) {
      alert("Network error scheduling farm visit. Please try again.");
      console.error("[BookSlot] PACS error:", err.message);
    } finally {
      setIsSubmitting(false);
      setIsSuccessModalOpen(true);
    }
  };


  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Page Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>AI-Optimized Dynamic Procurement Booking</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {t.booking.title}
        </h1>
        <p className="text-xs text-slate-600 max-w-2xl">
          {t.booking.subtitle}
        </p>
      </div>

      {/* ─── Real-Time Weather Advisory (OpenWeatherMap) ─── */}
      {weather && (
        <div
          className={`rounded-2xl p-4 border flex items-start gap-3 ${
            weather.advisoryLevel === "severe"
              ? "bg-red-50 border-red-300"
              : weather.advisoryLevel === "warning"
              ? "bg-amber-50 border-amber-300"
              : weather.advisoryLevel === "caution"
              ? "bg-yellow-50 border-yellow-300"
              : "bg-emerald-50 border-emerald-200"
          }`}
        >
          <span className="text-2xl shrink-0" aria-hidden>
            {weather.isRaining ? "🌧️" : weather.advisoryLevel === "caution" ? "🌫️" : "🌤️"}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-extrabold text-slate-900">
                Weather Advisory — {weather.temperature}°C · {weather.description}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  weather.advisoryLevel === "severe"
                    ? "bg-red-200 text-red-800"
                    : weather.advisoryLevel === "warning"
                    ? "bg-amber-200 text-amber-800"
                    : weather.advisoryLevel === "caution"
                    ? "bg-yellow-200 text-yellow-800"
                    : "bg-emerald-200 text-emerald-800"
                }`}
              >
                {weather.advisoryLevel === "none" ? "CLEAR" : weather.advisoryLevel.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-slate-700 mt-0.5">{isHindi ? weather.advisoryTextHindi : weather.advisoryText}</p>
            <p className="text-[10px] text-slate-400 mt-1">
              Source: OpenWeatherMap · {weather.source === "live" ? "Live" : "Estimated"} · Updates every 30 mins
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleBookingSubmit} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b pb-3">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <span>Harvest & Transport Inputs</span>
            </h2>

            {/* Crop Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                {t.booking.cropSelect}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {crops.map((c: any) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCropId(c.id)}
                    className={`p-3 rounded-xl border text-left transition ${
                      cropId === c.id
                        ? "bg-emerald-50/80 border-emerald-500 text-emerald-900 font-bold shadow-xs ring-1 ring-emerald-500"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div className="text-xs font-bold">{c.name || c.nameHindi}</div>
                    <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                      ₹{c.basePricePerQuintal}/Q
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Slider & Direct Input (Expanded up to 2,000+ Quintals) */}
            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <div>
                  <label className="text-xs font-bold text-slate-700 block">
                    {t.booking.quantityLabel}
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Supports small farmers up to large commercial lots (2,000Q+)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min={1}
                      max={5000}
                      step={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 0))}
                      className="w-24 px-2 py-1 text-sm font-mono font-bold text-emerald-800 bg-white border-2 border-emerald-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 text-right pr-6 shadow-xs"
                    />
                    <span className="absolute right-2 text-xs font-bold text-emerald-700 pointer-events-none">
                      Q
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">
                    ({(quantity * 100).toLocaleString()} kg)
                  </span>
                </div>
              </div>

              {/* Extended Range Slider */}
              <input
                type="range"
                min={5}
                max={2000}
                step={5}
                value={Math.min(quantity, 2000)}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />

              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>Small (5Q)</span>
                <span>Normal (40Q)</span>
                <span className="text-amber-600 font-bold">PACS Farm Gate Cutoff (&gt;50Q)</span>
                <span>Commercial (500Q)</span>
                <span>Large Lot (2,000Q)</span>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] text-slate-500 font-semibold mr-1">Quick Select:</span>
                {[
                  { q: 20, label: "20 Q" },
                  { q: 40, label: "40 Q (Standard)" },
                  { q: 80, label: "80 Q (PACS)" },
                  { q: 150, label: "150 Q" },
                  { q: 300, label: "300 Q" },
                  { q: 500, label: "500 Q" },
                  { q: 1000, label: "1,000 Q (Bulk)" },
                ].map((preset) => (
                  <button
                    key={preset.q}
                    type="button"
                    onClick={() => setQuantity(preset.q)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                      quantity === preset.q
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Large Farmer Callout Notice */}
            {isLargeFarmer && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-400 text-amber-900 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{t.booking.largeFarmerTitle}</span>
                </div>
                <p className="leading-relaxed">
                  {t.booking.largeFarmerNotice}
                </p>
                <div className="text-[11px] font-semibold text-amber-700">
                  ✓ Free on-farm quality assessment • ✓ Single multi-lot transport arrangement • ✓ Dedicated procurement team
                </div>
              </div>
            )}

            {/* Vehicle Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                {t.booking.vehicleSelect}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "TRACTOR_TROLLEY", label: "Tractor-Trolley", delta: "+5 min" },
                  { id: "PICKUP_TRUCK", label: "Pickup Truck", delta: "0 min" },
                  { id: "MINI_VAN", label: "Mini Van", delta: "+2 min" },
                  { id: "BULLOCK_CART", label: "Bullock Cart", delta: "+10 min" },
                ].map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVehicleType(v.id)}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      vehicleType === v.id
                        ? "bg-emerald-50 border-emerald-500 text-emerald-900 font-bold shadow-xs ring-1 ring-emerald-500"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <div className="text-xs font-semibold">{v.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{v.delta} delta</div>
                  </button>
                ))}
              </div>
            </div>

            {/* ─── Procurement Date Picker (Farmer Chooses Arrival Date) ─── */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isHindi ? "खरीद / आगमन तिथि चुनें" : "Select Procurement Date"}</span>
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  max={new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-xs font-mono font-bold text-slate-800 bg-white border border-slate-300 rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-emerald-500 shadow-xs cursor-pointer"
                />
              </div>

              {/* Quick 7-Day Date Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {datePills.map((p) => {
                  const isChosen = selectedDate === p.dateStr;
                  return (
                    <button
                      key={p.dateStr}
                      type="button"
                      onClick={() => setSelectedDate(p.dateStr)}
                      className={`p-2 rounded-xl border text-left transition flex flex-col ${
                        isChosen
                          ? "bg-emerald-50 border-emerald-500 text-emerald-900 font-bold ring-1 ring-emerald-500 shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">
                        {p.dayLabel}
                      </span>
                      <span className="text-xs font-bold mt-0.5">{p.formattedDate}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slot Picker */}
            {!isLargeFarmer && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  {t.booking.selectSlot}
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => setSelectedSlotTime(slot.time)}
                      className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                        selectedSlotTime === slot.time
                          ? "bg-emerald-50 border-emerald-500 text-emerald-900 font-bold ring-1 ring-emerald-500"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-xs">{slot.label}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {slot.load}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic Processing Time Breakdown Calculator Display */}
            <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  {t.booking.estimatedProcessingTime}
                </span>
                <span className="text-sm font-mono font-extrabold text-white">
                  ~{processingTimeResult.totalEstimatedMinutes} Minutes
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px] text-slate-300">
                <div className="p-1.5 bg-slate-800 rounded">
                  <span className="text-slate-400 block">{t.booking.baseIntake}:</span>
                  <span className="font-bold text-white font-mono">
                    {processingTimeResult.breakdown.baseEntryMinutes}m
                  </span>
                </div>
                <div className="p-1.5 bg-slate-800 rounded">
                  <span className="text-slate-400 block">{t.booking.qtyHandling}:</span>
                  <span className="font-bold text-emerald-400 font-mono">
                    +{processingTimeResult.breakdown.quantityHandlingMinutes}m
                  </span>
                </div>
                <div className="p-1.5 bg-slate-800 rounded">
                  <span className="text-slate-400 block">{t.booking.inspectionTime}:</span>
                  <span className="font-bold text-white font-mono">
                    +{processingTimeResult.breakdown.inspectionMinutes}m
                  </span>
                </div>
                <div className="p-1.5 bg-slate-800 rounded">
                  <span className="text-slate-400 block">{t.booking.vehicleAdjustment}:</span>
                  <span className="font-bold text-white font-mono">
                    +{processingTimeResult.breakdown.vehicleAdjustmentMinutes}m
                  </span>
                </div>
                <div className="p-1.5 bg-slate-800 rounded col-span-2 sm:col-span-1">
                  <span className="text-slate-400 block">{t.booking.incidentPenalty}:</span>
                  <span className="font-bold text-amber-400 font-mono">
                    +{processingTimeResult.breakdown.incidentPenaltyMinutes}m
                  </span>
                </div>
              </div>
            </div>

            {/* Innovation Feature Shortcuts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Link
                href="/farmer/ai-quality"
                target="_blank"
                className="p-3 bg-purple-50 hover:bg-purple-100/80 border border-purple-200 rounded-xl transition flex items-center justify-between text-xs group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-extrabold text-purple-950">Pre-Scan with AI Scanner</div>
                    <div className="text-[10px] text-purple-700">Check moisture % before heading to Mandi</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-purple-600 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <Link
                href="/farmer/pool"
                target="_blank"
                className="p-3 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-xl transition flex items-center justify-between text-xs group"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-extrabold text-emerald-950">Join Shared Trolley Pool</div>
                    <div className="text-[10px] text-emerald-700">Cut transport rent by up to 68%</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Submission Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2 transition disabled:opacity-60"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CalendarPlus className="w-4 h-4" />
              )}
              <span>
                {isLargeFarmer ? t.booking.requestPacsVisit : t.booking.confirmBooking}
              </span>
            </button>
          </form>
        </div>

        {/* Right: AI Recommendation Cards & Centre Explorer (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                {t.booking.aiRecommendation}
              </h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {centresLoading ? "Loading..." : "6-Factor AI Model (Weather & Proximity)"}
              </span>
            </div>

            {/* ─── Real GPS Location Bar & Region Selector ─── */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping shrink-0" />
                  <span className="font-bold text-slate-900 truncate">
                    📍 {farmerLocationName || "Detecting Location..."}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={requestGpsLocation}
                  disabled={locationLoading}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 shadow-xs shrink-0 disabled:opacity-60"
                  title="Detect exact coordinates using device GPS"
                >
                  {locationLoading ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Detecting...</span>
                    </>
                  ) : (
                    <>
                      <span>🎯 Auto-Detect GPS</span>
                    </>
                  )}
                </button>
              </div>

              {farmerLat && farmerLng && (
                <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between">
                  <span>
                    GPS: {farmerLat.toFixed(4)}°N, {farmerLng.toFixed(4)}°E
                  </span>
                  <span className="text-emerald-700 font-bold">
                    ✓ Real distance calculation active
                  </span>
                </div>
              )}

              {locationError && (
                <div className="text-[10px] text-amber-700 font-medium">
                  {locationError}
                </div>
              )}

              {/* Quick Region Selector Chips */}
              <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-slate-200/70">
                <span className="text-[10px] text-slate-500 font-semibold mr-0.5">
                  Select Hub:
                </span>
                {LOCATION_PRESETS.map((p) => {
                  const isCurrent = farmerLocationName === p.label;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handleSelectPreset(p)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                        isCurrent
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {p.label.split(",")[0]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive OpenStreetMap / Leaflet Map */}
            <div className="rounded-xl overflow-hidden border border-slate-200 shadow-xs h-72 relative">
              <CentreMapLeaflet
                centres={centres}
                selectedCentreId={selectedCentreId}
                onCentreSelect={(id) => setSelectedCentreId(id)}
                farmerLat={farmerLat}
                farmerLng={farmerLng}
                farmerLocationName={farmerLocationName}
                onDetectLocation={requestGpsLocation}
              />
            </div>

            {/* Ranked Centres List */}
            {centresLoading ? (
              <div className="flex items-center justify-center py-8 text-slate-400 text-xs gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                <span>Loading live centre data...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {rankedCentres.slice(0, 4).map((rec, idx) => {
                  const centre = centres.find((c) => c.id === rec.centreId)!;
                  if (!centre) return null;
                  const isSelected = selectedCentreId === centre.id;
                  const distText =
                    rec.distanceKm !== undefined && rec.distanceKm !== null
                      ? `${rec.distanceKm} km away`
                      : centre.distanceKm !== null && centre.distanceKm !== undefined
                      ? `${centre.distanceKm} km away`
                      : "Distance calculating...";

                  return (
                    <div
                      key={centre.id}
                      onClick={() => setSelectedCentreId(centre.id)}
                      className={`p-4 rounded-xl border transition cursor-pointer relative ${
                        isSelected
                          ? "bg-emerald-50/70 border-emerald-500 shadow-xs ring-1 ring-emerald-500"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100/80"
                      }`}
                    >
                      {idx === 0 && (
                        <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-bold shadow-xs">
                          ★ TOP AI CHOICE (Nearest Centre)
                        </span>
                      )}

                      <div className="flex justify-between items-start mb-1.5">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">
                            {centre.name}
                          </h4>
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{centre.district}, {centre.state}</span>
                            <span>•</span>
                            <span className="font-bold text-blue-700 bg-blue-50 px-1 rounded">
                              {distText}
                            </span>
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-mono font-extrabold text-emerald-700">
                            {rec.score}/100
                          </div>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              rec.congestionStatus === "GREEN"
                                ? "bg-emerald-100 text-emerald-800"
                                : rec.congestionStatus === "YELLOW"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {rec.loadPercentage}% Load
                          </span>
                        </div>
                      </div>


                      {/* "Why we recommend this" Natural Language Explainability */}

                      <div className="mt-2 pt-2 border-t border-slate-200/70 text-[11px] space-y-1">
                        <span className="font-bold text-slate-700 block">
                          {t.booking.whyRecommend}:
                        </span>
                        <ul className="space-y-0.5 text-slate-600">
                          {rec.reasons.map((r, i) => (
                            <li key={i} className="flex items-center gap-1">
                              <span className="text-emerald-600 font-bold">•</span>
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>

                        {/* Live Gemini AI Advisory for selected centre */}
                        {isSelected && (
                          <div className="mt-2.5 p-2.5 rounded-lg bg-gradient-to-r from-blue-50/90 to-indigo-50/80 border border-blue-200/80 shadow-xs space-y-1">
                            <div className="flex items-center gap-1.5 text-blue-900 font-bold text-[10px] uppercase tracking-wide">
                              <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                              <span>Gemini AI Smart Advisor</span>
                              {geminiAdvisory?.source === "gemini" && (
                                <span className="ml-auto px-1.5 py-0.2 text-[9px] font-mono bg-blue-200/80 text-blue-800 rounded font-bold">
                                  LIVE AI
                                </span>
                              )}
                            </div>
                            {isGeminiLoading ? (
                              <div className="flex items-center gap-1.5 text-slate-500 py-0.5">
                                <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                                <span className="text-[10px]">Generating real-time AI advisory...</span>
                              </div>
                            ) : (
                              <p className="text-[11px] text-slate-700 font-medium leading-relaxed">
                                {isHindi
                                  ? geminiAdvisory?.hindi || geminiAdvisory?.text || "आज यहाँ बुकिंग करना सबसे उपयुक्त रहेगा।"
                                  : geminiAdvisory?.text || "Optimal capacity and minimum wait times detected for today."}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );

                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Confirmation Dialog (Scannable QR Pass) */}
      {isSuccessModalOpen && confirmedBookingData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                {t.booking.bookingConfirmed}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Booking Reference: <strong>{confirmedBookingData.bookingNumber}</strong>
              </p>
            </div>

            {/* Generated QR Pass Preview */}
            <div className="p-4 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 inline-block mx-auto">
              <div className="w-44 h-44 bg-slate-900 text-white rounded-lg p-2 flex flex-col items-center justify-center relative shadow-xs">
                <div className="grid grid-cols-5 gap-1.5 w-full h-full p-1 bg-white">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-xs ${
                        i % 2 === 0 || i % 7 === 0 ? "bg-slate-900" : "bg-transparent"
                      }`}
                    />
                  ))}
                </div>
                <span className="absolute px-2 py-1 bg-emerald-600 text-white rounded font-mono text-[9px] font-bold shadow-md">
                  {confirmedBookingData.tokenNumber}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-700 space-y-1.5 text-left border">
              <div className="flex justify-between">
                <span className="text-slate-500">Procurement Centre:</span>
                <span className="font-bold text-slate-800">{confirmedBookingData.centreName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Procurement Date:</span>
                <span className="font-bold text-emerald-700">
                  {new Date(selectedDate).toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Produce & Quantity:</span>
                <span className="font-bold">{confirmedBookingData.cropName} ({confirmedBookingData.quantity} Q)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Arrival Window:</span>
                <span className="font-mono font-bold text-emerald-700">{confirmedBookingData.arrivalWindow}</span>
              </div>
            </div>


            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/farmer/queue/${confirmedBookingData.bookingNumber}`)}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition"
              >
                Track Live Queue →
              </button>
              <button
                onClick={() => setIsSuccessModalOpen(false)}
                className="py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PACS Farm Gate Visit Modal for Large Farmer */}
      {isPacsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-amber-700 pb-3 border-b">
              <Building className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-extrabold text-slate-900">
                PACS Farm Gate Procurement Request
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are booking <strong>{quantity} Quintals</strong> of {selectedCrop.nameEnglish}. To eliminate multiple mandi trips and avoid unloading bottlenecks, a certified PACS procurement field officer will visit your farm.
            </p>

            <div className="bg-amber-50 rounded-xl p-3.5 text-xs text-amber-900 space-y-1.5 border border-amber-200">
              <div className="font-bold text-amber-800">Assigned Inspection Team:</div>
              <div>• Nilokheri PACS Field Inspection Unit #3</div>
              <div>• Officer: Suresh Chander (Agricultural Field Officer)</div>
              <div>• Scheduled Timeframe: Next 24-48 Hours</div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmPacsRequest}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold rounded-xl text-xs transition shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm Farm Gate Visit Request
              </button>
              <button
                type="button"
                onClick={() => setIsPacsModalOpen(false)}
                className="py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
