# KRISHI FLOW (SIH 2026 — Problem Statement ID: 26032)
# Comprehensive Specification & Requirements Mining Document

**Author**: Specification Miner (`spec_miner_survey_1`)  
**Date**: 2026-08-26  
**Source of Truth**: `ORIGINAL_REQUEST.md`  
**Application Type**: Browser-Accessible Full-Stack Web Portal (Zero-CLI runtime interaction)  
**Target Platform**: Web Browsers (Mobile 320px to Desktop 1440px+ Responsive)  
**Integrity Mode**: Polished Demo Prototype with seeded mock databases & real-time capabilities  

---

## Table of Contents
1. [Executive Summary & Problem Statement](#1-executive-summary--problem-statement)
2. [Functional Requirements (R1 – R7)](#2-functional-requirements-r1--r7)
3. [Acceptance Criteria & Verification Traceability Matrix](#3-acceptance-criteria--verification-traceability-matrix)
4. [Features Discovered Table](#4-features-discovered-table)
5. [Edge Cases & Error Handling Specifications](#5-edge-cases--error-handling-specifications)
6. [Complete Relational Data Schema & Entity Specifications](#6-complete-relational-data-schema--entity-specifications)
7. [Mathematical, Algorithmic & Decision Models](#7-mathematical-algorithmic--decision-models)
   - 7.1 Estimated Processing Time Formula
   - 7.2 AI Centre Recommendation Multi-Factor Scoring Engine & Explainability
   - 7.3 Weighing Discrepancy Alert & Operator Resolution Logic
   - 7.4 Quality Inspection & Grading Decision Matrix
   - 7.5 Payment State Machine, Payout Calculation & SLA Boost Logic
8. [User Workflows across All 6 System Roles](#8-user-workflows-across-all-6-system-roles)
9. [Small vs. Large Quantity Farmer Bifurcation Architecture](#9-small-vs-large-quantity-farmer-bifurcation-architecture)
10. [Real-Time WebSocket & Incident Recalculation Engine](#10-real-time-websocket--incident-recalculation-engine)
11. [Offline Resilience, Caching & Network Status Subsystem](#11-offline-resilience-caching--network-status-subsystem)
12. [Multilingual & Internationalization (i18n) Architecture](#12-multilingual--internationalization-i18n-architecture)
13. [Demo Flow Step-by-Step Verification Protocol (< 5 Minutes)](#13-demo-flow-step-by-step-verification-protocol--5-minutes)

---

## 1. Executive Summary & Problem Statement

### 1.1 Problem Context (SIH 2026: Problem Statement ID 26032)
Agricultural procurement centres (Mandis / PACS / Government Procurement Centres) across India suffer from severe operational bottlenecks during harvesting seasons:
- Unpredictable queues resulting in multi-day waiting periods for farmers in extreme conditions.
- Asymmetric information regarding centre capacity, causing extreme congestion at certain centres while neighboring centres remain underutilized.
- Manual and opaque weighing, inspection, and payment tracking, creating distrust and payment realization delays.
- Lack of dynamic rescheduling when physical disruptions occur (e.g., weighing scale breakdown, moisture meter failure, power cut, sudden weather changes).

### 1.2 The KRISHI FLOW Solution
**KRISHI FLOW** is an intelligent, full-stack, cloud-based agricultural procurement orchestration platform that:
1. Provides **Smart Procurement Booking** with AI-driven centre recommendations and dynamic arrival slots.
2. Manages a **Live Virtual Queue Engine** that dynamically recalculates arrival windows and wait times upon equipment failure or staff shortages.
3. Tracks the full **9-Stage Procurement Lifecycle** with tamper-evident audit trails.
4. Provides transparent **MSP Payment Calculations**, real-time status tracking, and SLA-based **Payment Boost Requests**.
5. Delivers dedicated portals tailored to **6 distinct roles** (Farmer, Centre Operator, Quality Inspector, District Admin, State Admin, Super Admin).
6. Operates seamlessly as a **mobile-first browser web app** with English and Hindi support and offline caching.

---

## 2. Functional Requirements (R1 – R7)

### R1. Farmer Authentication & KYC Onboarding
- **Authentication Flow**:
  - Mock Mobile OTP login (OTP entry simulated with realistic validation).
  - Profile Creation & Completion: Full Name, Aadhaar Number (12 digits), Kisan ID / PM-KISAN ID, Village, District, State, PIN Code, Preferred Language (English/Hindi), Bank Account Details (Bank Name, Account Number, IFSC Code).
  - Government Database Cross-Verification: System cross-checks Aadhaar + Kisan ID combination against a seeded mock government registry. Rejects mismatched, fraudulent, or unverified records with actionable feedback.
  - Role-Based Access Control (RBAC): 6 roles (`FARMER`, `CENTRE_OPERATOR`, `QUALITY_INSPECTOR`, `DISTRICT_ADMIN`, `STATE_ADMIN`, `SUPER_ADMIN`) with route protection, session storage/cookies, and role-appropriate redirection.

### R2. Smart Procurement Booking System
- **Discovery & AI Recommendation**:
  - Interactive map and list view of procurement centres in the farmer's district/state.
  - Multi-factor AI Centre Recommendation engine (weighted score across $\ge 5$ factors: Distance, Queue Length, Wait Time, Capacity Congestion, Processing Speed, Crop Availability, Equipment Status, Historical Delay Rate).
  - "Why we recommend this" natural language explainability block.
- **Dynamic Slot Generation**:
  - Input parameters: Crop Type (Wheat, Rice/Paddy, Maize, Soybean), Estimated Quantity (in Quintals), Vehicle Type (Tractor-Trolley, Truck, Mini Truck, Bullock Cart, Auto/Pickup).
  - Algorithmic Arrival Window computation based on the complete processing time formula.
  - Output Deliverables: Booking ID, Queue Token (e.g., `TK-WHT-042`), Scannable QR Code Token, Arrival Window (Start Time – End Time), and Estimated Completion Time.
- **Farmer Bifurcation Handling**:
  - **Small Quantity Farmer ($\le 50$ Q / Self-Transport)**: Direct nearest slot allocation, scannable QR pass, self-check-in enabled.
  - **Large Quantity Farmer ($> 50$ Q / PACS Farm Visit)**: Triggers "PACS Team Visit Request" workflow; operator schedules farm inspection, verifies on-field quantity, and assigns a multi-lot procurement slot.

### R3. Real-Time Virtual Queue & Procurement Lifecycle
- **Virtual Queue Engine (Socket.IO / Real-Time)**:
  - Live queue state: Token Position, Estimated Wait Time, Current Serving Token, Status (Waiting, Called, In Progress, Completed, Delayed, No-Show).
  - Resilient event handling: Farmer check-in, late arrival grace period (15 mins), automatic no-show transition, reschedule assistance with ranked alternate slots.
  - Dynamic Disruption Recalculation: When an operator logs an operational incident (e.g., "Weighing Machine Failure" with $+30$ min impact), the queue engine recalculates all downstream ETAs within $\le 5$ seconds and broadcasts instant push notifications to affected farmers.
- **Full 9-Stage Procurement Lifecycle**:
  ```
  [1. SLOT BOOKED] ➔ [2. CHECKED IN] ➔ [3. IDENTITY VERIFIED] ➔ [4. DOCUMENTS VERIFIED] ➔
  [5. PRODUCE WEIGHED] ➔ [6. QUALITY INSPECTED] ➔ [7. PROCUREMENT ACCEPTED] ➔ 
  [8. PAYMENT PROCESSING] ➔ [9. PAYMENT COMPLETED]
  ```
  - Every stage records exact timestamp, actor ID, status code, and operator notes.
- **Weighing & Discrepancy Module**:
  - Gross Weight, Tare Weight, Net Weight calculation in Kg and Quintals.
  - Automated Discrepancy Detection: Flags discrepancies where $|\text{Actual} - \text{Booked}| / \text{Booked} > 20\%$.
  - Requires operator acknowledgement, supervisor reason selection, or quota re-allocation before proceeding.
- **Quality Inspection Module**:
  - Form capturing: Moisture %, Foreign Material %, Damaged/Discolored Grain %.
  - Automated Grade Assignment: Grade A, Grade B, Grade C, or Rejected.
  - Decision Logic: Accept (Full MSP), Partial Accept (with quality cut deduction), Reject (formal rejection slip with reasons), Reinspect (after aeration/drying).

### R4. Payment Tracking & Boost Requests
- **MSP Settlement Computation**:
  - Gross Amount = $\text{Accepted Quantity (Q)} \times \text{Crop MSP (₹/Q)}$.
  - Deductions = Moisture Cut + Foreign Matter Cut + Handling Charges (if applicable).
  - Net Payable Amount = $\text{Gross Amount} - \text{Deductions}$.
- **Payment Lifecycle States**:
  - `NOT_INITIATED` ➔ `INITIATED` ➔ `PROCESSING` ➔ `SUCCESSFUL` (or `FAILED` with retry).
  - Displays Bank Name, Masked Account Number (`XXXX-XXXX-1234`), IFSC, and simulated NEFT/PFMS Transaction Reference.
- **SLA & Payment Boost Request**:
  - Default SLA: 48 hours post-procurement acceptance.
  - If payment is pending past SLA, farmer can trigger "Payment Boost Request" with reason.
  - Boost alerts District Admin and Centre Operator dashboard with HIGH PRIORITY badge.

### R5. Multi-Role Portals & Admin Analytics
- **Farmer Portal (Mobile-First)**:
  - Dashboard with active bookings, live queue card, QR token viewer, 9-stage timeline, payment tracker, notification centre, language switcher.
- **Operator Portal (Tablet/Desktop)**:
  - Daily queue controller, simulated QR camera scanner / manual Booking ID input, 1-click check-in, weighing station data entry with discrepancy alerts, operational incident reporter (toggle breakdowns), capacity adjustments.
- **Quality Inspector Portal**:
  - Dedicated inspection queue, digital quality testing form with real-time grade compute, decision submission (Accept/Partial/Reject/Reinspect), inspection history.
- **District / State Admin Dashboard (Desktop)**:
  - Real-time KPI summary (Total Farmers Served, Total Tonnage Procured, Payout Disbursed, Average Wait Time).
  - Congestion Heat Map: Colour-coded procurement centres:
    - 🟢 **GREEN**: $< 60\%$ capacity utilization, wait time $< 30$ mins.
    - 🟡 **YELLOW**: $60\% - 85\%$ capacity utilization, wait time $30 - 60$ mins.
    - 🔴 **RED**: $> 85\%$ capacity utilization or active critical disruption.
    - ⚪ **GREY**: Inactive or Maintenance status.
  - Decision-Support System: "ACTION RECOMMENDED" cards (e.g., "Redirect 25% traffic from Centre Alpha (94% congestion) to Centre Beta (38% congestion, 6.2 km away)").
  - Centre-by-centre comparative throughput and bottleneck analytics.
- **Super Admin Portal**:
  - Master configuration for Crops, MSP rates, standard quality tolerance thresholds, user permissions, audit logs.

### R6. Notification System & Offline Support
- **In-App Notification Centre**:
  - Unread count badge, category filters (`BOOKING`, `QUEUE`, `INCIDENT`, `PROCUREMENT`, `PAYMENT`, `SYSTEM`).
  - Bilingual notification templates (English + Hindi).
  - Real-time toast alerts on WebSocket events.
- **Offline Capability & Network Status**:
  - LocalStorage / IndexedDB caching of active booking, QR code image/data, last queue position, and profile.
  - Visual Network Status Indicator: `ONLINE` (Green), `SYNCING` (Blue), `OFFLINE` (Amber), `LAST SYNCED: [Time]`.
  - Offline banner preventing invalid submissions while keeping crucial pass information accessible.

### R7. Technology Stack & Code Quality
- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui component library, Lucide React icons, Framer Motion animations, React Hook Form + Zod schema validation, TanStack Query for server state.
- **Backend / API**: Next.js API Routes / Route Handlers, TypeScript, Service Layer Architecture.
- **Database / ORM**: PostgreSQL with Prisma ORM (with SQLite / LibSQL fallback capability for instant zero-config demo execution), fully normalized schema across 13 tables with constraints, indexes, and audit timestamps (`createdAt`, `updatedAt`).
- **Real-Time Layer**: Socket.IO / Server-Sent Events / Polling Fallback ensuring live queue updates within $\le 5$ seconds.
- **Internationalization (i18n)**: English (`en`) and Hindi (`hi`) with dictionary-based i18n provider.
- **Deployment & Accessibility**: Pure browser execution on `http://localhost:3000` via `npm run dev`. Zero CLI input required from the user during evaluation.

---

## 3. Acceptance Criteria & Verification Traceability Matrix

| AC # | Acceptance Criterion | Source Spec | Expected Observable Behavior | Verification Method |
|------|----------------------|-------------|------------------------------|---------------------|
| **AC-01** | Farmer Registration & OTP Login | R1 | User enters phone $\to$ OTP $\to$ completes profile with Aadhaar & Kisan ID $\to$ redirected to farmer dashboard. | Test login flow with demo phone & OTP. |
| **AC-02** | Aadhaar + Kisan ID Validation | R1 | Mismatched or invalid combinations are rejected with an explicit error alert. | Submit invalid Aadhaar/Kisan ID pair and verify error message. |
| **AC-03** | 6 Role Route Guards & Demo Logins | R1, R5 | All 6 roles have distinct seeded credentials and cannot access unauthorized role routes. | Log in with each role; verify route permissions and UI. |
| **AC-04** | AI Centre Recommendation Engine | R2 | Shows ranked centres with score based on $\ge 5$ factors and "Why we recommend this" explanation. | View centre booking screen; inspect recommendation card. |
| **AC-05** | Large Quantity Farmer Bifurcation | R2 | Entering quantity $>50$ Q or choosing PACS Visit opens Team Visit Request workflow instead of slot booking. | Enter quantity = 80 Q; verify PACS visit form opens. |
| **AC-06** | Dynamic Slot Booking & QR Token | R2 | Booking computes arrival window using formula; generates scannable QR token and Booking ID. | Book a slot; verify QR display and arrival window times. |
| **AC-07** | Seeded Booking States | R2, R7 | Seeded data contains at least 3 active bookings in different lifecycle states. | Check dashboard and database for varied booking statuses. |
| **AC-08** | Live Queue Engine & ETA Updates | R3 | Queue position, current serving token, and ETA update in real time without full page reload. | Trigger queue progression in operator view; verify farmer screen. |
| **AC-09** | Equipment Failure Recalculation | R3 | Operator marking machine breakdown updates farmer ETA by $+30$ mins within $\le 5$ seconds. | Trigger incident in Operator portal; verify farmer ETA update. |
| **AC-10** | No-Show Handling & Rescheduling | R3 | Overdue bookings transition to NO_SHOW; farmer can click Reschedule to see ranked alternative slots. | Check late slot behavior; test Reschedule modal. |
| **AC-11** | 9-Stage Procurement Timeline | R3 | Complete 9-stage progression visible on booking detail with timestamps, actors, and remarks. | Advance booking through all 9 stages; inspect timeline. |
| **AC-12** | Weighing Discrepancy Alert | R3 | Produce weight $>20\%$ off booked quantity triggers visual warning and operator resolution modal. | Enter 65 Q for a 20 Q booking; verify discrepancy alert. |
| **AC-13** | Quality Inspection Form & Grading | R3 | Form captures Moisture, FM, Damaged Grain; calculates Grade A/B/C/Reject; records accepted quantity. | Submit inspection metrics; verify Grade calculation and deduction. |
| **AC-14** | Payment Tracker & MSP Breakdown | R4 | Shows Gross MSP, Deductions, Net Payable, 4 lifecycle states, and simulated transaction reference. | Inspect Payment tab after procurement acceptance. |
| **AC-15** | Payment Boost Request | R4 | Farmer can submit boost request when payment is pending; Operator & Admin see HIGH PRIORITY boost tag. | Click "Request Payment Boost"; verify status and admin badge. |
| **AC-16** | Admin Congestion Heat Map | R5 | Map renders all 8–15 centres with Green, Yellow, Red, Grey status based on live occupancy. | Open Admin Dashboard; inspect map markers and legend. |
| **AC-17** | Admin Action Recommendation | R5 | Admin dashboard renders "ACTION RECOMMENDED" card proposing load balancing / redirection. | Verify presence of redirection recommendation card. |
| **AC-18** | Operator QR & Manual Check-in | R5 | Operator portal can check in farmer via simulated QR scan and manual Booking ID input. | Test both QR scanner button and text input check-in. |
| **AC-19** | In-App Notification Centre | R6 | Displays categorised notifications with unread count badge and timestamped detail. | Check bell icon dropdown and notification page. |
| **AC-20** | Offline Caching & Banner | R6 | Disconnecting network shows amber OFFLINE banner while QR token and booking details remain visible. | Toggle browser offline mode; verify cached pass display. |
| **AC-21** | Bilingual Language Switcher | R7 | Toggle between English and Hindi immediately translates farmer portal interface. | Click EN/HI switcher; verify UI text translations. |
| **AC-22** | Browser Web Portal Execution | R7 | Single command `npm run dev` starts app on `localhost:3000`; 100% point-and-click browser navigable. | Verify complete browser workflow with zero CLI commands. |

---

## 4. Features Discovered Table

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Auth & Onboarding | Mock Mobile OTP Auth | Authenticates user via phone number and 6-digit OTP | `phoneNumber`, `otpCode` | Auth session token, User profile, role | Invalid OTP error, expired OTP | ORIGINAL_REQUEST R1 |
| 2 | Auth & Onboarding | Aadhaar & Kisan ID KYC Verification | Cross-verifies farmer identity against mock government registry | `aadhaarNumber`, `kisanId`, `farmerName` | KYC status `VERIFIED`, verified timestamp | KYC validation error: "Aadhaar/Kisan ID mismatch" | ORIGINAL_REQUEST R1 |
| 3 | Auth & Onboarding | Role-Based Route Guards | Enforces page access restrictions per user role | User session, requested route | Rendered route or redirect to authorized portal | 403 Forbidden / Redirect to login | ORIGINAL_REQUEST R1, R7 |
| 4 | Booking & Discovery | Centre Discovery Map & List | Interactive map showing procurement centres with capacity indicators | User GPS/district, crop filter | Centre list with distance, congestion tag, capacity | "No centres found matching criteria" | ORIGINAL_REQUEST R2 |
| 5 | Booking & Discovery | AI Centre Recommendation Engine | Computes composite suitability score across 8 weighted factors | Centre metrics, farmer location, crop, quantity | Ranked centres + "Why we recommend this" rationale | Fallback to nearest distance if data missing | ORIGINAL_REQUEST R2, AC-04 |
| 6 | Booking & Discovery | Dynamic Slot Time Calculator | Computes arrival window and processing duration using 5-factor formula | `cropId`, `quantityQuintals`, `vehicleType`, centre load | Arrival Window (`start`, `end`), Estimated Duration | Validation error if quantity $\le 0$ | ORIGINAL_REQUEST R2 |
| 7 | Booking & Discovery | QR Token Generation | Generates scannable QR token payload encoding booking details | `bookingId`, `farmerId`, `slotId`, `tokenNumber` | Visual QR Code, alpha-numeric token (e.g. `TK-WHT-102`) | QR rendering fallback text | ORIGINAL_REQUEST R2, AC-06 |
| 8 | Booking & Discovery | PACS Farm Visit Workflow | Requests on-site farm inspection for large quantity farmers ($>50$ Q) | Farm location, crop, estimated quantity, preferred date | `visitRequestId`, status `VISIT_REQUESTED` | Rejection if outside PACS operational jurisdiction | ORIGINAL_REQUEST R2, AC-05 |
| 9 | Queue & Lifecycle | Live Virtual Queue Board | Real-time queue monitor displaying current token, wait times, positions | `centreId`, WebSocket connection | Ordered queue list, farmer personal position & ETA | Reconnection banner on socket drop | ORIGINAL_REQUEST R3, AC-08 |
| 10 | Queue & Lifecycle | Operator Check-In Scanner | QR scanner simulation and manual Booking ID lookup | QR token payload or Booking ID string | Booking status `CHECKED_IN`, Queue token assigned | "Invalid or already checked-in booking" error | ORIGINAL_REQUEST R3, R5, AC-18 |
| 11 | Queue & Lifecycle | 9-Stage Procurement Stepper | Visual timeline tracking 9 discrete procurement milestones | `bookingId`, transition triggers | Timestamped stage history with actor & remarks | Rejects invalid out-of-order stage transitions | ORIGINAL_REQUEST R3, AC-11 |
| 12 | Queue & Lifecycle | Late Arrival & No-Show Engine | Grace period timer (15 min) with auto-transition to `NO_SHOW` | Current time vs `arrivalWindowEnd` | Booking status `NO_SHOW`, slot released | Notification sent to farmer | ORIGINAL_REQUEST R3, AC-10 |
| 13 | Queue & Lifecycle | Slot Reschedule Assistant | Allows no-show or delayed farmers to rebook next available slot | `bookingId`, preferred date/centre | Updated booking with new slot & QR token | "No available slots on selected date" | ORIGINAL_REQUEST R3, AC-10 |
| 14 | Weighing & Quality | Weighing Data Entry & Gross/Tare/Net | Computes net weight from gross and tare readings | `grossWeightKg`, `tareWeightKg` | `netWeightKg`, `netWeightQuintals` | Error if `grossWeight <= tareWeight` | ORIGINAL_REQUEST R3 |
| 15 | Weighing & Quality | Weighing Discrepancy Flag | Triggers alert when actual weight deviates $>20\%$ from booking | `bookedQty`, `actualQty` | Discrepancy modal with operator reason code | Blocks transition without operator sign-off | ORIGINAL_REQUEST R3, AC-12 |
| 16 | Weighing & Quality | Quality Inspection Form | Captures Moisture %, Foreign Matter %, Damaged Grain % | Sample test measurements | Calculated Grade (A/B/C/Reject), Deduction % | Error if percentages out of bounds ($0-100\%$) | ORIGINAL_REQUEST R3, AC-13 |
| 17 | Weighing & Quality | Quality Decision Workflow | Supports Accept, Partial Accept, Reject, Reinspect | Inspection results, Inspector decision | Procurement record update, rejection memo / approval | Mandatory reason required on Reject | ORIGINAL_REQUEST R3, AC-13 |
| 18 | Payment & Settlement | MSP Payout Calculation | Computes gross amount, deductions, and net payable | `acceptedQuantity`, `mspRate`, `deductionPercent` | Itemized financial receipt | Recalculates on deduction change | ORIGINAL_REQUEST R4, AC-14 |
| 19 | Payment & Settlement | Payment State Machine Tracker | Visual stepper tracking 4 payment states with transaction info | `bookingId`, payment triggers | State badge, UTR number, bank account details | Displays failure reason on `FAILED` state | ORIGINAL_REQUEST R4, AC-14 |
| 20 | Payment & Settlement | Payment Boost Request | Allows farmer to expedite payment when exceeding 48h SLA | `bookingId`, `reason` | `boostRequested: true`, High priority tag in admin | Disabled if payment already within SLA or completed | ORIGINAL_REQUEST R4, AC-15 |
| 21 | Admin & Analytics | Congestion Heat Map | District map with color-coded markers based on live load | Centre coordinates, current occupancy, capacity | Interactive map with Green/Yellow/Red/Grey pins | Defaults to list view if map tiles fail | ORIGINAL_REQUEST R5, AC-16 |
| 22 | Admin & Analytics | Action Recommendation Engine | Identifies overloaded centres and recommends load-balancing | Centre congestion %, nearby centre capacities | "ACTION RECOMMENDED" cards with redirect button | Hides card if all centres are balanced | ORIGINAL_REQUEST R5, AC-17 |
| 23 | Admin & Analytics | Hourly Throughput & Bottlenecks | Graphs showing procurement rate (Q/hour) and stage delays | Procurement records, stage timestamps | Hourly bar charts, stage duration breakdown | Empty state when no data for selected date | ORIGINAL_REQUEST R5 |
| 24 | Incident Management | Operational Incident Reporter | Operator reports equipment breakdown or staff shortages | `centreId`, `incidentType`, `delayMinutes`, `severity` | Active incident recorded, broadcast triggered | Validation error if delay minutes $< 1$ | ORIGINAL_REQUEST R3, R5, AC-09 |
| 25 | Incident Management | Real-Time Disruption Recalculation | Recalculates all farmer queue ETAs within $\le 5$s of incident | Active incidents, current queue entries | Updated ETAs sent via WebSocket + push notification | Graceful fallback if client disconnected | ORIGINAL_REQUEST R3, AC-09 |
| 26 | Notifications | Notification Centre & Badges | Centralized inbox with category filtering and unread count | User ID, notification triggers | Notification list, bell badge counter | Mark as read on click | ORIGINAL_REQUEST R6, AC-19 |
| 27 | Offline & Resilience | Offline Caching Subsystem | Caches active booking, QR code, and queue state locally | Browser LocalStorage / IndexedDB | Offline QR display, network status banner | Warning banner when attempting mutation offline | ORIGINAL_REQUEST R6, AC-20 |
| 28 | Multilingual | English / Hindi Language Switcher | Toggles interface language between English and Hindi | Language selection (`en` / `hi`) | Translated UI labels, dates, and notifications | Fallback to English for missing keys | ORIGINAL_REQUEST R7, AC-21 |
| 29 | System Admin | Master Data Configuration | Manages crops, MSP pricing, tolerance limits, and centres | Form inputs for crop/centre attributes | Updated master data records | Restricts duplicate codes and negative prices | ORIGINAL_REQUEST R7 |

---

## 5. Edge Cases & Error Handling Specifications

| # | Feature | Input / Edge Condition | Observed & Specified Behavior |
|---|---------|------------------------|-------------------------------|
| **EC-01** | Farmer KYC | Mismatched Aadhaar & Kisan ID (e.g., Aadhaar of Farmer A with Kisan ID of Farmer B) | System rejects KYC submission with error: *"Aadhaar and Kisan ID do not match government records. Please verify your credentials."* Status remains `UNVERIFIED`. |
| **EC-02** | Centre Recommendation | All nearby centres in district are $>90\%$ congested | AI recommendation engine ranks by lowest wait time, flags *"High Congestion Warning"*, and suggests booking a slot for the next morning. |
| **EC-03** | Dynamic Booking | Estimated quantity is $0$ or negative | Form validation prevents submission with error: *"Quantity must be between 1 and 500 Quintals."* |
| **EC-04** | Farmer Bifurcation | Farmer with $120$ Quintals selects self-transport | System displays guidance modal: *"For quantities over 50 Q, PACS Farm Gate Visit is recommended to avoid multiple trips. Do you wish to proceed with PACS Visit or Self-Transport?"* |
| **EC-05** | Check-in Window | Farmer arrives 45 minutes before arrival window | Operator check-in accepts early arrival, places farmer in `EARLY_WAITING` state, but schedules turn according to original slot priority. |
| **EC-06** | Check-in Window | Farmer arrives 25 minutes after arrival window (grace period = 15 mins) | System has marked token as `NO_SHOW`. Operator receives alert: *"Slot expired. Reschedule to next open slot or admit under Emergency Standby?"* |
| **EC-07** | Live Queue | Operator logs "Weighing Scale Breakdown" with $+45$ min delay | WebSocket broadcasts event `INCIDENT_ALERT`; all farmers in queue see ETA jump by $+45$ min with amber incident badge and push notification. |
| **EC-08** | Weighing Stage | Actual weight is $72$ Q on a $25$ Q booking ($+188\%$ discrepancy) | Weighing screen shows high-severity RED alert: *"Severe Discrepancy (>20%). Booked: 25 Q, Actual: 72 Q (+188%)."* Operator must enter supervisor override code and reason (*"Farmer brought additional lot from adjacent plot"*). |
| **EC-09** | Weighing Stage | Actual weight is $14$ Q on a $20$ Q booking ($-30\%$ discrepancy) | System flags discrepancy; operator selects *"Under-harvest / Partial transport"* and adjusts procurement quantity to $14$ Q. |
| **EC-10** | Quality Testing | Wheat sample has $17.5\%$ moisture (Limit for Grade A is $12\%$, max acceptable is $14\%$) | Inspection module automatically classifies as `REJECTED` or `REINSPECT`. If farmer chooses drying, status set to `REINSPECT_PENDING` (holding slot for 4 hours). |
| **EC-11** | Quality Testing | Foreign matter is $1.8\%$ (Grade B range $0.76\% - 1.5\%$) | Inspection module sets decision to `PARTIAL_ACCEPT` with a calculated quality cut deduction (e.g. $1.5\%$ of gross MSP). |
| **EC-12** | Payment SLA | Farmer requests payment boost at 12 hours post-procurement (SLA = 48h) | "Request Payment Boost" button shows countdown timer: *"SLA active. Boost request available in 36h 00m if payment remains unprocessed."* |
| **EC-13** | Payment Failure | Simulated payment gateway returns bank rejection (invalid IFSC) | Payment state transitions to `FAILED`; farmer and operator receive notification: *"Bank account validation failed. Please update IFSC in profile to retry."* |
| **EC-14** | Network Offline | Farmer loses internet connectivity while standing in Mandi line | Browser shows amber `OFFLINE` badge; cached QR Code, Token Number (`TK-WHT-042`), and Booking summary remain completely viewable and scannable. |
| **EC-15** | Admin Redirection | Admin clicks "Approve Redirection" from Centre A to Centre B | System updates Centre A banner to *"High Demand — New bookings routed to Centre B"* and offers 5% priority booking bonus for Centre B. |

---

## 6. Complete Relational Data Schema & Entity Specifications

The relational schema comprises **13 normalized entities** with foreign keys, indexes, enums, and audit fields (`createdAt`, `updatedAt`).

```
                              ┌──────────────────┐
                              │       User       │
                              └────────┬─────────┘
                                       │ 1:1
                              ┌────────▼─────────┐
                              │  FarmerProfile   │
                              └────────┬─────────┘
                                       │ 1:N
 ┌─────────────────────┐      ┌────────▼─────────┐      ┌─────────────────────┐
 │  ProcurementCentre  ├──────►     Booking      ◄──────┤        Crop         │
 └──────────┬──────────┘ 1:N  └────────┬─────────┘ 1:N  └──────────┬──────────┘
            │                          │                           │
     1:N ┌──┴──┐ 1:N            1:1 ┌──┴──┐ 1:1              1:N ┌─┴──┐
         │     │                    │     │                      │    │
┌────────▼─┐ ┌─▼──────────────┐ ┌───▼──┐ ┌▼──────────────────┐ ┌─▼──┐ │
│CentreCrop│ │OpIncident      │ │Queue │ │ProcurementRecord  │ │    │ │
└──────────┘ └────────────────┘ └───┬──┘ └────────┬──────────┘ └────┘ │
                                    │             │ 1:1               │
                                    │    1:1 ┌────┴────┐ 1:1          │
                                    │        │         │              │
                                    │   ┌────▼─────┐ ┌─▼───────────┐  │
                                    │   │Quality   │ │Payment      │  │
                                    │   │Inspection│ └─────────────┘  │
                                    │   └──────────┘                  │
                                    └─────────────┬───────────────────┘
                                                  │ (Notification references User)
                                         ┌────────▼─────────┐
                                         │   Notification   │
                                         └──────────────────┘
```

### 6.1 Database Enums
1. **`UserRole`**: `FARMER`, `CENTRE_OPERATOR`, `QUALITY_INSPECTOR`, `DISTRICT_ADMIN`, `STATE_ADMIN`, `SUPER_ADMIN`
2. **`KycStatus`**: `PENDING`, `VERIFIED`, `REJECTED`
3. **`CentreStatus`**: `ACTIVE`, `CONGESTED`, `INACTIVE`, `MAINTENANCE`
4. **`VehicleType`**: `TRACTOR`, `TROLLEY`, `TRUCK`, `MINI_TRUCK`, `BULLOCK_CART`, `AUTO`
5. **`BookingType`**: `SELF_TRANSPORT`, `PACS_VISIT_REQUEST`
6. **`BookingStatus`**: `PENDING`, `CONFIRMED`, `CHECKED_IN`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `NO_SHOW`, `RESCHEDULED`
7. **`QueueStatus`**: `WAITING`, `CALLED`, `AT_WEIGHING`, `AT_INSPECTION`, `PROCESSING_PAYMENT`, `COMPLETED`, `NO_SHOW`, `CANCELLED`
8. **`ProcurementStage`**: `SLOT_BOOKED`, `CHECKED_IN`, `IDENTITY_VERIFIED`, `DOCUMENTS_VERIFIED`, `PRODUCE_WEIGHED`, `QUALITY_INSPECTED`, `PROCUREMENT_ACCEPTED`, `PAYMENT_PROCESSING`, `PAYMENT_COMPLETED`
9. **`CropGrade`**: `GRADE_A`, `GRADE_B`, `GRADE_C`, `REJECTED`
10. **`QualityDecision`**: `ACCEPT`, `PARTIAL_ACCEPT`, `REJECT`, `REINSPECT`
11. **`PaymentStatus`**: `NOT_INITIATED`, `INITIATED`, `PROCESSING`, `SUCCESSFUL`, `FAILED`
12. **`IncidentType`**: `WEIGHING_MACHINE_FAILURE`, `MOISTURE_METER_FAILURE`, `POWER_OUTAGE`, `STAFF_SHORTAGE`, `NETWORK_DOWN`, `CONGESTION_SPIKE`, `WEATHER_DISRUPTION`, `OTHER`
13. **`IncidentSeverity`**: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
14. **`NotificationCategory`**: `BOOKING`, `QUEUE`, `INCIDENT`, `PROCUREMENT`, `PAYMENT`, `SYSTEM`

---

### 6.2 Entity Data Dictionary

#### 1. `User` (Core Authentication & RBAC)
| Field | Type | Modifiers | Description |
|---|---|---|---|
| `id` | `String` (UUID/CUID) | Primary Key | Unique user identifier |
| `phone` | `String` | Unique, Indexed | Mobile phone number (10 digits) |
| `name` | `String` | Not Null | User full legal name |
| `email` | `String?` | Nullable | Email address (optional for farmers) |
| `role` | `UserRole` | Default: `FARMER` | RBAC role |
| `aadhaarNumber` | `String?` | Unique, Nullable | 12-digit Aadhaar number |
| `kisanId` | `String?` | Unique, Nullable | Government Kisan / PM-KISAN ID |
| `status` | `String` | Default: `"ACTIVE"` | Account status (`ACTIVE`, `SUSPENDED`) |
| `preferredLanguage`| `String` | Default: `"en"` | Language code (`en`, `hi`) |
| `createdAt` | `DateTime` | Default: `now()` | Audit record creation timestamp |
| `updatedAt` | `DateTime` | Updated on change | Audit record modification timestamp |

#### 2. `FarmerProfile` (Farmer Details & Bank Information)
| Field | Type | Modifiers | Description |
|---|---|---|---|
| `id` | `String` (UUID/CUID) | Primary Key | Unique profile identifier |
| `userId` | `String` | Foreign Key (`User.id`), 1:1 | Associated user account |
| `village` | `String` | Not Null | Village name |
| `district` | `String` | Indexed, Not Null | District name |
| `state` | `String` | Not Null | State name |
| `pinCode` | `String` | Not Null | 6-digit postal code |
| `landSizeAcres`| `Float` | Default: `0.0` | Agricultural landholding size |
| `bankName` | `String` | Not Null | Bank branch name |
| `accountNumber`| `String` | Not Null | Bank account number |
| `ifscCode` | `String` | Not Null | 11-character IFSC code |
| `kycStatus` | `KycStatus` | Default: `PENDING` | Verification status |
| `kycVerifiedAt`| `DateTime?`| Nullable | Timestamp of KYC approval |
| `createdAt` | `DateTime` | Default: `now()` | Audit timestamp |
| `updatedAt` | `DateTime` | Updated on change | Audit timestamp |

#### 3. `ProcurementCentre` (Procurement Facility Master)
| Field | Type | Modifiers | Description |
|---|---|---|---|
| `id` | `String` (UUID/CUID) | Primary Key | Unique centre identifier |
| `code` | `String` | Unique, Indexed | Centre short code (e.g., `PC-BPL-001`) |
| `name` | `String` | Not Null | Centre display name |
| `district` | `String` | Indexed, Not Null | District location |
| `state` | `String` | Not Null | State location |
| `pinCode` | `String` | Not Null | 6-digit postal code |
| `latitude` | `Float` | Not Null | Geo-coordinate latitude |
| `longitude` | `Float` | Not Null | Geo-coordinate longitude |
| `address` | `String` | Not Null | Street address |
| `totalCapacityQuintals` | `Float` | Not Null | Total daily holding capacity in Q |
| `dailyProcessingCapacity`| `Float`| Not Null | Max processing throughput in Q/day |
| `currentOccupancyQuintals`| `Float`| Default: `0.0` | Current booked/stored Q load |
| `status` | `CentreStatus` | Default: `ACTIVE` | Operational status |
| `operatingHours` | `String` | Default: `"08:00 - 18:00"` | Daily operational time range |
| `contactNumber` | `String` | Not Null | Centre supervisor phone number |
| `createdAt` | `DateTime` | Default: `now()` | Audit timestamp |
| `updatedAt` | `DateTime` | Updated on change | Audit timestamp |

#### 4. `Crop` (Crop Master & Standard Parameters)
| Field | Type | Modifiers | Description |
|---|---|---|---|
| `id` | `String` (UUID/CUID) | Primary Key | Unique crop identifier |
| `code` | `String` | Unique, Indexed | Crop code (`WHEAT`, `PADDY`, `MAIZE`, `SOYBEAN`) |
| `nameEnglish` | `String` | Not Null | English crop name |
| `nameHindi` | `String` | Not Null | Hindi crop name (गेहूं, धान, मक्का, सोयाबीन) |
| `category` | `String` | Not Null | `Cereal`, `Oilseed`, `Pulse` |
| `mspPerQuintal` | `Float` | Not Null | Current Minimum Support Price (₹/Quintal) |
| `standardMoistureLimit` | `Float` | Not Null | Max allowable moisture percentage (e.g. 12.0%) |
| `standardForeignMatterLimit` | `Float`| Not Null | Max allowable foreign matter % (e.g. 0.75%) |
| `standardDamagedGrainLimit` | `Float` | Not Null | Max allowable damaged grain % (e.g. 2.0%) |
| `baseProcessingTimeMinutes` | `Int` | Default: `15` | Baseline intake duration per vehicle |
| `complexityFactor` | `Float` | Default: `1.0` | Processing multiplier for crop handling |
| `createdAt` | `DateTime` | Default: `now()` | Audit timestamp |
| `updatedAt` | `DateTime` | Updated on change | Audit timestamp |

#### 5. `CentreCrop` (Centre-Crop Association & Quota)
| Field | Type | Modifiers | Description |
|---|---|---|---|
| `id` | `String` (UUID/CUID) | Primary Key | Unique mapping identifier |
| `centreId` | `String` | Foreign Key (`ProcurementCentre.id`) | Reference to Centre |
| `cropId` | `String` | Foreign Key (`Crop.id`) | Reference to Crop |
| `isAccepting` | `Boolean` | Default: `true` | Availability toggle |
| `maxDailyQuotaQuintals` | `Float` | Not Null | Max daily procurement quota in Q |
| `bookedTodayQuintals` | `Float` | Default: `0.0` | Quantity currently booked for today |
| `createdAt` | `DateTime` | Default: `now()` | Audit timestamp |
| `updatedAt` | `DateTime` | Updated on change | Audit timestamp |

#### 6. `Slot` (Time Slot Allocation)
| Field | Type | Modifiers | Description |
|---|---|---|---|
| `id` | `String` (UUID/CUID) | Primary Key | Unique slot identifier |
| `centreId` | `String` | Foreign Key (`ProcurementCentre.id`), Indexed | Centre reference |
| `date` | `DateTime` | Indexed, Not Null | Slot operating date |
| `startTime` | `DateTime` | Not Null | Slot window start time |
| `endTime` | `DateTime` | Not Null | Slot window end time |
| `maxCapacityQuintals` | `Float` | Not Null | Tonnage capacity for this slot |
| `bookedCapacityQuintals` | `Float` | Default: `0.0` | Booked tonnage for this slot |
| `status` | `String` | Default: `"OPEN"` | `OPEN`, `FULL`, `CANCELLED`, `COMPLETED` |
| `createdAt` | `DateTime` | Default: `now()` | Audit timestamp |
| `updatedAt` | `DateTime` | Updated on change | Audit timestamp |

#### 7. `Booking` (Procurement Booking Transaction)
| Field | Type | Modifiers | Description |
|---|---|---|---|
| `id` | `String` (UUID/CUID) | Primary Key | Unique booking identifier |
| `bookingNumber` | `String` | Unique, Indexed | Human-readable ID (e.g. `BK-2026-0826-001`) |
| `farmerId` | `String` | Foreign Key (`User.id`), Indexed | Farmer reference |
| `centreId` | `String` | Foreign Key (`ProcurementCentre.id`), Indexed | Centre reference |
| `cropId` | `String` | Foreign Key (`Crop.id`), Indexed | Crop reference |
| `slotId` | `String?` | Foreign Key (`Slot.id`), Nullable | Slot reference (null for initial visit request) |
| `estimatedQuantityQuintals`| `Float`| Not Null | Quantity declared by farmer (Q) |
| `actualQuantityQuintals` | `Float?` | Nullable | Quantity weighed at intake (Q) |
| `vehicleType` | `VehicleType`| Default: `TRACTOR` | Mode of transport |
| `bookingType` | `BookingType`| Default: `SELF_TRANSPORT` | Self-transport vs PACS visit |
| `status` | `BookingStatus`| Default: `PENDING` | Current booking state |
| `arrivalWindowStart` | `DateTime?`| Nullable | Computed arrival window start |
| `arrivalWindowEnd` | `DateTime?`| Nullable | Computed arrival window end |
| `estimatedProcessingMinutes`| `Int?` | Nullable | Computed total processing time |
| `qrToken` | `String` | Unique, Indexed | Encrypted / tokenized payload for QR code |
| `visitScheduledDate` | `DateTime?`| Nullable | For PACS visit workflow |
| `visitStatus` | `String?` | Nullable | `REQUESTED`, `ASSIGNED`, `COMPLETED` |
| `discrepancyFlag` | `Boolean` | Default: `false` | True if weight discrepancy $> 20\%$ |
| `discrepancyReason` | `String?` | Nullable | Operator reason code for discrepancy |
| `cancellationReason` | `String?` | Nullable | Reason if booking was cancelled |
| `createdAt` | `DateTime` | Default: `now()` | Audit timestamp |
| `updatedAt` | `DateTime` | Updated on change | Audit timestamp |

#### 8. `QueueEntry` (Live Virtual Queue State)
| Field | Type | Modifiers | Description |
|---|---|---|---|
| `id` | `String` (UUID/CUID) | Primary Key | Unique queue entry identifier |
| `bookingId` | `String` | Unique, Foreign Key (`Booking.id`) | 1:1 reference to booking |
| `centreId` | `String` | Foreign Key (`ProcurementCentre.id`), Indexed | Centre reference |
| `tokenNumber` | `String` | Indexed, Not Null | Daily token (e.g. `TK-WHT-042`) |
| `queuePosition` | `Int` | Indexed, Not Null | Numerical sequence in live queue |
| `status` | `QueueStatus` | Default: `WAITING` | Live queue status |
| `estimatedWaitTimeMinutes`| `Int` | Default: `0` | Dynamic wait time |
| `checkedInAt` | `DateTime?`| Nullable | Check-in timestamp |
| `calledAt` | `DateTime?`| Nullable | Timestamp when operator called token |
| `completedAt` | `DateTime?`| Nullable | Completion timestamp |
| `createdAt` | `DateTime` | Default: `now()` | Audit timestamp |
| `updatedAt` | `DateTime` | Updated on change | Audit timestamp |

#### 9. `ProcurementRecord` (9-Stage Lifecycle & Weighing Data)
| Field | Type | Modifiers | Description |
|---|---|---|---|
| `id` | `String` (UUID/CUID) | Primary Key | Unique record identifier |
| `bookingId` | `String` | Unique, Foreign Key (`Booking.id`) | 1:1 reference to booking |
| `centreId` | `String` | Foreign Key (`ProcurementCentre.id`) | Centre reference |
| `farmerId` | `String` | Foreign Key (`User.id`) | Farmer reference |
| `cropId` | `String` | Foreign Key (`Crop.id`) | Crop reference |
| `grossWeightKg` | `Float?` | Nullable | Weighbridge gross weight (Kg) |
| `tareWeightKg` | `Float?` | Nullable | Empty vehicle tare weight (Kg) |
| `netWeightKg` | `Float?` | Nullable | Net crop weight (Kg) |
| `netWeightQuintals` | `Float?` | Nullable | Net crop weight in Quintals ($/ 100$) |
| `discrepancyPercentage` | `Float?` | Nullable | Deviation percentage vs booked Q |
| `discrepancyApprovedBy` | `String?`| Nullable | Supervisor ID who approved discrepancy |
| `currentStage` | `ProcurementStage`| Default: `SLOT_BOOKED` | Current milestone in 9-stage lifecycle |
| `stageTimestamps` | `Json` | Default: `{}` | JSON map of timestamps per stage |
| `stageRemarks` | `Json` | Default: `{}` | JSON map of notes/remarks per stage |
| `operatorNotes` | `String?` | Nullable | General operator comments |
| `createdAt` | `DateTime` | Default: `now()` | Audit timestamp |
| `updatedAt` | `DateTime` | Updated on change | Audit timestamp |

#### 10. `QualityInspection` (Inspection Metrics & Grading)
| Field | Type | Modifiers | Description |
|---|---|---|---|
| `id` | `String` (UUID/CUID) | Primary Key | Unique inspection identifier |
| `bookingId` | `String` | Unique, Foreign Key (`Booking.id`) | 1:1 reference to booking |
| `procurementRecordId` | `String` | Foreign Key (`ProcurementRecord.id`) | Reference to procurement record |
| `inspectorId` | `String` | Foreign Key (`User.id`) | Quality Inspector user ID |
| `moisturePercentage` | `Float` | Not Null | Measured moisture % |
| `foreignMaterialPercentage`| `Float`| Not Null | Measured foreign matter % |
| `damagedGrainPercentage` | `Float` | Not Null | Measured damaged / discolored grain % |
| `grade` | `CropGrade` | Not Null | Assigned grade (`GRADE_A`, `GRADE_B`, `GRADE_C`, `REJECTED`) |
| `decision` | `QualityDecision`| Not Null | Action (`ACCEPT`, `PARTIAL_ACCEPT`, `REJECT`, `REINSPECT`) |
| `acceptedQuantityQuintals`| `Float`| Not Null | Final accepted quantity for payment |
| `deductionPercentage` | `Float` | Default: `0.0` | Quality penalty cut percentage |
| `deductionAmount` | `Float` | Default: `0.0` | Deducted amount in ₹ |
| `rejectionReason` | `String?` | Nullable | Reason if rejected |
| `reinspectionNotes` | `String?` | Nullable | Notes if reinspection required |
| `inspectedAt` | `DateTime` | Default: `now()` | Inspection completion timestamp |
| `createdAt` | `DateTime` | Default: `now()` | Audit timestamp |
| `updatedAt` | `DateTime` | Updated on change | Audit timestamp |

#### 11. `Payment` (Financial Settlement & SLA Boost)
| Field | Type | Modifiers | Description |
|---|---|---|---|
| `id` | `String` (UUID/CUID) | Primary Key | Unique payment identifier |
| `bookingId` | `String` | Unique, Foreign Key (`Booking.id`) | 1:1 reference to booking |
| `farmerId` | `String` | Foreign Key (`User.id`), Indexed | Farmer user reference |
| `procurementRecordId` | `String` | Foreign Key (`ProcurementRecord.id`) | Procurement record reference |
| `grossAmount` | `Float` | Not Null | Gross MSP value in ₹ |
| `deductionAmount` | `Float` | Default: `0.0` | Total deductions in ₹ |
| `netPayableAmount` | `Float` | Not Null | Final disbursement amount in ₹ |
| `paymentStatus` | `PaymentStatus`| Default: `NOT_INITIATED` | Payment lifecycle state |
| `transactionReference` | `String?`| Nullable | UTR / NEFT reference number |
| `bankAccountNumber` | `String` | Not Null | Masked beneficiary account number |
| `ifscCode` | `String` | Not Null | Bank IFSC code |
| `slaDueDate` | `DateTime` | Not Null | 48-hour SLA deadline |
| `isDelayed` | `Boolean` | Default: `false` | True if pending past SLA |
| `boostRequested` | `Boolean` | Default: `false` | True if farmer submitted boost request |
| `boostRequestedAt` | `DateTime?`| Nullable | Timestamp of boost submission |
| `boostReason` | `String?` | Nullable | Farmer-provided boost justification |
| `failureReason` | `String?` | Nullable | Error message if payment failed |
| `processedAt` | `DateTime?`| Nullable | Timestamp when status became `SUCCESSFUL` |
| `createdAt` | `DateTime` | Default: `now()` | Audit timestamp |
| `updatedAt` | `DateTime` | Updated on change | Audit timestamp |

#### 12. `OperationalIncident` (Equipment Breakdown & Disruption Log)
| Field | Type | Modifiers | Description |
|---|---|---|---|
| `id` | `String` (UUID/CUID) | Primary Key | Unique incident identifier |
| `centreId` | `String` | Foreign Key (`ProcurementCentre.id`), Indexed | Affected centre |
| `incidentType` | `IncidentType`| Not Null | Type of operational disruption |
| `severity` | `IncidentSeverity`| Default: `MEDIUM` | Severity level |
| `title` | `String` | Not Null | Short summary |
| `description` | `String` | Not Null | Detailed incident explanation |
| `impactDelayMinutes` | `Int` | Default: `30` | Added processing delay per vehicle (minutes) |
| `status` | `String` | Default: `"ACTIVE"` | `"ACTIVE"`, `"RESOLVED"` |
| `reportedBy` | `String` | Foreign Key (`User.id`) | Operator who logged incident |
| `resolvedBy` | `String?` | Nullable | Operator who resolved incident |
| `startTime` | `DateTime` | Default: `now()` | Disruption start timestamp |
| `resolvedAt` | `DateTime?`| Nullable | Disruption resolution timestamp |
| `createdAt` | `DateTime` | Default: `now()` | Audit timestamp |
| `updatedAt` | `DateTime` | Updated on change | Audit timestamp |

#### 13. `Notification` (In-App Messaging & Real-Time Alerts)
| Field | Type | Modifiers | Description |
|---|---|---|---|
| `id` | `String` (UUID/CUID) | Primary Key | Unique notification identifier |
| `userId` | `String` | Foreign Key (`User.id`), Indexed | Target recipient user ID |
| `title` | `String` | Not Null | English notification title |
| `titleHindi` | `String` | Not Null | Hindi notification title |
| `message` | `String` | Not Null | English message content |
| `messageHindi` | `String` | Not Null | Hindi message content |
| `category` | `NotificationCategory`| Default: `SYSTEM` | Category filter tag |
| `read` | `Boolean` | Default: `false` | Read status |
| `linkUrl` | `String?` | Nullable | Deep-link to relevant screen |
| `metaDataJson` | `Json?` | Nullable | Extra JSON payload (e.g. `bookingId`) |
| `createdAt` | `DateTime` | Default: `now()` | Audit timestamp |
| `updatedAt` | `DateTime` | Updated on change | Audit timestamp |

---

## 7. Mathematical, Algorithmic & Decision Models

### 7.1 Estimated Processing Time Formula

$$\text{Estimated Processing Time } (T_{\text{proc}}) = T_{\text{base}} + T_{\text{qty}} + T_{\text{crop}} + T_{\text{insp}} + T_{\text{delay}}$$

#### Component Parameter Breakdown:
1. **Base Time ($T_{\text{base}}$)**: Fixed setup, docking, gate verification, and unlatching time determined by the vehicle type:
   $$\begin{aligned}
   \text{Bullock Cart} &: 12\text{ minutes} \\
   \text{Auto / 3-Wheeler} &: 8\text{ minutes} \\
   \text{Tractor-Trolley} &: 10\text{ minutes} \\
   \text{Mini Truck (e.g. Bolero/Ace)} &: 10\text{ minutes} \\
   \text{Heavy Commercial Truck} &: 15\text{ minutes}
   \end{aligned}$$

2. **Quantity Factor ($T_{\text{qty}}$)**: Variable unloading and weighbridge transit duration scaled with tonnage:
   $$T_{\text{qty}} = Q \times r_{\text{unload}}$$
   where $Q$ is the quantity in Quintals, and $r_{\text{unload}} = 0.40\text{ minutes per Quintal}$ (i.e. $40\text{ seconds per Quintal}$).
   *(Example: For $50\text{ Q}$, $T_{\text{qty}} = 50 \times 0.40 = 20\text{ minutes}$)*.

3. **Crop Complexity ($T_{\text{crop}}$)**: Crop-specific unloading and handling characteristic adjustment:
   $$T_{\text{crop}} = \text{CropBaseTime} \times (\text{CropComplexityFactor} - 1.0)$$
   $$\begin{aligned}
   \text{Wheat} &: 3\text{ minutes} \quad (\text{Complexity} = 1.0) \\
   \text{Maize} &: 4\text{ minutes} \quad (\text{Complexity} = 1.1) \\
   \text{Soybean} &: 5\text{ minutes} \quad (\text{Complexity} = 1.2) \\
   \text{Paddy / Rice} &: 6\text{ minutes} \quad (\text{Complexity} = 1.3)
   \end{aligned}$$

4. **Inspection Time ($T_{\text{insp}}$)**: Quality sampling, moisture meter reading, foreign matter sieving, and grain dissection time:
   $$T_{\text{insp}} = 8\text{ minutes (Standard Fast-Track Protocol)}$$

5. **Delay Penalty ($T_{\text{delay}}$)**: Dynamic delay penalty based on active centre incidents and live congestion factor:
   $$T_{\text{delay}} = \sum_{i \in \text{ActiveIncidents}} \text{ImpactDelay}_i + \left( \max(0, N_{\text{queue}} - 5) \times 1.5 \right)$$
   where $N_{\text{queue}}$ is the number of vehicles currently waiting ahead in the physical line.

#### Arrival Window Calculation:
$$\text{Arrival Window Start} = \text{SlotStartTime}$$
$$\text{Arrival Window End} = \text{SlotStartTime} + 30\text{ minutes (Standard Check-in Window)}$$
$$\text{Estimated Completion Time} = \text{Arrival Window Start} + T_{\text{proc}} + (\text{CurrentCentreWaitTime})$$

---

### 7.2 AI Centre Recommendation Multi-Factor Scoring Engine & Explainability

The recommendation engine ranks available procurement centres by computing a composite score $S_c \in [0, 100]$ (where higher is better) across **8 normalized factors**:

$$S_c = \sum_{j=1}^{8} w_j \cdot f_j(c)$$

$$\text{Subject to: } \sum_{j=1}^{8} w_j = 1.00$$

#### Factor Definitions, Normalizations & Weights Table:

| Factor | Weight ($w_j$) | Raw Metric ($x$) | Normalization Function $f_j(c) \in [0, 100]$ | Rationale |
|---|---|---|---|---|
| **1. Distance ($f_{\text{dist}}$)** | $0.25$ | Distance from farmer (km) | $\max\left(0, 100 - \frac{d}{d_{\max}} \times 100\right)$ (where $d_{\max} = 50\text{ km}$) | Shorter travel minimizes transport cost and transit spoilage. |
| **2. Wait Time ($f_{\text{wait}}$)** | $0.20$ | Current average wait (mins) | $\max\left(0, 100 - \frac{t_{\text{wait}}}{120} \times 100\right)$ | Lower wait time directly eliminates Mandi queue congestion. |
| **3. Capacity Congestion ($f_{\text{cap}}$)** | $0.15$ | Capacity Utilization ($\%$) | $100 - \text{Occupancy}\%$ | Uncongested centres have higher bandwidth for quick intake. |
| **4. Processing Speed ($f_{\text{speed}}$)** | $0.10$ | Daily throughput rate (Q/hr) | $\min\left(100, \frac{\text{Throughput}}{\text{TargetThroughput}} \times 100\right)$ | High-throughput centres clear lots faster. |
| **5. Equipment Status ($f_{\text{equip}}$)** | $0.10$ | Operational equipment count | $100 \times \frac{\text{WorkingMachines}}{\text{TotalMachines}}$ ($0$ if primary weighbridge broken) | Active machine breakdowns significantly degrade throughput. |
| **6. Crop Availability ($f_{\text{crop}}$)** | $0.10$ | Crop accepting & remaining quota | $100$ if accepting & quota $> Q$, else $0$ | Strict gating requirement for crop acceptance. |
| **7. Historical Delay Rate ($f_{\text{delay}}$)** | $0.05$ | % of past slots delayed | $100 - \text{HistoricalDelayRate}\%$ | Favors consistently punctual and well-managed centres. |
| **8. Road / Access Score ($f_{\text{access}}$)** | $0.05$ | Heavy vehicle road accessibility | Rated $50 - 100$ based on highway / all-weather road access | Prevents tractor/truck bottlenecks on narrow rural roads. |

#### Explainability Engine ("Why We Recommend This"):
The system translates the top contributing scoring components into concise, farmer-friendly natural language explanations:
- If $f_{\text{dist}} > 85$ and $f_{\text{wait}} > 80$:  
  *"Recommended because this centre is closest to your village (4.2 km) with the shortest current wait time (18 mins) and 100% operational equipment."*
- If $f_{\text{cap}} > 80$ while nearest centre is $>85\%$ congested:  
  *"Recommended as a Smart Alternative: Even though Centre Alpha is 3 km closer, this centre has 62% available capacity and will save you ~1.5 hours of waiting in line."*

---

### 7.3 Weighing Discrepancy Alert & Operator Resolution Logic

Let $Q_{\text{booked}}$ be the farmer-declared estimated quantity in Quintals.  
Let $Q_{\text{actual}}$ be the measured net weighbridge quantity:
$$Q_{\text{actual}} = \frac{W_{\text{gross}} - W_{\text{tare}}}{100} \quad (\text{in Quintals})$$

#### Discrepancy Percentage:
$$\Delta_{\text{weight}} = \frac{|Q_{\text{actual}} - Q_{\text{booked}}|}{Q_{\text{booked}}} \times 100\%$$

#### Action Rules:
1. **Normal Range ($\Delta_{\text{weight}} \le 20\%$)**:
   - Status: `DISCREPANCY_NORMAL`
   - UI: Green badge.
   - Action: Single-click proceed to Quality Inspection.

2. **Moderate Discrepancy ($20\% < \Delta_{\text{weight}} \le 50\%$)**:
   - Status: `DISCREPANCY_WARNING`
   - UI: Amber warning alert.
   - Action: Operator must confirm actual weight and select an explanation reason (*"Moisture loss during transit"*, *"Additional bagging from second harvest"*, *"Vehicle tare re-calibrated"*).

3. **Severe Discrepancy ($\Delta_{\text{weight}} > 50\%$)**:
   - Status: `DISCREPANCY_CRITICAL`
   - UI: Red blinking modal alert with supervisor authentication requirement.
   - Action: Requires Centre Supervisor / Operator override PIN, photo proof of weighbridge ticket, and auto-generates a discrepancy log in the audit trail.

---

### 7.4 Quality Inspection & Grading Decision Matrix

The Quality Inspection Module enforces Indian Agmarknet / FCI standard procurement parameters for major kharif and rabi crops (Wheat, Paddy/Rice, Maize, Soybean).

#### Quality Standard Parameters & Grading Table:

| Crop | Grade | Moisture % ($M$) | Foreign Material % ($FM$) | Damaged / Discolored % ($D$) | Automated Decision | Financial Adjustment |
|---|---|---|---|---|---|---|
| **Wheat** | **Grade A** | $M \le 12.0\%$ | $FM \le 0.75\%$ | $D \le 2.0\%$ | `ACCEPT` | $100\%$ Full MSP Payout |
| **Wheat** | **Grade B** | $12.1\% - 14.0\%$ | $0.76\% - 1.50\%$ | $2.1\% - 4.0\%$ | `PARTIAL_ACCEPT` | $1.5\%$ Quality Cut Deduction |
| **Wheat** | **Grade C** | $14.1\% - 15.5\%$ | $1.51\% - 2.50\%$ | $4.1\% - 6.0\%$ | `PARTIAL_ACCEPT` | $4.0\%$ Quality Cut Deduction |
| **Wheat** | **Rejected** | $M > 15.5\%$ | $FM > 2.50\%$ | $D > 6.0\%$ | `REJECT` or `REINSPECT` | $0$ (Rejection Memo Issued or 4h Aeration Reinspection) |
| **Paddy (Common)** | **Grade A** | $M \le 14.0\%$ | $FM \le 1.00\%$ | $D \le 3.0\%$ | `ACCEPT` | $100\%$ Full MSP Payout |
| **Paddy (Common)** | **Grade B** | $14.1\% - 17.0\%$ | $1.01\% - 2.00\%$ | $3.1\% - 5.0\%$ | `PARTIAL_ACCEPT` | $2.0\%$ Quality Cut Deduction |
| **Paddy (Common)** | **Rejected** | $M > 17.0\%$ | $FM > 2.00\%$ | $D > 5.0\%$ | `REJECT` | $0$ (Rejection Slip) |
| **Maize** | **Grade A** | $M \le 14.0\%$ | $FM \le 1.50\%$ | $D \le 3.0\%$ | `ACCEPT` | $100\%$ Full MSP Payout |
| **Maize** | **Grade B** | $14.1\% - 16.0\%$ | $1.51\% - 2.50\%$ | $3.1\% - 5.0\%$ | `PARTIAL_ACCEPT` | $2.5\%$ Quality Cut Deduction |
| **Maize** | **Rejected** | $M > 16.0\%$ | $FM > 2.50\%$ | $D > 5.0\%$ | `REJECT` | $0$ (Rejection Slip) |
| **Soybean** | **Grade A** | $M \le 10.0\%$ | $FM \le 1.00\%$ | $D \le 2.0\%$ | `ACCEPT` | $100\%$ Full MSP Payout |
| **Soybean** | **Grade B** | $10.1\% - 12.0\%$ | $1.01\% - 2.00\%$ | $2.1\% - 4.0\%$ | `PARTIAL_ACCEPT` | $2.0\%$ Quality Cut Deduction |
| **Soybean** | **Rejected** | $M > 12.0\%$ | $FM > 2.00\%$ | $D > 4.0\%$ | `REJECT` | $0$ (Rejection Slip) |

#### Decision Algorithm:
$$\text{Grade} = \max(\text{Grade}(M), \text{Grade}(FM), \text{Grade}(D))$$
*(i.e. The overall grade is constrained by the worst individual parameter measured).*

---

### 7.5 Payment State Machine, Payout Calculation & SLA Boost Logic

#### Payout Calculation Formula:
$$\text{Gross Amount } (A_{\text{gross}}) = Q_{\text{accepted}} \times \text{MSP}_{\text{crop}}$$
$$\text{Deductions } (A_{\text{ded}}) = A_{\text{gross}} \times \left(\frac{\text{DeductionPercentage}}{100}\right) + \text{MandatoryCess}$$
$$\text{Net Payable Amount } (A_{\text{net}}) = A_{\text{gross}} - A_{\text{ded}}$$

#### State Machine Flow:
```
               ┌───────────────────────┐
               │     NOT_INITIATED     │ (Procurement Accepted)
               └───────────┬───────────┘
                           │ Operator / System Initiates Disbursement
                           ▼
               ┌───────────────────────┐
               │       INITIATED       │ (Queued in PFMS / Banking Gateway)
               └───────────┬───────────┘
                           │ Bank Processing Started
                           ▼
               ┌───────────────────────┐
               │      PROCESSING       │ (Awaiting Clearing)
               └───────┬───────┬───────┘
                       │       │
      Bank Ack Success │       │ Gateway Error / Invalid IFSC
                       ▼       ▼
       ┌──────────────────┐  ┌──────────────────┐
       │    SUCCESSFUL    │  │      FAILED      │
       └──────────────────┘  └────────┬─────────┘
                                      │ Operator Retries / Updates Account
                                      └────────► (Returns to INITIATED)
```

#### SLA Boost Logic:
- **Standard SLA**: $T_{\text{SLA}} = \text{ProcurementAcceptedAt} + 48\text{ Hours}$.
- If $\text{CurrentTime} > T_{\text{SLA}}$ and $\text{PaymentStatus} \ne \text{SUCCESSFUL}$:
  - `isDelayed` becomes `true`.
  - Farmer Portal enables the **"🚀 Request Payment Boost"** button.
  - Upon submission, `boostRequested` is set to `true`, `boostRequestedAt` recorded.
  - Instantly raises priority level to `CRITICAL` in District Admin, State Admin, and Operator Financial Queues.

---

## 8. User Workflows across All 6 System Roles

```
               KRISHI FLOW MULTI-ROLE SYSTEM WORKFLOWS
  
  FARMER               CENTRE OPERATOR      QUALITY INSPECTOR    ADMIN (DIST/STATE)
  ──────               ───────────────      ─────────────────    ──────────────────
  1. Mobile OTP Login  1. Shift Dashboard   1. Inspection Queue  1. Congestion Heat Map
  2. KYC Verification  2. QR / Manual Scan  2. Sample Testing    2. Action Recommendations
  3. AI Recs & Booking 3. Check-In & Queue  3. Moisture/FM/Grain 3. Throughput Charts
  4. QR Token Pass     4. Weighbridge Gross 4. Grade A/B/C/Rej   4. Boost Request Audit
  5. Live Queue Track  5. Discrepancy Check 5. Decision Submit   5. Master Data Config
  6. 9-Stage Timeline  6. Incident Report   6. Deduction Compute
  7. Payment & Boost   7. Handover to Pay
```

### 8.1 FARMER Workflow
1. **Authentication**: Enter mobile number $\to$ enter 6-digit OTP $\to$ complete KYC with Aadhaar & Kisan ID.
2. **Centre Discovery & Booking**:
   - View map of nearby centres with real-time congestion badges.
   - View AI recommended centre with "Why we recommend this" rationale.
   - Select Crop, Quantity, and Vehicle Type.
   - Choose Small Quantity (direct slot) or Large Quantity (PACS visit request).
3. **Arrival & Queue Management**:
   - Receive scannable QR token pass with calculated arrival window.
   - Monitor live queue board on phone with real-time ETA updates.
   - Receive push notifications if equipment breaks down or wait times shift.
4. **Procurement & Payment**:
   - Track live 9-stage progression as vehicle moves through check-in, weighing, and inspection.
   - Review quality grade and weight slip.
   - View detailed MSP payout breakdown in Payment Tracker.
   - Trigger Payment Boost Request if payment exceeds 48-hour SLA.

### 8.2 CENTRE OPERATOR Workflow
1. **Daily Intake Dashboard**: View total scheduled bookings, checked-in vehicles, and open slots.
2. **Check-In Station**: Scan farmer's QR token using camera simulation or enter Booking ID manually $\to$ marks `CHECKED_IN` and generates token number.
3. **Weighing Station**: Input Gross Weight and Tare Weight $\to$ system calculates Net Weight $\to$ if discrepancy $>20\%$, review discrepancy alert modal and record reason.
4. **Incident & Queue Controller**:
   - Report operational incident (e.g. toggle "Weighing Scale #1 Breakdown", $+30$ min delay).
   - Watch automated real-time queue recalculation.
   - Manage late arrivals / mark no-shows after grace period.
5. **Payment Coordination**: View completed procurements and monitor farmer payment boost requests.

### 8.3 QUALITY INSPECTOR Workflow
1. **Inspection Queue**: View lots waiting at the testing bay after weighbridge clearance.
2. **Digital Quality Form**:
   - Enter measured Moisture %, Foreign Material %, Damaged Grain %.
   - System auto-computes Grade (Grade A, Grade B, Grade C, or Rejected).
3. **Decision & Sign-Off**:
   - Select Decision (`ACCEPT`, `PARTIAL_ACCEPT`, `REJECT`, `REINSPECT`).
   - System calculates applicable quality cut deductions.
   - Submit digital inspection certificate $\to$ advances booking to `PROCUREMENT_ACCEPTED`.

### 8.4 DISTRICT ADMIN Workflow
1. **District Overview**: Monitor aggregated tonnage procured, active farmer count, and total disbursements.
2. **Congestion Heat Map**: Inspect map markers across all district centres (Green/Yellow/Red/Grey).
3. **Decision Support & Redirection**:
   - Review "ACTION RECOMMENDED" cards (e.g. redirect load from 95% congested centre to 38% congested centre).
   - Broadcast capacity adjustments and inter-centre advisories.
4. **Discrepancy & Escalation Monitoring**: Review high-severity weighing discrepancies and farmer payment boost escalations.

### 8.5 STATE ADMIN Workflow
1. **State-Level Analytics**: Statewide procurement targets vs. actuals across all districts.
2. **Supply Chain Bottleneck Analysis**: Identify districts with recurring equipment failures or high average wait times.
3. **Financial & MSP Pipeline Monitoring**: Track total State MSP disbursement budget, pending bank batches, and SLA compliance rates.

### 8.6 SUPER ADMIN Workflow
1. **Master Configuration**: Configure crops, base MSP rates, and standard quality tolerance limits.
2. **Centre Provisioning**: Add/edit procurement centres, geolocations, capacity limits, and operating equipment.
3. **User & Role Management**: Manage user accounts, role elevations, and audit logs.

---

## 9. Small vs. Large Quantity Farmer Bifurcation Architecture

```
                                Farmer Booking Request
                                (Crop, Quantity, Vehicle)
                                          │
                         Is Quantity > 50 Q OR Requested Visit?
                                          │
                         ┌────────────────┴────────────────┐
                         │                                 │
                   NO (<= 50 Q)                       YES (> 50 Q)
                         │                                 │
                 [Small Farmer Flow]               [Large Farmer Flow]
                         │                                 │
             1. AI Centre Recommendation           1. PACS Farm Gate Visit Request
             2. Select Time Slot                   2. Provide Farm Geo-Location & Survey #
             3. Instant Booking Confirmed          3. Operator Assigns Inspection Officer
             4. Generates Scannable QR Pass        4. On-Farm Quantity & Quality Verification
             5. Self-Transport Arrival             5. Official Multi-Lot Slot Issued
             6. Self / Standard Check-in           6. Dedicated Priority Intake Window
```

### Key Differences:
- **Small Farmer Flow**: Optimized for rapid, autonomous self-service. Generates instant arrival windows and QR passes for local tractor/trolley transit.
- **Large Farmer Flow**: Prevents centre gridlock caused by unexpected multi-truck loads. Sends PACS field officers to verify bulk tonnage on-site before issuing coordinated multi-vehicle intake slots.

---

## 10. Real-Time WebSocket & Incident Recalculation Engine

### 10.1 Event Architecture (Socket.IO / Real-Time Channel)
- **`queue:update`**: Broadcasts current serving token, queue positions, and updated wait times per centre.
- **`incident:reported`**: Broadcast when an operator logs an operational incident.
- **`incident:resolved`**: Broadcast when a breakdown is fixed.
- **`booking:status_change`**: Targeted event notifying farmer when their booking moves between any of the 9 stages.
- **`notification:new`**: In-app push notification trigger for the farmer.

### 10.2 Disruption Recalculation Sequence ($\le 5$ Seconds SLA)
1. **Trigger**: Operator clicks *"Report Breakdown"* (e.g. Weighbridge Down, $+30$ min delay).
2. **Engine Processing**:
   - Backend queries all active `QueueEntry` records for the centre with status `WAITING` or `CALLED`.
   - Iterates through entries in order of `queuePosition`.
   - Adds $\Delta T_{\text{incident}}$ to each entry's `estimatedWaitTimeMinutes`.
   - Recalculates `arrivalWindowEnd` for future bookings scheduled within the incident window.
3. **Broadcast**:
   - Emits `queue:update` payload with updated ETAs.
   - Emits `incident:reported` to all subscribed clients.
   - Dispatches in-app notifications to affected farmers.
4. **Client UI Reaction**:
   - Farmer queue card immediately updates ETA counter with an amber badge *"Delay Alert: +30 mins due to Weighbridge Breakdown"*.
   - Operator queue board highlights affected tokens.

---

## 11. Offline Resilience, Caching & Network Status Subsystem

### 11.1 Client-Side Offline Storage
- **Cached Items**:
  - Active Booking details (`id`, `bookingNumber`, `crop`, `quantity`, `centreName`, `arrivalWindow`).
  - Scannable QR Token SVG / Data URL (guaranteed offline access).
  - Last known Queue Token Number (`TK-WHT-042`) and Queue Position.
  - Farmer KYC Profile and Bank details.

### 11.2 Visual Network Status Indicator
A global status pill rendered in the navigation header:
- 🟢 **`ONLINE`**: Active network connection and connected WebSocket.
- 🔵 **`SYNCING`**: Reconnecting and fetching latest queue deltas.
- 🟠 **`OFFLINE`**: Network disconnected; offline pass mode active.
- 🕒 **`LAST SYNCED: 10:42 AM`**: Exact timestamp of last successful server handshake.

### 11.3 Offline UX Guarantee
When offline, the farmer can freely view their scannable QR pass at the Mandi gate without requiring mobile data. Form submissions (like booking a new slot) are gracefully paused with a prompt: *"You are currently offline. Booking will submit automatically when connection is restored."*

---

## 12. Multilingual & Internationalization (i18n) Architecture

- **Supported Languages**: English (`en`) and Hindi (`hi`), structured for easy extension to Marathi, Punjabi, Telugu, etc.
- **Architecture**:
  - React Context / i18n hook (`useTranslation()`) providing instant zero-reload UI text toggling.
  - Comprehensive translation dictionaries covering all navigation, forms, status badges, mathematical metrics, and error messages.
  - Dynamic bilingual notifications stored with both English and Hindi titles and messages.

---

## 13. Demo Flow Step-by-Step Verification Protocol (< 5 Minutes)

| Step # | Time Window | Role / Actor | Screen / View | Action & Verification Points | Expected Result |
|---|---|---|---|---|---|
| **Step 1** | 0:00 – 0:45 | **Farmer** | Login & KYC | 1. Enter demo farmer phone (`9876543210`) $\to$ click "Verify OTP".<br>2. Complete/verify Aadhaar (`1234 5678 9012`) & Kisan ID (`KISAN-IND-9021`).<br>3. Verify instant KYC verified badge. | Farmer profile verified; redirected to Farmer Portal. |
| **Step 2** | 0:45 – 1:30 | **Farmer** | Booking & Discovery | 1. Navigate to "Book Slot".<br>2. Inspect AI Recommended Centre with "Why we recommend this" explanation.<br>3. Select Crop (Wheat), Quantity (25 Q), Vehicle (Tractor).<br>4. Confirm booking $\to$ inspect Scannable QR Token & Arrival Window. | Booking confirmed; QR Token `TK-WHT-042` generated; slot reserved. |
| **Step 3** | 1:30 – 2:30 | **Farmer + Operator** | Live Queue & Incident | 1. Open Live Queue view on Farmer screen.<br>2. In a second browser tab, log in as **Centre Operator**.<br>3. In Operator Dashboard, click "Report Incident" $\to$ select "Weighing Machine Breakdown (+30 min)".<br>4. Switch to Farmer tab $\to$ verify ETA recalculates live ($\le 5$s) with incident banner and push alert. | Real-time WebSocket incident propagation verified without page reload. |
| **Step 4** | 2:30 – 3:30 | **Operator + Inspector** | Check-in, Weigh & Inspect | 1. As Operator, simulate scanning QR code / enter Booking ID $\to$ click "Check-In".<br>2. Enter Gross Weight (3,500 kg) & Tare Weight (1,000 kg) $\to$ Net 25 Q.<br>3. Switch to **Quality Inspector** portal $\to$ enter Moisture (11.5%), FM (0.5%), Damaged (1.2%) $\to$ Grade A calculated $\to$ click "Accept". | Booking progresses through 9-stage stepper to `PROCUREMENT_ACCEPTED`. |
| **Step 5** | 3:30 – 4:15 | **Admin** | Admin Analytics | 1. Log in as **District / State Admin**.<br>2. View Congestion Heat Map with Green/Yellow/Red centre markers.<br>3. Inspect "ACTION RECOMMENDED" card ("Redirect 25% traffic from Centre A to Centre B").<br>4. Inspect hourly throughput charts. | Admin decision-support system and heat map fully interactive. |
| **Step 6** | 4:15 – 5:00 | **Farmer** | Payment & Boost | 1. Switch back to Farmer Portal $\to$ open "Payment Tracker".<br>2. Inspect gross MSP payout, zero deductions, and net payable amount.<br>3. Click "Request Payment Boost" $\to$ enter reason.<br>4. Switch to Operator/Admin view $\to$ verify HIGH PRIORITY boost alert badge appears. | Complete end-to-end procurement and payment lifecycle demonstrated. |

---

## 14. Conclusion & Handover Note

This specification document constitutes the exhaustive, authoritative blueprint for the implementation of **KRISHI FLOW**. All mathematical models, data schemas, role permissions, and user flows are fully resolved, eliminating any implementation ambiguities. Proceed to system architecture and full-stack implementation in accordance with these mined specifications.
