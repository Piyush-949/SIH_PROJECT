# E2E Test Infra: KRISHI FLOW
**SIH 2026 Problem Statement ID**: 26032  
**Platform**: Intelligent Agricultural Procurement Platform  
**Test Philosophy**: Opaque-box, requirement-driven, deterministic execution against REST API, Socket.IO real-time events, and Web Browser UI.

---

## Feature Inventory & Test Coverage Matrix
| # | Feature | Requirement | Tier 1 (Coverage) | Tier 2 (Boundaries) | Tier 3 (Pairwise) | Tier 4 (Real-World) | Tier 5 (Adversarial) |
|---|---------|-------------|:-----------------:|:-------------------:|:-----------------:|:-------------------:|:--------------------:|
| F01 | Unified Web Server & Zero-CLI | R7, AC-11, AC-12 | 5 | 5 | ✓ | ✓ | ✓ |
| F02 | Normalized Data Schema & Seeding | R7, Spec §6 | 6 | 5 | ✓ | ✓ | ✓ |
| F03 | Mock Government Registry | R1, AC-02 | 5 | 5 | ✓ | ✓ | ✓ |
| F04 | Mobile OTP Auth & Sessions | R1, AC-01 | 5 | 5 | ✓ | ✓ | ✓ |
| F05 | Farmer KYC Onboarding | R1, AC-01 | 5 | 5 | ✓ | ✓ | ✓ |
| F06 | RBAC Middleware & 6 Roles | R1, AC-03 | 6 | 5 | ✓ | ✓ | ✓ |
| F07 | Centre Discovery & Map | R2, R5, AC-13 | 5 | 5 | ✓ | ✓ | ✓ |
| F08 | AI Centre Recommendation (8 Factors)| R2, AC-05 | 5 | 5 | ✓ | ✓ | ✓ |
| F09 | Dynamic Arrival Slot Processing | R2, AC-07 | 5 | 5 | ✓ | ✓ | ✓ |
| F10 | QR Code Token Generation | R2, AC-07 | 5 | 5 | ✓ | ✓ | ✓ |
| F11 | Large Farmer Farm Visit Workflow | R2, AC-06 | 5 | 5 | ✓ | ✓ | ✓ |
| F12 | Live Virtual Queue & Socket.IO | R3, AC-08 | 5 | 5 | ✓ | ✓ | ✓ |
| F13 | Incidents & Sub-5s ETA Recalculation | R3, AC-08, AC-09 | 5 | 5 | ✓ | ✓ | ✓ |
| F14 | Auto No-Show & Slot Reschedule | R3, AC-10 | 5 | 5 | ✓ | ✓ | ✓ |
| F15 | 9-Stage Procurement Lifecycle | R3, AC-11 | 6 | 5 | ✓ | ✓ | ✓ |
| F16 | Weighing & Discrepancy (>20%) Alert | R3, AC-12 | 5 | 5 | ✓ | ✓ | ✓ |
| F17 | Quality Inspection & Agmarknet Grading| R3, AC-13 | 5 | 5 | ✓ | ✓ | ✓ |
| F18 | MSP & Deductions Calculation | R4, AC-14 | 5 | 5 | ✓ | ✓ | ✓ |
| F19 | 4-Stage Payment State Machine | R4, AC-14 | 5 | 5 | ✓ | ✓ | ✓ |
| F20 | Payment Boost Request & Resolution | R4, AC-15 | 5 | 5 | ✓ | ✓ | ✓ |
| F21 | Multi-Role Portals (Farmer/Op/Insp) | R5, AC-16, AC-18 | 6 | 5 | ✓ | ✓ | ✓ |
| F22 | Admin Heatmap & Bottleneck Action Cards| R5, AC-16, AC-17 | 5 | 5 | ✓ | ✓ | ✓ |
| F23 | In-App Notification System | R6, AC-19 | 5 | 5 | ✓ | ✓ | ✓ |
| F24 | Bilingual Toggle (EN + HI) | R7, AC-21 | 5 | 5 | ✓ | ✓ | ✓ |
| F25 | Offline Caching & Sync Banner | R6, AC-20 | 5 | 5 | ✓ | ✓ | ✓ |

---

## Test Architecture
- **Test Runner Location**: `tests/e2e/runner.ts`
- **Execution Script**: `npm run test:e2e`
- **Pass/Fail Semantics**: Deterministic exit code (0 for PASS, non-zero for FAIL).
- **Execution Format**: Structured ANSI summary table reporting Tier 1 to Tier 5 execution results, duration, test counts, and error diagnostics.

---

## Test Tiers Overview
- **Tier 1 - Feature Coverage ($\ge 5$ per requirement)**: 43 test cases verifying all standalone features in happy-path isolation.
- **Tier 2 - Boundary & Corner Cases ($\ge 5$ per requirement)**: 38 test cases covering $0\text{Q}$ quantity, $5000\text{Q}$ bulk, $19.9\%$ vs $20.0\%$ vs $20.1\%$ discrepancy thresholds, $30\text{min}$ grace period boundary, network disconnect simulation, and $320\text{px}$ viewports.
- **Tier 3 - Cross-Feature Pairwise Interactions**: 10 multi-hop end-to-end integration flows (Auth ➔ Booking ➔ Incident ➔ Reschedule ➔ Weighing ➔ Quality ➔ Deductions ➔ Payment Boost).
- **Tier 4 - Real-World Application Workflows**: 5 comprehensive scenarios including the canonical 5-minute SIH Demo Flow.
- **Tier 5 - White-Box Adversarial Hardening**: 12 attack scenarios (Race condition double booking, QR check-in replay, skip stage tampering, privilege escalation, socket disconnect recovery).

---

## Total Test Suite Count: >100 Test Cases
Target: 100% Pass Rate across Tiers 1-5 prior to final victory attestation.
