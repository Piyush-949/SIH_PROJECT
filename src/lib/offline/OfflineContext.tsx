"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { offlineStore, CachedBookingData } from "./offlineStore";

export type NetworkState = "ONLINE" | "SYNCING" | "OFFLINE";

interface OfflineContextType {
  networkState: NetworkState;
  isOnline: boolean;
  isOffline: boolean;
  isSyncing: boolean;
  lastSyncedTimestamp: string | null;
  cachedBooking: CachedBookingData | null;
  refreshCache: () => void;
  triggerSync: () => Promise<void>;
  simulateNetworkToggle: () => void;
}

const OfflineContext = createContext<OfflineContextType>({
  networkState: "ONLINE",
  isOnline: true,
  isOffline: false,
  isSyncing: false,
  lastSyncedTimestamp: null,
  cachedBooking: null,
  refreshCache: () => {},
  triggerSync: async () => {},
  simulateNetworkToggle: () => {},
});

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [networkState, setNetworkState] = useState<NetworkState>("ONLINE");
  const [lastSyncedTimestamp, setLastSyncedTimestamp] = useState<string | null>(null);
  const [cachedBooking, setCachedBooking] = useState<CachedBookingData | null>(null);

  const refreshCache = () => {
    const booking = offlineStore.getActiveBooking();
    setCachedBooking(booking);
    setLastSyncedTimestamp(offlineStore.getLastSync() || new Date().toISOString());
  };

  const triggerSync = async () => {
    if (networkState === "OFFLINE") return;
    setNetworkState("SYNCING");
    try {
      // Simulate rapid server sync
      await new Promise((res) => setTimeout(res, 800));
      offlineStore.updateLastSync();
      refreshCache();
      setNetworkState("ONLINE");
    } catch {
      setNetworkState("OFFLINE");
    }
  };

  const simulateNetworkToggle = () => {
    if (networkState === "ONLINE" || networkState === "SYNCING") {
      setNetworkState("OFFLINE");
    } else {
      triggerSync();
    }
  };

  useEffect(() => {
    refreshCache();

    // Initial check
    if (typeof window !== "undefined") {
      setNetworkState(navigator.onLine ? "ONLINE" : "OFFLINE");

      const handleOnline = () => {
        triggerSync();
      };

      const handleOffline = () => {
        setNetworkState("OFFLINE");
      };

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  return (
    <OfflineContext.Provider
      value={{
        networkState,
        isOnline: networkState === "ONLINE",
        isOffline: networkState === "OFFLINE",
        isSyncing: networkState === "SYNCING",
        lastSyncedTimestamp,
        cachedBooking,
        refreshCache,
        triggerSync,
        simulateNetworkToggle,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline() {
  return useContext(OfflineContext);
}
