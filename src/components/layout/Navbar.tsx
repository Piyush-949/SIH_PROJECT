"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { useTranslation, useLanguage, Language } from "@/lib/i18n";
import { useNotifications } from "@/lib/notifications/NotificationContext";
import { NotificationDrawer } from "./NotificationDrawer";
import {
  Sprout,
  Bell,
  Globe,
  UserCheck,
  ChevronDown,
  Menu,
  X,
  LayoutDashboard,
  CalendarPlus,
  Clock,
  GitCommit,
  CreditCard,
  Scale,
  AlertTriangle,
  FlaskConical,
  BarChart3,
  Shield,
  LogIn,
  LogOut,
  User,
  ShieldCheck,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, farmerProfile, logout } = useAuth();
  const { t, isHindi } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const { unreadCount } = useNotifications();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLangChange = (lang: Language) => {
    setLanguage(lang);
    setIsLangDropdownOpen(false);
  };

  const navLinks = [
    { href: "/farmer/dashboard", label: "Farmer Services", icon: Sprout },
    { href: "/farmer/ai-quality", label: "AI Quality Scan", icon: FlaskConical },
    { href: "/farmer/pool", label: "Shared Transport", icon: Scale },
    { href: "/operator", label: "Mandi Inward", icon: ShieldCheck },
    { href: "/admin", label: "National Analytics", icon: BarChart3 },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900 text-white shadow-xl border-b border-emerald-900/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand Logo & Title */}
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="flex items-center gap-2.5 group focus:outline-hidden"
              >
                {/* KRISHI SETU Logo */}
                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md shadow-emerald-900/40 group-hover:scale-105 transition transform flex-shrink-0">
                  <img
                    src="/krishi-setu-logo.jpg"
                    alt="KRISHI SETU Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-lg tracking-tight text-white group-hover:text-emerald-300 transition">
                      KRISHI SETU
                    </span>
                    <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      National Portal
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block -mt-0.5">
                    किसान का साथी, हर कदम पर
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || (link.href !== "/farmer/dashboard" && pathname?.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition ${
                      isActive
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "text-slate-300 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right: Language Toggle, Notification Bell, User Avatar */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Language Switcher Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition"
                >
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{language === "en" ? "EN" : "हिन्दी"}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {isLangDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-32 bg-slate-900 border border-slate-700 rounded-xl shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-2 text-xs">
                    <button
                      onClick={() => handleLangChange("en")}
                      className={`w-full px-3 py-2 text-left font-semibold flex items-center justify-between hover:bg-slate-800 transition ${
                        language === "en" ? "text-emerald-400 bg-emerald-950/30" : "text-slate-300"
                      }`}
                    >
                      <span>English</span>
                      {language === "en" && <span>✓</span>}
                    </button>
                    <button
                      onClick={() => handleLangChange("hi")}
                      className={`w-full px-3 py-2 text-left font-semibold flex items-center justify-between hover:bg-slate-800 transition ${
                        language === "hi" ? "text-emerald-400 bg-emerald-950/30" : "text-slate-300"
                      }`}
                    >
                      <span>हिन्दी</span>
                      {language === "hi" && <span>✓</span>}
                    </button>
                  </div>
                )}
              </div>

              {/* Notification Bell */}
              <button
                onClick={() => setIsNotifOpen(true)}
                className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700"
                title="Procurement Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* User Session Profile Button */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs font-semibold text-emerald-200 hover:bg-emerald-900/60 transition"
                  >
                    <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                      {user.name.charAt(0)}
                    </div>
                    <span className="hidden sm:inline-block truncate max-w-[120px]">
                      {user.name}
                    </span>
                    <span className="hidden md:inline-block px-1.5 py-0.2 rounded text-[9px] bg-slate-800 text-emerald-300 font-mono">
                      {user.role}
                    </span>
                    <ChevronDown className="w-3 h-3 text-emerald-400" />
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 text-xs">
                      <div className="px-3 py-2 border-b border-slate-800">
                        <div className="font-bold text-white truncate">{user.name}</div>
                        <div className="text-[11px] text-emerald-400 font-mono">{user.phone}</div>
                        <div className="text-[10px] text-amber-400 font-bold mt-0.5">Role: {user.role}</div>
                        {farmerProfile && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Kisan ID: {farmerProfile.kisanId}
                          </div>
                        )}
                      </div>

                      {user.role === "FARMER" ? (
                        <>
                          <Link
                            href="/farmer/dashboard"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="block px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 transition"
                          >
                            Farmer Dashboard
                          </Link>
                          <Link
                            href="/farmer/payments"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="block px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 transition"
                          >
                            Payment Ledger
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link
                            href="/admin"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="block px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 transition"
                          >
                            Admin Dashboard
                          </Link>
                          <Link
                            href="/operator"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="block px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 transition"
                          >
                            Operator Mandi Panel
                          </Link>
                          <Link
                            href="/inspector"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="block px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 transition"
                          >
                            Inspector Testing Station
                          </Link>
                        </>
                      )}

                      <div className="border-t border-slate-800 mt-1 pt-1">
                        <button
                          onClick={() => {
                            logout();
                            setIsUserMenuOpen(false);
                            router.push("/login");
                          }}
                          className="w-full px-3 py-2 text-left text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 font-semibold flex items-center gap-1.5 transition"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-xs"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Farmer Login</span>
                  </Link>
                  <Link
                    href="/staff-login"
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-300 border border-blue-500/40 font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
                  >
                    <Shield className="w-3.5 h-3.5 text-blue-400" />
                    <span className="hidden sm:inline">Staff Login</span>
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-slate-900 border-t border-slate-800 px-4 py-3 space-y-1 animate-in slide-in-from-top-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 text-slate-200 hover:bg-slate-800"
                >
                  <Icon className="w-4 h-4 text-emerald-400" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Notification Drawer */}
      <NotificationDrawer isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </>
  );
}
