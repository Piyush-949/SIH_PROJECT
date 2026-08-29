## 2026-08-26T10:10:33Z

You are the Lead Implementation Worker for Milestone 1: Core Foundation, Database Schema & Mock Government Registry for KRISHI FLOW (SIH 2026 Problem Statement ID: 26032).
Your working directory is: C:\Users\piyus\Desktop\SIH_PROJECT\.agents\worker_m1_1
Source of Truth: C:\Users\piyus\Desktop\SIH_PROJECT\ORIGINAL_REQUEST.md
Architecture & Specifications: C:\Users\piyus\Desktop\SIH_PROJECT\PROJECT.md
Architecture Plan: C:\Users\piyus\Desktop\SIH_PROJECT\.agents\explorer_arch_1\arch_analysis.md

Your task for Milestone 1:
1. Initialize the project configuration: `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`, `postcss.config.mjs`. Ensure all required dependencies are present (Next 14, React 18, TypeScript, Tailwind CSS, Lucide React, Socket.IO, Socket.IO Client, Prisma, @prisma/client, tsx, etc.).
2. Set up `server.ts`: A unified HTTP server running Next.js App Router and Socket.IO on port 3000, so `npm run dev` starts both seamlessly on a single port for zero-CLI browser access.
3. Build the complete Prisma Schema (`prisma/schema.prisma`):
   - 14 models: `User`, `FarmerProfile`, `ProcurementCentre`, `Crop`, `CentreCrop`, `Slot`, `Booking`, `QueueEntry`, `ProcurementRecord`, `QualityInspection`, `Payment`, `PaymentBoostRequest`, `OperationalIncident`, `Notification`, `GovRegistry`.
   - Complete enums: `Role`, `GovVerificationStatus`, `VehicleType`, `BookingStatus`, `QueueStatus`, `ProcurementStage`, `QualityGrade`, `InspectionDecision`, `PaymentStatus`, `IncidentType`, `IncidentSeverity`, `NotificationCategory`.
   - Setup SQLite database (`file:./dev.db`) for zero-config instant local execution with PostgreSQL compatibility.
4. Implement `prisma/seed.ts`:
   - High-fidelity realistic seed data:
     - 10+ Procurement Centres across varied states/districts with coordinates, capacities, processing speeds, active equipment.
     - 4 major crops: Wheat (Kanak), Paddy (Rice), Maize (Corn), Soybean with official MSP rates and Agmarknet quality standards.
     - 20+ Farmers with valid Aadhaar/Kisan ID in `GovRegistry` and realistic demo profiles.
     - 6 Demo User Accounts for all roles (`FARMER`, `CENTRE_OPERATOR`, `QUALITY_INSPECTOR`, `DISTRICT_ADMIN`, `STATE_ADMIN`, `SUPER_ADMIN`).
     - Multiple seeded bookings in various stages (Confirmed, Checked-in, In-inspection, Completed, Payment processing).
     - Active incidents (e.g. Weighing machine failure at Centre A).
5. Build `src/lib/db.ts` (Prisma singleton) and initial utility helpers (`src/lib/algorithms/...`).
6. Run `npx prisma generate` and `npx prisma db push` or `npx tsx prisma/seed.ts` to verify database generation.
7. Run build/test checks to verify clean compilation.
