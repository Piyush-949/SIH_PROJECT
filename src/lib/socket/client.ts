"use client";

import { io, Socket } from "socket.io-client";
import { useEffect, useState } from "react";

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance && typeof window !== "undefined") {
    socketInstance = io(window.location.origin, {
      path: "/api/socket",
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socketInstance.on("connect", () => {
      console.log("[KRISHI SETU Socket] Connected to real-time server. ID:", socketInstance?.id);
    });

    socketInstance.on("connect_error", (err) => {
      console.warn("[KRISHI SETU Socket] Connection notice (polling fallback active):", err.message);
    });
  }

  return socketInstance!;
}

/**
 * React hook to listen to centre queue updates
 */
export function useCentreQueueSocket(centreId: string, onUpdate?: (data: any) => void) {
  const [lastUpdate, setLastUpdate] = useState<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !centreId) return;
    const socket = getSocket();
    if (!socket) return;

    socket.emit("join_centre", centreId);

    const handleQueueUpdate = (data: any) => {
      setLastUpdate(data);
      if (onUpdate) onUpdate(data);
    };

    const handleIncident = (data: any) => {
      setLastUpdate({ type: "INCIDENT", incident: data, timestamp: new Date().toISOString() });
      if (onUpdate) onUpdate(data);
    };

    socket.on("queue_updated", handleQueueUpdate);
    socket.on("incident_reported", handleIncident);

    return () => {
      socket.emit("leave_centre", centreId);
      socket.off("queue_updated", handleQueueUpdate);
      socket.off("incident_reported", handleIncident);
    };
  }, [centreId, onUpdate]);

  return { lastUpdate };
}

/**
 * React hook to listen to personal booking updates & live ETAs
 */
export function useBookingLifecycleSocket(bookingId: string, onUpdate?: (data: any) => void) {
  const [lifecycleUpdate, setLifecycleUpdate] = useState<any>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !bookingId) return;
    const socket = getSocket();
    if (!socket) return;

    socket.emit("join_booking", bookingId);

    const handleEtaUpdate = (data: any) => {
      setLifecycleUpdate({ type: "ETA_UPDATE", ...data });
      if (onUpdate) onUpdate(data);
    };

    const handleStageChange = (data: any) => {
      setLifecycleUpdate({ type: "STAGE_CHANGE", ...data });
      if (onUpdate) onUpdate(data);
    };

    socket.on("eta_updated", handleEtaUpdate);
    socket.on("stage_transitioned", handleStageChange);

    return () => {
      socket.emit("leave_booking", bookingId);
      socket.off("eta_updated", handleEtaUpdate);
      socket.off("stage_transitioned", handleStageChange);
    };
  }, [bookingId, onUpdate]);

  return { lifecycleUpdate };
}
