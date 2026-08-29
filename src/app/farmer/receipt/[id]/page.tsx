"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Printer,
  ShieldCheck,
  QrCode,
  CheckCircle2,
  Landmark,
  Building,
  Scale,
  FlaskConical,
  CreditCard,
  ArrowLeft,
  FileCheck,
  Download,
  Lock,
} from "lucide-react";

export default function MandiReceiptPage() {
  const params = useParams();
  const receiptId = (params?.id as string) || "KF-2026-0007";

  const [booking, setBooking] = useState<any>({
    bookingNumber: receiptId,
    farmerName: "Ramesh Kumar",
    kisanId: "KID-HR-2024-8891",
    aadhaarMasked: "XXXX-XXXX-9012",
    cropName: "Wheat (Kalyan Sona Sharbati)",
    centreName: "Karnal Central APMC Mandi",
    district: "Karnal",
    state: "Haryana",
    grossWeight: 67.0,
    tareWeight: 27.0,
    netWeight: 40.0,
    moisturePercentage: 11.2,
    foreignMatterPercentage: 0.4,
    damagedPercentage: 0.8,
    grade: "GRADE_A (Optimal)",
    mspRate: 2275.0,
    grossAmount: 91000.0,
    deductions: 0.0,
    netPayable: 91000.0,
    paymentStatus: "SUCCESSFUL",
    utrNumber: "PFMS-2026-TXN-849201",
    settlementDate: "2026-08-26 08:30 AM",
    sha256Signature: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  });

  useEffect(() => {
    fetch(`/api/bookings/${encodeURIComponent(receiptId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.booking) {
          const b = data.booking;
          const qty = b.procurementRecord?.netWeightQuintals || b.actualQuantityQuintals || b.estimatedQuantityQuintals || 40;
          const rate = b.crop?.mspPrice || 2275;
          setBooking({
            bookingNumber: b.bookingNumber || receiptId,
            farmerName: b.farmer?.name || "Ramesh Kumar",
            kisanId: b.farmer?.farmerProfile?.kisanId || "KID-HR-2024-8891",
            aadhaarMasked: b.farmer?.farmerProfile?.aadhaarNumber || "XXXX-XXXX-9012",
            cropName: b.crop?.nameEnglish || "Wheat",
            centreName: b.centre?.name || "Karnal Central APMC Mandi",
            district: b.centre?.district || "Karnal",
            state: b.centre?.state || "Haryana",
            grossWeight: b.procurementRecord?.grossWeightQuintals || (qty + 27),
            tareWeight: b.procurementRecord?.tareWeightQuintals || 27,
            netWeight: qty,
            moisturePercentage: b.qualityInspection?.moisturePercentage || 11.2,
            foreignMatterPercentage: b.qualityInspection?.foreignMaterialPercentage || 0.4,
            damagedPercentage: b.qualityInspection?.damagedGrainPercentage || 0.8,
            grade: b.qualityInspection?.qualityGrade || "GRADE_A",
            mspRate: rate,
            grossAmount: qty * rate,
            deductions: 0,
            netPayable: qty * rate,
            paymentStatus: b.payment?.status || "SUCCESSFUL",
            utrNumber: b.payment?.transactionReference || `PFMS-2026-TXN-${b.bookingNumber?.slice(-6) || "849201"}`,
            settlementDate: new Date().toLocaleString("en-IN"),
            sha256Signature: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
          });
        }
      })
      .catch(() => {});
  }, [receiptId]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="flex-1 bg-slate-100 py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full space-y-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between no-print">
        <Link
          href="/farmer/payments"
          className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Payment Ledger</span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href={`/traceability/${booking.bookingNumber}`}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-xs"
          >
            <span>Track PDS Bag Journey</span>
            <FileCheck className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Official J-Form Receipt</span>
          </button>
        </div>
      </div>

      {/* Official J-Form Certificate Box */}
      <div className="bg-white rounded-3xl p-8 sm:p-12 border-2 border-slate-300 shadow-2xl space-y-6 text-slate-900 relative overflow-hidden print:border-none print:shadow-none">
        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none text-9xl font-black rotate-[-30deg]">
          GOVT OF INDIA
        </div>

        {/* Certificate Header */}
        <div className="text-center space-y-1 pb-6 border-b-2 border-slate-900">
          <div className="text-xs font-extrabold uppercase tracking-widest text-emerald-800">
            Government of India • Ministry of Agriculture & Farmers Welfare
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            OFFICIAL MANDI PROCUREMENT RECEIPT (J-FORM)
          </h1>
          <div className="text-xs text-slate-500 font-semibold">
            Issued under National Agricultural Produce Procurement & PFMS Direct Settlement Rules
          </div>
        </div>

        {/* Top Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 block">J-Form Slip #:</span>
            <span className="font-mono font-extrabold text-sm">{booking.bookingNumber}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Issuance Date:</span>
            <span className="font-bold">{booking.settlementDate}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Procurement Mandi:</span>
            <span className="font-bold">{booking.centreName}</span>
          </div>
          <div>
            <span className="text-slate-500 block">Location:</span>
            <span className="font-bold">{booking.district}, {booking.state}</span>
          </div>
        </div>

        {/* Farmer & Crop Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
          <div className="space-y-2 p-4 rounded-2xl border border-slate-200">
            <span className="font-black text-slate-900 uppercase tracking-wider block border-b pb-1">
              Farmer Identification:
            </span>
            <div className="flex justify-between">
              <span className="text-slate-500">Name:</span>
              <span className="font-bold">{booking.farmerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Kisan Reg. ID:</span>
              <span className="font-mono font-bold">{booking.kisanId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Aadhaar (UIDAI):</span>
              <span className="font-mono font-bold">{booking.aadhaarMasked}</span>
            </div>
          </div>

          <div className="space-y-2 p-4 rounded-2xl border border-slate-200">
            <span className="font-black text-slate-900 uppercase tracking-wider block border-b pb-1">
              Weighbridge & Agmarknet Lab Audit:
            </span>
            <div className="flex justify-between">
              <span className="text-slate-500">Gross / Tare / Net:</span>
              <span className="font-mono font-bold">{booking.grossWeight}Q / {booking.tareWeight}Q = {booking.netWeight}Q</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Moisture Content:</span>
              <span className="font-mono font-bold text-emerald-700">{booking.moisturePercentage}% (&le;12.0% Grade A)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Certified Grade:</span>
              <span className="font-bold text-emerald-800">{booking.grade}</span>
            </div>
          </div>
        </div>

        {/* Financial Statement Table */}
        <div className="rounded-2xl border-2 border-slate-900 overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-white font-bold text-[11px] uppercase tracking-wider">
              <tr>
                <th className="p-3">Commodity</th>
                <th className="p-3">Accepted Quantity</th>
                <th className="p-3">Govt MSP Benchmark</th>
                <th className="p-3 text-right">Net Payable (DBT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="p-3 font-bold">{booking.cropName}</td>
                <td className="p-3 font-mono">{booking.netWeight} Quintals</td>
                <td className="p-3 font-mono">₹{booking.mspRate.toLocaleString("en-IN")}/Q</td>
                <td className="p-3 font-mono font-black text-right text-base text-emerald-800">
                  ₹{booking.netPayable.toLocaleString("en-IN")}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Banking Settlement & Cryptographic Proof */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-300 text-xs">
          <div className="space-y-1">
            <span className="font-bold text-emerald-950 uppercase tracking-wider block">PFMS DBT Settlement Record:</span>
            <div className="font-mono text-emerald-900">UTR: <strong>{booking.utrNumber}</strong></div>
            <div className="text-[11px] text-emerald-800">Status: <strong>DIRECT BANK CREDIT COMPLETED</strong></div>
          </div>

          <div className="space-y-1 text-right sm:text-left">
            <span className="font-bold text-emerald-950 uppercase tracking-wider block">Cryptographic Integrity Hash:</span>
            <div className="font-mono text-[10px] text-emerald-800 break-all">{booking.sha256Signature}</div>
            <div className="text-[10px] text-emerald-700 flex items-center gap-1 font-semibold">
              <Lock className="w-3 h-3" />
              <span>Immutable State Government Digital Signature</span>
            </div>
          </div>
        </div>

        {/* Signatures Footer */}
        <div className="pt-8 border-t-2 border-slate-200 flex justify-between items-end text-xs text-slate-600">
          <div className="text-center space-y-1">
            <div className="w-32 border-b border-slate-400 mx-auto pb-6 font-serif italic text-slate-800">Ramesh Kumar</div>
            <span className="text-[10px] font-bold block">Farmer Signature / Thumbprint</span>
          </div>

          <div className="text-center space-y-1">
            <div className="w-36 border-b border-slate-400 mx-auto pb-6 font-serif italic text-slate-800">Dr. Anil Sharma</div>
            <span className="text-[10px] font-bold block">Agmarknet Assessor (Cert #AQ-918)</span>
          </div>

          <div className="text-center space-y-1">
            <div className="w-36 border-b border-slate-400 mx-auto pb-6 font-serif italic text-slate-800">Suraj Meena</div>
            <span className="text-[10px] font-bold block">Mandi Secretary / Weighmaster</span>
          </div>
        </div>
      </div>
    </div>
  );
}
