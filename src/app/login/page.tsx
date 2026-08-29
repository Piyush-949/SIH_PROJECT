"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { useTranslation } from "@/lib/i18n";
import {
  Sprout,
  Phone,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Lock,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { DEMO_ACCOUNTS } from "@/lib/auth/demoAccounts";
import { Role } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const { loginWithPhone, loginAsDemoRole } = useAuth();
  const { t, isHindi } = useTranslation();

  const [phone, setPhone] = useState<string>("");
  const [otp, setOtp] = useState<string>("");
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [devMode, setDevMode] = useState<boolean>(false);
  const [fallbackOtp, setFallbackOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(phone.trim())) {
      setError("Please enter a valid 10-digit mobile number.");
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
        setLoading(false);
        return;
      }
      setOtpSent(true);
      setDevMode(!!data.devMode);
      setFallbackOtp(data.devOtp || null);
    } catch (err: any) {
      setError("Network error sending OTP. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError("Please enter the 6-digit OTP code.");
      return;
    }
    setError(null);
    setLoading(true);

    const res = await loginWithPhone(phone, otp);
    setLoading(false);

    if (res.success) {
      router.push("/farmer/dashboard");
    } else {
      setError(res.error || "Invalid OTP. Please check your verification code.");
    }
  };

  const handleDemoLogin = async (role: Role) => {
    setLoading(true);
    await loginAsDemoRole(role);
    setLoading(false);
    const demo = DEMO_ACCOUNTS[role];
    router.push(demo?.defaultPath || "/admin");
  };

  return (
    <div className="flex-1 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-sans">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-lg shadow-emerald-950/50 mx-auto">
            <Sprout className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            KRISHI SETU Portal Login
          </h2>
          <p className="text-xs text-slate-400">
            National Agricultural Procurement & DBT Settlement System
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-5">
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
                  Registered Mobile Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 text-xs font-bold">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs font-mono placeholder:text-slate-500 focus:outline-hidden focus:border-emerald-500 transition"
                    required
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  A 6-digit one-time verification code will be sent to this number.
                </span>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length < 10}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 text-xs font-extrabold transition shadow-md shadow-emerald-950/50 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? "Transmitting OTP..." : "Send Verification OTP"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {/* OTP status banner */}
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-start gap-2">
                <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">OTP generated for +91 {phone}</p>
                  {fallbackOtp ? (
                    <div className="mt-1 flex items-center justify-between bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-emerald-500/40">
                      <span className="text-slate-400 text-[11px]">Verification Code:</span>
                      <span className="font-mono text-white font-bold text-sm tracking-widest">{fallbackOtp}</span>
                    </div>
                  ) : (
                    <p className="text-slate-400 mt-0.5 text-[11px]">
                      Check your SMS inbox. Valid for 5 minutes.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Enter 6-Digit OTP
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp("");
                      setDevMode(false);
                    }}
                    className="text-[11px] text-emerald-400 hover:underline"
                  >
                    Change Number (+91 {phone})
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="• • • • • •"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-center text-lg tracking-widest font-mono font-bold focus:outline-hidden focus:border-emerald-500 transition"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 text-xs font-extrabold transition shadow-md shadow-emerald-950/50 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? "Verifying..." : "Verify & Access Portal"}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Registration link */}
          <div className="pt-4 border-t border-slate-700/60 text-center space-y-2 text-xs">
            <p className="text-slate-400">Not registered as a farmer yet?</p>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold"
            >
              <span>Complete Aadhaar & Kisan ID Registration</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* System Roles — Demo Quick Access for Judges */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-4 space-y-3">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
            System Roles — Quick Demo Access
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(DEMO_ACCOUNTS) as [Role, (typeof DEMO_ACCOUNTS)[Role]][]).map(
              ([role, acc]) =>
                acc ? (
                  <button
                    key={role}
                    onClick={() => handleDemoLogin(role)}
                    disabled={loading}
                    className="flex flex-col items-start p-2.5 rounded-xl bg-slate-900/70 border border-slate-700 hover:border-slate-500 transition text-left disabled:opacity-50"
                  >
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${acc.badgeColor} mb-1`}>
                      {acc.roleTitle}
                    </span>
                    <span className="text-[11px] text-white font-semibold">{acc.name}</span>
                    <span className="text-[9px] text-slate-500">{acc.description?.slice(0, 50)}…</span>
                  </button>
                ) : null
            )}
          </div>
          <p className="text-[10px] text-slate-600 text-center">
            Farmers must register via OTP + Aadhaar verification above
          </p>
        </div>

        {/* Security badge */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <Lock className="w-3 h-3 text-emerald-500" />
          <span>Secured by UIDAI Aadhaar e-Authentication & PFMS Payment Gateway</span>
        </div>
      </div>
    </div>
  );
}
