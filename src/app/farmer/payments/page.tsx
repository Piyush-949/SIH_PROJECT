"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useTranslation } from "@/lib/i18n";
import { SEEDED_BOOKINGS } from "@/lib/data/mockDatabase";
import { normalizeBookings } from "@/lib/utils/normalizers";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Zap,
  Landmark,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  FileText,
  HelpCircle,
  Check,
  Loader2,
} from "lucide-react";
import Link from "next/link";

const DEFAULT_PAYMENTS = [
  {
    id: "pay-001",
    bookingNumber: "KF-2026-0007",
    cropName: "Wheat",
    quantity: 40.0,
    grade: "GRADE_A",
    mspRate: 2275.0,
    grossAmount: 91000.0,
    deductionAmount: 0.0,
    netPayable: 91000.0,
    status: "SUCCESSFUL",
    txnRef: "PFMS-2026-TXN-849201",
    disbursedAt: "2026-08-26 08:30 AM",
    bankName: "Punjab National Bank",
    accountMasked: "XXXX-XXXX-4321",
    boostRequested: false,
  },
  {
    id: "pay-002",
    bookingNumber: "KF-2026-0008",
    cropName: "Maize",
    quantity: 30.0,
    grade: "GRADE_B",
    mspRate: 2090.0,
    grossAmount: 62700.0,
    deductionAmount: 1254.0,
    netPayable: 61446.0,
    status: "PROCESSING",
    txnRef: "PFMS-2026-TXN-849202",
    disbursedAt: "Pending Clearing",
    bankName: "Punjab National Bank",
    accountMasked: "XXXX-XXXX-4321",
    boostRequested: true,
    boostReason: "Payment processing exceeds expected window. Request expedited clearing.",
  },
  {
    id: "pay-003",
    bookingNumber: "KF-2026-0001",
    cropName: "Wheat",
    quantity: 40.0,
    grade: "GRADE_A (Estimated)",
    mspRate: 2275.0,
    grossAmount: 91000.0,
    deductionAmount: 0.0,
    netPayable: 91000.0,
    status: "NOT_INITIATED",
    txnRef: "Pending Procurement",
    disbursedAt: "Awaiting Intake",
    bankName: "Punjab National Bank",
    accountMasked: "XXXX-XXXX-4321",
    boostRequested: false,
  },
];

export default function PaymentsPage() {
  const { farmerProfile } = useAuth();
  const { t, isHindi } = useTranslation();

  const [payments, setPayments] = useState(DEFAULT_PAYMENTS);
  const [loading, setLoading] = useState(true);

  // Fetch real payment and booking data from API
  useEffect(() => {
    const farmerId = farmerProfile?.id || farmerProfile?.userId || "fp_farmer_demo";
    const fetchPayments = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/bookings?farmerId=${encodeURIComponent(farmerId)}`);
        if (!res.ok) throw new Error(`Bookings API error: ${res.status}`);
        const data = await res.json();
        const normalized = normalizeBookings(data.bookings || [], true);
        
        if (normalized.length > 0) {
          const apiPayments = normalized.map((b, idx) => {
            const qty = b.actualQuantityQuintals || b.estimatedQuantityQuintals || 40.0;
            const rate = b.mspRateApplied || 2275.0;
            const gross = b.grossAmount || (qty * rate);
            const ded = b.deductionAmount || 0;
            const net = b.netPayableAmount || (gross - ded);
            return {
              id: b.id || `pay-${idx}`,
              bookingNumber: b.bookingNumber,
              cropName: b.cropName,
              quantity: qty,
              grade: b.assignedGrade || "GRADE_A",
              mspRate: rate,
              grossAmount: gross,
              deductionAmount: ded,
              netPayable: net,
              status: b.paymentStatus || (b.status === "COMPLETED" ? "SUCCESSFUL" : b.status === "IN_PROGRESS" ? "PROCESSING" : "NOT_INITIATED"),
              txnRef: b.transactionReference || (b.paymentStatus === "SUCCESSFUL" ? `PFMS-2026-TXN-${b.bookingNumber.slice(-6)}` : "Pending"),
              disbursedAt: b.paymentStatus === "SUCCESSFUL" ? "Completed" : "Pending Processing",
              bankName: farmerProfile?.bankName || "Punjab National Bank",
              accountMasked: "XXXX-XXXX-4321",
              boostRequested: false,
            };
          });
          setPayments(apiPayments);
        } else {
          setPayments(DEFAULT_PAYMENTS);
        }
      } catch (err: any) {
        console.warn("[Payments] Using fallback payments:", err.message);
        setPayments(DEFAULT_PAYMENTS);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, [farmerProfile?.id, farmerProfile?.userId]);

  const [selectedPaymentForBoost, setSelectedPaymentForBoost] = useState<any>(null);
  const [boostReason, setBoostReason] = useState<string>("SLA exceeded 48 hours without bank credit confirmation.");
  const [boostSuccess, setBoostSuccess] = useState<boolean>(false);
  const [isSubmittingBoost, setIsSubmittingBoost] = useState<boolean>(false);

  const handleOpenBoostModal = (p: any) => {
    setSelectedPaymentForBoost(p);
    setBoostSuccess(false);
  };

  const handleSubmitBoost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentForBoost) return;

    setIsSubmittingBoost(true);
    try {
      await fetch("/api/payments/boost-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: selectedPaymentForBoost.id,
          reason: boostReason,
        }),
      });

      setPayments((prev) =>
        prev.map((item) =>
          item.id === selectedPaymentForBoost.id
            ? { ...item, boostRequested: true, boostReason }
            : item
        )
      );
      setBoostSuccess(true);
    } catch (err: any) {
      console.warn("[Payments] Boost request local update:", err.message);
      setPayments((prev) =>
        prev.map((item) =>
          item.id === selectedPaymentForBoost.id
            ? { ...item, boostRequested: true, boostReason }
            : item
        )
      );
      setBoostSuccess(true);
    } finally {
      setIsSubmittingBoost(false);
      setTimeout(() => {
        setSelectedPaymentForBoost(null);
        setBoostSuccess(false);
      }, 1800);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUCCESSFUL":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t.payments.statuses.SUCCESSFUL}
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-300 animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            {t.payments.statuses.PROCESSING}
          </span>
        );
      case "INITIATED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            {t.payments.statuses.INITIATED}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {t.payments.statuses.NOT_INITIATED}
          </span>
        );
    }
  };

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full space-y-6">
      {/* Top Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
          <Landmark className="w-3.5 h-3.5 text-emerald-600" />
          <span>PFMS / Public Financial Management System Direct Benefit Transfer</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {t.payments.title}
        </h1>
        <p className="text-xs text-slate-600">
          {t.payments.subtitle}
        </p>
      </div>

      {/* SLA Info Banner */}
      <div className="bg-emerald-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-200" />
          </div>
          <div>
            <div className="font-bold text-sm text-emerald-100">Government 48-Hour Payment SLA Guarantee</div>
            <p className="text-emerald-200/80 mt-0.5">
              {t.payments.slaNotice}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[11px] text-emerald-300 block">DBT Target Bank Account:</span>
          <span className="font-mono font-bold text-xs">
            {farmerProfile?.bankName || "Punjab National Bank"} (XXXX-XXXX-4321)
          </span>
        </div>
      </div>

      {/* ─── Live Mandi Rate vs MSP Intelligence Card ─── */}
      <LiveMandiRateCard />


      {/* Itemized Payment Cards */}
      {loading ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center gap-2 text-slate-600 text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
          <span>Loading live payment records...</span>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4"
            >
            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs">
                  <CreditCard className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    {p.cropName} Procurement ({p.quantity} Quintals)
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500">
                    Booking: {p.bookingNumber} • Grade: {p.grade}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {p.boostRequested && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500 text-white flex items-center gap-1 shadow-xs animate-pulse">
                    <Zap className="w-3 h-3" />
                    BOOST ACTIVE
                  </span>
                )}
                {getStatusBadge(p.status)}
              </div>
            </div>

            {/* Financial Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 rounded-xl p-4 border border-slate-200/70 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">{t.payments.mspRate}:</span>
                <span className="font-bold text-slate-900 font-mono text-sm">
                  ₹{p.mspRate.toLocaleString("en-IN")}/Q
                </span>
                <span className="text-[10px] text-slate-500 block">Gov Benchmark</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">{t.payments.grossMsp}:</span>
                <span className="font-bold text-slate-900 font-mono text-sm">
                  ₹{p.grossAmount.toLocaleString("en-IN")}
                </span>
                <span className="text-[10px] text-slate-500 block">Before Deductions</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">{t.payments.deductions}:</span>
                <span className="font-bold text-rose-600 font-mono text-sm">
                  -₹{p.deductionAmount.toLocaleString("en-IN")}
                </span>
                <span className="text-[10px] text-slate-500 block">Quality Cut Rate</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">{t.payments.netPayable}:</span>
                <span className="font-extrabold text-emerald-700 font-mono text-base">
                  ₹{p.netPayable.toLocaleString("en-IN")}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold block">Net DBT Credit</span>
              </div>
            </div>

            {/* Transaction & SLA Actions Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs">
              <div className="flex items-center gap-2 text-slate-500">
                <span className="font-mono">UTR Ref: <strong>{p.txnRef}</strong></span>
                <span>•</span>
                <span>Disbursed: {p.disbursedAt}</span>
              </div>

              <div className="flex items-center gap-2">
                {p.status === "PROCESSING" && !p.boostRequested && (
                  <button
                    onClick={() => handleOpenBoostModal(p)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition flex items-center gap-1 shadow-xs"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{t.payments.requestBoost}</span>
                  </button>
                )}

                <Link
                  href={`/farmer/timeline/${p.bookingNumber}`}
                  className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-0.5"
                >
                  Audit Timeline <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Payment Boost Request Modal */}
      {selectedPaymentForBoost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-amber-700 pb-2 border-b">
              <Zap className="w-5 h-5 text-amber-600" />
              <h3 className="text-base font-extrabold text-slate-900">
                {t.payments.boostTitle}
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {t.payments.boostDesc}
            </p>

            {boostSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-center text-xs font-bold text-emerald-800">
                ✓ Boost Request Transmitted to District Agricultural Officer!
              </div>
            ) : (
              <form onSubmit={handleSubmitBoost} className="space-y-4">
                <div className="bg-slate-50 p-3 rounded-xl border text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Booking Number:</span>
                    <span className="font-mono font-bold">{selectedPaymentForBoost.bookingNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pending Amount:</span>
                    <span className="font-mono font-bold text-emerald-700">
                      ₹{selectedPaymentForBoost.netPayable.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reason for Expedited Clearing:
                  </label>
                  <textarea
                    rows={3}
                    value={boostReason}
                    onChange={(e) => setBoostReason(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition shadow-md"
                  >
                    Submit Priority Boost Request
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentForBoost(null)}
                    className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Live Mandi Rate vs MSP Card ──────────────────────────────────────────────
function LiveMandiRateCard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/market-prices");
        if (!res.ok) throw new Error("fetch failed");
        const json = await res.json();
        if (json.success && json.crops) setData(json.crops);
      } catch {
        setData([
          { cropName: "Wheat", cropHindi: "गेहूँ", nationalAvgModal: 2480, mspPerQuintal: 2425, priceVsMsp: 2.3, topMarket: "Khanna, Punjab" },
          { cropName: "Paddy", cropHindi: "धान", nationalAvgModal: 2200, mspPerQuintal: 2300, priceVsMsp: -4.3, topMarket: "Warangal, Telangana" },
          { cropName: "Maize", cropHindi: "मक्का", nationalAvgModal: 2180, mspPerQuintal: 2225, priceVsMsp: -2.0, topMarket: "Gulbarga, Karnataka" },
          { cropName: "Soybean", cropHindi: "सोयाबीन", nationalAvgModal: 4750, mspPerQuintal: 4892, priceVsMsp: -2.9, topMarket: "Indore, M.P." },
        ]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-2 text-sm text-blue-700">
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        Loading live mandi rates from Agmarknet...
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
      <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-white border-b border-slate-100 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-blue-600" />
        <div>
          <span className="text-xs font-extrabold text-slate-900">Today&apos;s Mandi Rate vs. MSP</span>
          <span className="ml-2 text-[10px] text-slate-400">Source: Agmarknet / data.gov.in</span>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100">
        {data.map((crop) => {
          const above = crop.priceVsMsp >= 0;
          return (
            <div key={crop.cropName} className="p-3 space-y-1">
              <div className="text-xs font-bold text-slate-700">{crop.cropName}</div>
              <div className="text-[10px] text-slate-400">{crop.cropHindi}</div>
              <div className="font-mono text-sm font-extrabold text-slate-900">
                ₹{crop.nationalAvgModal?.toLocaleString("en-IN")}
              </div>
              <div className="text-[10px] text-slate-500">
                MSP: ₹{crop.mspPerQuintal?.toLocaleString("en-IN")}
              </div>
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  above ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                }`}
              >
                {above ? "↑ " : "↓ "}{Math.abs(crop.priceVsMsp)}% vs MSP
              </span>
            </div>
          );
        })}
      </div>
      <div className="px-4 py-2 border-t border-slate-100">
        <p className="text-[10px] text-slate-400">
          Mandi prices are indicative market averages. MSP procurement guarantees the official government rate. Data updated every 6 hours.
        </p>
      </div>
    </div>
  );
}
