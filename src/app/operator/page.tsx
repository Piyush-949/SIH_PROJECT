"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import { StaffGate } from "@/components/auth/StaffGate";
import { SEEDED_BOOKINGS, SEEDED_CENTRES, MockBooking } from "@/lib/data/mockDatabase";
import { normalizeBookings } from "@/lib/utils/normalizers";
import { ProcurementStage } from "@/types";
import {
  QrCode,
  ScanLine,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Scale,
  FlaskConical,
  CreditCard,
  Building,
  User,
  Search,
  Filter,
  Sparkles,
  ChevronRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function OperatorPage() {
  const { t, isHindi } = useTranslation();

  const [centre] = useState(SEEDED_CENTRES[0]); // Karnal Central APMC
  const [bookings, setBookings] = useState<MockBooking[]>(SEEDED_BOOKINGS);
  const [loading, setLoading] = useState(true);
  const [manualInput, setManualInput] = useState("");
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [scanSuccessMessage, setScanSuccessMessage] = useState<string | null>(null);
  const [filterStage, setFilterStage] = useState<string>("ALL");

  // Fetch real bookings from DB
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/bookings");
        if (res.ok) {
          const data = await res.json();
          const normalized = normalizeBookings(data.bookings || [], true);
          if (normalized.length > 0) setBookings(normalized);
        }
      } catch (err: any) {
        console.warn("[Operator] Using fallback bookings:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  // QR Camera simulation trigger
  const handleSimulateScan = async (bookingNum: string = "KF-2026-0001") => {
    setScanSuccessMessage(null);
    try {
      await fetch("/api/procurement/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: bookingNum }),
      });
    } catch (err: any) {
      console.warn("[Operator] Check-in local update:", err.message);
    }

    setBookings((prev) =>
      prev.map((b) =>
        b.bookingNumber === bookingNum || b.id === bookingNum
          ? {
              ...b,
              status: "CHECKED_IN",
              currentStage: "CHECKED_IN",
              stageTimestamps: {
                ...b.stageTimestamps,
                CHECKED_IN: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              },
            }
          : b
      )
    );
    setScanSuccessMessage(`✓ QR Scanned Successfully! Verified & Checked In: ${bookingNum}`);
  };

  const handleManualCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleSimulateScan(manualInput.trim().toUpperCase());
    setManualInput("");
  };

  const handleAdvanceStage = async (bookingId: string) => {
    const stages: ProcurementStage[] = [
      "SLOT_BOOKED",
      "CHECKED_IN",
      "IDENTITY_VERIFIED",
      "DOCUMENTS_VERIFIED",
      "PRODUCE_WEIGHED",
      "QUALITY_INSPECTED",
      "PROCUREMENT_ACCEPTED",
      "PAYMENT_PROCESSING",
      "PAYMENT_COMPLETED",
    ];

    const currentBooking = bookings.find((b) => b.id === bookingId || b.bookingNumber === bookingId);
    if (!currentBooking) return;
    const currIdx = stages.indexOf(currentBooking.currentStage as ProcurementStage);
    const nextStage = currIdx < stages.length - 1 ? stages[currIdx + 1] : stages[currIdx];

    try {
      await fetch("/api/procurement/transition-stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: currentBooking.id,
          stage: nextStage,
          status: nextStage === "PAYMENT_COMPLETED" ? "COMPLETED" : "IN_PROGRESS",
        }),
      });
    } catch {}

    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId || b.bookingNumber === bookingId) {
          return {
            ...b,
            currentStage: nextStage,
            status: nextStage === "PAYMENT_COMPLETED" ? "COMPLETED" : "IN_PROGRESS",
          };
        }
        return b;
      })
    );
  };

  const filteredBookings = bookings.filter((b) => {
    if (filterStage === "ALL") return true;
    return b.currentStage === filterStage;
  });

  return (
    <StaffGate
      allowedRoles={["CENTRE_OPERATOR", "DISTRICT_ADMIN", "STATE_ADMIN", "SUPER_ADMIN"]}
      stationName="Mandi Operator & Intake Bay"
      stationDescription="Authorized personnel terminal for gate check-in, weighing bay control, and queue dispatching."
    >
      <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white rounded-2xl p-6 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
            <Building className="w-3.5 h-3.5" />
            <span>Mandi Code: {centre.code} • {centre.district}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            {t.operator.title}
          </h1>
          <p className="text-xs text-slate-400">
            {centre.name} — Gate Check-in, Live Queue Flow & Weighbridge Intake Controller.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/operator/weighing"
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 shadow-xs"
          >
            <Scale className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.nav.weighing}</span>
          </Link>

          <Link
            href="/operator/incidents"
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{t.nav.incidents}</span>
          </Link>
        </div>
      </div>

      {/* QR Scanner Simulation & Manual Intake Box */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <ScanLine className="w-4 h-4 text-emerald-600" />
              <span>{t.operator.scannerTitle}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {t.operator.scannerDesc}
            </p>
          </div>

          <button
            onClick={() => setScanModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-md shadow-emerald-950/20"
          >
            <QrCode className="w-4 h-4" />
            <span>{t.operator.scanCameraBtn}</span>
          </button>
        </div>

        {scanSuccessMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{scanSuccessMessage}</span>
          </div>
        )}

        {/* Manual Lookup Form */}
        <form onSubmit={handleManualCheckIn} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Enter Booking ID (e.g. KF-2026-0001) or QR Token"
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-mono uppercase focus:outline-hidden focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition shrink-0"
          >
            {t.operator.checkInBtn}
          </button>
        </form>
      </div>

      {/* Live Mandi Queue Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>{t.operator.activeQueueTable}</span>
            </h3>
            <span className="text-xs text-slate-500">
              {filteredBookings.length} total vehicle slots in system
            </span>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {["ALL", "SLOT_BOOKED", "CHECKED_IN", "IN_PROGRESS", "PRODUCE_WEIGHED", "COMPLETED"].map((f) => (
              <button
                key={f}
                onClick={() => setFilterStage(f)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  filterStage === f
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Token</th>
                <th className="py-3 px-3">Booking ID</th>
                <th className="py-3 px-3">Farmer</th>
                <th className="py-3 px-3">Crop / Qty</th>
                <th className="py-3 px-3">Vehicle</th>
                <th className="py-3 px-3">Current Stage</th>
                <th className="py-3 px-3 text-right">Station Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-3 font-mono font-extrabold text-slate-900">
                    <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-[11px]">
                      {b.tokenNumber}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-800">
                    {b.bookingNumber}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{b.farmerName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{b.kisanId}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-slate-900">{b.cropName}</span>
                    <div className="text-[10px] text-slate-500">
                      {b.actualQuantityQuintals || b.estimatedQuantityQuintals} Q
                    </div>
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    {b.vehicleType.replace("_", " ")}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.currentStage === "SLOT_BOOKED"
                          ? "bg-amber-100 text-amber-800"
                          : b.currentStage === "CHECKED_IN"
                          ? "bg-blue-100 text-blue-800"
                          : b.currentStage === "PRODUCE_WEIGHED"
                          ? "bg-purple-100 text-purple-800"
                          : b.currentStage === "PAYMENT_COMPLETED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {b.currentStage.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {b.currentStage === "SLOT_BOOKED" ? (
                        <button
                          onClick={() => handleSimulateScan(b.bookingNumber)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition"
                        >
                          Check In
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAdvanceStage(b.id)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                        >
                          <span>Advance</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}

                      <Link
                        href={`/farmer/timeline/${b.id}`}
                        className="p-1 rounded text-slate-400 hover:text-slate-800"
                        title="View Timeline"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Camera QR Scanner Simulation Modal */}
      {scanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <ScanLine className="w-4 h-4 text-emerald-600" />
                <span>Simulated Camera QR Scanner</span>
              </h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                ACTIVE
              </span>
            </div>

            {/* Viewfinder simulation box */}
            <div className="w-full h-48 bg-slate-950 rounded-xl relative overflow-hidden flex items-center justify-center border-2 border-emerald-500">
              <div className="absolute inset-x-0 h-0.5 bg-emerald-400 animate-pulse" />
              <div className="w-32 h-32 border-2 border-dashed border-emerald-400/80 rounded-lg flex items-center justify-center text-emerald-300 text-[11px] font-mono">
                Align QR Code
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Point camera at farmer's digital gate QR pass on their mobile screen.
            </p>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  handleSimulateScan("KF-2026-0001");
                  setScanModalOpen(false);
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-md"
              >
                Scan Token: TK-101 (Ramesh Kumar - Wheat 40Q)
              </button>

              <button
                onClick={() => setScanModalOpen(false)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Close Scanner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </StaffGate>
  );
}
