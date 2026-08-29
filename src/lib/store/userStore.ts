// Minimal in-memory store — only used as a transient cache for active sessions
// All persistent user data is now stored in Prisma SQLite DB
// This file is kept for backward compatibility with any code that may reference it

export interface StoredUser {
  id: string;
  phone: string;
  name: string;
  role: string;
  language: string;
  createdAt: string;
  farmerProfile: StoredFarmerProfile | null;
}

export interface StoredFarmerProfile {
  id: string;
  userId: string;
  aadhaarNumber: string;
  kisanId: string;
  village: string;
  district: string;
  state: string;
  pincode: string;
  bankAccountNumber: string;
  ifscCode: string;
  bankName: string;
  landAreaAcres: number;
  kycStatus: string;
  kycVerifiedAt: string | null;
}

// Empty map — no pre-seeded demo users
// Users are created via OTP login and stored in Prisma DB
export const userStore = new Map<string, StoredUser>();
