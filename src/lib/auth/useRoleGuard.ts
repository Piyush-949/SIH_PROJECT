"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import { Role } from "@/types";

/**
 * Protects a page so only users with one of the allowed roles can access it.
 * Unauthenticated users are redirected to /staff-login.
 * Farmers trying to access staff areas are redirected to /staff-login.
 * Returns { isAuthorized } — only true when authenticated with an authorized role.
 */
export function useRoleGuard(allowedRoles: Role[]): { isAuthorized: boolean } {
  const router = useRouter();
  const { user, isAuthenticated, role, isLoaded } = useAuth();

  const isAuthorized = isLoaded && isAuthenticated && role !== null && allowedRoles.includes(role);

  useEffect(() => {
    if (!isLoaded) return; // Wait until local session is read

    if (!isAuthenticated || !user || !role) {
      router.replace("/staff-login");
      return;
    }

    if (!allowedRoles.includes(role)) {
      // If unauthorized role, send to staff login
      router.replace("/staff-login");
    }
  }, [isLoaded, isAuthenticated, role, user, router, allowedRoles]);

  return { isAuthorized };
}
