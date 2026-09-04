import { Role } from "@/types";

export interface DemoUser {
  phone: string;
  name: string;
  role: Role;
  roleTitle: string;
  badgeColor: string;
  defaultPath: string;
  centreId?: string;
  centreName?: string;
  district?: string;
  state?: string;
  avatarInitials: string;
  description: string;
}

// Pre-configured system role accounts for development and testing (Operator, Inspector, Admin)
// These accounts are pre-seeded in the database to test station terminal portals.
// FARMER role requires authentication via real OTP + verified KYC.
export const DEMO_ACCOUNTS: Partial<Record<Role, DemoUser>> = {
  CENTRE_OPERATOR: {
    phone: "9876543220",
    name: "Suraj Meena",
    role: "CENTRE_OPERATOR",
    roleTitle: "Mandi Gate & Weighing Operator",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-300",
    defaultPath: "/operator",
    centreId: "PC-HR-001",
    centreName: "Karnal Central APMC Mandi",
    district: "Karnal",
    state: "Haryana",
    avatarInitials: "SM",
    description: "Gate Supervisor & Weighbridge Operator managing live check-ins and queue flow.",
  },
  QUALITY_INSPECTOR: {
    phone: "9876543230",
    name: "Dr. Anil Sharma",
    role: "QUALITY_INSPECTOR",
    roleTitle: "Agmarknet Quality Assessor",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-300",
    defaultPath: "/inspector",
    district: "Karnal",
    state: "Haryana",
    avatarInitials: "AS",
    description: "Certified grain testing officer performing Agmarknet grading & moisture analysis.",
  },
  DISTRICT_ADMIN: {
    phone: "9876543240",
    name: "Vikas Verma",
    role: "DISTRICT_ADMIN",
    roleTitle: "District Agricultural Officer",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
    defaultPath: "/admin",
    district: "Karnal",
    state: "Haryana",
    avatarInitials: "VV",
    description: "Oversees 12 mandis across Karnal & Haryana, monitors congestion and load balancing.",
  },
  STATE_ADMIN: {
    phone: "9876543250",
    name: "Meenakshi Sundaram",
    role: "STATE_ADMIN",
    roleTitle: "State Food & Civil Supplies Dir.",
    badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-300",
    defaultPath: "/admin",
    state: "Haryana",
    avatarInitials: "MS",
    description: "State-level procurement director allocating inter-district buffer storage & quotas.",
  },
  SUPER_ADMIN: {
    phone: "9876543260",
    name: "Rajeshwari Singh",
    role: "SUPER_ADMIN",
    roleTitle: "National Procurement Division (FCI)",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-300",
    defaultPath: "/admin",
    avatarInitials: "RS",
    description:
      "National administrator controlling master crop MSP rates, policy thresholds, and audit trails.",
  },
};
