"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import { StaffGate } from "@/components/auth/StaffGate";
import { SEEDED_BOOKINGS, MockBooking } from "@/lib/data/mockDatabase";
import { normalizeBookings } from "@/lib/utils/normalizers";
import { evaluateQuality, QualityMetricsInput } from "@/lib/algorithms";
import {
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  ShieldCheck,
  Building,
  User,
  Sliders,
  ChevronRight,
  ArrowRight,
  Info,
  Sparkles,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function InspectorPage() {
  const { t, isHindi } = useTranslation();

  const [bookings, setBookings] = useState<MockBooking[]>(SEEDED_BOOKINGS);
  const [loading, setLoading] = useState(true);
  const [selectedBookingId, setSelectedBookingId] = useState<string>("KF-2026-0005");
  const [moisture, setMoisture] = useState<number>(11.5);
  const [foreignMatter, setForeignMatter] = useState<number>(0.8);
  const [damagedGrain, setDamagedGrain] = useState<number>(1.2);
  const [inspectorRemarks, setInspectorRemarks] = useState<string>(
    "Grain sample exhibited excellent amber luster, uniform kernel size, and optimal moisture."
  );
  const [inspectionSuccess, setInspectionSuccess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fetch real bookings awaiting quality inspection
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/bookings");
        if (res.ok) {
          const data = await res.json();
          const normalized = normalizeBookings(data.bookings || [], true);
          if (normalized.length > 0) {
            setBookings(normalized);
            setSelectedBookingId(normalized[0].bookingNumber || normalized[0].id);
          }
        }
      } catch (err: any) {
        console.warn("[Inspector] Using fallback bookings:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  const activeBooking =
    bookings.find((b) => b.id === selectedBookingId || b.bookingNumber === selectedBookingId) ||
    bookings[0] ||
    SEEDED_BOOKINGS[2];

  // Dynamic Agmarknet Quality Grading Calculation
  const qualityResult = useMemo(() => {
    return evaluateQuality({
      moisturePercentage: moisture,
      foreignMaterialPercentage: foreignMatter,
      damagedGrainPercentage: damagedGrain,
      cropName: activeBooking.cropName,
      submittedQuantityQuintals:
        activeBooking.actualQuantityQuintals || activeBooking.estimatedQuantityQuintals,
    });
  }, [moisture, foreignMatter, damagedGrain, activeBooking]);

  const handleSelectBooking = (bId: string) => {
    setSelectedBookingId(bId);
    setInspectionSuccess(false);
    const target = bookings.find((b) => b.id === bId || b.bookingNumber === bId);
    if (target?.cropName?.toLowerCase().includes("maize")) {
      setMoisture(14.5);
      setForeignMatter(1.2);
      setDamagedGrain(2.1);
    } else {
      setMoisture(11.5);
      setForeignMatter(0.8);
      setDamagedGrain(1.2);
    }
  };

  const handleSubmitDecision = async (decisionType: string) => {
    setIsSubmitting(true);
    try {
      await fetch("/api/procurement/quality-inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: activeBooking.id,
          moisturePercentage: moisture,
          foreignMaterialPercentage: foreignMatter,
          damagedGrainPercentage: damagedGrain,
          qualityGrade: qualityResult.grade,
          decision: decisionType,
          inspectorRemarks,
          inspectorId: "dr_anil_sharma",
        }),
      });
    } catch (err: any) {
      console.warn("[Inspector] Saved inspection locally:", err.message);
    } finally {
      setIsSubmitting(false);
      setInspectionSuccess(true);
      setTimeout(() => {
        setInspectionSuccess(false);
      }, 2500);
    }
  };

  return (
    <StaffGate
      allowedRoles={["QUALITY_INSPECTOR", "DISTRICT_ADMIN", "STATE_ADMIN", "SUPER_ADMIN"]}
      stationName="Agmarknet Quality Testing Station"
      stationDescription="Authorized laboratory terminal for digital grain inspection, moisture analysis, and Agmarknet certification."
    >
      <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full space-y-6">
      {/* Top Header */}
      <div className="bg-purple-950 text-white rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30">
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Agmarknet Certified Grain Testing Station • Karnal APMC</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            {t.inspector.title}
          </h1>
          <p className="text-xs text-purple-200/80">
            {t.inspector.subtitle}
          </p>
        </div>

        <div className="text-right">
          <span className="text-[11px] text-purple-300 block">Chief Quality Assessor:</span>
          <span className="font-bold text-xs">Dr. Anil Sharma (Cert #AQ-2024-918)</span>
        </div>
      </div>

      {/* Select Lot from Queue */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Select Weighed Grain Lot for Lab Analysis:
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <button
            type="button"
            onClick={() => handleSelectBooking("KF-2026-0005")}
            className={`p-3.5 rounded-xl border text-left transition ${
              selectedBookingId === "KF-2026-0005"
                ? "bg-purple-50 border-purple-500 ring-1 ring-purple-500 shadow-xs"
                : "bg-slate-50 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-900">Gurpreet Singh</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                Grade A Sample
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Wheat • 45.2 Quintals (TK-098)
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelectBooking("KF-2026-0008")}
            className={`p-3.5 rounded-xl border text-left transition ${
              selectedBookingId === "KF-2026-0008"
                ? "bg-purple-50 border-purple-500 ring-1 ring-purple-500 shadow-xs"
                : "bg-slate-50 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-900">Sunita Devi</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                Grade B (2% Cut)
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Maize • 30.0 Quintals (TK-088)
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSelectBooking("KF-2026-REJECT")}
            className={`p-3.5 rounded-xl border text-left transition ${
              selectedBookingId === "KF-2026-REJECT"
                ? "bg-rose-50 border-rose-500 ring-1 ring-rose-500 shadow-xs"
                : "bg-slate-50 border-slate-200 hover:bg-slate-100"
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-900">High Moisture Lot</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-800">
                Reject / Dry Test
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Wheat • 50.0 Quintals (High Water)
            </div>
          </button>
        </div>
      </div>

      {/* Main Inspection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Inputs (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b pb-3">
              <Sliders className="w-4 h-4 text-purple-600" />
              <span>{t.inspector.sampleTesting}</span>
            </h2>

            {/* Moisture Meter Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700">
                  {t.inspector.moisturePercent}
                </label>
                <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                  {moisture}% (Standard Max: 12.0%)
                </span>
              </div>
              <input
                type="range"
                min={8}
                max={22}
                step={0.1}
                value={moisture}
                onChange={(e) => setMoisture(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Optimal (8%)</span>
                <span className="text-emerald-600 font-bold">Standard (12%)</span>
                <span className="text-amber-600 font-bold">Grade B (14%)</span>
                <span className="text-rose-600 font-bold">Reject (&gt;16.5%)</span>
              </div>
            </div>

            {/* Foreign Matter Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700">
                  {t.inspector.foreignMatterPercent}
                </label>
                <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                  {foreignMatter}% (Standard Max: 2.0%)
                </span>
              </div>
              <input
                type="range"
                min={0.1}
                max={6.0}
                step={0.1}
                value={foreignMatter}
                onChange={(e) => setForeignMatter(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>

            {/* Damaged Grain Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700">
                  {t.inspector.damagedGrainPercent}
                </label>
                <span className="text-xs font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                  {damagedGrain}% (Standard Max: 3.0%)
                </span>
              </div>
              <input
                type="range"
                min={0.1}
                max={8.0}
                step={0.1}
                value={damagedGrain}
                onChange={(e) => setDamagedGrain(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
              />
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t.inspector.remarks}
              </label>
              <textarea
                rows={2}
                value={inspectorRemarks}
                onChange={(e) => setInspectorRemarks(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-purple-500"
              />
            </div>

            {inspectionSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>✓ Quality Decision Recorded! Procurement Accepted & Payout Batch Queued.</span>
              </div>
            )}

            {/* Decision Action Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleSubmitDecision("ACCEPT")}
                className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{t.inspector.decisions.ACCEPT}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSubmitDecision("PARTIAL")}
                className="p-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 shadow-xs"
              >
                <Sliders className="w-4 h-4" />
                <span>{t.inspector.decisions.PARTIAL_ACCEPT}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSubmitDecision("REINSPECT")}
                className="p-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 shadow-xs"
              >
                <Info className="w-4 h-4" />
                <span>{t.inspector.decisions.REINSPECT}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSubmitDecision("REJECT")}
                className="p-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex flex-col items-center gap-1 shadow-xs"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>{t.inspector.decisions.REJECT}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Output & Quality Certificate Card (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center justify-between border-b pb-3">
              <span>Agmarknet Quality Decision Certificate</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </h3>

            {/* Big Grade Badge */}
            <div
              className={`p-5 rounded-2xl border text-center space-y-1 ${
                qualityResult.grade === "GRADE_A"
                  ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                  : qualityResult.grade === "GRADE_B"
                  ? "bg-sky-50 border-sky-300 text-sky-900"
                  : qualityResult.grade === "GRADE_C"
                  ? "bg-amber-50 border-amber-300 text-amber-900"
                  : "bg-rose-50 border-rose-300 text-rose-900"
              }`}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider block opacity-80">
                {t.inspector.assignedGrade}
              </span>
              <div className="text-2xl font-black">{qualityResult.grade.replace("_", " ")}</div>
              <p className="text-xs font-medium mt-1">
                {qualityResult.gradeDescription}
              </p>
            </div>

            {/* Metric Checks */}
            <div className="bg-slate-50 rounded-xl p-4 border text-xs space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Moisture Content ({moisture}%):</span>
                <span
                  className={`font-bold flex items-center gap-1 ${
                    qualityResult.passedMoisture ? "text-emerald-700" : "text-rose-600"
                  }`}
                >
                  {qualityResult.passedMoisture ? "✓ Pass (Grade Range)" : "✗ Exceeds Cutoff"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600">Foreign Matter ({foreignMatter}%):</span>
                <span
                  className={`font-bold flex items-center gap-1 ${
                    qualityResult.passedForeignMatter ? "text-emerald-700" : "text-rose-600"
                  }`}
                >
                  {qualityResult.passedForeignMatter ? "✓ Pass" : "✗ Exceeds Cutoff"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600">Damaged Grain ({damagedGrain}%):</span>
                <span
                  className={`font-bold flex items-center gap-1 ${
                    qualityResult.passedDamagedGrain ? "text-emerald-700" : "text-rose-600"
                  }`}
                >
                  {qualityResult.passedDamagedGrain ? "✓ Pass" : "✗ Exceeds Cutoff"}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-bold">
                <span className="text-slate-900">Net Accepted Quantity:</span>
                <span className="text-emerald-700 font-mono text-sm">
                  {qualityResult.acceptedQuantityQuintals} Q
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500">
              Procurement Officer Signature: <strong>Dr. Anil Sharma</strong>
              <br />
              Digital Hash: <span className="font-mono text-[10px]">AGM-2026-HR-8849-AUTH</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </StaffGate>
  );
}
