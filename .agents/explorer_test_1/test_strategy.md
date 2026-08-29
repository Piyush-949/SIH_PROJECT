# KRISHI FLOW (SIH 2026 Problem Statement ID: 26032)
# End-to-End (E2E) Testing Strategy, Test Harness Architecture & 5-Tier Test Suite Catalog

---

## 1. Executive Summary & Testing Philosophy

### 1.1 Purpose and Scope
This document specifies the comprehensive End-to-End (E2E) test strategy, opaque-box test harness architecture, and exhaustive 5-tier test catalog for **KRISHI FLOW** — an intelligent agricultural procurement orchestration platform designed for the Smart India Hackathon (SIH 2026 Problem Statement ID: 26032).

The platform eliminates farmer waiting times, mitigates procurement centre congestion, coordinates farm-gate visits for large producers, and guarantees real-time transparency across a 9-stage procurement lifecycle from mobile OTP onboarding to final payment disbursal.

### 1.2 Testing Philosophy & Forensic Rigor
- **Opaque-Box E2E Testing**: Tests treat the platform as a cohesive black-box system through public REST APIs, real-time WebSocket events, and browser DOM interactions.
- **Zero Mock Cheating**: In demo/production-preview modes, all database interactions hit PostgreSQL (via Prisma ORM), live socket connections use Socket.IO, and calculations (processing time, AI scoring, MSP deductions) execute actual backend logic.
- **Deterministic Seeded State**: Every test run starts from a verifiable, seeded state (8–15 procurement centres, 20+ farmers, 4 core crops: Wheat, Paddy/Rice, Maize, Soybean, active incidents, varied payment states).
- **Graceful Failure & Exit Code Contract**: The automated test runner executes all test tiers, provides structured progress and tabular summaries, and returns `exit code 0` on 100% pass or `exit code 1` on any failure.

---

## 2. System Architecture & Test Surface Mapping

### 2.1 Technology Stack & Architectural Surface
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             KRISHI FLOW UI LAYER                            │
│  Next.js 14+ (App Router) | Tailwind CSS | shadcn/ui | Framer Motion | i18n │
│  - Farmer Portal (Mobile-First 320px–768px)                                 │
│  - Operator Portal (Tablet/Desktop 768px–1440px)                            │
│  - Quality Inspector Portal (Tablet/Desktop)                                │
│  - Admin Analytics Dashboard (Desktop 1024px–1440px+)                       │
└───────────────────────┬───────────────────────────────┬─────────────────────┘
                        │ HTTP / REST                   │ WebSockets (Socket.IO)
┌───────────────────────▼───────────────────────────────▼─────────────────────┐
│                          BACKEND & SERVICE LAYER                            │
│  - Route Handlers (/api/auth, /api/farmers, /api/centres, /api/slots, etc.) │
│  - AI Recommendation Engine (Multi-Factor Scoring)                          │
│  - Dynamic ETA & Queue Recalculation Engine                                 │
│  - 9-Stage Procurement Lifecycle Orchestrator                               │
│  - MSP Calculation & Payment Boost Engine                                   │
│  - Notification Dispatcher & Offline Sync Reconciler                        │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Prisma ORM
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                            DATABASE (PostgreSQL)                            │
│  User, FarmerProfile, ProcurementCentre, Crop, CentreCrop, Slot, Booking,   │
│  QueueEntry, ProcurementRecord, QualityInspection, Payment,                 │
│  OperationalIncident, Notification                                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Role-Based Access Control (RBAC) Test Matrix

| Role | Accessible Portals & Routes | Primary Permissions | Protected Actions |
| :--- | :--- | :--- | :--- |
| `FARMER` | `/farmer/*`, `/profile`, `/notifications` | Book slots, view live queue, view timeline, submit boost requests, toggle i18n | Cannot access operator scanning, quality forms, or admin metrics |
| `CENTRE_OPERATOR` | `/operator/*`, `/operator/scanner`, `/operator/weighing` | Check-in via QR/ID, record produce weight, log incidents, manage dock capacity | Cannot inspect quality grade or disburse payments directly |
| `QUALITY_INSPECTOR` | `/inspector/*`, `/inspector/queue`, `/inspector/form` | Inspect produce, record moisture/damage/foreign matter, assign Grade A/B/C | Cannot alter weighing records or manage centre capacity |
| `DISTRICT_ADMIN` | `/admin/*`, `/admin/congestion`, `/admin/heat-map` | View district analytics, monitor bottlenecks, issue centre redirection advisories | Cannot alter farmer KYC or execute quality inspections |
| `STATE_ADMIN` | `/admin/*`, `/admin/state-overview` | View statewide procurement KPIs, cross-district comparisons, policy controls | Read-only access to operational logs; aggregate analytics |
| `SUPER_ADMIN` | `/*` (All routes) | Full system configuration, user role management, global audit logs | Full access across all system entities |

### 2.3 Procurement Lifecycle State Machine (9 Stages)

```
[1. SLOT_BOOKED] ──► [2. CHECKED_IN] ──► [3. IDENTITY_VERIFIED] ──► [4. DOCUMENTS_VERIFIED]
                                                                             │
[8. PAYMENT_PROCESSING] ◄── [7. PROCUREMENT_ACCEPTED] ◄── [6. QUALITY_INSPECTED] ◄── [5. PRODUCE_WEIGHED]
           │
           ▼
[9. PAYMENT_COMPLETED]
```

*Exceptional States*: `CANCELLED`, `NO_SHOW`, `REJECTED_AT_GATE`, `DISCREPANCY_FLAGGED`, `QUALITY_REJECTED`, `REINSPECTION_PENDING`, `PAYMENT_FAILED`, `BOOST_REQUESTED`.

---

## 3. Automated Test Runner Architecture & Harness Specification

### 3.1 Test Directory Structure
```
tests/
├── e2e/
│   ├── runner.ts                     # Master Test Orchestrator & CLI Runner
│   ├── harness/
│   │   ├── api-client.ts             # Typed REST Client with Auth Session Simulation
│   │   ├── socket-client.ts          # Socket.IO Event Listener & Emitter Harness
│   │   ├── seed-loader.ts            # Database State Reset & Seed Verification Helper
│   │   ├── assertion-utils.ts        # Custom Chai/Jest-like Assertions & Matchers
│   │   └── reporter.ts               # Formatted ANSI Terminal & JSON Reporter
│   ├── tier1-feature-coverage/
│   │   ├── r1-auth-kyc.spec.ts
│   │   ├── r2-smart-booking.spec.ts
│   │   ├── r3-virtual-queue.spec.ts
│   │   ├── r4-payment-tracking.spec.ts
│   │   ├── r5-multi-role-portals.spec.ts
│   │   ├── r6-notifications-offline.spec.ts
│   │   └── r7-tech-stack-i18n.spec.ts
│   ├── tier2-boundary-corner/
│   │   ├── boundary-quantities.spec.ts
│   │   ├── boundary-discrepancy.spec.ts
│   │   ├── boundary-grace-period.spec.ts
│   │   ├── boundary-offline-sync.spec.ts
│   │   └── boundary-edge-inputs.spec.ts
│   ├── tier3-cross-feature/
│   │   ├── multi-hop-lifecycle.spec.ts
│   │   ├── incident-reschedule-flow.spec.ts
│   │   └── discrepancy-override-flow.spec.ts
│   ├── tier4-real-world-workflows/
│   │   ├── canonical-5min-demo.spec.ts
│   │   ├── smallholder-wheat-journey.spec.ts
│   │   ├── large-producer-visit.spec.ts
│   │   └── district-crisis-rebalancing.spec.ts
│   └── tier5-adversarial-hardening/
│   │   ├── race-conditions.spec.ts
│   │   ├── state-tampering.spec.ts
│   │   ├── rbac-security.spec.ts
│   │   └── socket-chaos.spec.ts
├── playwright.config.ts              # Browser UI E2E Configuration
└── ui/                               # Playwright UI Test Specs
    ├── demo-flow.spec.ts
    ├── responsive-viewport.spec.ts
    └── i18n-toggle.spec.ts
```

### 3.2 Dual-Execution Mode Strategy

1. **Headless Fast Runner (`npm run test:e2e` or `tsx tests/e2e/runner.ts`)**:
   - Executes all 5 tiers against the live Next.js API + Socket.IO server.
   - Evaluates response payloads, WebSocket broadcasts, DB mutations, mathematical accuracy, state machines, and concurrency invariants in <30 seconds.
   - Outputs structured color-coded suite progress, duration, pass/fail counts, and summary breakdown table.
2. **Browser UI E2E Runner (`npm run test:ui` / `npx playwright test`)**:
   - Uses Chromium headless/headed to validate client DOM rendering, QR code generation, interactive maps, form validation UX, Framer Motion animations, mobile responsive views (320px, 375px, 768px, 1024px, 1440px), and English ↔ Hindi translations.

### 3.3 Test Harness Execution Lifecycle & Seed Management

```typescript
// Lifecycle Hook Flow per Test Suite
1. globalSetup()     -> Verifies PostgreSQL connection, seeds 12 centres, 25 farmers, 4 crops
2. beforeEach()      -> Establishes fresh JWT/session tokens for target test roles
3. executeTest()     -> Drives API endpoints / emits socket events / captures state transitions
4. assertEvents()    -> Awaits expected WebSocket events within 5000ms timeout
5. afterEach()       -> Cleans up transient test records or resets booking status
6. globalTeardown()  -> Outputs final test matrix report and terminates open socket pools
```

---

## 4. Tier 1: Feature Coverage Test Suite (>= 5 Tests per R1–R7)

### Requirement R1: Farmer Authentication & KYC Onboarding

| Test Case ID | Test Name | Preconditions | Test Steps | Expected Output & Verification |
| :--- | :--- | :--- | :--- | :--- |
| `TC-T1-R1-01` | **Farmer Mobile OTP Verification** | Seeded farmer mobile `9876543210` exists in system | 1. `POST /api/auth/send-otp` with `{ mobile: "9876543210" }`<br>2. Receive mock OTP `123456`<br>3. `POST /api/auth/verify-otp` with `{ mobile, otp: "123456" }` | Returns `200 OK`, JWT auth session token, user role `FARMER`, and indicates KYC status (`PENDING` or `COMPLETED`). |
| `TC-T1-R1-02` | **Aadhaar + Kisan ID Verification against Mock Gov DB** | Farmer authenticated, KYC pending | 1. `POST /api/farmers/verify-identity` with valid seeded Aadhaar `1234-5678-9012` and Kisan ID `KID-MH-2026-001`<br>2. Check verification response | Returns `200 OK`, matched name, village, land record acreage, and sets identity status to `VERIFIED`. |
| `TC-T1-R1-03` | **Invalid Aadhaar/Kisan ID Rejection** | Farmer authenticated, KYC pending | 1. `POST /api/farmers/verify-identity` with mismatched Aadhaar `9999-9999-9999` and Kisan ID `INVALID-ID`<br>2. Validate response | Returns `400 Bad Request` or `422 Unprocessable Entity` with error message `"Aadhaar and Kisan ID record not found in National Farmer Registry"`. |
| `TC-T1-R1-04` | **Farmer KYC Profile Completion** | Farmer verified identity | 1. `POST /api/farmers/profile` with `{ bankAccount: "987654321098", ifsc: "SBIN0001234", bankName: "State Bank of India", preferredLanguage: "hi", village: "Pipla", district: "Nagpur", state: "Maharashtra", pin: "440001" }` | Returns `201 Created` / `200 OK`. Profile stored in DB with KYC status `COMPLETED`. |
| `TC-T1-R1-05` | **6-Role Distinct Demo Authentication** | Seeded credentials for all 6 roles | 1. Authenticate credentials for `FARMER`, `CENTRE_OPERATOR`, `QUALITY_INSPECTOR`, `DISTRICT_ADMIN`, `STATE_ADMIN`, `SUPER_ADMIN`<br>2. Inspect token payload | Each role receives valid token with exact claims: role enum matching requirement, assigned centre ID (for operators/inspectors), and access scopes. |
| `TC-T1-R1-06` | **Role-Based Protected Route Guards** | Authenticated as `FARMER` | 1. Attempt `GET /api/admin/analytics/congestion`<br>2. Attempt `POST /api/operator/check-in`<br>3. Attempt `POST /api/inspector/quality-decision` | All requests return `403 Forbidden` with `"Unauthorized role access"`. |

---

### Requirement R2: Smart Procurement Booking System

| Test Case ID | Test Name | Preconditions | Test Steps | Expected Output & Verification |
| :--- | :--- | :--- | :--- | :--- |
| `TC-T1-R2-01` | **Nearby Procurement Centre Discovery on Map** | 10 centres seeded with geo-coordinates | 1. `GET /api/centres?lat=21.1458&lng=79.0882&radiusKm=50`<br>2. Verify returned list | Returns list of centres within 50km radius with distances, current capacity %, status (`GREEN`/`YELLOW`/`RED`/`GREY`), and supported crops. |
| `TC-T1-R2-02` | **AI Multi-Factor Centre Recommendation Engine** | Multiple centres with varying queue lengths and wait times | 1. `POST /api/recommendations/centres` with `{ farmerLat: 21.14, farmerLng: 79.08, cropType: "WHEAT", quantityQtl: 35 }`<br>2. Inspect top recommendation | Returns ranked centres with composite AI score and detailed breakdown (`distanceScore`, `queueScore`, `waitScore`, `capacityScore`, `speedScore`, `historicalDelayScore`) and text explanation `"Why we recommend this"`. |
| `TC-T1-R2-03` | **Dynamic Arrival Window Calculation Formula** | Seeded crop processing parameters | 1. `POST /api/slots/compute-window` with `{ crop: "PADDY", quantityQtl: 50, vehicleType: "TRACTOR_TROLLEY" }`<br>2. Compute expected formula: `Base(15m) + QtyFactor(50*0.5m) + Complexity(10m) + Inspection(10m) + DelayPenalty(0m) = 60 mins` | Response matches calculated duration exactly (±1 min). Returns arrival window start/end times. |
| `TC-T1-R2-04` | **Small Quantity Farmer Direct Slot Booking** | Small quantity (30 Quintals, self-transport) | 1. `POST /api/bookings` with `{ centreId, crop: "WHEAT", quantityQtl: 30, slotTime: "2026-08-27T10:00:00Z", transportMode: "SELF" }` | Returns `201 Created` with unique Booking ID, Queue Token (e.g., `TK-WHT-104`), Scannable QR Code Data URI, and Status `SLOT_BOOKED`. |
| `TC-T1-R2-05` | **Large Quantity Farmer Farm Visit Request Workflow** | Large quantity (180 Quintals > 100Q threshold) | 1. `POST /api/bookings` with `{ centreId, crop: "SOYBEAN", quantityQtl: 180, transportMode: "REQUEST_PICKUP" }` | Booking is created in status `TEAM_VISIT_REQUESTED`. Operator receives notification to schedule on-site verification before slot issuance. |
| `TC-T1-R2-06` | **QR Code Token Generation & Verifiable Payload** | Confirmed booking | 1. Retrieve QR payload string from booking response<br>2. Decode QR data structure | QR contains encrypted/signed JSON: `{ bookingId, farmerId, crop, quantity, tokenNumber, arrivalWindowStart, signature }`. |
| `TC-T1-R2-07` | **Seeded Booking Multi-State Verification** | DB initialized with demo seed | 1. `GET /api/bookings/demo-states`<br>2. Verify state distribution | Confirms at least 3 distinct demo bookings exist: `SLOT_BOOKED`, `CHECKED_IN`, and `PAYMENT_COMPLETED`. |

---

### Requirement R3: Real-Time Virtual Queue & 9-Stage Lifecycle

| Test Case ID | Test Name | Preconditions | Test Steps | Expected Output & Verification |
| :--- | :--- | :--- | :--- | :--- |
| `TC-T1-R3-01` | **Live WebSocket Queue Subscription & Token Position** | Farmer with confirmed booking | 1. Connect WebSocket client to `/socket.io`<br>2. Emit `join-queue` with `{ centreId, bookingId }`<br>3. Receive initial queue state | Returns current position in queue (e.g. `Position 4`), estimated wait time (e.g. `24 mins`), and active dock status. |
| `TC-T1-R3-02` | **Operator Incident Reporting & Dynamic ETA Recalculation** | Active queue with 5 farmers | 1. Operator sends `POST /api/operator/incidents` with `{ centreId, type: "WEIGHING_MACHINE_FAILURE", severity: "HIGH", estimatedDelayMinutes: 25 }`<br>2. Capture WebSocket broadcast on `queue-updated` channel | Within 5.0 seconds, all 5 subscribed farmers receive updated ETAs (+25 mins) and push notification `"Weighing equipment offline at Centre A"`. |
| `TC-T1-R3-03` | **Operator QR Scan Check-In** | Farmer arrives at centre with QR token | 1. Operator `POST /api/operator/check-in` with `{ qrData: "<decoded-token>" }` | Booking transitions `SLOT_BOOKED` ──► `CHECKED_IN`. Queue entry timestamp recorded. WebSocket broadcasts position advancement to subsequent farmers. |
| `TC-T1-R3-04` | **Manual Booking ID Check-In Fallback** | Farmer QR unreadable | 1. Operator `POST /api/operator/check-in-manual` with `{ bookingId: "BK-2026-8891" }` | Successful check-in identical to QR scan. Audit log records actor as operator with manual entry remark. |
| `TC-T1-R3-05` | **9-Stage Procurement Lifecycle Progression** | Checked-in booking | 1. Sequentially trigger: Identity Verification ──► Document Verification ──► Produce Weighing ──► Quality Inspection ──► Procurement Acceptance | Each stage records: `timestamp`, `actorId`, `status: COMPLETED`, and `remarks`. Timeline API returns all 9 stages in chronological order. |
| `TC-T1-R3-06` | **Weighing Module with Discrepancy Alert (>20% difference)** | Produce at weighing station, booked 20Q | 1. Operator enters actual gross weight = 68 Quintals (240% increase)<br>2. `POST /api/operator/weighing` with `{ bookingId, actualQuantityQtl: 68 }` | Response flags `DISCREPANCY_ALERT` (>20%). UI presents operator action buttons: `[Accept With Deviation]`, `[Require Manager Override]`, `[Reject Over-Quota]`. |
| `TC-T1-R3-07` | **Quality Inspection Decisions & Metric Logging** | Produce at inspection dock | 1. Inspector submits `POST /api/inspector/quality-decision` with `{ bookingId, grade: "GRADE_A", moisturePercent: 11.2, foreignMatterPercent: 0.8, damagedGrainPercent: 1.1, decision: "ACCEPTED" }` | Stage transitions to `QUALITY_INSPECTED` / `PROCUREMENT_ACCEPTED`. Metrics saved in `QualityInspection` table. |
| `TC-T1-R3-08` | **Missed Slot Grace Period Expiry to NO_SHOW & Ranked Reschedule** | Booking slot expired + 30m grace period | 1. Trigger background cron/worker `/api/queue/process-grace-periods`<br>2. Farmer checks status<br>3. Farmer requests `GET /api/slots/reschedule-options?bookingId=...` | Booking marked `NO_SHOW`. Reschedule API returns ranked alternative slots sorted by nearest date and lowest congestion. |

---

### Requirement R4: Payment Tracking & Boost Requests

| Test Case ID | Test Name | Preconditions | Test Steps | Expected Output & Verification |
| :--- | :--- | :--- | :--- | :--- |
| `TC-T1-R4-01` | **Procurement Acceptance to MSP Calculation** | Quality accepted for 50 Quintals Wheat | 1. `GET /api/payments/booking/{bookingId}` | Returns: Accepted Qty = `50 Q`, MSP = `₹2,275/Q`, Gross Amount = `₹1,13,750`, Deductions = `₹0`, Payable = `₹1,13,750`, Status = `NOT_INITIATED`. |
| `TC-T1-R4-02` | **Quality Moisture Deduction Calculation** | Quality Grade B with 14.5% moisture (exceeds standard 12% by 2.5%) | 1. Inspect calculated payable amount for 100 Quintals Paddy (MSP ₹2,183/Q) | Gross = `₹2,18,300`. Moisture Deduction (2.5% penalty) = `₹5,457.50`. Final Net Payable = `₹2,12,842.50`. |
| `TC-T1-R4-03` | **4-State Payment Lifecycle Progression** | Payment record created | 1. Advance payment: `NOT_INITIATED` ──► `INITIATED` ──► `PROCESSING` ──► `SUCCESSFUL`<br>2. Provide mock UTR `UTR20260826998811` | Payment tracker shows exact timestamps for each transition, current status `SUCCESSFUL`, and Bank Reference Number `UTR20260826998811`. |
| `TC-T1-R4-04` | **Farmer Payment Boost Request Submission** | Payment in `PROCESSING` state > 48 hours | 1. Farmer `POST /api/payments/boost-request` with `{ bookingId, reason: "Urgent seed purchase for Rabi season" }` | Returns `201 Created`. Boost request status `ACTIVE`. Notification dispatched to District Admin and Centre Operator. |
| `TC-T1-R4-05` | **Operator / Admin View & Expedite Boost Request** | Active boost request | 1. Operator `GET /api/operator/boost-requests`<br>2. Operator clicks `POST /api/operator/boost-requests/{id}/expedite` | Boost priority updated to `EXPEDITED`. SLA deadline updated. Farmer receives notification `"Your payment boost request has been prioritized"`. |
| `TC-T1-R4-06` | **Payment Failed Simulation & Retry Flow** | Payment simulation set to FAIL | 1. `POST /api/payments/simulate-status` with `{ bookingId, status: "FAILED", failureReason: "Beneficiary IFSC Invalid" }` | Status updates to `PAYMENT_FAILED`. Farmer and Operator receive alert with action button `[Update Bank Details]`. |

---

### Requirement R5: Multi-Role Portals & Admin Analytics

| Test Case ID | Test Name | Preconditions | Test Steps | Expected Output & Verification |
| :--- | :--- | :--- | :--- | :--- |
| `TC-T1-R5-01` | **Farmer Portal Dashboard Rendering** | Authenticated as Farmer | 1. `GET /api/farmer/dashboard-summary` | Returns active booking card, QR code, live queue progress, recent payments summary, and unread notification badge count. |
| `TC-T1-R5-02` | **Operator Portal Queue Management & Scanner View** | Authenticated as Operator | 1. `GET /api/operator/active-queue?centreId=C1` | Returns list of checked-in, waiting, and in-progress farmers, current dock utilization, and active incident alerts. |
| `TC-T1-R5-03` | **Quality Inspector Portal Inspection Queue** | Authenticated as Inspector | 1. `GET /api/inspector/pending-inspections?centreId=C1` | Returns list of weighed vehicles awaiting quality grading with crop type, batch ID, and sample ID. |
| `TC-T1-R5-04` | **Admin Dashboard Live KPI Cards** | Authenticated as Admin | 1. `GET /api/admin/kpis` | Returns total procurement metric (e.g. `14,250 Q`), total active bookings, average wait time (`38 mins`), and total disbursed payment (`₹3.24 Cr`). |
| `TC-T1-R5-05` | **Admin Congestion Heat Map Data (GREEN/YELLOW/RED/GREY)** | Seeded 12 centres | 1. `GET /api/admin/congestion-map` | All 12 centres returned with accurate status color: GREEN (<60% capacity), YELLOW (60–85%), RED (>85% bottleneck), GREY (Maintenance/Inactive). |
| `TC-T1-R5-06` | **Admin Decision Support Recommendation Generation** | Centre A at 96% capacity, Centre B at 42% capacity (within 15km) | 1. `GET /api/admin/recommendations` | Returns actionable card: `"ACTION RECOMMENDED: High congestion at Centre A (96%). Redirect 15 upcoming bookings to nearby Centre B (42%)"`, with `[Apply Diversion]` action button. |
| `TC-T1-R5-07` | **Admin Hourly Throughput Charts & Comparison Table** | Historical procurement records seeded | 1. `GET /api/admin/analytics/throughput-hourly?date=today` | Returns 24-hour array of hourly arrivals, processed quintals, and turnaround time per centre. |

---

### Requirement R6: Notification System & Offline Support

| Test Case ID | Test Name | Preconditions | Test Steps | Expected Output & Verification |
| :--- | :--- | :--- | :--- | :--- |
| `TC-T1-R6-01` | **In-App Notification Centre Categorization & Badging** | Farmer with multiple events | 1. `GET /api/notifications` | Returns list with categories: `BOOKING`, `QUEUE`, `INCIDENT`, `PAYMENT`. Unread count badge matches unread items count. |
| `TC-T1-R6-02` | **Mark Notification As Read & Badge Decrement** | 3 unread notifications | 1. `PATCH /api/notifications/{id}/read`<br>2. `GET /api/notifications/unread-count` | Notification marked `isRead: true`. Unread count decrements from 3 to 2. |
| `TC-T1-R6-03` | **Multi-Channel Notification Payload Architecture** | Notification event triggered | 1. Trigger queue delay event<br>2. Inspect DB `Notification` table | Record contains `smsPayload`, `whatsappPayload`, `inAppTitle`, `inAppBody`, and delivery status flags ready for multi-channel dispatch. |
| `TC-T1-R6-04` | **Offline Mode Local Cache Preservation** | Farmer has active booking | 1. Load Farmer Portal in browser<br>2. Set browser network to Offline<br>3. Inspect localStorage / IndexedDB | Booking ID, QR Code Data URI, arrival window, and last synced queue position remain fully readable and interactive. |
| `TC-T1-R6-05` | **Offline Banner & Sync State Status** | Network status toggle | 1. Simulate offline state<br>2. Observe UI banner<br>3. Reconnect network | UI displays `"OFFLINE - Viewing cached data"`. On reconnect, status switches: `OFFLINE` ──► `SYNCING` ──► `ONLINE` (`Last Synced: Just now`). |
| `TC-T1-R6-06` | **Offline Actions Queue & Reconnection Reconciliation** | Offline user action (e.g. dismiss alert) | 1. Perform action offline<br>2. Reconnect online | Actions stored in offline sync queue execute in order upon reconnect; server DB reconciles with zero conflict. |

---

### Requirement R7: Technology Stack, Code Quality & Multilingual

| Test Case ID | Test Name | Preconditions | Test Steps | Expected Output & Verification |
| :--- | :--- | :--- | :--- | :--- |
| `TC-T1-R7-01` | **Single-Command Startup & Web Access Verification** | Clean repo | 1. Inspect `package.json` scripts (`npm run dev`, `npm run build`, `npm run start`)<br>2. Probe `http://localhost:3000` | HTTP 200 OK. Web application opens directly in browser without terminal CLI prompt or command line interaction. |
| `TC-T1-R7-02` | **Prisma Database Schema Integrity & Relational Foreign Keys** | PostgreSQL running | 1. Run Prisma schema validation: `npx prisma validate`<br>2. Inspect models | Confirms all required models: `User`, `FarmerProfile`, `ProcurementCentre`, `Crop`, `CentreCrop`, `Slot`, `Booking`, `QueueEntry`, `ProcurementRecord`, `QualityInspection`, `Payment`, `OperationalIncident`, `Notification` with valid FKs and indexes. |
| `TC-T1-R7-03` | **English ↔ Hindi Multilingual Translation Toggle** | Farmer Portal home & booking | 1. Set language cookie/state to `hi`<br>2. Verify UI text strings | Key labels render in Hindi (e.g., `"मेरी बुकिंग"`, `"निकटतम खरीद केंद्र"`, `"लाइव कतार"`, `"भुगतान स्थिति"`). Toggling back to `en` restores English immediately. |
| `TC-T1-R7-04` | **Mobile-First Responsive Layout (320px–1440px)** | Playwright viewport tests | 1. Test viewports: 320px (iPhone SE), 375px, 768px (iPad), 1024px, 1440px | Zero horizontal overflow, hamburger navigation renders cleanly on mobile, touch targets >= 44px, QR code fits within screen width. |
| `TC-T1-R7-05` | **Zero Build Errors (`npm run build`)** | Application codebase | 1. Execute TypeScript compiler & Next.js production build | `npm run build` exits with code 0. Zero TypeScript typing errors, zero missing import errors. |
| `TC-T1-R7-06` | **Complete README Documentation Verification** | `README.md` in root | 1. Inspect `README.md` contents | Contains single-command setup, demo credentials for all 6 roles, architectural overview, API docs, and browser URL instructions. |

---

## 5. Tier 2: Boundary & Corner Cases Test Suite (>= 5 Tests per R1–R7)

### R1: Auth & KYC Boundaries

| Test Case ID | Test Name | Scenario / Edge Condition | Input Values | Expected Boundary Behavior |
| :--- | :--- | :--- | :--- | :--- |
| `TC-T2-R1-01` | **Invalid Aadhaar Format Edge** | Short/Long/Alphanumeric Aadhaar | `12345` or `1234-5678-901A-999` | Zod validation error: `"Aadhaar must be exactly 12 digits"`. Request rejected before DB query. |
| `TC-T2-R1-02` | **Invalid Mobile Number Length** | 9-digit or 11-digit mobile number | `987654321` (9 digits) | Rejects with `"Mobile number must be a valid 10-digit Indian phone number"`. |
| `TC-T2-R1-03` | **OTP Attempt Rate Limiting & Expiry** | 5 failed OTP attempts or expired OTP (>10m) | 5 wrong OTP inputs `"000000"` | Account temporarily locked for 15 minutes with `"Too many failed attempts. Please request a new OTP after 15 minutes."` |
| `TC-T2-R1-04` | **Duplicate KYC Submission for Already Verified Farmer** | KYC already `COMPLETED` | `POST /api/farmers/verify-identity` re-sent | Returns `409 Conflict` with `"Farmer identity has already been verified and locked"`. |
| `TC-T2-R1-05` | **Invalid Bank IFSC Code Boundary** | Invalid IFSC character structure | `SBIN000` (short) or `1234INVALID` | Zod regex validation failure: `"IFSC must match standard 11-character format (4 letters, 0, 6 alphanumeric)"`. |

---

### R2: Booking & Formula Boundaries

| Test Case ID | Test Name | Scenario / Edge Condition | Input Values | Expected Boundary Behavior |
| :--- | :--- | :--- | :--- | :--- |
| `TC-T2-R2-01` | **Zero Quantity Booking Rejection** | Quantity = `0 Quintals` | `{ crop: "WHEAT", quantityQtl: 0 }` | Validation error `400 Bad Request`: `"Booking quantity must be greater than 0 Quintals"`. |
| `TC-T2-R2-02` | **Extreme Upper Bound Quantity Handling** | Massive quantity (e.g. 5,000 Quintals) | `{ crop: "PADDY", quantityQtl: 5000 }` | Rejects standard slot booking; routes to `"State Commercial Bulk Procurement Desk / PACS Rail Siding Workflow"`. |
| `TC-T2-R2-03` | **Exact Quantity Threshold for Farm Visit (100.0 Q)** | Exactly at boundary (99.9Q vs 100.0Q vs 100.1Q) | `99.9Q` -> Direct Slot<br>`100.0Q` -> Direct Slot<br>`100.1Q` -> Farm Visit | System strictly triggers `TEAM_VISIT_REQUESTED` only when `quantity > 100.0 Q`. |
| `TC-T2-R2-04` | **Zero-Capacity / Saturated Centre Booking Attempt** | Centre at 100% capacity in requested slot | Centre slot has 0 remaining capacity | Returns `409 Conflict`: `"Slot is fully booked"`. System presents 3 nearest alternative available slots. |
| `TC-T2-R2-05` | **Midnight / Daylight Boundary Slot Calculations** | Slot crossing midnight (23:30 to 00:30) | Slot booked across date transition | Arrival window timestamps compute correct date boundary with zero epoch rollover errors. |
| `TC-T2-R2-06` | **Unsupported Crop for Selected Centre** | Centre only handles Wheat; booking Paddy | `{ centreId: "WHEAT_ONLY_C1", crop: "PADDY" }` | Returns `400 Bad Request`: `"Selected procurement centre does not accept PADDY"`. |

---

### R3: Queue & Lifecycle Boundaries

| Test Case ID | Test Name | Scenario / Edge Condition | Input Values | Expected Boundary Behavior |
| :--- | :--- | :--- | :--- | :--- |
| `TC-T2-R3-01` | **Discrepancy Threshold Boundaries (19.9% vs 20.0% vs 20.1%)** | Booked 50Q: Actual 59.95Q (19.9%), 60.0Q (20.0%), 60.05Q (20.1%) | Actual weights tested at boundary | 19.9% and 20.0% proceed without alert; 20.1% triggers `DISCREPANCY_ALERT` popup and locks progression until operator confirmation. |
| `TC-T2-R3-02` | **Exact Grace Period Expiry (29m59s vs 30m00s)** | Grace period configured at 30 minutes | Farmer checks in at +29:50 vs +30:05 | At +29:50 check-in succeeds with `"LATE_ARRIVAL"` tag; at +30:05 system transitions status to `NO_SHOW`. |
| `TC-T2-R3-03` | **Zero Tare Weight Negative Net Produce Weight** | Gross weight entered lower than truck tare weight | Gross: 2000kg, Tare: 2500kg | Rejects input `400 Bad Request`: `"Net crop weight cannot be negative. Please recalibrate weighbridge."` |
| `TC-T2-R3-04` | **Quality Moisture Upper Threshold (Rejection Boundary)** | Moisture exceeds maximum allowable limit (e.g. >18% for Paddy) | Moisture = `19.5%` | Quality form auto-suggests `REJECT` or `RE_DRYING_REQUIRED` with clear warning to inspector. |
| `TC-T2-R3-05` | **Multiple Simultaneous Incident Reports at Single Centre** | Weighing machine offline + Power outage logged simultaneously | 2 concurrent incident reports | Delays stack logically (`DelayPenalty = 25m + 15m = 40m`) without crashing ETA calculation engine. |
| `TC-T2-R3-06` | **Duplicate Check-In Scan Attempt** | Scanning already checked-in QR token | Second scan of same QR token | Returns `409 Conflict`: `"Farmer already checked in at 10:14 AM"`. Prevents duplicate queue tokens. |

---

### R4: Payment & MSP Boundaries

| Test Case ID | Test Name | Scenario / Edge Condition | Input Values | Expected Boundary Behavior |
| :--- | :--- | :--- | :--- | :--- |
| `TC-T2-R4-01` | **Zero Payable Amount for 100% Rejected Produce** | Quality decision `REJECTED` (0Q accepted) | Accepted Quantity = `0 Q` | Payment status set to `NOT_APPLICABLE` / `REJECTED`. Final payable = `₹0.00`. |
| `TC-T2-R4-02` | **Fractional Quintal Precision (e.g. 34.567 Quintals)** | Actual weight with 3 decimal places | `34.567 Q` @ `₹2,275.00/Q` | Math rounds accurately to 2 decimal currency places (`₹78,640.93`) without floating-point drift. |
| `TC-T2-R4-03` | **Duplicate Payment Boost Request Boundary** | Submitting second boost while one is already `ACTIVE` | Resubmitting boost request | Returns `409 Conflict`: `"An active boost request is already pending review"`. |
| `TC-T2-R4-04` | **Boost Request Before SLA Expiry** | Submitting boost within standard 24h SLA window | Payment processing for only 2 hours | Request accepted with informational tag: `"Standard processing SLA is 48 hours. Request logged."` |
| `TC-T2-R4-05` | **Maximum Deduction Exceeding Gross Amount Prevention** | Quality penalties exceeding total crop value | Extreme foreign matter (90%) | System caps total deduction at gross amount; payable never results in a negative debt. |

---

### R5: Admin & Portal Boundaries

| Test Case ID | Test Name | Scenario / Edge Condition | Input Values | Expected Boundary Behavior |
| :--- | :--- | :--- | :--- | :--- |
| `TC-T2-R5-01` | **Admin Map Zero Centres in Filtered Region** | Filter by remote district with 0 centres | District: `"Zero_Procurement_Zone"` | Renders clean empty state: `"No procurement centres registered in this district"`. No map rendering crash. |
| `TC-T2-R5-02` | **Extreme Congestion Peak (150% Overcapacity)** | Centre booked to 150% due to emergency influx | Capacity = `150%` | Centre card flashes pulsing `CRITICAL_RED`; recommendation engine automatically halts new bookings. |
| `TC-T2-R5-03` | **Hourly Throughput with Zero Activity Hours** | Midnight hours (00:00 to 06:00) with 0 arrivals | Hourly array with 0 values | Throughput charts display clean 0 baseline without null-pointer errors. |
| `TC-T2-R5-04` | **Centre Comparison Table Sorting by Dynamic Metrics** | 15 centres sorted by wait time ascending/descending | Click table column headers | Sorts accurately across numeric and text fields with instant UI re-render. |
| `TC-T2-R5-05` | **Operator Scanner Camera Permission Denied Fallback** | Browser blocks camera access | Camera access `DENIED` | UI seamlessly displays manual Booking ID input modal without blocking the operator. |

---

### R6: Notification & Offline Boundaries

| Test Case ID | Test Name | Scenario / Edge Condition | Input Values | Expected Boundary Behavior |
| :--- | :--- | :--- | :--- | :--- |
| `TC-T2-R6-01` | **100+ Backlogged Notifications Pagination & Badging** | Farmer with 150 historical notifications | `GET /api/notifications?page=1&limit=20` | Returns first 20 items with pagination metadata (`totalPages: 8`). Badge shows accurate total unread count. |
| `TC-T2-R6-02` | **Rapid Consecutive Network Offline/Online Flapping** | Toggling connection 10 times in 5 seconds | 10 rapid offline/online state events | Debounces network state transitions; prevents duplicate sync requests; lands on correct final connection state. |
| `TC-T2-R6-03` | **Corrupted Local Storage Cache Recovery** | Local cache contains malformed JSON | `localStorage.setItem('krishi_booking', '{invalid')` | System catches parse error gracefully, falls back to fetching fresh data from server, and repairs cache. |
| `TC-T2-R6-04` | **Offline QR Code Scanner Display with Zero CSS/Network Assets** | Device loads cached PWA offline | Disconnect internet, refresh page | Cached SVG QR code renders crisply with all necessary token metadata visible. |
| `TC-T2-R6-05` | **Special Unicode Characters in Notification Text** | Hindi/Marathi notification strings with emojis | `"⚠️ कतार में देरी: तौल मशीन में तकनीकी समस्या 🚜"` | Notifications render without character encoding glitches (UTF-8 preserved). |

---

### R7: Tech Stack, i18n & Viewport Boundaries

| Test Case ID | Test Name | Scenario / Edge Condition | Input Values | Expected Boundary Behavior |
| :--- | :--- | :--- | :--- | :--- |
| `TC-T2-R7-01` | **Narrow Viewport (320px Width - iPhone SE/5)** | Smallest supported mobile screen | Viewport: `320px x 568px` | No horizontal scrollbars; action buttons wrap cleanly; QR code maintains 200x200px scan box. |
| `TC-T2-R7-02` | **Ultra-Wide Viewport (2560px Width - 4K Monitor)** | Admin dashboard on 4K display | Viewport: `2560px x 1440px` | Layout remains centered or grid scales proportionally without stretched card distortions. |
| `TC-T2-R7-03` | **Missing Hindi i18n Translation Key Fallback** | Key missing in `hi.json` | Request translation key `dashboard.new_feature_title` | Falls back gracefully to English string instead of displaying raw key or `undefined`. |
| `TC-T2-R7-04` | **Database Connection Pool Saturation Recovery** | 50 concurrent DB queries | 50 parallel requests to `/api/centres` | Prisma connection pool handles load; all 50 return 200 OK within 1500ms without connection timeouts. |
| `TC-T2-R7-05` | **High Latency Network Simulation (3000ms Latency)** | Slow 3G mobile network | Network throttle: 3000ms delay | UI displays skeleton loaders; no duplicate form submissions on repeated button clicks (debounced). |

---

## 6. Tier 3: Cross-Feature Combinations & State Machine Interactions

| Test Case ID | Test Name | Involving Modules | Test Flow & Interaction Chain | Verification & Invariant Criteria |
| :--- | :--- | :--- | :--- | :--- |
| `TC-T3-01` | **Full Lifecycle Multi-Hop Progression** | Auth ──► Booking ──► Queue ──► Weighing ──► Quality ──► Payment | 1. Farmer OTP login & KYC verification.<br>2. Discover centre, book slot for 40Q Wheat.<br>3. Arrival & QR Check-in by Operator.<br>4. Identity & Docs approved.<br>5. Weighing recorded (40Q).<br>6. Quality inspected (Grade A).<br>7. Procurement accepted.<br>8. Payment calculated & transitioned to `SUCCESSFUL`. | All 9 lifecycle stages populated in timeline with accurate chronological timestamps and matching actors. Payment matches `40 * 2275 = ₹91,000`. |
| `TC-T3-02` | **Incident Delay ──► Dynamic Recalculation ──► Farmer Reschedule** | Incidents ──► Queue Engine ──► Slot Booking ──► Notifications | 1. 3 farmers in queue.<br>2. Operator logs `MOISTURE_METER_BREAKDOWN` (+45m delay).<br>3. Queue updates ETAs in real-time.<br>4. Farmer 3 cannot wait and clicks `[Reschedule Slot]`.<br>5. Selects next day morning slot.<br>6. Old slot released. | Queue positions for Farmer 4+ move up by 1; Centre capacity for next day decrements; Farmer 3 receives rescheduled confirmation QR. |
| `TC-T3-03` | **Weighing Discrepancy ──► Operator Override ──► Adjusted Payment** | Weighing ──► Operator Portal ──► Quality ──► Payment Engine | 1. Booked: 25Q. Actual Weighed: 55Q (120% discrepancy).<br>2. Weighing alerts discrepancy.<br>3. Operator enters justification `"Farmer brought additional field harvest"` and confirms override.<br>4. Quality Grade A approved.<br>5. Payment generated. | Payment calculated for actual accepted quantity (55Q = `₹1,25,125`) rather than booked 25Q. Audit trail preserves original booking vs actual weight. |
| `TC-T3-04` | **Quality Partial Acceptance ──► Moisture Deduction ──► Net MSP** | Quality Inspector ──► Weighing ──► Payment Engine ──► Farmer UI | 1. 100Q Paddy weighed.<br>2. Inspector records 15% moisture (3% penalty) and 10Q damaged grain.<br>3. Inspector chooses `PARTIAL_ACCEPT` (90Q accepted, 10Q rejected).<br>4. Procurement accepted for 90Q. | Gross = `90 * 2183 = ₹1,96,470`. Moisture deduction applied. Farmer timeline displays both accepted (90Q) and rejected (10Q) quantities clearly. |
| `TC-T3-05` | **Delayed Payment ──► Farmer Boost Request ──► Admin Expedite ──► Disbursal** | Payment Tracker ──► Farmer Portal ──► Admin Dashboard ──► Notification | 1. Payment status stuck in `PROCESSING`.<br>2. Farmer clicks `[Request Payment Boost]` with urgency note.<br>3. Admin views boost queue, clicks `[Approve Expedite]`.<br>4. Payment status shifts to `SUCCESSFUL` with UTR. | Farmer receives real-time push notification; Payment card shows green `SUCCESSFUL` badge with updated timeline. |
| `TC-T3-06` | **Large Quantity Visit Request ──► PACS Inspection ──► Dock Slot Allocation** | Farm Visit Engine ──► Operator Portal ──► Booking Engine ──► Queue | 1. Farmer requests pickup for 200Q Soybean.<br>2. Operator receives visit request, schedules visit date.<br>3. Operator verifies 200Q on-site via mobile tablet.<br>4. System auto-assigns 2 direct dock slots. | Farmer receives notification with dock allocation; bypasses standard general waiting queue upon arrival. |
| `TC-T3-07` | **Grace Period Expiration ──► Auto No-Show ──► Slot Re-Allocation** | Queue Engine ──► Background Worker ──► Booking ──► Admin Analytics | 1. Farmer slot at 09:00 AM; no check-in by 09:31 AM (30m grace).<br>2. Grace period worker marks booking `NO_SHOW`.<br>3. Centre capacity freed.<br>4. Standby farmer automatically assigned slot. | Standby farmer notified of slot confirmation; Admin congestion score dynamically updates downward. |
| `TC-T3-08` | **Admin Centre Redirection ──► Farmer Broadcast ──► One-Click Divert** | Admin Dashboard ──► Recommendation Engine ──► Farmer Portal | 1. Centre A reaches 95% congestion.<br>2. Admin clicks `[Broadcast Diversion to Centre B]`.<br>3. Upcoming booked farmers receive notification with incentive (e.g. priority weighing).<br>4. Farmer clicks `[Accept Divert]`. | Booking centre transferred from Centre A to Centre B with updated QR code and arrival window; Centre A congestion drops. |
| `TC-T3-09` | **Quality Reinspection Request ──► Re-Grade ──► Lifecycle Continuation** | Quality Inspector ──► Farmer Portal ──► Procurement Lifecycle | 1. Initial inspection grades produce as `GRADE_C` (High foreign matter).<br>2. Farmer requests on-spot winnowing and reinspection.<br>3. Inspector marks `REINSPECTION_PENDING`.<br>4. Cleaned produce reinspected and graded `GRADE_B`. | System records re-inspection history; updates procurement record with Grade B; unlocks payment generation. |
| `TC-T3-10` | **Multilingual Switch During Active Queue ──► Offline Simulation ──► Resync** | i18n Engine ──► Live Socket Queue ──► Offline Cache ──► UI State | 1. Farmer watching live queue in English.<br>2. Switches language to Hindi (UI text shifts).<br>3. Internet disconnected (Offline banner shown).<br>4. Operator checks in previous farmer.<br>5. Internet reconnected. | Queue position syncs immediately to new position in Hindi without reload; UI maintains selected language. |

---

## 7. Tier 4: Real-World Workflows & User Journeys

### 7.1 Canonical 5-Minute Demo Flow (`TC-T4-01`)
*Strict verification of the exact 6-step flow defined in `ORIGINAL_REQUEST.md`:*

```
Step 1: Farmer Login (Demo OTP) ──► Profile KYC Completion
Step 2: Smart Centre Recommendation (AI Scoring) ──► Slot Booking ──► QR Token Generation
Step 3: Live Queue Tracking ──► Operator Triggers Weighing Failure ──► Real-Time ETA Shift & Push Alert
Step 4: Operator QR Scan Check-In ──► Weighing Recorded ──► Quality Approved (Grade A)
Step 5: Admin Congestion Heat Map ──► "Redirect to Centre B" Action Card
Step 6: Farmer Payment Tracker ──► Payment Boost Request Submission & Tracking
```

| Step | Action & Endpoint | Actor | Expected UI / System Behavior |
| :--- | :--- | :--- | :--- |
| **1.1** | `POST /api/auth/send-otp` + `verify-otp` (`9876543210`) | Farmer | Logs in instantly; navigates to KYC verification screen. |
| **1.2** | `POST /api/farmers/verify-identity` (Aadhaar + Kisan ID) | Farmer | Verifies against seeded mock government registry; completes profile. |
| **2.1** | `GET /api/recommendations/centres` (`WHEAT`, 35Q) | Farmer | Displays top-recommended centre with AI score (e.g. 94/100) and explanation card. |
| **2.2** | `POST /api/bookings` (Confirm Slot) | Farmer | Generates Booking ID `BK-2026-001`, Token `TK-WHT-042`, Scannable QR Code, Arrival Window. |
| **3.1** | Farmer opens `/farmer/queue` | Farmer | Subscribes to live WebSocket queue; sees `Position: 3`, `ETA: 18 mins`. |
| **3.2** | Operator `POST /api/operator/incidents` (Weighing Machine Breakdown) | Operator | Broadcasts incident event over WebSocket within 2 seconds. |
| **3.3** | Live Queue UI updates dynamically | Farmer | ETA updates from 18 mins to 43 mins (+25m); in-app notification banner pops up. |
| **4.1** | Operator `POST /api/operator/check-in` (Scan QR) | Operator | Farmer checked in; status updates to `CHECKED_IN`. |
| **4.2** | Operator `POST /api/operator/weighing` (35Q recorded) | Operator | Weighing recorded; passes to Quality station. |
| **4.3** | Inspector `POST /api/inspector/quality-decision` (Grade A, 11% moisture) | Inspector | Quality approved; status transitions to `PROCUREMENT_ACCEPTED`. |
| **5.1** | Admin opens `/admin/dashboard` | Admin | Renders congestion heat map with colour-coded centres (GREEN/YELLOW/RED). |
| **5.2** | Admin views Recommendation Panel | Admin | Displays `"ACTION RECOMMENDED: High load at Centre A (92%). Redirect to Centre B (38%)"`. |
| **6.1** | Farmer opens `/farmer/payments` | Farmer | Displays gross ₹79,625, status `PROCESSING`, with payment timeline. |
| **6.2** | Farmer clicks `[Request Boost]` | Farmer | Submits boost request; modal confirms priority dispatch to admin dashboard. |

---

### 7.2 Additional Real-World Persona Journeys

- **TC-T4-02: Smallholder Wheat Farmer On-Time Journey**:
  - Ramesh (2.5 acres, 25 Quintals Wheat) books slot on mobile, receives token, arrives within arrival window, checks in via QR, weighing matches booked quantity exactly, Grade A certified, receives instant payment tracking confirmation.
- **TC-T4-03: Marginal Paddy Farmer with High Moisture & Partial Acceptance**:
  - Suresh brings 60 Quintals Paddy harvested after unseasonal rain. Weighbridge records 60Q. Inspector measures 16% moisture and 5Q damaged grain. System calculates partial acceptance (55Q accepted with 2% moisture deduction, 5Q rejected). Suresh receives transparent breakdown on phone and accepts receipt.
- **TC-T4-04: Large-Scale Soybean Producer On-Site PACS Visit Journey**:
  - Vikram (45 acres, 250 Quintals Soybean) initiates large quantity request. PACS operator receives dispatch task, visits farm with mobile moisture tester, verifies crop volume on-site, issues confirmed bulk slot with dedicated dock gate allocation.
- **TC-T4-05: Multi-Centre Congestion Crisis & Dynamic Traffic Rebalancing**:
  - Major highway blockage causes sudden delay at Centre A. Admin dashboard flags bottleneck (RED 96%), generates auto-diversion recommendations, broadcasts route diversion alerts to 20 approaching farmers, successfully diverting 60% of incoming load to Centre B.

---

## 8. Tier 5: Adversarial Hardening, Security & Race Conditions

### 8.1 Race Condition & Concurrency Hardening

| Test Case ID | Attack / Stress Scenario | Execution Vector | Expected Hardened Behavior |
| :--- | :--- | :--- | :--- |
| `TC-T5-01` | **Concurrent Double-Booking on Last Available Slot Capacity** | 2 farmers concurrently submit `POST /api/bookings` for the same remaining 15Q slot capacity simultaneously | Database transaction uses row-level locking (`SELECT ... FOR UPDATE` or Prisma `$transaction`). Exactly one booking succeeds; the second receives `409 Conflict` with alternative slot suggestion. |
| `TC-T5-02` | **Simultaneous Multi-Operator QR Check-In Scan** | 2 operators scan the same farmer QR code at Gate 1 and Gate 2 within 50ms | Atomic state check ensures only the first scan executes state transition `SLOT_BOOKED` ──► `CHECKED_IN`. Second scan returns `409 Conflict: Already checked in`. |
| `TC-T5-03` | **Concurrent Payment Boost Request Spamming** | Script fires 20 simultaneous `POST /api/payments/boost-request` for the same booking ID | Unique constraint on `(bookingId, status=ACTIVE)` rejects duplicates; exactly 1 active boost request created. |

---

### 8.2 State Machine Tampering & Stage Skipping

| Test Case ID | Attack / Stress Scenario | Execution Vector | Expected Hardened Behavior |
| :--- | :--- | :--- | :--- |
| `TC-T5-04` | **Lifecycle Stage Skipping (e.g. Weighing before Check-In)** | Directly calling `POST /api/operator/weighing` on a booking in `SLOT_BOOKED` state | Fails with `422 Unprocessable Entity`: `"Illegal state transition: Cannot record produce weight before CHECKED_IN stage"`. |
| `TC-T5-05` | **Quality Approval before Weighing Record** | Calling `POST /api/inspector/quality-decision` before `PRODUCE_WEIGHED` stage | Fails with `422 Unprocessable Entity`: `"Cannot inspect produce before gross/tare weight is recorded"`. |
| `TC-T5-06` | **Direct Payment Disbursal on Rejected Quality** | Calling `POST /api/payments/initiate` on a booking with `QUALITY_REJECTED` | Fails with `400 Bad Request`: `"Cannot initiate payment for rejected procurement record"`. |

---

### 8.3 RBAC Privilege Escalation & Route Tampering

| Test Case ID | Attack / Stress Scenario | Execution Vector | Expected Hardened Behavior |
| :--- | :--- | :--- | :--- |
| `TC-T5-07` | **Farmer Impersonating Operator to Record Weighing** | Farmer JWT token sent to `POST /api/operator/weighing` | Gateway route guard blocks request with `403 Forbidden: Insufficient permissions for role FARMER`. |
| `TC-T5-08` | **Quality Inspector Altering Centre Capacity Controls** | Inspector JWT token sent to `PATCH /api/centres/{id}/capacity` | Returns `403 Forbidden`. Only `DISTRICT_ADMIN` and `CENTRE_OPERATOR` have capacity modification privileges. |
| `TC-T5-09` | **Unauthorized User Accessing Another Farmer's Booking** | Farmer A attempts to read `GET /api/bookings/{farmerB_bookingId}` | Returns `403 Forbidden` / `404 Not Found`. User can only query their own records unless possessing `ADMIN` role. |

---

### 8.4 Network Chaos, Socket Disconnections & Resync

| Test Case ID | Attack / Stress Scenario | Execution Vector | Expected Hardened Behavior |
| :--- | :--- | :--- | :--- |
| `TC-T5-10` | **Abrupt WebSocket Disconnection During Queue Position Shift** | Socket connection terminated while server emits 5 position advancements | Client detects socket disconnect, switches to polling fallback, and immediately resynchronizes accurate queue position upon socket reconnect. |
| `TC-T5-11` | **Socket Event Injection with Forged Centre ID** | Malicious client emits `fake-incident-event` directly on WebSocket channel | Socket server validates incoming session authentication and authorization; drops unprivileged event emitters immediately. |
| `TC-T5-12` | **MSP Rate Tampering in Client Payload** | Farmer client modifies `mspRate: 99999` in booking or payment request payload | Backend ignores client-provided rates and strictly calculates totals using verified database MSP rate tables. |

---

## 9. Traceability Matrix: Requirements to Test Catalog

| Requirement ID | Requirement Scope | Tier 1 (Feature) | Tier 2 (Boundary) | Tier 3 (Cross) | Tier 4 (Workflow) | Tier 5 (Adversarial) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **R1** | Farmer Auth, KYC & RBAC | TC-T1-R1-01..06 | TC-T2-R1-01..05 | TC-T3-01 | TC-T4-01 | TC-T5-07, TC-T5-09 |
| **R2** | Smart Booking & AI Scoring | TC-T1-R2-01..07 | TC-T2-R2-01..06 | TC-T3-02, 06 | TC-T4-01, 04 | TC-T5-01 |
| **R3** | Real-Time Queue & 9-Stage | TC-T1-R3-01..08 | TC-T2-R3-01..06 | TC-T3-01..04, 07 | TC-T4-01..03 | TC-T5-02, 04, 05, 10, 11 |
| **R4** | Payment Tracking & Boost | TC-T1-R4-01..06 | TC-T2-R4-01..05 | TC-T3-01, 03..05 | TC-T4-01..03 | TC-T5-03, 06, 12 |
| **R5** | Multi-Role Portals & Admin | TC-T1-R5-01..07 | TC-T2-R5-01..05 | TC-T3-05, 08 | TC-T4-01, 05 | TC-T5-08 |
| **R6** | Notifications & Offline Sync | TC-T1-R6-01..06 | TC-T2-R6-01..05 | TC-T3-02, 08, 10 | TC-T4-01 | TC-T5-10 |
| **R7** | Tech Stack, i18n & Web Portal | TC-T1-R7-01..06 | TC-T2-R7-01..05 | TC-T3-10 | TC-T4-01..05 | TC-T5-01..12 |

---

## 10. Test Automation Execution Harness & Code Blueprints

### 10.1 Master Headless Test Runner Blueprint (`tests/e2e/runner.ts`)
```typescript
/**
 * KRISHI FLOW - Master E2E Test Suite Runner
 * Runs all 5 Tiers and guarantees Exit Code 0 on 100% Pass
 */

import { runTier1FeatureCoverage } from './tier1-feature-coverage';
import { runTier2BoundaryCases } from './tier2-boundary-corner';
import { runTier3CrossFeature } from './tier3-cross-feature';
import { runTier4RealWorldWorkflows } from './tier4-real-world-workflows';
import { runTier5AdversarialHardening } from './tier5-adversarial-hardening';
import { printSummaryTable, SuiteReport } from './harness/reporter';

async function main() {
  console.log("\n=======================================================");
  console.log("  🌾 KRISHI FLOW - OPAQUE-BOX E2E TEST SUITE RUNNER  ");
  console.log("  Problem Statement ID: 26032 | Smart India Hackathon ");
  console.log("=======================================================\n");

  const startTime = Date.now();
  const reports: SuiteReport[] = [];

  try {
    reports.push(await runTier1FeatureCoverage());
    reports.push(await runTier2BoundaryCases());
    reports.push(await runTier3CrossFeature());
    reports.push(await runTier4RealWorldWorkflows());
    reports.push(await runTier5AdversarialHardening());

    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
    const hasFailures = reports.some(r => r.failed > 0);

    printSummaryTable(reports, totalDuration);

    if (hasFailures) {
      console.error("\n❌ E2E TEST SUITE FAILED. See details above.\n");
      process.exit(1);
    } else {
      console.log("\n✅ ALL 5 TIERS PASSED PERFECTLY (100% Pass Rate). Exit Code: 0\n");
      process.exit(0);
    }
  } catch (err) {
    console.error("\n💥 FATAL TEST RUNNER EXCEPTION:", err);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
```

### 10.2 Real-Time WebSocket Assertion Helper Blueprint
```typescript
/**
 * WebSocket Test Helper for Live Queue & Incident Verification
 */
import { io, Socket } from "socket.io-client";

export class SocketTestHarness {
  private socket: Socket | null = null;

  async connect(url: string, token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(url, {
        auth: { token },
        transports: ['websocket'],
        reconnection: false
      });
      this.socket.on('connect', () => resolve());
      this.socket.on('connect_error', (err) => reject(err));
    });
  }

  async waitForEvent<T>(eventName: string, timeoutMs: number = 5000): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.socket) return reject(new Error("Socket not connected"));
      
      const timer = setTimeout(() => {
        reject(new Error(`Timed out waiting for socket event: ${eventName} (${timeoutMs}ms)`));
      }, timeoutMs);

      this.socket.once(eventName, (data: T) => {
        clearTimeout(timer);
        resolve(data);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}
```

### 10.3 Playwright UI E2E Configuration Blueprint (`playwright.config.ts`)
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/ui',
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    video: 'off',
  },
  projects: [
    {
      name: 'Mobile Chrome (Farmer)',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Desktop Chrome (Operator/Admin)',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 60000,
  },
});
```

---

## 11. Verification Checklist & Success Criteria

- [x] **Tier 1 Feature Coverage**: Full coverage across all requirements R1 to R7 (>= 5 test cases per requirement, 43 total Tier 1 cases).
- [x] **Tier 2 Boundary & Corner Cases**: Exhaustive coverage across edge cases, 0 quantities, extreme limits, exact discrepancy thresholds (19.9% vs 20.0% vs 20.1%), expired grace periods, offline sync flapping (38 total Tier 2 cases).
- [x] **Tier 3 Cross-Feature Combinations**: Pairwise and complex multi-hop state machine interactions (10 comprehensive interaction flows).
- [x] **Tier 4 Real-World Workflows**: Canonical 5-Minute Demo Flow precisely specified + 4 realistic farmer & admin persona journeys.
- [x] **Tier 5 Adversarial Hardening**: White-box race conditions, state machine tampering, RBAC privilege escalation bypass tests, and socket network chaos.
- [x] **Automated Test Runner Architecture**: Headless Node/TS CLI runner + Playwright UI test runner, structured tabular reporting, and standard exit code 0 contract.
