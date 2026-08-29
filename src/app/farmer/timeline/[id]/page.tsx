"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { SEEDED_BOOKINGS } from "@/lib/data/mockDatabase";
import { normalizeBooking } from "@/lib/utils/normalizers";
import { ProcurementStage } from "@/types";
import {
  GitCommit,
  CheckCircle2,
  Clock,
  QrCode,
  MapPin,
  Truck,
  Scale,
  FlaskConical,
  CreditCard,
  Building,
  User,
  FileCheck,
  ChevronRight,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import Link from "next/link";

const ALL_STAGES: ProcurementStage[] = [
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

export default function TimelinePage() {
  const params = useParams();
  const { t, isHindi } = useTranslation();
  const [isQrModalOpen, setIsQrModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const bookingId = (params?.id as string) || "KF-2026-0007";
  const [booking, setBooking] = useState(
    SEEDED_BOOKINGS.find((b) => b.id === bookingId || b.bookingNumber === bookingId) ||
    SEEDED_BOOKINGS[4]
  );

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.booking) {
            setBooking(normalizeBooking(data.booking));
          }
        }
      } catch (err: any) {
        console.warn("[Timeline] Using fallback booking:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

  const currentStageIndex = ALL_STAGES.indexOf(booking.currentStage as ProcurementStage);

  const getStageActor = (stage: ProcurementStage) => {
    switch (stage) {
      case "SLOT_BOOKED":
        return "Farmer (Self-Service Online)";
      case "CHECKED_IN":
        return "Suraj Meena (Gate Operator #1)";
      case "IDENTITY_VERIFIED":
        return "Aadhaar / Biometric Verification Station";
      case "DOCUMENTS_VERIFIED":
        return "Revenue & Kisan ID Records Officer";
      case "PRODUCE_WEIGHED":
        return "Dharam Kanta Weighbridge Station #2";
      case "QUALITY_INSPECTED":
        return "Dr. Anil Sharma (Chief Quality Assessor)";
      case "PROCUREMENT_ACCEPTED":
        return "Mandi Secretary / Buffer Stock Incharge";
      case "PAYMENT_PROCESSING":
        return "PFMS DBT Electronic Settlement Batch";
      case "PAYMENT_COMPLETED":
        return "Direct Bank Transfer Settlement";
    }
  };

  const getStageTimestamp = (stage: ProcurementStage) => {
    if (booking.stageTimestamps && booking.stageTimestamps[stage]) {
      return booking.stageTimestamps[stage];
    }
    const idx = ALL_STAGES.indexOf(stage);
    if (idx <= currentStageIndex) {
      return `2026-08-26 0${7 + Math.floor(idx / 2)}:${10 * (idx % 6)} AM`;
    }
    return "Pending Execution";
  };

  const getStageRemarks = (stage: ProcurementStage) => {
    if (booking.stageRemarks && booking.stageRemarks[stage]) {
      return booking.stageRemarks[stage];
    }
    const idx = ALL_STAGES.indexOf(stage);
    if (idx < currentStageIndex) {
      return "Verified and approved in accordance with standard procurement protocols.";
    } else if (idx === currentStageIndex) {
      return "Currently active station. Vehicle processing underway.";
    }
    return "Awaiting completion of upstream stages.";
  };

  return (
    <div className="flex-1 bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs font-bold border border-purple-200">
            <GitCommit className="w-3.5 h-3.5 text-purple-600" />
            <span>9-Stage Full Procurement Lifecycle Audit</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {t.timeline.title}
          </h1>
          <p className="text-xs text-slate-600">
            Booking ID: <strong className="font-mono text-slate-900">{booking.bookingNumber}</strong> • {booking.cropName} ({booking.actualQuantityQuintals || booking.estimatedQuantityQuintals} Q)
          </p>
        </div>

        <button
          onClick={() => setIsQrModalOpen(true)}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs"
        >
          <QrCode className="w-4 h-4 text-emerald-400" />
          <span>{t.timeline.viewQrPass}</span>
        </button>
      </div>

      {/* Produce Summary Strip */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-slate-400 block mb-0.5">Farmer Name:</span>
          <span className="font-bold text-slate-900">{booking.farmerName}</span>
          <span className="text-[10px] text-slate-500 font-mono block">{booking.kisanId}</span>
        </div>
        <div>
          <span className="text-slate-400 block mb-0.5">Procurement Centre:</span>
          <span className="font-bold text-slate-900">{booking.centreName}</span>
          <span className="text-[10px] text-slate-500 block">District: {booking.centreDistrict}</span>
        </div>
        <div>
          <span className="text-slate-400 block mb-0.5">Weighed Produce:</span>
          <span className="font-bold text-slate-900">
            {booking.actualQuantityQuintals || booking.estimatedQuantityQuintals} Quintals
          </span>
          <span className="text-[10px] text-emerald-700 font-semibold block">
            {booking.assignedGrade || "Grade A (100% Payout)"}
          </span>
        </div>
        <div>
          <span className="text-slate-400 block mb-0.5">DBT Payment Status:</span>
          <span
            className={`font-bold inline-block px-2 py-0.5 rounded text-[11px] ${
              booking.paymentStatus === "SUCCESSFUL"
                ? "bg-emerald-100 text-emerald-800"
                : "bg-sky-100 text-sky-800"
            }`}
          >
            {booking.paymentStatus || "IN PROCESS"}
          </span>
          {booking.transactionReference && (
            <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
              UTR: {booking.transactionReference}
            </span>
          )}
        </div>
      </div>

      {/* 9-Stage Stepper Progression */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
          {ALL_STAGES.map((stage, index) => {
            const isCompleted = index <= currentStageIndex;
            const isCurrent = index === currentStageIndex;
            const stageLabel = (t.timeline.stages as any)[stage] || stage.replace("_", " ");
            const stageDesc =
              (t.timeline.stageDescriptions as any)[stage] ||
              "Standard procurement verification.";

            return (
              <div key={stage} className="relative group">
                {/* Node Icon */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-0.5 w-6 sm:w-8 h-6 sm:h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition ${
                    isCompleted
                      ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-950/20"
                      : "bg-white border-slate-300 text-slate-400"
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                </div>

                {/* Stage Body */}
                <div
                  className={`p-4 rounded-xl border transition ${
                    isCurrent
                      ? "bg-emerald-50/60 border-emerald-400 ring-1 ring-emerald-400 shadow-xs"
                      : isCompleted
                      ? "bg-slate-50/70 border-slate-200"
                      : "bg-white border-slate-100 text-slate-400 opacity-60"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                      <span>{stageLabel}</span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white animate-pulse">
                          CURRENT STAGE
                        </span>
                      )}
                    </h3>
                    <span className="text-[11px] font-mono text-slate-500">
                      {getStageTimestamp(stage)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {stageDesc}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-400 block">{t.timeline.actor}:</span>
                      <span className="font-semibold text-slate-800">
                        {getStageActor(stage)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">{t.timeline.remarks}:</span>
                      <span className="text-slate-700 italic">
                        "{getStageRemarks(stage)}"
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex justify-between items-center text-xs">
        <Link
          href={`/farmer/queue/${booking.id}`}
          className="text-slate-700 hover:text-emerald-700 font-bold flex items-center gap-1"
        >
          ← Return to Live Virtual Queue
        </Link>
        <Link
          href="/farmer/payments"
          className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
        >
          Track DBT Payment Receipts →
        </Link>
      </div>

      {/* QR Modal */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 text-center">
            <h3 className="text-base font-extrabold text-slate-900">
              Scannable Gate QR Token
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              {booking.qrToken}
            </p>

            <div className="p-4 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 inline-block mx-auto">
              <div className="w-44 h-44 bg-slate-900 text-white rounded-lg p-2 flex flex-col items-center justify-center relative shadow-xs">
                <div className="grid grid-cols-5 gap-1.5 w-full h-full p-1 bg-white">
                  {Array.from({ length: 25 }).map((_, i) => (
                    <div
                      key={i}
                      className={`rounded-xs ${
                        i % 2 === 0 || i % 7 === 0 ? "bg-slate-900" : "bg-transparent"
                      }`}
                    />
                  ))}
                </div>
                <span className="absolute px-2 py-1 bg-emerald-600 text-white rounded font-mono text-[9px] font-bold shadow-md">
                  {booking.tokenNumber}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsQrModalOpen(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
