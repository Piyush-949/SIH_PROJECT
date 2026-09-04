"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Role, UserSession, FarmerProfileSummary } from "@/types";
import { DEMO_ACCOUNTS, DemoUser } from "./demoAccounts";

interface AuthContextType {
  user: UserSession | null;
  farmerProfile: FarmerProfileSummary | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoaded: boolean;
  loginWithPhone: (phone: string, otp: string, signature?: string) => Promise<{ success: boolean; error?: string }>;
  loginAsDemoRole: (role: Role) => void;
  logout: () => void;
  updateKycProfile: (data: Partial<FarmerProfileSummary>) => Promise<{ success: boolean; error?: string }>;
  activeDemoAccount: DemoUser | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  farmerProfile: null,
  role: null,
  isAuthenticated: false,
  isLoaded: false,
  loginWithPhone: async () => ({ success: true }),
  loginAsDemoRole: () => {},
  logout: () => {},
  updateKycProfile: async () => ({ success: true }),
  activeDemoAccount: null,
});

const AUTH_STORAGE_KEY = "krishi_auth_session";
const PROFILE_STORAGE_KEY = "krishi_farmer_profile";
const TOKEN_STORAGE_KEY = "krishi_auth_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [farmerProfile, setFarmerProfile] = useState<FarmerProfileSummary | null>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const savedSession = localStorage.getItem(AUTH_STORAGE_KEY);
        const savedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
        const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);

        if (savedSession) {
          setUser(JSON.parse(savedSession));
        }
        if (savedProfile) {
          setFarmerProfile(JSON.parse(savedProfile));
        }

        // Re-validate session with server if token exists
        if (savedToken) {
          try {
            const res = await fetch("/api/auth/me", {
              headers: { Authorization: `Bearer ${savedToken}` },
            });
            if (res.ok) {
              const data = await res.json();
              const session: UserSession = {
                id: data.user.id,
                phone: data.user.phone,
                name: data.user.name,
                role: data.user.role as Role,
                language: data.user.language || "en",
              };
              setUser(session);
              localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));

              if (data.profile) {
                const profile: FarmerProfileSummary = {
                  id: data.profile.id,
                  userId: data.user.id,
                  aadhaarNumber: data.profile.aadhaarNumber || "",
                  kisanId: data.profile.kisanId,
                  village: data.profile.village,
                  district: data.profile.district,
                  state: data.profile.state,
                  pincode: data.profile.pincode,
                  bankAccountNumber: "",
                  ifscCode: "",
                  bankName: data.profile.bankName || "",
                  landAreaAcres: data.profile.landAreaAcres || 5.0,
                  kycStatus: data.profile.kycStatus,
                };
                setFarmerProfile(profile);
                localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
              }
            } else {
              // Token invalid — clear session
              localStorage.removeItem(AUTH_STORAGE_KEY);
              localStorage.removeItem(PROFILE_STORAGE_KEY);
              localStorage.removeItem(TOKEN_STORAGE_KEY);
              setUser(null);
              setFarmerProfile(null);
            }
          } catch {
            // Network error — keep existing local session
          }
        }
      } catch {
        // localStorage may fail in SSR
      } finally {
        setIsLoaded(true);
      }
    };

    restoreSession();
  }, []);

  /**
   * Demo login for SYSTEM ROLES only (Operator, Inspector, Admin).
   * These accounts are pre-seeded in the database.
   * FARMER role is NOT supported here — farmers must register via OTP.
   */
  const loginAsDemoRole = async (targetRole: Role) => {
    const demo = DEMO_ACCOUNTS[targetRole];
    if (!demo) {
      console.warn(`[Auth] No demo account configured for role: ${targetRole}`);
      return;
    }

    // Try real OTP login with the demo phone number
    // These phones have a pre-seeded OTP bypass on the server for demo purposes
    try {
      // First, send OTP for the demo account
      await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: demo.phone }),
      });

      // Then verify with a fixed demo OTP that the server accepts for these system accounts
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: demo.phone, otp: "999999", role: targetRole }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const session: UserSession = {
          id: data.user.id,
          phone: data.user.phone,
          name: data.user.name,
          role: data.user.role as Role,
          language: "en",
        };
        setUser(session);
        setFarmerProfile(null);
        try {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
          localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        } catch {}
        return;
      }
    } catch {
      // API failed — fall through to local demo session
    }

    // Fallback: create a local demo session (for judges when server isn't running)
    const session: UserSession = {
      id: `usr_${targetRole.toLowerCase()}_demo`,
      phone: demo.phone,
      name: demo.name,
      role: targetRole,
      language: "en",
    };
    setUser(session);
    setFarmerProfile(null);
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    } catch {}
  };

  /**
   * Real phone + OTP login. Verifies against the server and stores the real JWT.
   */
  const loginWithPhone = async (phone: string, otp: string, signature?: string) => {
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp, signature }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || "Invalid or expired OTP." };
      }

      const session: UserSession = {
        id: data.user.id,
        phone: data.user.phone,
        name: data.user.name,
        role: data.user.role as Role,
        language: "en",
      };

      setUser(session);

      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
        if (data.token) {
          localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
        }
      } catch {}

      // If server returned farmer profile directly, hydrate immediately
      if (data.profile) {
        const profile: FarmerProfileSummary = {
          id: data.profile.id,
          userId: session.id,
          aadhaarNumber: data.profile.aadhaarNumber || "",
          kisanId: data.profile.kisanId,
          village: data.profile.village,
          district: data.profile.district,
          state: data.profile.state,
          pincode: data.profile.pincode || data.profile.pinCode || "",
          bankAccountNumber: data.profile.bankAccountNumber || "",
          ifscCode: data.profile.ifscCode || "",
          bankName: data.profile.bankName || "",
          landAreaAcres: data.profile.landAreaAcres || 5.0,
          kycStatus: data.profile.kycStatus || "PENDING",
        };
        setFarmerProfile(profile);
        try {
          localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
        } catch {}
      } else if (session.role === "FARMER") {
        // Fallback: fetch profile from /api/auth/me
        try {
          const profileRes = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${data.token}` },
          });
          if (profileRes.ok) {
            const profileData = await profileRes.json();
            if (profileData.profile) {
              const profile: FarmerProfileSummary = {
                id: profileData.profile.id,
                userId: session.id,
                aadhaarNumber: profileData.profile.aadhaarNumber || "",
                kisanId: profileData.profile.kisanId,
                village: profileData.profile.village,
                district: profileData.profile.district,
                state: profileData.profile.state,
                pincode: profileData.profile.pincode || profileData.profile.pinCode || "",
                bankAccountNumber: profileData.profile.bankAccountNumber || "",
                ifscCode: profileData.profile.ifscCode || "",
                bankName: profileData.profile.bankName || "",
                landAreaAcres: profileData.profile.landAreaAcres || 5.0,
                kycStatus: profileData.profile.kycStatus || "PENDING",
              };
              setFarmerProfile(profile);
              try {
                localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
              } catch {}
            } else {
              setFarmerProfile(null);
              try {
                localStorage.removeItem(PROFILE_STORAGE_KEY);
              } catch {}
            }
          }
        } catch {
          setFarmerProfile(null);
        }
      } else {
        setFarmerProfile(null);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: "Network error. Please check your connection and try again." };
    }
  };

  const logout = () => {
    setUser(null);
    setFarmerProfile(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(PROFILE_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      // Clear auth cookie
      document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    } catch {}
  };

  const updateKycProfile = async (
    data: Partial<FarmerProfileSummary>
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY) || "";

      const res = await fetch("/api/auth/complete-kyc", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user?.id,
          phone: user?.phone,
          name: data.name || user?.name,
          aadhaarNumber: data.aadhaarNumber,
          kisanId: data.kisanId,
          village: data.village,
          district: data.district,
          state: data.state,
          pinCode: data.pincode,
          pincode: data.pincode,
          bankName: data.bankName,
          accountNumber: data.bankAccountNumber,
          ifscCode: data.ifscCode,
          landAreaAcres: data.landAreaAcres,
        }),
      });

      const resData = await res.json().catch(() => ({}));

      if (!res.ok || !resData.success) {
        const errorMsg = resData.error || "KYC registration failed. Please check your details.";
        console.error("[Auth] KYC update failed:", errorMsg);
        return { success: false, error: errorMsg };
      }

      const profileData = resData.profile;

      const updated: FarmerProfileSummary = {
        id: profileData?.id || farmerProfile?.id || `fp_${Date.now()}`,
        userId: user?.id || profileData?.userId || "usr_farmer_active",
        aadhaarNumber: data.aadhaarNumber || profileData?.aadhaarNumber || "",
        kisanId: data.kisanId || profileData?.kisanId || "",
        village: data.village || profileData?.village || "",
        district: data.district || profileData?.district || "",
        state: data.state || profileData?.state || "",
        pincode: data.pincode || profileData?.pinCode || profileData?.pincode || "",
        bankAccountNumber: data.bankAccountNumber || profileData?.bankAccountNumber || "",
        ifscCode: data.ifscCode || profileData?.ifscCode || "",
        bankName: data.bankName || profileData?.bankName || "",
        landAreaAcres: data.landAreaAcres || profileData?.landAreaAcres || 5.0,
        kycStatus: "VERIFIED",
      };

      setFarmerProfile(updated);
      try {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
      } catch {}

      // Update name in user session as well
      if (data.name && user) {
        const updatedUser: UserSession = { ...user, name: data.name };
        setUser(updatedUser);
        try {
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedUser));
        } catch {}
      }

      return { success: true };
    } catch (err: any) {
      console.error("[Auth] updateKycProfile error:", err.message);
      return { success: false, error: err.message || "Network error. Please try again." };
    }
  };

  const currentRole = user?.role || null;
  const activeDemoAccount = currentRole ? (DEMO_ACCOUNTS[currentRole] || null) : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        farmerProfile,
        role: currentRole,
        isAuthenticated: !!user,
        isLoaded,
        loginWithPhone,
        loginAsDemoRole,
        logout,
        updateKycProfile,
        activeDemoAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
