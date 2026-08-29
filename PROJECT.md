# Project: KRISHI SETU
**SIH 2026 Problem Statement ID**: 26032  
**Platform**: Intelligent Agricultural Procurement Orchestration Web Platform  
**Integrity Mode**: Demo (Production-grade Web Prototype with High-Fidelity Mock Infrastructure)  
**Execution Target**: Zero-CLI Browser Web Execution (`http://localhost:3000`)

---

## Architecture
- **Full-Stack Framework**: Next.js 14+ App Router (`src/app`), React 18, TypeScript.
- **Unified Server**: Custom Node.js HTTP Server (`server.ts`) hosting both Next.js App Router and Socket.IO on port 3000.
- **Styling & UI**: Tailwind CSS, Lucide React Icons, Framer Motion (subtle animations), Radix UI primitives / shadcn-style component library.
- **State & Data Fetching**: TanStack Query / React SWR + Local State Management + Socket.IO client hooks.
- **Database & ORM**: Prisma ORM (`prisma/schema.prisma`) targeting SQLite (`file:./dev.db`) with PostgreSQL compatibility.
- **Data Models (16 Entities)**: `User`, `FarmerProfile`, `GovRegistry`, `ProcurementCentre`, `Crop`, `CentreCrop`, `Slot`, `Booking`, `QueueEntry`, `ProcurementRecord`, `QualityInspection`, `Payment`, `PaymentBoostRequest`, `OperationalIncident`, `Notification`, `AuditLog`.
- **Real-Time Engine**: Socket.IO (`server.ts` / `/api/socket`) emitting live queue updates, incident alerts, dynamic ETA recalculations, and status broadcasts across dynamic rooms (`centre:${id}`, `booking:${id}`, `farmer:${id}`, `admin:analytics`).
- **Auth & RBAC**: Session/JWT-based role authentication supporting 6 roles (`FARMER`, `CENTRE_OPERATOR`, `QUALITY_INSPECTOR`, `DISTRICT_ADMIN`, `STATE_ADMIN`, `SUPER_ADMIN`).
- **Bilingual i18n**: English + Hindi language dictionary and context provider (`src/lib/i18n`).
- **Offline Resiliency**: `localStorage` + Service Worker caching for QR code tokens, active booking records, last known queue position, and 4-state network banner (`ONLINE`, `SYNCING`, `OFFLINE`, `LAST SYNCED`).

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F01 | Unified Web Server | Single-command `npm run dev` running Next.js + Socket.IO on port 3000 | M1 | R7, AC-11, AC-12 |
| F02 | Normalized Database Schema | 16 relational tables in Prisma schema with full audit fields and indexes | M1 | R7, Spec §6 |
| F03 | Mock Government Registry | Aadhaar + Kisan ID combination verification registry | M1 | R1, AC-02 |
| F04 | High-Fidelity Seed Data | Seed 12 centres, 25 farmers, 4 crops, 14 bookings, active incident | M1 | R7, AC-04 |
| F05 | Mobile OTP Authentication | Mock OTP generation, verification, and role-based session login | M2 | R1, AC-01 |
| F06 | Farmer KYC Onboarding | Aadhaar/Kisan ID validation, profile details, bank info, language preference | M2 | R1, AC-01 |
| F07 | Role-Based Route Guards | Protected route middleware and session validation for all 6 roles | M2 | R1, AC-03 |
| F08 | Centre Map & Congestion Explorer | Interactive procurement centre map with capacity and congestion indicators | M3 | R2, R5, AC-13 |
| F09 | AI Centre Recommendation Engine | 8-factor weighted scoring with natural language "Why we recommend this" | M3 | R2, AC-05 |
| F10 | Dynamic Arrival Slot Booking | Processing time formula based on vehicle, quantity, crop, inspection, delay | M3 | R2, AC-07 |
| F11 | QR Code & Token Generator | Generate scannable QR token, Booking ID, and arrival window | M3 | R2, AC-07 |
| F12 | Large Farmer Farm Visit Workflow | Quantity > 50Q triggers PACS on-site inspection request before slot issuance | M3 | R2, AC-06 |
| F13 | Live Virtual Queue Engine | Real-time queue positioning and live WebSocket state synchronization | M4 | R3, AC-08 |
| F14 | Incident Management & Sub-5s ETA | Operator incident reporting with automatic sub-5s ETA recalculation broadcast | M4 | R3, AC-08, AC-09 |
| F15 | Grace Period & Auto No-Show | Automatic no-show assignment upon grace period expiry | M4 | R3, AC-10 |
| F16 | Ranked Slot Rescheduling | Alternative slot recommendations for missed or delayed bookings | M4 | R3, AC-10 |
| F17 | 9-Stage Procurement Lifecycle | Step-by-step state machine with timestamp, actor, status, and audit log | M5 | R3, AC-11 |
| F18 | Weighing Module & Discrepancy Alerts | Gross/Tare/Net calculation with >20% discrepancy alert and operator actions | M5 | R3, AC-12 |
| F19 | Quality Inspection Form & Grading | Agmarknet grading (A/B/C/Reject) with moisture, foreign matter, damaged grain | M5 | R3, AC-13 |
| F20 | MSP Calculation & Net Payable | Dynamic MSP calculation with quality moisture deductions and breakdown | M6 | R4, AC-14 |
| F21 | 4-Stage Payment Tracker | NOT_INITIATED -> INITIATED -> PROCESSING -> SUCCESSFUL with ref ID | M6 | R4, AC-14 |
| F22 | Payment Boost Request Workflow | Farmer SLA delay boost submission and operator resolution dashboard | M6 | R4, AC-15 |
| F23 | Farmer Mobile-First Portal | Responsive dashboard with booking, live queue, timeline, payment tracker | M7 | R5, AC-16 |
| F24 | Operator Portal & QR Scanner | Queue management, simulated QR scanner, manual entry, incident controls | M7 | R5, AC-18 |
| F25 | Quality Inspector Portal | Inspection queue, interactive testing form, grading decision workflow | M7 | R5, AC-13 |
| F26 | Admin Dashboard & Heatmap | Congestion heatmap (Green/Yellow/Red/Grey), throughput charts, bottlenecks | M7 | R5, AC-16 |
| F27 | Decision-Support Action Cards | Actionable administrative recommendations (e.g. redirect traffic to Centre B) | M7 | R5, AC-17 |
| F28 | In-App Notification Centre | Categorized notification drawer with unread badges and toast alerts | M8 | R6, AC-19 |
| F29 | Bilingual Support (English + Hindi) | Instant header toggle for English ↔ Hindi across all core views | M8 | R7, AC-21 |
| F30 | Offline Caching & Sync Banner | Offline access to QR tokens and bookings with 4-state connection indicator | M8 | R6, AC-20 |
| F31 | 5-Tier Opaque E2E Test Suite | Comprehensive automated test runner covering Tiers 1-5 (>100 test cases) | E2E | R7, AC-22 |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| E2E | E2E Testing Track | Test harness, runner (`tests/e2e/runner.ts`), Tiers 1-4 tests, `TEST_READY.md` | none | DONE |
| M1 | Core Foundation & Data Architecture | Next.js 14 project, `server.ts` (Next + Socket.IO), Prisma Schema (16 models), MockGovRegistry, Seed data script | none | DONE |
| M2 | Auth, Farmer KYC & Role Guards | OTP mock auth, Gov validation, KYC profile completion, 6-role sessions, middleware guards | M1 | PLANNED |
| M3 | Centre Map, AI Engine & Smart Booking | Interactive map, 8-factor AI recommendation, dynamic slot formula, QR generation, Farm Visit workflow | M1, M2 | PLANNED |
| M4 | Real-Time Queue & Incident Engine | Socket.IO queue service, incident reporting, sub-5s ETA recalculation, auto-noshow, slot rescheduling | M1, M3 | PLANNED |
| M5 | 9-Stage Procurement, Weighing & Quality | 9-stage lifecycle engine, weighing module with >20% discrepancy alert, quality grading matrix form | M1, M4 | PLANNED |
| M6 | Payment Tracker & SLA Boost Requests | MSP rate calculations, 4-stage payment state machine, farmer SLA boost request & operator resolver | M1, M5 | PLANNED |
| M7 | Multi-Role Portals & Admin Analytics | Farmer portal, Operator portal with QR scanner, Inspector portal, Admin congestion heatmap & action cards | M2, M3, M4, M5, M6 | PLANNED |
| M8 | Notifications, Bilingual & Offline | In-app notification drawer, EN/HI language switcher, offline caching & 4-state connection banner | M1-M7 | PLANNED |
| M9 | Full E2E Verification & Hardening | Run 100% E2E test suite (Tiers 1-4), execute Tier 5 adversarial hardening, verify 5-min demo flow | M8, E2E | PLANNED |

---

## Interface Contracts
### Auth & User Management
- `POST /api/auth/send-otp` -> `{ phone: string } => { success: boolean, otp: string, message: string }`
- `POST /api/auth/verify-otp` -> `{ phone: string, otp: string, role?: Role } => { success: boolean, user: User, token: string }`
- `POST /api/auth/validate-gov-id` -> `{ aadhaarNumber: string, kisanId: string } => { valid: boolean, record?: GovRegistry }`
- `POST /api/auth/complete-kyc` -> `{ userId: string, aadhaarNumber, kisanId, name, village, district, state, pinCode, bankName, accountNumber, ifscCode, preferredLanguage } => { success: boolean, profile: FarmerProfile }`
- `GET /api/auth/me` -> Headers: Session Token => `{ user: User, profile?: FarmerProfile }`

### Centre Discovery & Smart Booking
- `GET /api/centres` -> `?cropId=&lat=&lng=` => `{ centres: (ProcurementCentre & { crops, activeQueueCount, congestionLevel, aiScore, recommendationReason })[] }`
- `POST /api/bookings/calculate-slot` -> `{ centreId, cropId, quantity, vehicleType } => { estimatedMinutes: number, breakdown: {...}, suggestedSlots: SlotOption[] }`
- `POST /api/bookings/create` -> `{ farmerId, centreId, cropId, estimatedQuantity, vehicleType, slotTime, isFarmVisitRequest } => { booking: Booking, qrToken: string }`

### Real-Time Queue & Incident Engine
- Socket.IO Events:
  - `join_centre_queue`: `(centreId: string)`
  - `queue_updated`: `{ centreId, queue: QueueEntry[], activeIncidentCount }`
  - `incident_reported`: `{ incident: OperationalIncident, affectedBookingsCount, recalculatedEtas: Record<string, string> }`
  - `eta_updated`: `{ bookingId: string, newEstimatedTime: string, delayMinutes: number, reason: string }`
- `POST /api/incidents/create` -> `{ centreId, type, severity, description, delayMinutesImpact } => { incident: OperationalIncident }`
- `POST /api/incidents/resolve` -> `{ incidentId } => { success: boolean }`

### Procurement Lifecycle & Quality
- `POST /api/procurement/check-in` -> `{ bookingId | qrToken, operatorId } => { booking: Booking, queueEntry: QueueEntry }`
- `POST /api/procurement/transition-stage` -> `{ bookingId, stage: ProcurementStage, actorId, remarks } => { record: ProcurementRecord }`
- `POST /api/procurement/weighing` -> `{ bookingId, grossWeight, tareWeight, operatorId } => { actualQuantity, discrepancyPercentage, alertTriggered }`
- `POST /api/procurement/quality-inspect` -> `{ bookingId, inspectorId, moisturePercentage, foreignMatterPercentage, damagedGrainPercentage, grade, decision, deductionPercentage } => { inspection: QualityInspection }`

### Payment & Boost
- `GET /api/payments/booking/:bookingId` -> `{ payment: Payment, mspRate, grossAmount, deductions, finalPayableAmount, status, transactionRef }`
- `POST /api/payments/boost-request` -> `{ bookingId, farmerId, reason } => { boostRequest: PaymentBoostRequest }`
- `POST /api/payments/process-boost` -> `{ requestId, operatorId, action: 'EXPEDITE'|'REJECT' } => { success: boolean }`

---

## Code Layout
```
C:\Users\piyus\Desktop\SIH_PROJECT/
├── server.ts                       # Custom HTTP + Socket.IO server running Next.js on port 3000
├── package.json                    # Dependencies, scripts: dev, build, start, test:e2e, seed
├── tsconfig.json                   # TypeScript configuration
├── next.config.mjs                 # Next.js configuration
├── tailwind.config.ts              # Tailwind styling configuration
├── postcss.config.mjs              # PostCSS configuration
├── prisma/
│   ├── schema.prisma               # Complete 16-model relational schema (SQLite compatible)
│   ├── seed.ts                     # High-fidelity realistic seed data generator
│   └── dev.db                      # SQLite local database instance
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Root HTML, Header, Language Switcher, Offline Banner, Toast Container
│   │   ├── page.tsx                # Landing Page & Quick Demo Launchpad
│   │   ├── login/page.tsx          # Multi-role OTP login & demo switcher
│   │   ├── onboarding/page.tsx     # Farmer KYC registration & Gov verification
│   │   ├── farmer/                 # Farmer Mobile-First Portal
│   │   │   ├── dashboard/page.tsx  # Overview, quick stats, active bookings
│   │   │   ├── book/page.tsx       # Centre map, AI recommendation, slot booking & farm visit
│   │   │   ├── queue/[id]/page.tsx # Live queue, ETA ticker, WebSocket sync, reschedule
│   │   │   ├── timeline/[id]/page.tsx # 9-stage procurement lifecycle timeline
│   │   │   └── payments/page.tsx   # Payment tracker & SLA boost request
│   │   ├── operator/               # Operator Portal (Queue scanner, weighing, incidents)
│   │   │   ├── page.tsx            # Queue table, QR check-in scanner, manual entry
│   │   │   ├── weighing/page.tsx   # Weighbridge module & discrepancy alerts
│   │   │   └── incidents/page.tsx  # Incident reporting & capacity controls
│   │   ├── inspector/page.tsx      # Quality Inspector portal & Agmarknet grading form
│   │   ├── admin/                  # Admin Analytics Dashboard
│   │   │   └── page.tsx            # Congestion heatmap, throughput, action cards
│   │   └── api/                    # RESTful Next.js API route handlers
│   ├── components/                 # Reusable UI component library (shadcn/Radix)
│   │   ├── ui/                     # Button, Dialog, Card, Badge, Tabs, Input, Select, etc.
│   │   ├── layout/                 # Navbar, Header, Sidebar, OfflineBanner, LanguageToggle
│   │   ├── farmer/                 # MapView, SlotPicker, QueueCard, QrModal, TimelineStepper
│   │   ├── operator/               # QrScannerModal, WeighingForm, IncidentModal
│   │   ├── inspector/              # QualityForm, GradingBadge
│   │   └── admin/                  # HeatmapGrid, HourlyChart, BottleneckAlert, ActionCard
│   ├── lib/                        # Core application business logic
│   │   ├── db.ts                   # Prisma client singleton
│   │   ├── socket/                 # Socket.IO client and server event helpers
│   │   ├── algorithms/             # Formulas: Processing time, AI scoring, Quality grading, Discrepancy, MSP
│   │   ├── i18n/                   # English and Hindi dictionaries & translation hook
│   │   ├── offline/                # Offline sync hook, localStorage manager, service worker reg
│   │   └── auth/                   # Session cookie / JWT helper & role checker
├── tests/                          # Opaque-box E2E automated test suite
│   ├── m1_foundation.test.ts       # 27 unit tests for algorithms & math models
│   ├── m1_challenger_stress.test.ts# 54 adversarial stress tests
│   └── e2e/
│       ├── runner.ts               # Test suite entry point executing Tiers 1-4 with ANSI summary
│       ├── tiers/
│       │   ├── tier1_features.test.ts   # Tier 1: Feature Coverage (44 test cases)
│       │   ├── tier2_boundaries.test.ts # Tier 2: Boundary & Corner Cases (37 test cases)
│       │   ├── tier3_pairwise.test.ts   # Tier 3: Cross-Feature Interactions (10 test cases)
│       │   └── tier4_workflows.test.ts  # Tier 4: Canonical 5-Min Demo & Persona Workflows (5 test cases)
│       └── helpers/                # API client, Socket.IO client, DB helper, assertion library
├── TEST_INFRA.md                   # E2E Test Suite Architecture & Catalog
├── TEST_READY.md                   # E2E Test Suite Ready Signal
└── README.md                       # Complete documentation with 1-command startup and demo guide
```
