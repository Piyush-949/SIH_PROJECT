"use client";

import React, { useState } from "react";
import { useNotifications, AppNotification } from "@/lib/notifications/NotificationContext";
import { useTranslation } from "@/lib/i18n";
import {
  Bell,
  X,
  CheckCheck,
  Trash2,
  CalendarCheck,
  Clock,
  AlertTriangle,
  CreditCard,
  Layers,
  ChevronRight,
  Info,
} from "lucide-react";
import Link from "next/link";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const { t, isHindi } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>("ALL");

  if (!isOpen) return null;

  const filtered = notifications.filter((n) => {
    if (activeTab === "ALL") return true;
    return n.category === activeTab;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "BOOKING":
        return <CalendarCheck className="w-4 h-4 text-emerald-600" />;
      case "QUEUE":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "INCIDENT":
        return <AlertTriangle className="w-4 h-4 text-amber-600" />;
      case "PAYMENT":
        return <CreditCard className="w-4 h-4 text-purple-600" />;
      default:
        return <Info className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Bell className="w-5 h-5 text-emerald-400" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </div>
              <h2 className="font-bold text-base">{t.notifications.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Action Bar */}
          <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-600 font-medium">
              {unreadCount} unread alert{unreadCount !== 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={markAllAsRead}
                className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 transition"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                {t.notifications.markAllRead}
              </button>
              <button
                onClick={clearAll}
                className="text-slate-500 hover:text-rose-600 transition flex items-center gap-1"
                title="Clear all alerts"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex border-b border-slate-200 px-2 bg-white text-xs font-medium overflow-x-auto">
            {[
              { id: "ALL", label: t.notifications.all },
              { id: "BOOKING", label: t.notifications.booking },
              { id: "QUEUE", label: t.notifications.queue },
              { id: "INCIDENT", label: t.notifications.incident },
              { id: "PAYMENT", label: t.notifications.payment },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2.5 px-3 border-b-2 whitespace-nowrap transition ${
                  activeTab === tab.id
                    ? "border-emerald-600 text-emerald-700 font-bold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Bell className="w-12 h-12 mx-auto mb-2 text-slate-300 stroke-1" />
                <p className="text-sm font-medium">{t.notifications.noNotifications}</p>
              </div>
            ) : (
              filtered.map((item) => (
                <div
                  key={item.id}
                  onClick={() => markAsRead(item.id)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer relative ${
                    item.read
                      ? "bg-slate-50/70 border-slate-200 text-slate-700"
                      : "bg-emerald-50/40 border-emerald-300 text-slate-900 shadow-xs"
                  }`}
                >
                  {!item.read && (
                    <span className="absolute top-3.5 right-3 w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                  )}

                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-white shadow-xs border border-slate-200 mt-0.5">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div className="flex-1 pr-3">
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">
                        {isHindi ? item.titleHi : item.titleEn}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {isHindi ? item.messageHi : item.messageEn}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60">
                        <span className="text-[10px] text-slate-400 font-medium">
                          {item.timestamp}
                        </span>
                        {item.actionUrl && (
                          <Link
                            href={item.actionUrl}
                            onClick={onClose}
                            className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5"
                          >
                            View Details <ChevronRight className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Global Toast Banner Component for live Socket.IO & In-App triggers
 */
export function NotificationToast() {
  const { toastMessage, dismissToast } = useNotifications();
  const { isHindi } = useTranslation();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-slate-900 text-white rounded-xl shadow-2xl p-4 border border-emerald-500/40 animate-slide-up flex items-start gap-3">
      <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
        <Bell className="w-5 h-5 animate-bounce" />
      </div>
      <div className="flex-1">
        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
          {toastMessage.category} ALERT
        </h4>
        <p className="text-xs font-semibold text-white mt-0.5">
          {isHindi ? toastMessage.titleHi : toastMessage.titleEn}
        </p>
        <p className="text-xs text-slate-300 mt-1 line-clamp-2">
          {isHindi ? toastMessage.messageHi : toastMessage.messageEn}
        </p>
      </div>
      <button
        onClick={dismissToast}
        className="text-slate-400 hover:text-white p-1 rounded transition"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
