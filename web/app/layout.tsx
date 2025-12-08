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

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fantasy Football Ladder",
  description: "A modern fantasy football platform with promotion/relegation mechanics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <AnalyticsProvider>
            <QueryProvider>
              <ToastProvider>
                <EnvironmentBanner />
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

