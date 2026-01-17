import type { Metadata } from "next";

import { ClerkProvider } from "@clerk/nextjs";

import "../index.css";
import { Geist, Geist_Mono } from "next/font/google";

import ErrorBoundary from "@/components/error-boundary";
import Header from "@/components/header";
import Providers from "@/components/providers";
import { ServiceWorkerUpdateNotification } from "@/components/service-worker-update-notification";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "keyframe-razor",
  description: "keyframe-razor",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClerkProvider>
          <Providers>
            <ErrorBoundary>
              {/* Skip Links for keyboard users */}
              <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:ring-2 focus:ring-ring"
              >
                Skip to main content
              </a>
              <a
                href="#main-navigation"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-48 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:ring-2 focus:ring-ring"
              >
                Skip to navigation
              </a>

              <div className="grid grid-rows-[auto_1fr] h-svh">
                <Header />
                <main id="main-content" tabIndex={-1} role="main">
                  {children}
                </main>
              </div>
              <ServiceWorkerUpdateNotification />
            </ErrorBoundary>
          </Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
