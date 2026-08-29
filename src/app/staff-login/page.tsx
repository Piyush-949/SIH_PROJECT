"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  Shield,
  Phone,
  KeyRound,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Building2,
  Microscope,
  BarChart3,
  Lock,
} from "lucide-react";

const STAFF_CREDENTIALS = [
  {
    role: "CENTRE_OPERATOR",
    label: "Mandi Operator",
    phone: "9876543220",
    name: "Suraj Meena",
    icon: Building2,
    color: "blue",
    redirectTo: "/operator",
    bg: "bg-blue-50",
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-700",
    iconColor: "text-blue-600",
  },
  {
    role: "QUALITY_INSPECTOR",
    label: "Quality Inspector",
    phone: "9876543230",
    name: "Dr. Anil Sharma",
    icon: Microscope,
    color: "purple",
    redirectTo: "/inspector",
    bg: "bg-purple-50",
    border: "border-purple-200",
    badge: "bg-purple-100 text-purple-700",
    iconColor: "text-purple-600",
  },
  {
    role: "DISTRICT_ADMIN",
    label: "District Admin",
    phone: "9876543240",
    name: "Vikas Verma",
    icon: BarChart3,
    color: "amber",
    redirectTo: "/admin",
    bg: "bg-amber-50",
    border: "border-amber-200",
    badge: "bg-amber-100 text-amber-700",
    iconColor: "text-amber-600",
  },
  {
    role: "STATE_ADMIN",
    label: "State Admin",
    phone: "9876543250",
    name: "Meenakshi Sundaram",
    icon: Shield,
    color: "indigo",
    redirectTo: "/admin",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    badge: "bg-indigo-100 text-indigo-700",
    iconColor: "text-indigo-600",
  },
];

const ROLE_REDIRECT: Record<string, string> = {
  CENTRE_OPERATOR: "/operator",
  QUALITY_INSPECTOR: "/inspector",
  DISTRICT_ADMIN: "/admin",
  STATE_ADMIN: "/admin",
  SUPER_ADMIN: "/admin",
};

export default function StaffLoginPage() {
  const router = useRouter();
  const { loginWithPhone, loginAsDemoRole } = useAuth();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [receivedOtp, setReceivedOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(phone.trim())) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    // Only allow staff phone numbers
    const isStaffPhone = STAFF_CREDENTIALS.some(s => s.phone === phone.trim());
    if (!isStaffPhone) {
      setError("This number is not registered as a staff account. Farmers please use /login.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Failed to send OTP.");
        return;
      }
      setOtpSent(true);
      setReceivedOtp(data.demoOtp || null);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError("Enter the 6-digit OTP.");
      return;
    }
    setError(null);
    setLoading(true);

    const staffAccount = STAFF_CREDENTIALS.find(s => s.phone === phone.trim());
    const res = await loginWithPhone(phone, otp);
    setLoading(false);

    if (res.success) {
      const redirect = staffAccount ? staffAccount.redirectTo : "/admin";
      router.push(redirect);
    } else {
      setError(res.error || "Invalid OTP.");
    }
  };

  const handleQuickLogin = (staff: typeof STAFF_CREDENTIALS[0]) => {
    loginAsDemoRole(staff.role as any);
    router.push(staff.redirectTo);
  };

  return (
    <div className="flex-1 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-sans">
      <div className="max-w-lg w-full space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-400 text-white shadow-lg mx-auto">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Staff Portal Login</h2>
          <p className="text-xs text-slate-400">Authorised Personnel Only — Mandi Operators, Inspectors & Administrators</p>
        </div>

        {/* Quick Login Cards */}
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">Quick Access (Demo)</p>
          <div className="grid grid-cols-2 gap-3">
            {STAFF_CREDENTIALS.map((staff) => {
              const Icon = staff.icon;
              return (
                <button
                  key={staff.role}
                  onClick={() => handleQuickLogin(staff)}
                  className={`${staff.bg} ${staff.border} border rounded-2xl p-3.5 text-left hover:shadow-md transition group`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className={`w-4 h-4 ${staff.iconColor}`} />
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${staff.badge}`}>
                      {staff.label}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-800">{staff.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">+91 {staff.phone}</p>
                  <span className="text-[10px] text-blue-600 font-bold flex items-center gap-0.5 mt-1.5 group-hover:underline">
                    Login as this role <ArrowRight className="w-3 h-3" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-700" />
          <span className="text-[11px] text-slate-500 font-bold">OR LOGIN WITH OTP</span>
          <div className="flex-1 h-px bg-slate-700" />
        </div>

        {/* OTP Login Box */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Staff Mobile Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-xs font-bold">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="Staff registered mobile"
                    className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || phone.length < 10}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 hover:from-blue-500 hover:to-indigo-400 text-white text-xs font-extrabold transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? "Sending OTP..." : "Send Verification OTP"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {receivedOtp && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-300 text-xs flex items-center justify-between">
                  <span>Your OTP: <strong className="font-mono text-white text-sm">{receivedOtp}</strong></span>
                  <span className="text-[10px] text-blue-400">Valid 5 mins</span>
                </div>
              )}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-300">Enter 6-Digit OTP</label>
                  <button type="button" onClick={() => { setOtpSent(false); setOtp(""); }}
                    className="text-[11px] text-blue-400 hover:underline">
                    Change Number
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="• • • • • •"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-center text-lg tracking-widest font-mono font-bold focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-500 text-white text-xs font-extrabold transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? "Verifying..." : "Verify & Access Staff Portal"}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <Lock className="w-3 h-3 text-blue-500" />
          <span>Access restricted to authorised government personnel only</span>
        </div>
      </div>
    </div>
  );
}
