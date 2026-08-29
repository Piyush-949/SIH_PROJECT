import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { I18nProvider } from "@/lib/i18n";
import { OfflineProvider } from "@/lib/offline/OfflineContext";
import { NotificationProvider } from "@/lib/notifications/NotificationContext";
import { OfflineBanner } from "@/components/layout/OfflineBanner";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { NotificationToast } from "@/components/layout/NotificationDrawer";

export const metadata: Metadata = {
  title: "KRISHI SETU | Intelligent Agricultural Procurement Web Platform",
  description:
    "Smart India Hackathon 2026 (Problem Statement ID: 26032) — Intelligent Agricultural Procurement Orchestration Web Platform with Zero Wait Times, Real-Time Queue & 9-Stage Transparency.",
  icons: {
    icon: "/krishi-setu-logo.jpg",
    shortcut: "/krishi-setu-logo.jpg",
    apple: "/krishi-setu-logo.jpg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased">
        <I18nProvider>
          <AuthProvider>
            <OfflineProvider>
              <NotificationProvider>
                {/* 4-State Offline Banner */}
                <OfflineBanner />
                {/* Main Navigation Header */}
                <Navbar />
                {/* Main View Port */}
                <main className="flex-1 flex flex-col">{children}</main>
                {/* Global Notification Toast */}
                <NotificationToast />
                {/* Footer */}
                <Footer />
              </NotificationProvider>
            </OfflineProvider>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
