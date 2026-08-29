# KRISHI FLOW — E2E Test Suite Ready Specification
**SIH 2026 Problem Statement ID**: 26032  
**Platform**: Intelligent Agricultural Procurement Web Platform  
**Target Environment**: `http://localhost:3000` (Zero-CLI Web Execution)  
**Status**: **READY FOR EXECUTION**

---

## 1. Overview & Test Suite Architecture

The End-to-End (E2E) opaque-box test suite for **KRISHI FLOW** is fully implemented and cataloged under `tests/e2e/`. It exercises the platform across REST APIs, real-time WebSocket events (Socket.IO), state machine transitions, mathematical formulas, and responsive browser contracts.

```
tests/e2e/
├── runner.ts                       # Master CLI Runner (ANSI Tables, Tier filters, Exit codes)
├── helpers/
│   ├── types.ts                    # DTOs, Enums, Contracts, and Suite Report Interfaces
│   ├── assertions.ts               # Custom Assertion Library with Detailed Diff Messages
│   ├── apiClient.ts                # Opaque REST Client with Auth Session & Contract Engine
│   ├── socketClient.ts             # Socket.IO Event Listener, Broadcaster, and Timeout Harness
│   ├── dbHelper.ts                 # Database & Seed State Relational Integrity Verifier
│   └── reporter.ts                 # Formatted Box-Drawing ANSI Summary Table Reporter
└── tiers/
    ├── tier1_features.test.ts      # Tier 1: Feature Coverage (44 Test Cases)
    ├── tier2_boundaries.test.ts    # Tier 2: Boundary & Corner Cases (37 Test Cases)
    ├── tier3_pairwise.test.ts      # Tier 3: Cross-Feature Interactions (10 Test Cases)
    └── tier4_workflows.test.ts     # Tier 4: Canonical 5-Min Demo & Real-World Flows (5 Test Cases)
```

---

## 2. Test Catalog & Tier Breakdown

| Tier | Category | Scope & Requirements Covered | Test Count | Target Pass Rate |
| :--- | :--- | :--- | :---: | :---: |
| **Tier 1** | **Feature Coverage** | Happy paths for R1 to R7 (Auth, KYC, AI Booking, Farm Visit, Live Queue, Sub-5s ETA Recalculation, 9-Stage Lifecycle, Weighing Discrepancy, Quality Grading, MSP Payments, Boost SLA, Heatmap, Multilingual, Offline) | **44** | **100%** |
| **Tier 2** | **Boundary & Corner Cases** | Edge conditions (0Q quantity, 5000Q bulk, 19.9% vs 20.0% vs 20.1% discrepancy, 30m grace period expiry, negative net weight, offline network drop, narrow 320px viewport) | **37** | **100%** |
| **Tier 3** | **Cross-Feature Interactions** | Multi-hop workflows (Auth ➔ Booking ➔ Incidents ➔ Reschedule ➔ Weighing ➔ Quality ➔ Deductions ➔ Payment Boost) | **10** | **100%** |
| **Tier 4** | **Real-World Workflows** | Canonical 5-Minute SIH Demo Flow + 4 Persona Journeys (Smallholder, Marginal Paddy, Large Soybean PACS, Traffic Rebalance) | **5** | **100%** |
| **TOTAL** | **Comprehensive Suite** | **Total Automated Test Cases** | **96** | **100%** |

---

## 3. How to Run the Tests

### Execute Entire Test Suite (Tiers 1–4)
```bash
npx tsx tests/e2e/runner.ts
# or via npm script
npm run test:e2e
```

### Execute Specific Tiers
```bash
# Tier 1: Feature Coverage Only (44 tests)
npx tsx tests/e2e/runner.ts --tier=1

# Tier 2: Boundary & Corner Cases (37 tests)
npx tsx tests/e2e/runner.ts --tier=2

# Tier 3: Cross-Feature Interactions (10 tests)
npx tsx tests/e2e/runner.ts --tier=3

# Tier 4: Real-World Workflows (5 tests)
npx tsx tests/e2e/runner.ts --tier=4
```

### Filter by Specific Test ID or Name
```bash
# Run specific test case (e.g. Canonical Demo Flow)
npx tsx tests/e2e/runner.ts --filter=TC-T4-01

# Filter by Requirement (e.g. R1 Auth & KYC)
npx tsx tests/e2e/runner.ts --filter=R1
```

---

## 4. Key Verification Scenarios

1. **Canonical 5-Minute SIH Demo Flow (`TC-T4-01`)**:
   - Farmer OTP Auth (`9876543210`) ➔ Seeded Aadhaar/Kisan ID KYC Validation
   - AI Centre Recommendation (8-factor score >=80) ➔ Dynamic Slot Booking ➔ Scannable QR Token
   - Live Virtual Queue (`join_centre_queue`) ➔ Operator Incident Report (`WEIGHING_MACHINE_FAILURE`) ➔ Sub-5s Dynamic ETA Recalculation (+25 mins) & Push Notification
   - Operator QR Scan Check-in ➔ Weighbridge Recording (35Q) ➔ Quality Agmarknet Inspection (Grade A, 11.2% moisture) ➔ `PROCUREMENT_ACCEPTED`
   - Admin Congestion Heat Map (GREEN/YELLOW/RED/GREY) ➔ "Redirect to Centre B" Decision Card
   - Farmer Payment Tracker (₹79,625 Gross) ➔ Payment Boost Request ➔ Admin Expedite Action

2. **Boundary Precision (`Tier 2`)**:
   - Discrepancy threshold: 19.9% (no alert) vs 20.1% (`DISCREPANCY_ALERT` triggered).
   - Farm visit threshold: 99.9Q (direct slot) vs 100.1Q (`TEAM_VISIT_REQUESTED`).
   - Grace period: 30 minutes expiration transitions booking to `NO_SHOW`.

3. **Multi-Hop Resiliency (`Tier 3`)**:
   - 9-Stage lifecycle chronological integrity.
   - Quality reinspection loop (Grade C ➔ winnowing ➔ Grade B ➔ payment).
   - Bilingual language toggle (EN ↔ HI) during active queue with offline drop and resync.

---

## 5. Exit Code Semantics

- **`0`**: 100% of executed test cases passed successfully.
- **`1`**: One or more test assertions failed, or fatal runtime exception occurred.
