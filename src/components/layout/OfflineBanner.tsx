"use client";

import React from "react";
import { useOffline } from "@/lib/offline/OfflineContext";
import { useTranslation } from "@/lib/i18n";
import { Wifi, WifiOff, RefreshCw, Clock, ShieldCheck } from "lucide-react";

export function OfflineBanner() {
  const {
    networkState,
    isOnline,
    isOffline,
    isSyncing,
    lastSyncedTimestamp,
    triggerSync,
    simulateNetworkToggle,
  } = useOffline();
  const { t, isHindi } = useTranslation();

  const formattedTime = lastSyncedTimestamp
    ? new Date(lastSyncedTimestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : "Just now";

  return (
    <div
      className={`w-full py-1.5 px-4 text-xs font-medium border-b transition-colors duration-300 flex flex-wrap items-center justify-between gap-2 z-50 ${
        isOffline
          ? "bg-amber-500/15 text-amber-900 border-amber-300 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-800"
          : isSyncing
          ? "bg-sky-500/15 text-sky-900 border-sky-300 dark:bg-sky-950/40 dark:text-sky-200 dark:border-sky-800"
          : "bg-emerald-500/10 text-emerald-900 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:border-emerald-800"
      }`}
    >
      {/* Left: Status with Icon */}
      <div className="flex items-center gap-2">
        {isOffline ? (
          <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-semibold">
            <WifiOff className="w-3.5 h-3.5 animate-pulse" />
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
            {t.offline.offline}
          </span>
        ) : isSyncing ? (
          <span className="flex items-center gap-1.5 text-sky-700 dark:text-sky-300 font-semibold">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span className="inline-block w-2 h-2 rounded-full bg-sky-500 animate-ping"></span>
            {t.offline.syncing}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-semibold">
            <Wifi className="w-3.5 h-3.5" />
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            {t.offline.online}
          </span>
        )}

        <span className="hidden sm:inline-block text-slate-400">|</span>

        {/* Last Synced */}
        <span className="hidden md:flex items-center gap-1 text-slate-600 dark:text-slate-400">
          <Clock className="w-3 h-3" />
          <span>
            {t.offline.lastSynced}: <strong>{formattedTime}</strong>
          </span>
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {isOffline && (
          <span className="hidden lg:flex items-center gap-1 text-amber-800 dark:text-amber-200">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>QR Token & Booking Cached Locally</span>
          </span>
        )}

        <div className="flex items-center gap-2">
          {isOffline && (
            <button
              onClick={triggerSync}
              className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[11px] font-semibold transition"
            >
              {t.offline.retryConnection}
            </button>
          )}

          <button
            onClick={simulateNetworkToggle}
            title="Toggle simulated offline state to test caching and offline QR pass display"
            className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-[11px] transition flex items-center gap-1"
          >
            <span>Simulate {isOffline ? "Online" : "Offline"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
