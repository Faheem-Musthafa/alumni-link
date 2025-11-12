"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "./use-auth";

// Pages that don't require verification
const PUBLIC_ROUTES = ["/", "/login", "/signup", "/onboarding"];

export function useVerificationGuard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    // Allow public routes
    if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith("/api"))) {
      return;
    }

    // If not logged in, redirect to login
    if (!user) {
      router.push("/login");
      return;
    }

    // Check verification status
    const verificationStatus = user.verificationStatus || "unverified";

    // If user hasn't completed onboarding, redirect to onboarding
    if (verificationStatus === "unverified" && pathname !== "/onboarding") {
      console.log("User has not completed onboarding, redirecting...");
      router.push("/onboarding");
      return;
    }

    // If verification is pending, they can access dashboard but with limited features
    // This is handled in individual pages
  }, [user, loading, pathname, router]);

  return { user, loading };
}
