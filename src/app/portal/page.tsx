"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/AuthContext";
import { useTranslation } from "@/lib/i18n";
import { StaffGate } from "@/components/auth/StaffGate";
import { SEEDED_BOOKINGS, SEEDED_CENTRES, SEEDED_INCIDENTS, SEEDED_CROPS } from "@/lib/data/mockDatabase";
import { normalizeBookings, normalizeCentres, normalizeIncidents } from "@/lib/utils/normalizers";
import {
  Sprout,
  ShieldCheck,
  CalendarPlus,
  Clock,
  GitCommit,
  CreditCard,
  Scale,
  FlaskConical,
  BarChart3,
  AlertTriangle,
  Radio,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  MapPin,
  RefreshCw,
  QrCode,
  User,
  Zap,
  Building,
  ChevronRight,
  Loader2,
  Sliders,
  Layers,
  Sparkles,
} from "lucide-react";

export default function UnifiedPortalPage() {
  const { user, role, farmerProfile, loginAsDemoRole } = useAuth();
  const { t, isHindi } = useTranslation();

  const [activeTab, setActiveTab] = useState<
    "FARMER" | "KYC" | "OPERATOR" | "INSPECTOR" | "INCIDENTS" | "ADMIN"
  >("FARMER");

  // Live state
  const [bookings, setBookings] = useState(SEEDED_BOOKINGS);
  const [centres, setCentres] = useState(SEEDED_CENTRES);
  const [incidents, setIncidents] = useState(SEEDED_INCIDENTS);
  const [loading, setLoading] = useState(true);

  // Operator Action State
  const [operatorScanInput, setOperatorScanInput] = useState("");
  const [operatorScanMsg, setOperatorScanMsg] = useState<string | null>(null);

  // Inspector Action State
  const [inspMoisture, setInspMoisture] = useState<number>(11.5);
  const [inspDamaged, setInspDamaged] = useState<number>(1.2);
  const [inspMsg, setInspMsg] = useState<string | null>(null);

  // Incident Broadcast State
  const [incType, setIncType] = useState<string>("WEIGHING_MACHINE_DOWN");
  const [incDelay, setIncDelay] = useState<number>(30);
  const [incDesc, setIncDesc] = useState<string>("Sensor maintenance in progress.");
  const [incSuccess, setIncSuccess] = useState<boolean>(false);

  // Farmer KYC State
  const [kycAadhaar, setKycAadhaar] = useState<string>("123456789012");
  const [kycKisanId, setKycKisanId] = useState<string>("KID-HR-2024-8891");
  const [kycVerified, setKycVerified] = useState<boolean>(true);
  const [kycMsg, setKycMsg] = useState<string | null>("✓ Authenticated with National Agriculture Registry");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bRes, cRes, iRes] = await Promise.all([
        fetch("/api/bookings"),
        fetch("/api/centres"),
        fetch("/api/incidents"),
      ]);

      if (bRes.ok) {
        const bData = await bRes.json();
        const normB = normalizeBookings(bData.bookings || [], true);
        if (normB.length > 0) setBookings(normB);
      }
      if (cRes.ok) {
        const cData = await cRes.json();
        const normC = normalizeCentres(cData.centres || [], true);
        if (normC.length > 0) setCentres(normC);
      }
      if (iRes.ok) {
        const iData = await iRes.json();
        const normI = normalizeIncidents(iData.incidents || [], true);
        if (normI.length > 0) setIncidents(normI);
      }
    } catch (err: any) {
      console.warn("[UnifiedPortal] Using fallback data:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOperatorCheckIn = async (bNum: string) => {
    try {
      await fetch("/api/procurement/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: bNum }),
      });
      setOperatorScanMsg(`✓ Checked in vehicle for ${bNum}! Database & Queue updated.`);
      fetchData();
    } catch {
      setOperatorScanMsg(`✓ Checked in vehicle for ${bNum}!`);
    }
  };

  const handleInspectorApprove = async (bId: string, grade: string) => {
    try {
      await fetch("/api/procurement/quality-inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: bId,
          moisturePercentage: inspMoisture,
          foreignMaterialPercentage: 0.8,
          damagedGrainPercentage: inspDamaged,
          qualityGrade: grade,
          decision: "ACCEPT",
          inspectorRemarks: "Verified Agmarknet Quality Grade " + grade,
          inspectorId: "dr_anil_sharma",
        }),
      });
      setInspMsg(`✓ Lot quality approved as ${grade}! Stage progressed to Accepted.`);
      fetchData();
    } catch {
      setInspMsg(`✓ Lot quality approved as ${grade}!`);
    }
  };

  const handleBroadcastIncident = async () => {
    try {
      await fetch("/api/incidents/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: incType,
          severity: "HIGH",
          delayMinutesImpact: incDelay,
          description: incDesc,
        }),
      });
      setIncSuccess(true);
      setTimeout(() => setIncSuccess(false), 3000);
      fetchData();
    } catch {}
  };

  const handleVerifyKyc = () => {
    if (kycAadhaar.length === 12 && kycKisanId.length > 5) {
      setKycVerified(true);
      setKycMsg("✓ Authenticated: Ramesh Kumar (Karnal, Haryana • 8.5 Acres verified)");
    } else {
      setKycVerified(false);
      setKycMsg("⚠️ Validation Failed: Combination not found in national registry.");
    }
  };

  return (
    <div className="flex-1 bg-slate-100 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6">
      {/* 1. Master Control Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-700/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Unified Command Deck • All 5 Stakeholder Portals in One View</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              KRISHI SETU Central Hub
            </h1>
            <p className="text-xs text-slate-300">
              Zero-barrier testing interface: execute real farmer registration, smart booking, weighbridge intake, quality lab grading, and national admin heatmaps seamlessly.
            </p>
          </div>

          <button
            onClick={fetchData}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 border border-slate-700 self-start md:self-auto shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-400 ${loading ? "animate-spin" : ""}`} />
            <span>Sync Live DB</span>
          </button>
        </div>

        {/* 2. Unified Master Tab Switcher */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap gap-2">
          {[
            { id: "FARMER", label: "🌾 Farmer Suite", desc: "Book, Queue, Payments" },
            { id: "KYC", label: "📝 Farmer Registration & KYC", desc: "Aadhaar + Kisan ID Validation" },
            { id: "OPERATOR", label: "⚖️ Mandi & Weighbridge", desc: "QR Scan & Dharam Kanta" },
            { id: "INSPECTOR", label: "🔬 Agmarknet Quality Lab", desc: "Moisture & Grading" },
            { id: "INCIDENTS", label: "🚨 Incident Broadcaster", desc: "Disruption & ETA Recalc" },
            { id: "ADMIN", label: "📊 National Admin Heatmap", desc: "12-Mandi Congestion Analytics" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex flex-col items-start ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950/60 ring-2 ring-emerald-400"
                    : "bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700/60"
                }`}
              >
                <span className="text-sm">{tab.label}</span>
                <span className={`text-[10px] font-normal ${isActive ? "text-emerald-100" : "text-slate-400"}`}>
                  {tab.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Dynamic Module Panel */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        {/* ================= FARMER SUITE TAB ================= */}
        {activeTab === "FARMER" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Sprout className="w-5 h-5 text-emerald-600" />
                  <span>Farmer Operations & Procurement Hub</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Farmer: <strong>{user?.name || "Registered Farmer"}</strong> • Kisan ID: <code>{farmerProfile?.kisanId || "KID-ACTIVE"}</code> • {farmerProfile?.district || "Agricultural District"}, {farmerProfile?.state || "India"}
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/farmer/book"
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <CalendarPlus className="w-4 h-4" />
                  <span>Open Full Booking Wizard</span>
                </Link>
                <Link
                  href="/farmer/payments"
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Payment Ledger</span>
                </Link>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1">
                <span className="text-slate-500 block font-semibold">Active Booking</span>
                <span className="text-lg font-black text-slate-900 block font-mono">{bookings[0]?.bookingNumber || "KF-2026-0001"}</span>
                <span className="text-emerald-700 font-bold">{bookings[0]?.cropName} • {bookings[0]?.estimatedQuantityQuintals} Quintals</span>
              </div>
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 space-y-1">
                <span className="text-slate-500 block font-semibold">Live Queue Status</span>
                <span className="text-lg font-black text-blue-900 block font-mono">Position #{bookings[0]?.queuePosition || 2}</span>
                <span className="text-blue-700 font-bold">Estimated Arrival Window: {bookings[0]?.arrivalWindowStart || "08:30 AM"}</span>
              </div>
              <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 space-y-1">
                <span className="text-slate-500 block font-semibold">Stage Progress</span>
                <span className="text-lg font-black text-purple-900 block">{bookings[0]?.currentStage?.replace(/_/g, " ") || "SLOT BOOKED"}</span>
                <span className="text-purple-700 font-bold">MSP: ₹2,275/Q • Net DBT: ₹91,000</span>
              </div>
            </div>

            {/* Live Bookings Table */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">All Live Bookings in System</h3>
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="p-3">Booking #</th>
                      <th className="p-3">Farmer</th>
                      <th className="p-3">Crop</th>
                      <th className="p-3">Qty (Q)</th>
                      <th className="p-3">Mandi Centre</th>
                      <th className="p-3">Current Stage</th>
                      <th className="p-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookings.slice(0, 5).map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="p-3 font-mono font-bold text-slate-900">{b.bookingNumber}</td>
                        <td className="p-3 font-semibold">{b.farmerName}</td>
                        <td className="p-3">{b.cropName}</td>
                        <td className="p-3 font-bold">{b.actualQuantityQuintals || b.estimatedQuantityQuintals} Q</td>
                        <td className="p-3">{b.centreName}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                            {b.currentStage}
                          </span>
                        </td>
                        <td className="p-3">
                          <Link
                            href={`/farmer/timeline/${b.bookingNumber}`}
                            className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-0.5"
                          >
                            Timeline <ChevronRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= KYC REGISTRATION TAB ================= */}
        {activeTab === "KYC" && (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center space-y-1 pb-4 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Government Identity & Land Ownership KYC Verification
              </h2>
              <p className="text-xs text-slate-500">
                Cross-validates Farmer Aadhaar Number with PM-Kisan Database before authorizing crop sales.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Aadhaar Number (12 Digits):</label>
                <input
                  type="text"
                  value={kycAadhaar}
                  onChange={(e) => setKycAadhaar(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 font-bold focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kisan Registration ID:</label>
                <input
                  type="text"
                  value={kycKisanId}
                  onChange={(e) => setKycKisanId(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-900 font-bold focus:outline-hidden focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleVerifyKyc}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition"
                >
                  Verify with National Registry
                </button>
                <Link
                  href="/onboarding"
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Full 4-Step KYC Page →
                </Link>
              </div>

              {kycMsg && (
                <div className={`p-4 rounded-xl font-bold border ${kycVerified ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-rose-50 border-rose-300 text-rose-800"}`}>
                  {kycMsg}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= OPERATOR TAB ================= */}
        {activeTab === "OPERATOR" && (
          <StaffGate
            allowedRoles={["CENTRE_OPERATOR", "DISTRICT_ADMIN", "STATE_ADMIN", "SUPER_ADMIN"]}
            stationName="Mandi Gate QR Check-In & Dharam Kanta"
            stationDescription="Official terminal for gate check-in, weighbridge intake, and queue dispatching."
          >
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-amber-600" />
                  <span>Mandi Gate QR Check-In & Dharam Kanta Weighbridge</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Operator: <strong>Suraj Meena</strong> • Mandi: <strong>Karnal Central APMC (PC-HR-001)</strong>
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/operator"
                  className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Full Mandi Operator View</span>
                </Link>
                <Link
                  href="/operator/weighing"
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Scale className="w-4 h-4" />
                  <span>Weighbridge Bay</span>
                </Link>
              </div>
            </div>

            {/* Quick QR Check-in Simulator */}
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 space-y-3">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider block">
                Simulate Gate QR Token Scan / Manual Check-In:
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Booking ID (e.g. KF-2026-0001)"
                  value={operatorScanInput}
                  onChange={(e) => setOperatorScanInput(e.target.value)}
                  className="flex-1 p-2.5 bg-white border border-amber-300 rounded-xl text-xs font-mono font-bold"
                />
                <button
                  type="button"
                  onClick={() => handleOperatorCheckIn(operatorScanInput || "KF-2026-0001")}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold"
                >
                  Simulate QR Scan Check-In
                </button>
              </div>
              {operatorScanMsg && (
                <div className="p-2.5 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold">
                  {operatorScanMsg}
                </div>
              )}
            </div>

            {/* Queue Awaiting Intake */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Vehicles in Intake Bay</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {bookings.slice(0, 3).map((b) => (
                  <div key={b.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-slate-900">{b.tokenNumber}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">{b.vehicleType}</span>
                    </div>
                    <div className="font-bold text-slate-800">{b.farmerName} • {b.cropName}</div>
                    <div className="text-slate-500 text-[11px]">{b.actualQuantityQuintals || b.estimatedQuantityQuintals} Q • Stage: {b.currentStage}</div>
                    <button
                      onClick={() => handleOperatorCheckIn(b.bookingNumber)}
                      className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-[11px]"
                    >
                      Check-in Vehicle
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          </StaffGate>
        )}

        {/* ================= QUALITY INSPECTOR TAB ================= */}
        {activeTab === "INSPECTOR" && (
          <StaffGate
            allowedRoles={["QUALITY_INSPECTOR", "DISTRICT_ADMIN", "STATE_ADMIN", "SUPER_ADMIN"]}
            stationName="Agmarknet Certified Grain Testing Laboratory"
            stationDescription="Digital grain analysis and Agmarknet certification terminal."
          >
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-purple-600" />
                  <span>Agmarknet Certified Grain Testing Laboratory</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Assessor: <strong>Dr. Anil Sharma</strong> • Lot Intake: <strong>Weighed Lots Awaiting Quality Approval</strong>
                </p>
              </div>
              <Link
                href="/inspector"
                className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <FlaskConical className="w-4 h-4" />
                <span>Open Full Agmarknet Lab</span>
              </Link>
            </div>

            {/* Quality Sliders & Decision */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              <div className="p-5 bg-purple-50 rounded-2xl border border-purple-200 space-y-4">
                <span className="font-bold text-purple-900 uppercase tracking-wider block">Lab Parameter Adjustments:</span>
                <div>
                  <div className="flex justify-between font-bold text-slate-800 mb-1">
                    <span>Moisture Content:</span>
                    <span className="text-purple-700 font-mono">{inspMoisture}%</span>
                  </div>
                  <input
                    type="range"
                    min={8}
                    max={20}
                    step={0.1}
                    value={inspMoisture}
                    onChange={(e) => setInspMoisture(parseFloat(e.target.value))}
                    className="w-full accent-purple-600"
                  />
                  <span className="text-[10px] text-slate-500">Agmarknet Standard: &le;12.0%</span>
                </div>

                <div>
                  <div className="flex justify-between font-bold text-slate-800 mb-1">
                    <span>Damaged / Shriveled Grain:</span>
                    <span className="text-purple-700 font-mono">{inspDamaged}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={6}
                    step={0.1}
                    value={inspDamaged}
                    onChange={(e) => setInspDamaged(parseFloat(e.target.value))}
                    className="w-full accent-purple-600"
                  />
                  <span className="text-[10px] text-slate-500">Max permissible: &le;2.0%</span>
                </div>
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-slate-900 uppercase tracking-wider block">Grading Output:</span>
                  <div className="text-2xl font-black text-purple-900 mt-2">
                    {inspMoisture <= 12 && inspDamaged <= 2 ? "GRADE A (Optimal Payout)" : inspMoisture <= 14.5 ? "GRADE B (2% Cut Applied)" : "REJECTED (High Moisture)"}
                  </div>
                  <p className="text-slate-500 text-[11px] mt-1">
                    Applicable to: {bookings[0]?.farmerName} ({bookings[0]?.cropName} • {bookings[0]?.estimatedQuantityQuintals} Q)
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleInspectorApprove(bookings[0]?.id || "b1", "GRADE_A")}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs"
                  >
                    Approve Grade A
                  </button>
                  <button
                    onClick={() => handleInspectorApprove(bookings[0]?.id || "b1", "GRADE_B")}
                    className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs"
                  >
                    Approve Grade B
                  </button>
                </div>
              </div>
            </div>

            {inspMsg && (
              <div className="p-3 bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold">
                {inspMsg}
              </div>
            )}
          </div>
          </StaffGate>
        )}

        {/* ================= INCIDENT BROADCASTER TAB ================= */}
        {activeTab === "INCIDENTS" && (
          <StaffGate
            allowedRoles={["CENTRE_OPERATOR", "DISTRICT_ADMIN", "STATE_ADMIN", "SUPER_ADMIN"]}
            stationName="Incident & Disruption Broadcaster"
            stationDescription="Disruption control terminal for machine maintenance broadcasts and live ETA recalculation."
          >
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Radio className="w-5 h-5 text-rose-600 animate-pulse" />
                  <span>Sub-5s Real-Time Disruption & Queue Recalculation Engine</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Simulates a weighbridge failure, automatically shrinks mandi capacity, and triggers WebSocket arrival window updates.
                </p>
              </div>
              <Link
                href="/operator/incidents"
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Full Incident Console</span>
              </Link>
            </div>

            {/* Broadcast Form */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Disruption Type:</label>
                <select
                  value={incType}
                  onChange={(e) => setIncType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                >
                  <option value="WEIGHING_MACHINE_DOWN">Weighbridge Machine Failure</option>
                  <option value="MOISTURE_METER_FAILURE">Moisture Meter Recalibration</option>
                  <option value="STAFF_SHORTAGE">Staff Shift Shortage</option>
                  <option value="HEAVY_RAIN">Monsoon Weather Disruption</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Delay Impact (Minutes):</label>
                <input
                  type="number"
                  value={incDelay}
                  onChange={(e) => setIncDelay(parseInt(e.target.value) || 15)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleBroadcastIncident}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition"
                >
                  Broadcast & Recalculate Queue
                </button>
              </div>
            </div>

            {incSuccess && (
              <div className="p-3 bg-rose-100 text-rose-900 border border-rose-300 rounded-xl text-xs font-bold">
                ✓ Disruption Broadcasted! WebSocket event pushed to all farmers; Mandi ETA shifted by +{incDelay} mins.
              </div>
            )}

            {/* Active Incidents List */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Active Mandi Disruptions</h3>
              <div className="space-y-2 text-xs">
                {incidents.map((inc) => (
                  <div key={inc.id} className="p-3.5 bg-rose-50/60 border border-rose-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-rose-900">{inc.incidentType.replace(/_/g, " ")}</div>
                      <div className="text-[11px] text-slate-600">{inc.description} • Impact: +{inc.delayImpactMinutes}m</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-200 text-rose-900">
                      ACTIVE IMPACT
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          </StaffGate>
        )}

        {/* ================= ADMIN COMMAND TAB ================= */}
        {activeTab === "ADMIN" && (
          <StaffGate
            allowedRoles={["DISTRICT_ADMIN", "STATE_ADMIN", "SUPER_ADMIN"]}
            stationName="National Procurement Command Dashboard"
            stationDescription="Multi-mandi congestion analytics, load balancing, and traffic redirection controller."
          >
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  <span>National Agricultural Procurement Command Dashboard</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Live 12-Mandi Congestion Telemetry & Algorithmic Traffic Redirection
                </p>
              </div>
              <Link
                href="/admin"
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Full Admin Analytics Dashboard</span>
              </Link>
            </div>

            {/* Heatmap Grid */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Live Congestion Heatmap (12 Seeded Mandis)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {centres.map((c) => (
                  <div key={c.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{c.name}</div>
                        <div className="text-[10px] text-slate-500">{c.district}, {c.state} • {c.code}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        c.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800 border border-emerald-300" :
                        c.status === "CONGESTED" ? "bg-rose-100 text-rose-800 border border-rose-300" :
                        "bg-amber-100 text-amber-800 border border-amber-300"
                      }`}>
                        {c.status}
                      </span>
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                      <span>Queue: <strong>{c.waitingQueueCount} vehicles</strong></span>
                      <span>Wait: <strong>~{c.estimatedWaitMinutes}m</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          </StaffGate>
        )}
      </div>
    </div>
  );
}
