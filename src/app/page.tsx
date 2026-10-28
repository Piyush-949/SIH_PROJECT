"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { useTranslation } from "@/lib/i18n";
import { SEEDED_CROPS } from "@/lib/data/mockDatabase";
import {
  Sprout,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  GitCommit,
  CreditCard,
  MapPin,
  Clock,
  Layers,
  Scale,
  CheckCircle2,
  Users,
  ChevronRight,
  TrendingUp,
  Building2,
  FileCheck,
  PhoneCall,
  Landmark,
  FlaskConical,
  BarChart3,
  CalendarPlus,
  QrCode,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const { user, role, farmerProfile } = useAuth();
  const { t, isHindi } = useTranslation();

  const [centresCount, setCentresCount] = useState(12);
  const [procuredTonnes, setProcuredTonnes] = useState(1104);

  useEffect(() => {
    fetch("/api/centres")
      .then((res) => res.json())
      .then((data) => {
        if (data.centres?.length) {
          setCentresCount(data.centres.length);
          const totalLoad = data.centres.reduce((acc: number, c: any) => acc + (c.currentLoadQuintals || 0), 0);
          if (totalLoad > 0) setProcuredTonnes(totalLoad);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex-1 bg-slate-50 flex flex-col font-sans">
      {/* 1. Official National Banner */}
      <div className="bg-slate-900 text-slate-300 py-1.5 px-4 sm:px-6 lg:px-8 text-[11px] border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-emerald-400">Government of India</span>
          <span>•</span>
          <span>Ministry of Agriculture & Farmers Welfare</span>
          <span>•</span>
          <span>Department of Food & Public Distribution</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1 text-emerald-400">
            <PhoneCall className="w-3 h-3" />
            Toll-Free Kisan Helpline: <strong>1800-180-1551</strong>
          </span>
          <span className="hidden md:inline">|</span>
          <span className="hidden md:inline text-slate-400">PFMS DBT Guaranteed Settlement</span>
        </div>
      </div>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950 text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8 border-b border-emerald-800/40">
        <div className="max-w-7xl mx-auto relative z-10 space-y-8">
          <div className="text-center max-w-4xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>National Unified Agricultural Crop Procurement Platform</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              KRISHI SETU
              <span className="block text-xl sm:text-3xl lg:text-4xl font-extrabold text-emerald-400 mt-2">
                राष्ट्रीय कृषि उपज खरीद एवं ई-उपार्जन प्रणाली
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Transparent, automated, zero-waiting crop procurement for Indian farmers. Book verified mandi time slots, track real-time virtual weighbridge queues, and receive guaranteed 48-hour Direct Benefit Transfer (DBT) MSP settlements.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/onboarding"
                className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-xs sm:text-sm transition shadow-lg shadow-emerald-950/60 flex items-center gap-2 transform hover:scale-105"
              >
                <Sprout className="w-4 h-4" />
                <span>New Farmer Registration & KYC</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/farmer/book"
                className="px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs sm:text-sm transition border border-white/20 backdrop-blur-md flex items-center gap-2"
              >
                <CalendarPlus className="w-4 h-4 text-emerald-400" />
                <span>Book Mandi Procurement Slot</span>
              </Link>
              <Link
                href="/login"
                className="px-5 py-3.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 font-bold rounded-2xl text-xs sm:text-sm transition border border-slate-700 flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>Mobile OTP Login</span>
              </Link>
            </div>
          </div>

          {/* 3. Four Core Stakeholder Portals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-6">
            {/* Farmer Portal Card */}
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 hover:border-emerald-500/60 transition shadow-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Sprout className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Farmer Services</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Aadhaar/Kisan ID KYC, AI-assisted nearby Mandi selection, dynamic slot scheduling, live token tracking, and PFMS payment ledger.
                </p>
              </div>
              <div className="space-y-2 pt-3 border-t border-slate-800">
                <Link
                  href="/farmer/dashboard"
                  className="w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-between transition"
                >
                  <span>Farmer Dashboard</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/farmer/payments"
                  className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl flex items-center justify-between transition"
                >
                  <span>DBT Payment Status</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Mandi Operator Card */}
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 hover:border-amber-500/60 transition shadow-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Scale className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Mandi & PACS Operator</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Gate QR code arrival scanning, Dharam Kanta digital weighbridge tare-gross intake, and automatic &gt;20% quantity discrepancy flagging.
                </p>
              </div>
              <div className="space-y-2 pt-3 border-t border-slate-800">
                <Link
                  href="/operator"
                  className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl flex items-center justify-between transition"
                >
                  <span>Gate & Queue Inward</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/operator/weighing"
                  className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl flex items-center justify-between transition"
                >
                  <span>Weighbridge Bay</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            {/* Quality Inspector Card */}
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 hover:border-purple-500/60 transition shadow-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Agmarknet Quality Lab</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Electronic grain sample assessment: moisture content %, foreign matter %, and damaged kernel testing for official Grade A/B clearance.
                </p>
              </div>
              <div className="space-y-2 pt-3 border-t border-slate-800">
                <Link
                  href="/inspector"
                  className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl flex items-center justify-between transition"
                >
                  <span>Quality Lab Console</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <div className="text-[10px] text-purple-300/80 text-center py-1 font-mono">
                  Official Assessor Station
                </div>
              </div>
            </div>

            {/* National Admin Card */}
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 hover:border-indigo-500/60 transition shadow-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">National Command & Admin</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Real-time 12-mandi congestion heatmap, throughput bottlenecks, capacity quotas, and automated farmer traffic diversion recommendations.
                </p>
              </div>
              <div className="space-y-2 pt-3 border-t border-slate-800">
                <Link
                  href="/admin"
                  className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-between transition"
                >
                  <span>National Admin Heatmap</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/operator/incidents"
                  className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl flex items-center justify-between transition"
                >
                  <span>Mandi Incident Dispatch</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Official MSP Benchmark Rates Ticker */}
      <section className="bg-emerald-800 text-white py-4 px-4 sm:px-6 lg:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 shrink-0 font-extrabold uppercase tracking-wider text-emerald-100">
            <Landmark className="w-4 h-4 text-emerald-300" />
            <span>Government Minimum Support Price (MSP) Kharif/Rabi 2026:</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {SEEDED_CROPS.map((c) => (
              <div
                key={c.code}
                className="px-3 py-1 bg-emerald-900/80 rounded-xl border border-emerald-600/50 flex items-center gap-2 font-mono font-bold"
              >
                <span className="text-emerald-300">{c.nameEnglish} ({c.nameHindi}):</span>
                <span className="text-white">₹{c.basePricePerQuintal}/Q</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Live Procurement Telemetry */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-extrabold text-slate-900">
            Real-Time Agricultural Procurement Statistics
          </h2>
          <p className="text-xs text-slate-500">
            Live telemetry data synchronized with APMC Mandis, PACS Cooperative Centers, and FCI Storage Silos
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Mandi Hubs</div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">{centresCount} Mandis</div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              100% Operational Telemetry
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tonnage Procured Today</div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">{procuredTonnes.toLocaleString()} Q</div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Wheat, Paddy, Maize & Soy
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Gate Wait Time</div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">15 Mins</div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Reduced from 18+ Hours
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">DBT Payment Clearance</div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">&lt; 48 Hours</div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              PFMS Direct Bank Settlement
            </div>
          </div>
        </div>
      </section>

      {/* 6. End-to-End Procurement Lifecycle Explainer */}
      <section className="bg-slate-900 text-white py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              End-to-End Transparent 9-Stage Procurement Lifecycle
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl mx-auto">
              Every crop consignment is digitally monitored from farmer booking to bank account credit.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-9 gap-2 text-xs">
            {[
              { num: "01", title: "Slot Booked", desc: "Online Self-Service / AI Mandi Routing" },
              { num: "02", title: "Checked In", desc: "Mandi Gate QR Code Verification" },
              { num: "03", title: "Identity Verified", desc: "UIDAI & PM-Kisan Cross Check" },
              { num: "04", title: "Docs Verified", desc: "Land Ownership & Girdawari Validation" },
              { num: "05", title: "Produce Weighed", desc: "Digital Dharam Kanta Tare-Gross Weight" },
              { num: "06", title: "Quality Inspected", desc: "Agmarknet Lab Moisture & Grading" },
              { num: "07", title: "Procurement Accepted", desc: "Warehouse Intake & Mandi Slip" },
              { num: "08", title: "Payment Processing", desc: "PFMS Batch Direct Benefit Transfer" },
              { num: "09", title: "Payment Completed", desc: "Bank Account Credit Confirmation" },
            ].map((st) => (
              <div key={st.num} className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 space-y-1">
                <div className="font-mono text-emerald-400 font-bold text-[11px]">STAGE {st.num}</div>
                <div className="font-bold text-white text-xs">{st.title}</div>
                <div className="text-[10px] text-slate-400 leading-tight">{st.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
