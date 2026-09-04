"use client";

import React from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { Sprout, ShieldCheck, Cpu, Database, Activity } from "lucide-react";

export function Footer() {
  const { t, isHindi } = useTranslation();

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-xs mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
          {/* Col 1: Platform Branding */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src="/krishi-setu-logo.jpg"
                  alt="KRISHI SETU Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="font-bold text-white text-sm block">KRISHI SETU</span>
                <span className="text-[10px] text-emerald-400">किसान का साथी, हर कदम पर</span>
              </div>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              {t.tagline}
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-emerald-400 font-semibold text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>National Agricultural Logistics Grid</span>
            </div>
          </div>

          {/* Col 2: Role Portals */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
              Platform Portals
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/farmer/dashboard" className="hover:text-emerald-400 transition flex items-center justify-between">
                  <span>{t.nav.farmerPortal}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-800/60">Public</span>
                </Link>
              </li>
              <li>
                <Link href="/onboarding" className="hover:text-emerald-400 transition flex items-center justify-between">
                  <span>{t.nav.onboarding}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-800/60">Public</span>
                </Link>
              </li>
              <li>
                <Link href="/operator" className="hover:text-emerald-400 transition flex items-center justify-between">
                  <span>{t.nav.operatorPortal}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 font-bold border border-blue-800/60">🔒 Staff</span>
                </Link>
              </li>
              <li>
                <Link href="/inspector" className="hover:text-emerald-400 transition flex items-center justify-between">
                  <span>{t.nav.inspectorPortal}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 font-bold border border-purple-800/60">🔒 Staff</span>
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-emerald-400 transition flex items-center justify-between">
                  <span>{t.nav.adminPortal}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 font-bold border border-amber-800/60">🔒 Admin</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© 2026 KRISHI SETU • National Agricultural Procurement & Logistics Grid. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-slate-300 transition">
              Home
            </Link>
            <Link href="/login" className="hover:text-slate-300 transition">
              Login
            </Link>
            <Link href="/farmer/book" className="hover:text-slate-300 transition">
              Book Slot
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
