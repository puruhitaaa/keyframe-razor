"use client";

import { useAuth } from "@clerk/nextjs";
import { env } from "@keyframe-razor/env/web";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";

import { initializeRateLimiter } from "@/lib/convex-rate-limiter";

import { ThemeProvider } from "./theme-provider";
import { Toaster } from "./ui/sonner";

// Initialize the rate limiter with configuration
initializeRateLimiter({
  maxRetries: 5,
  initialDelay: 1000,
  backoffMultiplier: 2,
  maxDelay: 30000,
  debug: false,
});

const convex = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
      <Toaster richColors />
    </ThemeProvider>
  );
}
