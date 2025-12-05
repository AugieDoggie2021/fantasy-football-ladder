import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { EnvironmentBanner } from "@/components/environment-banner";
import { QueryProvider } from "@/components/query-provider";
import { ToastProvider } from "@/components/toast-provider";

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
        <QueryProvider>
          <ToastProvider>
            <EnvironmentBanner />
            {children}
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

