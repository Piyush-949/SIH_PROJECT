"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Camera,
  Upload,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sliders,
  ArrowRight,
  Info,
  Droplets,
  Layers,
  Leaf,
  Loader2,
  FileCheck,
} from "lucide-react";

export default function AiQualityScannerPage() {
  const [selectedCrop, setSelectedCrop] = useState<string>("WHEAT");
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [selectedImagePreset, setSelectedImagePreset] = useState<string>("wheat_grade_a");

  const PRESET_SAMPLES = [
    {
      id: "wheat_grade_a",
      name: "High-Luster Wheat Sample (Clean)",
      crop: "WHEAT",
      desc: "Uniform golden grains with low moisture (<11.5%)",
      color: "from-amber-200 to-amber-400",
    },
    {
      id: "wheat_grade_b",
      name: "Slight Moisture Wheat Sample",
      crop: "WHEAT",
      desc: "Marginal moisture (13.2%) with minor husks",
      color: "from-amber-300 to-amber-500",
    },
    {
      id: "wheat_reject",
      name: "High Moisture & Damaged Sample",
      crop: "WHEAT",
      desc: "Wet grains (>15.2%) requiring farm sun-drying",
      color: "from-amber-600 to-stone-700",
    },
    {
      id: "paddy_sample",
      name: "Paddy Superfine Grain Lot",
      crop: "PADDY",
      desc: "Clean long-grain Basmati/Paddy crop",
      color: "from-yellow-200 to-lime-400",
    },
  ];

  const handleRunScan = async () => {
    setIsScanning(true);
    setScanResult(null);

    try {
      const res = await fetch("/api/ai/quality-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cropType: selectedCrop,
          samplePreset: selectedImagePreset,
        }),
      });

      const data = await res.json();
      setTimeout(() => {
        setScanResult(data);
        setIsScanning(false);
      }, 1200);
    } catch {
      setIsScanning(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-purple-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-purple-800/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/40">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Agmarknet-Trained Computer Vision Neural Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            AI Grain Quality Photo Scanner
          </h1>
          <p className="text-xs text-purple-200/90 max-w-2xl leading-relaxed">
            Take a phone photo of your grain sample before leaving for the Mandi. Instant AI assessment predicts your official Agmarknet Grade, moisture %, and prevents costly rejections.
          </p>
        </div>

        <Link
          href="/farmer/book"
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 self-start md:self-auto transition shadow-md"
        >
          <span>Back to Slot Booking</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image Capture & Sample Selection */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-purple-600" />
              <span>Step 1: Select or Upload Grain Photo</span>
            </h3>

            {/* Crop Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Crop Variety:</label>
              <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                {["WHEAT", "PADDY", "MAIZE"].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedCrop(c)}
                    className={`py-2 rounded-xl border transition ${
                      selectedCrop === c
                        ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Presets */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600">Choose Sample Grain Lot:</label>
              <div className="space-y-2">
                {PRESET_SAMPLES.map((preset) => (
                  <div
                    key={preset.id}
                    onClick={() => {
                      setSelectedImagePreset(preset.id);
                      setSelectedCrop(preset.crop);
                    }}
                    className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between text-xs ${
                      selectedImagePreset === preset.id
                        ? "bg-purple-50 border-purple-500 ring-2 ring-purple-500/20"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100/80"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900">{preset.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{preset.desc}</div>
                    </div>
                    <div className={`w-6 h-6 rounded-lg bg-gradient-to-tr ${preset.color} shrink-0 border border-black/10`} />
                  </div>
                ))}
              </div>
            </div>

            {/* Scan Trigger Button */}
            <button
              onClick={handleRunScan}
              disabled={isScanning}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold rounded-2xl text-xs sm:text-sm transition shadow-lg shadow-purple-950/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Computer Vision Model...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze Grain Quality with AI</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: AI Optical Analysis Output */}
        <div className="lg:col-span-7 space-y-5">
          {scanResult ? (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6 animate-in fade-in slide-in-from-bottom-2">
              {/* Top Result Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 font-mono">SCAN ID: {scanResult.scanId}</span>
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 mt-0.5">
                    <span>Assessed Grade:</span>
                    <span className={`px-3 py-0.5 rounded-full text-sm font-black border ${
                      scanResult.qualityAssessment.grade === "GRADE_A"
                        ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                        : scanResult.qualityAssessment.grade === "GRADE_B"
                        ? "bg-amber-100 text-amber-900 border-amber-300"
                        : "bg-rose-100 text-rose-900 border-rose-300"
                    }`}>
                      {scanResult.qualityAssessment.grade.replace("_", " ")}
                    </span>
                  </h3>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Est. MSP Payout:</span>
                  <span className="font-mono font-black text-lg text-emerald-700">
                    ₹{scanResult.qualityAssessment.estimatedMspPayoutPerQuintal}/Q
                  </span>
                </div>
              </div>

              {/* 3 Core Metric Meters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 space-y-1">
                  <div className="flex justify-between items-center text-blue-900 font-bold">
                    <span>Moisture Content</span>
                    <Droplets className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-2xl font-black font-mono text-blue-950 mt-1">
                    {scanResult.sampleAnalysis.moisturePercentage}%
                  </div>
                  <span className="text-[10px] text-blue-700 font-semibold block">
                    Agmarknet Permissible: &le;12.0%
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-1">
                  <div className="flex justify-between items-center text-amber-900 font-bold">
                    <span>Foreign Matter</span>
                    <Layers className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-2xl font-black font-mono text-amber-950 mt-1">
                    {scanResult.sampleAnalysis.foreignMaterialPercentage}%
                  </div>
                  <span className="text-[10px] text-amber-700 font-semibold block">
                    Max Permissible: &le;0.75%
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200 space-y-1">
                  <div className="flex justify-between items-center text-purple-900 font-bold">
                    <span>Damaged / Broken</span>
                    <AlertTriangle className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-2xl font-black font-mono text-purple-950 mt-1">
                    {scanResult.sampleAnalysis.damagedPercentage}%
                  </div>
                  <span className="text-[10px] text-purple-700 font-semibold block">
                    Shriveled kernels: &le;2.0%
                  </span>
                </div>
              </div>

              {/* Actionable Advice Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-purple-600" />
                  <span>AI Agronomist Pre-Mandi Recommendation:</span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  {scanResult.qualityAssessment.recommendation}
                </p>
              </div>

              {/* Detected Visual Defect Bounding Boxes */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Identified Kernel Defects ({scanResult.detectedDefects.length} detected):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  {scanResult.detectedDefects.map((def: any) => (
                    <div key={def.id} className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 font-mono text-[11px] flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{def.type}</span>
                      <span className="text-emerald-700 font-bold">{(def.confidence * 100).toFixed(0)}% Conf</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Book Slot CTA */}
              <div className="pt-2 flex justify-end">
                <Link
                  href="/farmer/book"
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs flex items-center gap-2 shadow-md transition"
                >
                  <span>Proceed to Book Slot with Grade A Certification</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-xs flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Camera className="w-8 h-8" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">
                Ready for AI Optical Grain Analysis
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Select a grain sample on the left and click <strong>&quot;Analyze Grain Quality with AI&quot;</strong> to generate moisture and defect readings.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
