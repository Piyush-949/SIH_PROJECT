"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  QrCode,
  ShieldCheck,
  CheckCircle2,
  Truck,
  Building,
  Store,
  ArrowLeft,
  Layers,
  MapPin,
  Lock,
  Sparkles,
  Loader2,
  FileCheck,
} from "lucide-react";

export default function SupplyChainTraceabilityPage() {
  const params = useParams();
  const batchId = (params?.batchId as string) || "LOT-HR-2026-009182";

  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/traceability/${encodeURIComponent(batchId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.batch) setBatch(data.batch);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [batchId]);

  if (loading) {
    return (
      <div className="flex-1 bg-slate-50 flex items-center justify-center p-12 text-slate-700 text-xs font-bold gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
        <span>Loading PDS Bag-Level Traceability Ledger...</span>
      </div>
    );
  }

  const STAGE_ICONS: any = {
    FARM_GATE_HARVEST: MapPin,
    MANDI_PROCUREMENT_INTAKE: Building,
    FCI_SILO_TRANSIT: Truck,
    DISTRICT_CIVIL_SUPPLIES: Layers,
    PDS_RATION_SHOP_DELIVERY: Store,
  };

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/farmer/payments"
          className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Farmer Portal</span>
        </Link>
        <Link
          href={`/farmer/receipt/${batchId}`}
          className="px-3 py-1.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition"
        >
          View Mandi J-Form Receipt
        </Link>
      </div>

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-800/40 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40">
          <QrCode className="w-3.5 h-3.5 text-emerald-400" />
          <span>Farm-to-Fork PDS Public Distribution System Traceability</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
          Grain Batch Traceability: {batch?.batchNumber}
        </h1>
        <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
          Every 50kg bag is cryptographically tagged with a serialized QR code. Verify origin farm, moisture certification, FCI storage silo, and Fair Price Ration Shop delivery with zero grain diversion or adulteration.
        </p>
      </div>

      {/* Batch Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-white rounded-3xl border border-slate-200 shadow-xs text-xs">
        <div>
          <span className="text-slate-400 block font-bold">Crop Consignment</span>
          <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">{batch?.cropType}</span>
        </div>
        <div>
          <span className="text-slate-400 block font-bold">Total Gunny Bags</span>
          <span className="font-extrabold text-slate-900 text-sm mt-0.5 block font-mono">{batch?.totalBags} Bags (50kg each)</span>
        </div>
        <div>
          <span className="text-slate-400 block font-bold">Origin Farmer</span>
          <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">{batch?.originFarmer?.name} ({batch?.originFarmer?.village})</span>
        </div>
        <div>
          <span className="text-slate-400 block font-bold">Agmarknet Clearance</span>
          <span className="font-extrabold text-emerald-700 text-sm mt-0.5 block">{batch?.agmarknetGrade}</span>
        </div>
      </div>

      {/* 5-Stage Visual Journey Timeline */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>5-Stage Public Distribution Lifecycle</span>
        </h2>

        <div className="space-y-6 relative before:absolute before:inset-0 before:left-5 sm:before:left-6 before:w-0.5 before:bg-slate-200 before:z-0">
          {batch?.supplyChainJourney?.map((st: any, idx: number) => {
            const Icon = STAGE_ICONS[st.stage] || CheckCircle2;
            const isDone = st.status === "COMPLETED";

            return (
              <div key={idx} className="relative z-10 flex items-start gap-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 border-2 ${
                  isDone
                    ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/20"
                    : "bg-amber-500 text-slate-950 border-amber-400 animate-pulse"
                }`}>
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-1 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="font-extrabold text-slate-900 text-sm">{st.title}</span>
                    <span className="text-[11px] font-mono text-slate-500 font-semibold">{st.timestamp}</span>
                  </div>

                  <div className="text-emerald-800 font-semibold text-[11px]">
                    📍 {st.location} • 👤 Actor: {st.actor}
                  </div>

                  <p className="text-slate-600 text-xs mt-1">
                    {st.details}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Serialized 50kg Gunny Bag QR Tags Grid */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <QrCode className="w-4 h-4 text-purple-600" />
            <span>Serialized Bag QR Codes (Sample of 8 Bags from Consignment):</span>
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">100% Anti-Theft Barcoded</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {batch?.serializedBags?.map((bag: any) => (
            <div key={bag.bagTag} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-[11px]">
              <div className="font-mono font-bold text-slate-900">{bag.bagTag}</div>
              <div className="text-slate-500">{bag.rfidTagId} • {bag.netWeightKg} kg</div>
              <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                bag.status === "DELIVERED_TO_PDS"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-blue-100 text-blue-800"
              }`}>
                {bag.status.replace(/_/g, " ")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
