"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { NotificationCategory } from "@/types";

export interface AppNotification {
  id: string;
  category: "BOOKING" | "QUEUE" | "INCIDENT" | "PAYMENT" | "SYSTEM";
  titleEn: string;
  titleHi: string;
  messageEn: string;
  messageHi: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  severity?: "INFO" | "WARNING" | "SUCCESS" | "CRITICAL";
}

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-1",
    category: "BOOKING",
    titleEn: "Procurement Slot Confirmed",
    titleHi: "फसल खरीद स्लॉट की पुष्टि हुई",
    messageEn: "Your Wheat slot (40 Quintals) at Karnal Central APMC Mandi is confirmed for today, 08:30 AM - 09:30 AM. Token: TK-101.",
    messageHi: "करनाल केंद्रीय एपीएमसी मंडी में आपके गेहूं का स्लॉट (40 क्विंटल) आज सुबह 08:30 - 09:30 बजे के लिए पक्का हो गया है। टोकन: TK-101।",
    timestamp: "10 mins ago",
    read: false,
    actionUrl: "/farmer/timeline/KF-2026-0001",
    severity: "SUCCESS",
  },
  {
    id: "notif-2",
    category: "INCIDENT",
    titleEn: "Mandi Delay Alert: Weighbridge Scale Offline",
    titleHi: "मंडी विलंब अलर्ट: धर्मकांटा मशीन बंद",
    messageEn: "Weighbridge #1 at Karnal Mandi is undergoing calibration (+15 min delay). Your estimated entry time has been automatically updated.",
    messageHi: "करनाल मंडी में धर्मकांटा #1 में तकनीकी सुधार चल रहा है (+15 मिनट विलंब)। आपका अनुमानित गेट समय अपडेट कर दिया गया है।",
    timestamp: "25 mins ago",
    read: false,
    actionUrl: "/farmer/queue/KF-2026-0001",
    severity: "WARNING",
  },
  {
    id: "notif-3",
    category: "PAYMENT",
    titleEn: "DBT Payout Transferred: ₹91,000",
    titleHi: "डीबीटी भुगतान सफलतापूर्वक भेजा गया: ₹91,000",
    messageEn: "MSP payment for booking KF-2026-0007 (40Q Wheat) has been credited to your PNB account. UTR: PFMS-2026-TXN-849201.",
    messageHi: "बुकिंग KF-2026-0007 (40 क्विंटल गेहूं) की एमएसपी राशि आपके पीएनबी बैंक खाते में जमा हो गई है। संदर्भ: PFMS-2026-TXN-849201।",
    timestamp: "2 hours ago",
    read: true,
    actionUrl: "/farmer/payments",
    severity: "SUCCESS",
  },
  {
    id: "notif-4",
    category: "QUEUE",
    titleEn: "Queue Turn Approaching",
    titleHi: "आपकी बारी आने वाली है",
    messageEn: "Token TK-100 has entered weighbridge. Please move your Tractor-Trolley to Gate 2 entrance.",
    messageHi: "टोकन TK-100 धर्मकांटे पर पहुंच गया है। कृपया अपना ट्रैक्टर-ट्राली गेट 2 की ओर आगे बढ़ाएं।",
    timestamp: "3 hours ago",
    read: true,
    actionUrl: "/farmer/queue/KF-2026-0001",
    severity: "INFO",
  },
];

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (notif: Omit<AppNotification, "id" | "timestamp" | "read">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  toastMessage: AppNotification | null;
  dismissToast: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: INITIAL_NOTIFICATIONS,
  unreadCount: 2,
  addNotification: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  clearAll: () => {},
  toastMessage: null,
  dismissToast: () => {},
});

const STORAGE_KEY = "krishi_notifications_list";

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [toastMessage, setToastMessage] = useState<AppNotification | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setNotifications(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const save = (updated: AppNotification[]) => {
    setNotifications(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const addNotification = (notif: Omit<AppNotification, "id" | "timestamp" | "read">) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
      timestamp: "Just now",
      read: false,
    };
    const updated = [newNotif, ...notifications];
    save(updated);
    setToastMessage(newNotif);

    // Auto-dismiss toast after 5s
    setTimeout(() => {
      setToastMessage((prev) => (prev?.id === newNotif.id ? null : prev));
    }, 5000);
  };

  const markAsRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    save(updated);
  };

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    save(updated);
  };

  const clearAll = () => {
    save([]);
  };

  const dismissToast = () => {
    setToastMessage(null);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
        toastMessage,
        dismissToast,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
