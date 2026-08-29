"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Role } from "@/types";
import {
  ShieldAlert,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  Lock,
  Building2,
  Microscope,
  BarChart3,
  Phone,
} from "lucide-react";
import Link from "next/link";

interface StaffGateProps {
  allowedRoles: Role[];
  stationName: string;
  stationDescription: string;
  children: React.ReactNode;
}

export function StaffGate({
  allowedRoles,
  stationName,
  stationDescription,
  children,
}: StaffGateProps) {
  const router = useRouter();
  const { user, role, isAuthenticated, isLoaded, loginWithPhone, loginAsDemoRole } = useAuth();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [receivedOtp, setReceivedOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If session is still loading from localStorage, show brief loader
  if (!isLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh] bg-slate-900 text-white">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 font-mono">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  // Check if currently authenticated with an authorized staff role
  const isAuthorized = isAuthenticated && role !== null && allowedRoles.includes(role);

  if (isAuthorized) {
    return (
      <div className="flex-1 flex flex-col w-full">
        {/* Active Staff Bar */}
        <div className="bg-slate-900 border-b border-slate-800 py-1.5 px-4 sm:px-6 lg:px-8 text-[11px] text-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>
              Logged in as: <strong className="text-white">{user?.name}</strong> (
              <span className="text-emerald-400 font-mono font-bold">{role}</span>)
            </span>
          </div>
          <button
            onClick={() => {
              loginAsDemoRole("FARMER");
              router.refresh();
            }}
            className="px-2.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 hover:text-rose-200 border border-slate-700 text-[10px] font-bold transition flex items-center gap-1"
            title="Lock terminal and return to lock screen"
          >
            <Lock className="w-3 h-3" />
            <span>Lock Terminal / Test Lock Screen</span>
          </button>
        </div>
        {children}
      </div>
    );
  }

  // Otherwise, render strict Authentication Gate Wall
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(phone.trim())) {
      setError("Enter a valid 10-digit registered staff phone number.");
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
      setError("Enter the 6-digit OTP code.");
      return;
    }
    setError(null);
    setLoading(true);
    const targetRole = allowedRoles[0] || "CENTRE_OPERATOR";
    const res = await loginWithPhone(phone, otp);
    setLoading(false);
    if (!res.success) {
      setError(res.error || "Invalid OTP code.");
    }
  };

  const handleAuthorizeRole = (targetRole: Role) => {
    loginAsDemoRole(targetRole);
  };

  return (
    <div className="flex-1 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-sans">
      <div className="max-w-md w-full space-y-6">
        {/* Lock Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white flex items-center justify-center shadow-xl shadow-amber-950/50 mx-auto">
            <Lock className="w-7 h-7" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-extrabold border border-rose-500/30">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Restricted Government Facility</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            {stationName}
          </h1>
          <p className="text-xs text-slate-400">
            {stationDescription}
          </p>
        </div>

        {/* Security Warning Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-5">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-300 text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Staff Authorization Required</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Only certified officers with roles (<code>{allowedRoles.join(", ")}</code>) can access this terminal.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
              {error}
            </div>
          )}

          {/* Verification Form */}
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Staff Registered Mobile Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-xs font-bold pointer-events-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 10-digit mobile"
                    className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs font-mono placeholder:text-slate-500 focus:outline-hidden focus:border-amber-500 transition"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length < 10}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 text-xs font-extrabold transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? "Transmitting OTP..." : "Request Access OTP"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {receivedOtp && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center justify-between">
                  <span>Your OTP: <strong className="font-mono text-white text-sm">{receivedOtp}</strong></span>
                  <span className="text-[10px] text-emerald-400">Valid 5m</span>
                </div>
              )}

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-300">Enter 6-Digit OTP</label>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtp("");
                    }}
                    className="text-[11px] text-amber-400 hover:underline"
                  >
                    Change Number
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="• • • • • •"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-center text-lg tracking-widest font-mono font-bold focus:outline-hidden focus:border-amber-500 transition"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 text-xs font-extrabold transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? "Authenticating..." : "Unlock Terminal"}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Quick Authorized Officer Key (For evaluation/demo) */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
              Quick Officer Access (Evaluation Pass)
            </p>
            <div className="grid grid-cols-1 gap-2">
              {allowedRoles.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleAuthorizeRole(r)}
                  className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-between transition group"
                >
                  <span className="flex items-center gap-2">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    <span>Authorize as {r.replace(/_/g, " ")}</span>
                  </span>
                  <span className="text-[10px] text-amber-400 group-hover:underline">Instant Unlock →</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center text-xs">
          <Link
            href="/farmer/dashboard"
            className="text-slate-400 hover:text-white transition inline-flex items-center gap-1"
          >
            ← Back to Farmer Public Services
          </Link>
        </div>
      </div>
    </div>
  );
}
