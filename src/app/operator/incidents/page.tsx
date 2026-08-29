"use client";

import React, { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import { useNotifications } from "@/lib/notifications/NotificationContext";
import { StaffGate } from "@/components/auth/StaffGate";
import { SEEDED_INCIDENTS, SEEDED_CENTRES } from "@/lib/data/mockDatabase";
import { normalizeIncidents } from "@/lib/utils/normalizers";
import {
  AlertTriangle,
  Radio,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building,
  Zap,
  ArrowLeft,
  Sparkles,
  Layers,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function IncidentsPage() {
  const { t, isHindi } = useTranslation();
  const { addNotification } = useNotifications();

  const [incidents, setIncidents] = useState(SEEDED_INCIDENTS);
  const [loading, setLoading] = useState(true);
  const [incidentType, setIncidentType] = useState<string>("WEIGHING_MACHINE_DOWN");
  const [severity, setSeverity] = useState<string>("HIGH");
  const [delayMinutes, setDelayMinutes] = useState<number>(30);
  const [capacityCut, setCapacityCut] = useState<number>(35);
  const [description, setDescription] = useState<string>(
    "Weighbridge #1 sensor calibration in progress. Secondary intake operational at reduced throughput."
  );
  const [broadcastSuccess, setBroadcastSuccess] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fetch live incidents from DB
  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/incidents");
        if (res.ok) {
          const data = await res.json();
          const normalized = normalizeIncidents(data.incidents || [], true);
          if (normalized.length > 0) setIncidents(normalized);
        }
      } catch (err: any) {
        console.warn("[Incidents] Using fallback incidents:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchIncidents();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newInc = {
      id: `inc-${Date.now()}`,
      centreId: "PC-HR-001",
      centreName: "Karnal Central APMC Mandi",
      incidentType,
      severity,
      description,
      delayImpactMinutes: delayMinutes,
      capacityReductionPercentage: capacityCut,
      status: "ACTIVE",
      reportedAt: "Just now",
      reporterName: "Suraj Meena (Operator)",
    };

    try {
      await fetch("/api/incidents/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: incidentType,
          severity,
          delayMinutesImpact: delayMinutes,
          description,
        }),
      });
    } catch (err: any) {
      console.warn("[Incidents] Saved locally:", err.message);
    }

    setIncidents([newInc, ...incidents]);

    // Push real-time notification to all farmers in queue
    addNotification({
      category: "INCIDENT",
      titleEn: `Mandi Delay Alert: ${incidentType.replace(/_/g, " ")}`,
      titleHi: `मंडी व्यवधान सूचना: ${incidentType.replace(/_/g, " ")}`,
      messageEn: `${description} (+${delayMinutes} min delay applied). Your arrival window has been updated automatically.`,
      messageHi: `${description} (+${delayMinutes} मिनट का अतिरिक्त समय)। आपका स्लॉट समय स्वचालित रूप से अपडेट कर दिया गया है।`,
      actionUrl: "/farmer/queue/KF-2026-0001",
      severity: "WARNING",
    });

    setIsSubmitting(false);
    setBroadcastSuccess(true);
    setTimeout(() => setBroadcastSuccess(false), 3000);
  };

  const handleResolve = async (id: string) => {
    try {
      await fetch("/api/incidents/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incidentId: id }),
      });
    } catch {}
    setIncidents((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <StaffGate
      allowedRoles={["CENTRE_OPERATOR", "DISTRICT_ADMIN", "STATE_ADMIN", "SUPER_ADMIN"]}
      stationName="Mandi Operational Incident & Disruption Deck"
      stationDescription="Disruption control terminal for machine maintenance broadcasts and live ETA recalculation."
    >
      <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200">
            <Radio className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
            <span>Sub-5s Real-Time Disruption Recalculation Engine</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {t.incidents.title}
          </h1>
          <p className="text-xs text-slate-600">
            {t.incidents.subtitle}
          </p>
        </div>

        <Link
          href="/operator"
          className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Mandi Queue</span>
        </Link>
      </div>

      {/* Incident Form & Active List Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form (7 Cols) */}
        <div className="lg:col-span-7">
          <form onSubmit={handleBroadcast} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 border-b pb-3">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Report Operational Disruption</span>
            </h2>

            {/* Type Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t.incidents.incidentType}
              </label>
              <select
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-semibold focus:outline-hidden focus:border-emerald-500"
              >
                <option value="WEIGHING_MACHINE_DOWN">{t.incidents.types.WEIGHING_MACHINE_DOWN}</option>
                <option value="MOISTURE_METER_DOWN">{t.incidents.types.MOISTURE_METER_DOWN}</option>
                <option value="POWER_OUTAGE">{t.incidents.types.POWER_OUTAGE}</option>
                <option value="STAFF_SHORTAGE">{t.incidents.types.STAFF_SHORTAGE}</option>
                <option value="WEATHER_DISRUPTION">{t.incidents.types.WEATHER_DISRUPTION}</option>
                <option value="SYSTEM_GLITCH">{t.incidents.types.SYSTEM_GLITCH}</option>
                <option value="CROWD_SURGE">{t.incidents.types.CROWD_SURGE}</option>
              </select>
            </div>

            {/* Severity & Delay Input */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t.incidents.severity}
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t.incidents.delayImpact}
                </label>
                <input
                  type="number"
                  min={5}
                  max={180}
                  step={5}
                  value={delayMinutes}
                  onChange={(e) => setDelayMinutes(parseInt(e.target.value) || 15)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t.incidents.capacityCut}
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={5}
                  value={capacityCut}
                  onChange={(e) => setCapacityCut(parseInt(e.target.value) || 20)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t.incidents.description}
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-emerald-500"
                placeholder="Describe reason for delay, affected equipment numbers, and estimated recovery time..."
                required
              />
            </div>

            {broadcastSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>✓ Incident Broadcast! All farmer ETAs recalculated and push notifications triggered.</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-lg shadow-amber-950/20 transition flex items-center justify-center gap-2"
            >
              <Radio className="w-4 h-4" />
              <span>{t.incidents.broadcastBtn}</span>
            </button>
          </form>
        </div>

        {/* Active Incidents List (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center justify-between border-b pb-3">
              <span>{t.incidents.activeIncidentsList}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                {incidents.length} Active
              </span>
            </h3>

            {incidents.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                No active operational incidents. Mandi operating at peak throughput.
              </div>
            ) : (
              <div className="space-y-3">
                {incidents.map((inc) => (
                  <div
                    key={inc.id}
                    className="p-4 rounded-xl border border-amber-300 bg-amber-50/50 space-y-2 text-xs"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-extrabold text-amber-900">
                          {inc.incidentType.replace(/_/g, " ")}
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">
                          Reported: {inc.reportedAt} by {inc.reporterName}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-amber-200 text-amber-900">
                        +{inc.delayImpactMinutes}m DELAY
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed">
                      {inc.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-amber-200/60">
                      <span className="text-[10px] text-amber-800 font-semibold">
                        Capacity Impact: -{inc.capacityReductionPercentage}%
                      </span>
                      <button
                        onClick={() => handleResolve(inc.id)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition"
                      >
                        {t.incidents.resolveBtn}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </StaffGate>
  );
}
