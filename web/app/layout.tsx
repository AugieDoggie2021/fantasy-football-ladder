import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { EnvironmentBanner } from "@/components/environment-banner";
import { QueryProvider } from "@/components/query-provider";
import { ToastProvider } from "@/components/toast-provider";
import { AnalyticsProvider } from "@/components/analytics/posthog-provider";
import { Analytics } from "@vercel/analytics/react";
import { PageViewTracker } from "@/components/analytics/page-view-tracker";
import { ConsentBanner } from "@/components/analytics/consent-banner";
import { ErrorBoundary } from "@/components/error-boundary";
import { UserIdentification } from "@/components/analytics/user-identification";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fantasy Football Ladder",
  description: "A modern fantasy football platform with promotion/relegation mechanics",
  icons: {
    icon: "/assets/brand/ffl-favicon.svg",
    apple: "/assets/brand/ffl-app-icon-standard.svg",
  },
};

export const viewport = {
  themeColor: "#10B981",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} min-h-screen bg-gradient-to-b from-[#020617] via-[#0a1020] to-[#0b1220] text-slate-300`}
      >
        <ErrorBoundary>
          <AnalyticsProvider>
            <QueryProvider>
              <ToastProvider>
                <EnvironmentBanner />
                <UserIdentification />
                <PageViewTracker />
                {children}
                <Analytics />
                <ConsentBanner />
              </ToastProvider>
            </QueryProvider>
          </AnalyticsProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
