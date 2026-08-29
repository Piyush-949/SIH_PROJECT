"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { useOffline } from "@/lib/offline/OfflineContext";
import { useCentreQueueSocket } from "@/lib/socket/client";
import { SEEDED_BOOKINGS, SEEDED_INCIDENTS, SEEDED_CENTRES } from "@/lib/data/mockDatabase";
import { normalizeBooking } from "@/lib/utils/normalizers";
import {
  Clock,
  MapPin,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  Activity,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Wifi,
  WifiOff,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function LiveQueuePage() {
  const params = useParams();
  const router = useRouter();
  const { t, isHindi } = useTranslation();
  const { isOffline, cachedBooking } = useOffline();

  const bookingId = (params?.id as string) || "KF-2026-0001";
  const initialBooking =
    SEEDED_BOOKINGS.find((b) => b.id === bookingId || b.bookingNumber === bookingId) ||
    SEEDED_BOOKINGS[0];

  const [booking, setBooking] = useState(initialBooking);
  const [loading, setLoading] = useState(true);
  const [queuePosition, setQueuePosition] = useState<number>(2);
  const [currentServingToken, setCurrentServingToken] = useState<string>("TK-099");
  const [etaMinutes, setEtaMinutes] = useState<number>(18);
  const [activeIncident, setActiveIncident] = useState<any>(SEEDED_INCIDENTS[0]);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState<boolean>(false);
  const [rescheduledSuccess, setRescheduledSuccess] = useState<boolean>(false);

  // Fetch real booking and queue position
  useEffect(() => {
    const fetchQueueDetails = async () => {
      try {
        setLoading(true);
        // 1. Fetch booking by ID or Number
        const bRes = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}`);
        if (bRes.ok) {
          const bData = await bRes.json();
          if (bData.booking) {
            const normalized = normalizeBooking(bData.booking);
            setBooking(normalized);

            // 2. Fetch live queue entries for the centre
            const qRes = await fetch(`/api/queue?centreId=${encodeURIComponent(normalized.centreId)}`);
            if (qRes.ok) {
              const qData = await qRes.json();
              const entries = qData.entries || [];
              const myEntryIdx = entries.findIndex(
                (e: any) => e.bookingId === bData.booking.id || e.tokenNumber === normalized.tokenNumber
              );
              if (myEntryIdx !== -1) {
                setQueuePosition(myEntryIdx);
                setEtaMinutes(Math.max(5, (myEntryIdx + 1) * 15));
              }
              if (entries.length > 0) {
                setCurrentServingToken(entries[0].tokenNumber || "TK-099");
              }
            }
          }
        }
      } catch (err: any) {
        console.warn("[LiveQueue] Using fallback booking:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchQueueDetails();
  }, [bookingId]);

  // Connect to live Socket.IO room for centre
  const { lastUpdate } = useCentreQueueSocket(booking.centreId, (data) => {
    if (data.type === "INCIDENT") {
      setActiveIncident(data.incident);
      setEtaMinutes((prev) => prev + (data.incident?.delayImpactMinutes || 15));
    }
  });

  // Dynamic ETA ticker countdown simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setEtaMinutes((prev) => (prev > 1 ? prev - 1 : 1));
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleReschedule = async (newSlot: string) => {
    try {
      await fetch("/api/bookings/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: booking.id,
          newSlotTime: newSlot,
        }),
      });
    } catch {}

    setBooking((prev) => ({
      ...prev,
      arrivalWindowStart: newSlot.split(" - ")[0] || "10:30 AM",
      arrivalWindowEnd: newSlot.split(" - ")[1] || "12:00 PM",
      tokenNumber: `TK-${Math.floor(200 + Math.random() * 800)}`,
    }));
    setQueuePosition(1);
    setEtaMinutes(10);
    setRescheduledSuccess(true);
    setTimeout(() => {
      setIsRescheduleModalOpen(false);
      setRescheduledSuccess(false);
    }, 1200);
  };

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200">
            <Activity className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            <span>WebSocket Live Synchronized Queue</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {t.queue.title}
          </h1>
          <p className="text-xs text-slate-600">
            Booking ID: <strong className="font-mono text-slate-900">{booking.bookingNumber}</strong> • {booking.centreName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRescheduleModalOpen(true)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-300 shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
            <span>{t.queue.rescheduleBtn}</span>
          </button>
        </div>
      </div>

      {/* Incident Delay Banner (if any) */}
      {activeIncident && (
        <div className="bg-amber-500/10 border border-amber-300 rounded-2xl p-4 text-amber-900 text-xs flex items-start gap-3 shadow-xs">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-700 mt-0.5 shrink-0">
            <AlertTriangle className="w-5 h-5 animate-bounce" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-amber-900 text-sm">
                Operational Alert: {activeIncident.incidentType.replace(/_/g, " ")}
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px] font-bold">
                +{activeIncident.delayImpactMinutes} MINS IMPACT
              </span>
            </div>
            <p className="mt-1 leading-relaxed text-amber-800">
              {activeIncident.description} — All farmer entry windows automatically recalibrated.
            </p>
          </div>
        </div>
      )}

      {/* Main Queue Progress Board */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        {/* Big Telemetry Numbers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-inner">
            <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider">
              {t.queue.tokenNumber}
            </span>
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-emerald-400 mt-1 block">
              {booking.tokenNumber}
            </span>
            <span className="text-[10px] text-slate-300 mt-1 block">
              {booking.cropName} • {booking.estimatedQuantityQuintals} Q
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <span className="text-[11px] font-semibold text-slate-500 block uppercase tracking-wider">
              {t.queue.currentServing}
            </span>
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 mt-1 block">
              {currentServingToken}
            </span>
            <span className="text-[10px] text-emerald-700 font-bold mt-1 block flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              At Weighbridge Station
            </span>
          </div>

          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5">
            <span className="text-[11px] font-semibold text-emerald-800 block uppercase tracking-wider">
              {t.queue.etaCountdown}
            </span>
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-emerald-700 mt-1 block">
              ~{etaMinutes} Mins
            </span>
            <span className="text-[10px] text-emerald-600 font-bold mt-1 block">
              Arrival: {booking.arrivalWindowStart}
            </span>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-700">
            <span>Queue Progress ({queuePosition} vehicle{queuePosition > 1 ? "s" : ""} ahead)</span>
            <span className="text-emerald-700">
              {queuePosition === 0 ? "You are next!" : "On Track"}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3.5 p-0.5 overflow-hidden border border-slate-200">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(15, 100 - queuePosition * 30)}%` }}
            />
          </div>
        </div>

        {/* Live Queue Station Stepper Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
          {[
            { step: "Gate Check-In", status: "COMPLETED", time: "08:12 AM" },
            { step: "Doc Verification", status: "IN_PROGRESS", time: "Current" },
            { step: "Weighbridge Intake", status: "WAITING", time: `~${etaMinutes}m` },
            { step: "Agmarknet Lab", status: "WAITING", time: `~${etaMinutes + 12}m` },
          ].map((st, i) => (
            <div
              key={st.step}
              className={`p-3 rounded-xl border text-xs ${
                st.status === "COMPLETED"
                  ? "bg-emerald-50/70 border-emerald-300 text-emerald-900"
                  : st.status === "IN_PROGRESS"
                  ? "bg-blue-50/80 border-blue-400 text-blue-900 font-bold ring-1 ring-blue-400"
                  : "bg-slate-50 border-slate-200 text-slate-500"
              }`}
            >
              <div className="text-[10px] text-slate-400 font-mono mb-0.5">Stage 0{i + 1}</div>
              <div className="font-bold">{st.step}</div>
              <div className="text-[10px] mt-1 font-semibold">{st.time}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Shortcuts */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <Link
          href={`/farmer/timeline/${booking.id}`}
          className="text-xs font-bold text-slate-700 hover:text-emerald-700 flex items-center gap-1.5"
        >
          <span>View Detailed 9-Stage Procurement Timeline</span>
          <ChevronRight className="w-4 h-4 text-emerald-600" />
        </Link>
        <Link
          href="/farmer/dashboard"
          className="text-xs font-bold text-slate-500 hover:text-slate-800"
        >
          ← Return to Dashboard
        </Link>
      </div>

      {/* Rescheduling Modal */}
      {isRescheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-slate-900 pb-2 border-b">
              <RotateCcw className="w-5 h-5 text-emerald-600" />
              <h3 className="text-base font-extrabold">{t.queue.rescheduleTitle}</h3>
            </div>
            <p className="text-xs text-slate-600">
              {t.queue.rescheduleDesc}
            </p>

            {rescheduledSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-center text-xs font-bold text-emerald-800">
                ✓ Slot Rescheduled Successfully! Updating Queue...
              </div>
            ) : (
              <div className="space-y-2">
                {[
                  "10:30 AM - 12:00 PM (Recommended • Low Load)",
                  "01:30 PM - 03:00 PM (Optimal)",
                  "Tomorrow 08:30 AM - 10:00 AM (Priority Morning)",
                ].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleReschedule(s)}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-500 text-left text-xs font-semibold text-slate-800 transition flex items-center justify-between"
                  >
                    <span>{s}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => setIsRescheduleModalOpen(false)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
