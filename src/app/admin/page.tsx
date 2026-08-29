"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import { StaffGate } from "@/components/auth/StaffGate";
import { SEEDED_CENTRES, SEEDED_CROPS, MockCentre } from "@/lib/data/mockDatabase";
import { normalizeCentres } from "@/lib/utils/normalizers";
import {
  BarChart3,
  TrendingUp,
  MapPin,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Users,
  Building,
  Zap,
  Activity,
  Layers,
  Sparkles,
  ArrowUpRight,
  RefreshCw,
  Loader2,
} from "lucide-react";

export default function AdminDashboardPage() {
  const { t, isHindi } = useTranslation();

  const [centres, setCentres] = useState<MockCentre[]>(SEEDED_CENTRES);
  const [loading, setLoading] = useState(true);
  const [redirectApproved, setRedirectApproved] = useState(false);
  const [filterState, setFilterState] = useState("ALL");

  const fetchCentres = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/centres");
      if (res.ok) {
        const data = await res.json();
        const normalized = normalizeCentres(data.centres || [], true);
        if (normalized.length > 0) setCentres(normalized);
      }
    } catch (err: any) {
      console.warn("[Admin] Using fallback centres:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCentres();
  }, []);

  const totalProcuredToday = centres.reduce((acc, c) => acc + c.currentLoadQuintals, 0);
  const totalCapacity = centres.reduce((acc, c) => acc + c.capacityPerDayQuintals, 0);
  const overallLoadPercentage = Math.round((totalProcuredToday / totalCapacity) * 100);
  const totalWaiting = centres.reduce((acc, c) => acc + c.waitingQueueCount, 0);

  const handleApproveRedirect = () => {
    setRedirectApproved(true);
    setCentres((prev) =>
      prev.map((c) => {
        if (c.code === "PC-HR-001") {
          return { ...c, currentLoadQuintals: 800, waitingQueueCount: 12, estimatedWaitMinutes: 35, status: "ACTIVE" };
        }
        if (c.code === "PC-HR-002") {
          return { ...c, currentLoadQuintals: 580, waitingQueueCount: 9, estimatedWaitMinutes: 24 };
        }
        return c;
      })
    );
  };

  const filteredCentres = centres.filter((c) => {
    if (filterState === "ALL") return true;
    return c.state === filterState;
  });

  return (
    <StaffGate
      allowedRoles={["DISTRICT_ADMIN", "STATE_ADMIN", "SUPER_ADMIN"]}
      stationName="National Procurement Command Center"
      stationDescription="Executive analytics terminal for multi-mandi load balancing, buffer stock routing, and MSP price telemetry."
    >
      <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Top Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>National Agricultural Procurement Command Dashboard</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            {t.admin.title}
          </h1>
          <p className="text-xs text-slate-400">
            {t.admin.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCentres([...SEEDED_CENTRES])}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Refresh Analytics</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">{t.admin.kpis.totalProcured}</span>
            <Building className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-slate-900">
            {totalProcuredToday.toLocaleString()} Q
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            +14.2% vs yesterday
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">{t.admin.kpis.activeFarmers}</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-slate-900">
            {totalWaiting} In Queues
          </div>
          <span className="text-[11px] text-blue-600 font-semibold">
            Across 12 Active Mandis
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">{t.admin.kpis.avgWaitTime}</span>
            <Activity className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-slate-900">
            18.4 Mins
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold">
            Down from 180 mins (Pre-KRISHI SETU)
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">{t.admin.kpis.congestionIndex}</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-slate-900">
            {overallLoadPercentage}%
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold">
            Optimal Operating Band
          </span>
        </div>
      </div>

      {/* Decision-Support System: "ACTION RECOMMENDED" Card (AC-17) */}
      <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border-2 border-amber-400 rounded-2xl p-5 sm:p-6 text-slate-900 space-y-3 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-300/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-amber-900/30">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
                {t.admin.actionRecommendedTitle}
              </h2>
              <span className="text-[11px] font-semibold text-amber-800">
                High Congestion Detected at Karnal Central APMC Mandi (92% Capacity)
              </span>
            </div>
          </div>

          {!redirectApproved ? (
            <button
              onClick={handleApproveRedirect}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition shadow-md shadow-amber-950/20 flex items-center gap-1.5 shrink-0"
            >
              <span>{t.admin.approveRedirect}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Load Redirection Active (Traffic Balanced)</span>
            </span>
          )}
        </div>

        <p className="text-xs text-slate-700 leading-relaxed">
          {t.admin.actionRecommendedDesc}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
          <div className="bg-white/90 rounded-xl p-3 border border-amber-200">
            <span className="font-bold text-slate-900 block">Karnal Central APMC (Source):</span>
            <span className="text-slate-600">Capacity: 1,200Q | Current: 1,104Q (92%) | Wait: 75 mins</span>
          </div>
          <div className="bg-white/90 rounded-xl p-3 border border-emerald-200">
            <span className="font-bold text-emerald-900 block">Nilokheri PACS (Target):</span>
            <span className="text-slate-600">Capacity: 800Q | Current: 304Q (38%) | Wait: 15 mins (14 km away)</span>
          </div>
        </div>
      </div>

      {/* Congestion Heatmap Grid (12 Mandis) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>{t.admin.heatmapTitle}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {t.admin.heatmapSubtitle}
            </p>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> GREEN (&lt;60%)
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-800">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> YELLOW (60-85%)
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-800">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> RED (&gt;85%)
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span> GREY (Maint.)
            </span>
          </div>
        </div>

        {/* 12 Mandi Heatmap Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredCentres.map((centre) => {
            const loadPct =
              centre.capacityPerDayQuintals > 0
                ? Math.round((centre.currentLoadQuintals / centre.capacityPerDayQuintals) * 100)
                : 0;

            const isMaintenance = centre.status === "MAINTENANCE";
            const isRed = loadPct >= 85 || centre.status === "CONGESTED";
            const isYellow = loadPct >= 60 && !isRed;
            const isGreen = !isMaintenance && !isRed && !isYellow;

            return (
              <div
                key={centre.id}
                className={`p-4 rounded-2xl border transition hover:shadow-md ${
                  isMaintenance
                    ? "bg-slate-50 border-slate-200 opacity-70"
                    : isRed
                    ? "bg-rose-50/70 border-rose-300"
                    : isYellow
                    ? "bg-amber-50/70 border-amber-300"
                    : "bg-emerald-50/70 border-emerald-300"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 block">
                      {centre.code}
                    </span>
                    <h4 className="text-xs font-extrabold text-slate-900 leading-tight">
                      {centre.name}
                    </h4>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isMaintenance
                        ? "bg-slate-200 text-slate-700"
                        : isRed
                        ? "bg-rose-500 text-white"
                        : isYellow
                        ? "bg-amber-500 text-white"
                        : "bg-emerald-600 text-white"
                    }`}
                  >
                    {isMaintenance ? "MAINT" : `${loadPct}%`}
                  </span>
                </div>

                <div className="text-[11px] text-slate-600 space-y-1">
                  <div className="flex justify-between">
                    <span>District:</span>
                    <span className="font-semibold text-slate-800">{centre.district}, {centre.state}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Daily Capacity:</span>
                    <span className="font-mono">{centre.capacityPerDayQuintals} Q</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Current Queue:</span>
                    <span className="font-bold text-slate-900">{centre.waitingQueueCount} vehicles</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Wait Time:</span>
                    <span className="font-bold font-mono">{centre.estimatedWaitMinutes} mins</span>
                  </div>
                </div>

                {/* Status Bar */}
                <div className="w-full bg-slate-200/80 rounded-full h-2 mt-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isMaintenance
                        ? "bg-slate-400"
                        : isRed
                        ? "bg-rose-500"
                        : isYellow
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(100, isMaintenance ? 0 : loadPct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hourly Throughput Chart (Bar simulation) */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b pb-3">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span>{t.admin.hourlyChart}</span>
        </h3>

        <div className="h-44 flex items-end justify-between gap-2 pt-4 px-2">
          {[
            { hour: "08:00 AM", q: 65, wait: "12m" },
            { hour: "09:00 AM", q: 110, wait: "18m" },
            { hour: "10:00 AM", q: 145, wait: "25m" },
            { hour: "11:00 AM", q: 180, wait: "32m" },
            { hour: "12:00 PM", q: 130, wait: "20m" },
            { hour: "01:00 PM", q: 95, wait: "15m" },
            { hour: "02:00 PM", q: 140, wait: "22m" },
            { hour: "03:00 PM", q: 160, wait: "28m" },
            { hour: "04:00 PM", q: 115, wait: "16m" },
            { hour: "05:00 PM", q: 75, wait: "10m" },
          ].map((bar) => (
            <div key={bar.hour} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[9px] font-mono text-slate-500 font-bold">{bar.q}Q</span>
              <div
                className="w-full bg-emerald-600 hover:bg-emerald-500 rounded-t-md transition cursor-pointer shadow-xs"
                style={{ height: `${(bar.q / 180) * 120}px` }}
                title={`${bar.hour}: ${bar.q} Quintals (Avg Wait: ${bar.wait})`}
              />
              <span className="text-[9px] text-slate-400 whitespace-nowrap mt-1">{bar.hour.split(" ")[0]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
    </StaffGate>
  );
}
