"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { useTranslation } from "@/lib/i18n";
import { useOffline } from "@/lib/offline/OfflineContext";
import { normalizeBookings } from "@/lib/utils/normalizers";
import {
  CalendarPlus,
  Clock,
  GitCommit,
  CreditCard,
  QrCode,
  MapPin,
  Truck,
  ArrowRight,
  TrendingUp,
  CloudSun,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Info,
  Loader2,
  PackageOpen,
} from "lucide-react";

export default function FarmerDashboard() {
  const { user, farmerProfile } = useAuth();
  const { t, isHindi } = useTranslation();
  const { isOffline, cachedBooking } = useOffline();

  const [bookings, setBookings] = useState<any[]>([]);
  const [crops, setCrops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Fetch real bookings from API
  useEffect(() => {
    const farmerId = farmerProfile?.id || farmerProfile?.userId;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = typeof window !== "undefined" ? localStorage.getItem("krishi_auth_token") : "";
        const url = farmerId ? `/api/bookings?farmerId=${encodeURIComponent(farmerId)}` : "/api/bookings";
        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error(`Bookings API error: ${res.status}`);
        const data = await res.json();
        const normalized = normalizeBookings(data.bookings || [], true);
        setBookings(normalized);
      } catch (err: any) {
        console.warn("[Dashboard] Bookings fetch error:", err.message);
        setError("Could not load bookings. Please refresh.");
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    // Also fetch crops for MSP ticker
    const fetchCrops = async () => {
      try {
        const res = await fetch("/api/crops");
        if (res.ok) {
          const data = await res.json();
          setCrops(data.crops || []);
        }
      } catch {
        // Non-critical — MSP ticker won't show
      }
    };

    fetchData();
    fetchCrops();
  }, [farmerProfile?.id, farmerProfile?.userId]);

  const activeBooking = bookings[0] || null;



  return (
    <div className="flex-1 bg-slate-50 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6">
      {/* 1. Header & Welcome Bar */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-700 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Kisan ID: {farmerProfile?.kisanId || "KID-ACTIVE"} • {farmerProfile?.district || "Agriculture Division"}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            {t.dashboard.welcome}, {user?.name || "Farmer"}
          </h1>
          <p className="text-xs text-emerald-100/90">
            {t.dashboard.welcomeSub}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/farmer/book"
            className="px-4 py-2.5 bg-white hover:bg-emerald-50 text-emerald-800 font-bold rounded-xl text-xs shadow-md transition flex items-center gap-1.5"
          >
            <CalendarPlus className="w-4 h-4 text-emerald-600" />
            <span>{t.dashboard.bookNewSlot}</span>
          </Link>
        </div>
      </div>

      {/* 2. Weather & MSP Ticker */}
      <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-700">
          <CloudSun className="w-4 h-4 text-amber-500" />
          <span>Karnal Weather: 28°C (Optimal Harvest Weather)</span>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-slate-600">
          <span className="font-semibold text-slate-900">Official MSP Rates:</span>
          {crops.map((c) => (
            <span
              key={c.code}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium text-[11px]"
            >
              <strong>{c.code}:</strong> ₹{c.basePricePerQuintal}/Q
            </span>
          ))}
        </div>
      </div>

      {/* 3. Active Procurement Booking Card */}
      {loading ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex items-center justify-center gap-3 text-slate-500 text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
          <span>Loading your bookings...</span>
        </div>
      ) : !activeBooking ? (
        <div className="bg-white rounded-2xl p-10 border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-4 text-center">
          <PackageOpen className="w-10 h-10 text-slate-300" />
          <div>
            <p className="text-base font-bold text-slate-700">No Active Bookings</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              You don&apos;t have any procurement slots booked yet. Click &ldquo;Book New Slot&rdquo; to find your nearest centre and schedule a pickup.
            </p>
          </div>
          <Link
            href="/farmer/book"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center gap-1.5"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Book My First Slot</span>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="text-base font-extrabold text-slate-900">
                {t.dashboard.activeBooking}
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                {activeBooking.status}
              </span>
            </div>

            <div className="text-xs font-mono font-bold text-slate-600">
              Booking ID: <span className="text-emerald-700">{activeBooking.bookingNumber}</span>
            </div>
          </div>


          {/* Booking Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/80 rounded-xl p-4 border border-slate-200/70 text-xs">
            <div>
              <span className="text-slate-500 block mb-0.5">Crop & Volume:</span>
              <span className="font-bold text-slate-900 text-sm">
                {activeBooking.cropName} • {activeBooking.estimatedQuantityQuintals} Quintals
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Transport: {activeBooking.vehicleType.replace("_", " ")}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block mb-0.5">Procurement Centre:</span>
              <span className="font-bold text-slate-900 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                {activeBooking.centreName}
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                District: {activeBooking.centreDistrict}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block mb-0.5">Designated Arrival Window:</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1 font-mono text-sm">
                <Clock className="w-3.5 h-3.5" />
                {activeBooking.arrivalWindowStart} - {activeBooking.arrivalWindowEnd}
              </span>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Est. Processing: ~{activeBooking.estimatedProcessingTimeMinutes} mins
              </span>
            </div>

            <div>
              <span className="text-slate-500 block mb-0.5">Virtual Queue Token:</span>
              <span className="font-extrabold text-white bg-slate-900 px-2.5 py-1 rounded-md inline-block font-mono text-sm tracking-wider">
                {activeBooking.tokenNumber}
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold block mt-1">
                Position #{activeBooking.queuePosition} in Live Queue
              </span>
            </div>
          </div>

          {/* Action Buttons for Active Booking */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
            >
              <QrCode className="w-4 h-4 text-emerald-400" />
              <span>{t.dashboard.downloadQr}</span>
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/farmer/queue/${activeBooking.id}`}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{t.dashboard.viewQueue}</span>
              </Link>

              <Link
                href={`/farmer/timeline/${activeBooking.id}`}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1"
              >
                <GitCommit className="w-3.5 h-3.5 text-purple-600" />
                <span>{t.dashboard.viewTimeline}</span>
              </Link>

              <Link
                href="/farmer/payments"
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1"
              >
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.dashboard.viewPayment}</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 4. Quick Action Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/farmer/book"
          className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-emerald-500 hover:shadow-md transition group"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition">
            <CalendarPlus className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition">
            Smart Slot Booking
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Discover nearby mandis with AI capacity scores & dynamic arrival windows.
          </p>
        </Link>

        <Link
          href="/farmer/ai-quality"
          className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-purple-500 hover:shadow-md transition group"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mb-3 group-hover:scale-105 transition">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition">
            AI Grain Quality Scan
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Computer Vision moisture % and Agmarknet Grade A pre-screening from your phone photo.
          </p>
        </Link>

        <Link
          href="/farmer/pool"
          className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-emerald-500 hover:shadow-md transition group"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-105 transition">
            <Truck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition">
            Shared Vehicle Pooling
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Club small harvests with neighbors into 1 tractor to save up to 68% freight.
          </p>
        </Link>

        <Link
          href="/farmer/payments"
          className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-amber-500 hover:shadow-md transition group"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-105 transition">
            <CreditCard className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition">
            DBT Payments & Receipts
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Track PFMS bank credits, download verified J-Form receipts, and audit PDS traceability.
          </p>
        </Link>
      </div>

      {/* 5. Recent Procurement History Table */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
        <h3 className="text-sm font-extrabold text-slate-900 mb-3">
          {t.dashboard.recentBookings}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Booking ID</th>
                <th className="py-2.5 px-3">Crop</th>
                <th className="py-2.5 px-3">Quantity</th>
                <th className="py-2.5 px-3">Centre</th>
                <th className="py-2.5 px-3">Stage</th>
                <th className="py-2.5 px-3">Payout Status</th>
                <th className="py-2.5 px-3 text-right">Receipt / Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.slice(0, 4).map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                    {b.bookingNumber}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">{b.cropName}</td>
                  <td className="py-2.5 px-3 font-bold text-slate-900">
                    {b.actualQuantityQuintals || b.estimatedQuantityQuintals} Q
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{b.centreName}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                      {b.currentStage.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.paymentStatus === "SUCCESSFUL"
                          ? "bg-emerald-100 text-emerald-800"
                          : b.paymentStatus === "PROCESSING"
                          ? "bg-sky-100 text-sky-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {b.paymentStatus || "PENDING"}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right space-x-2">
                    <Link
                      href={`/farmer/receipt/${b.bookingNumber}`}
                      className="text-emerald-700 hover:text-emerald-800 font-bold text-[11px] underline"
                    >
                      J-Form Slip
                    </Link>
                    <Link
                      href={`/farmer/timeline/${b.id}`}
                      className="text-slate-500 hover:text-slate-800 text-[11px]"
                    >
                      Timeline →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Modal */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Digital Gate QR Pass
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Token: <strong>{activeBooking.tokenNumber}</strong> | {activeBooking.cropName} ({activeBooking.estimatedQuantityQuintals}Q)
              </p>
            </div>

            {/* Simulated Scannable QR Code Graphics */}
            <div className="p-4 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 inline-block mx-auto">
              <div className="w-48 h-48 bg-white border border-slate-900 rounded-lg p-2 flex flex-col items-center justify-center relative shadow-xs">
                {/* SVG QR Code Pattern */}
                <div className="w-full h-full bg-slate-900 flex items-center justify-center text-white rounded p-3">
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
                </div>
                <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="px-2 py-1 bg-emerald-600 text-white rounded font-mono text-[9px] font-bold shadow-md">
                    {activeBooking.tokenNumber}
                  </span>
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-600 bg-emerald-50 rounded-lg p-2.5 border border-emerald-200">
              Arrival Window: <strong>{activeBooking.arrivalWindowStart} - {activeBooking.arrivalWindowEnd}</strong>
              <br />
              Centre: {activeBooking.centreName}
            </div>

            <button
              onClick={() => setIsQrModalOpen(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition"
            >
              Close Pass
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
