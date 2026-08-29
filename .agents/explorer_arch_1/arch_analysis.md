# KRISHI FLOW — Complete Technical Architecture & Implementation Blueprint
**Problem Statement ID**: 26032 (Smart India Hackathon 2026)  
**System Name**: KRISHI FLOW — Intelligent Agricultural Procurement Orchestration Platform  
**Target Delivery**: Browser-Accessible Web Portal (Zero Terminal Friction, Single Command Start)  
**Document Type**: Architectural Specification & Technical Blueprint  

---

## Executive Summary & Architectural Vision

KRISHI FLOW is an end-to-end intelligent agricultural procurement orchestration platform designed to eliminate farmer wait times, eradicate procurement centre congestion, and provide complete transparency from crop booking to direct MSP disbursement.

The architecture is built upon a **Unified Next.js 14+ Full-Stack App Router** foundation integrated with a **Custom Node.js HTTP Server wrapping Socket.IO** for sub-5-second real-time event distribution. It features a fully normalized **Prisma ORM data layer (SQLite for zero-dependency local launch, swappable to PostgreSQL)**, a **Mock Government Registry verification engine** for Aadhaar and Kisan IDs, a **5-Factor AI Centre Recommendation Engine**, a **9-Stage Procurement Lifecycle State Machine**, an **AI-driven ETA and Incident Recalculation Engine**, **Bilingual i18n (English + Hindi)**, and a **4-State Offline-Resilient PWA/LocalStorage Caching Layer**.

```
+-------------------------------------------------------------------------------------------------------------+
|                                           KRISHI FLOW WEB PORTAL                                            |
|  +-------------------+  +--------------------+  +----------------------+  +------------------------------+  |
|  |   Farmer Portal   |  |  Operator Portal   |  | Quality Inspector    |  | Admin Analytics Dashboard    |  |
|  |  (Mobile-First)   |  |  (Tablet/Desktop)  |  |    (Lab Terminal)    |  |  (Desktop Command Centre)   |  |
|  +-------------------+  +--------------------+  +----------------------+  +------------------------------+  |
|          |                         |                        |                           |                   |
|  +-------------------------------------------------------------------------------------------------------+  |
|  |          App Router Layouts, RBAC Route Guards, Language Provider (EN/HI), Offline Status Bar         |  |
|  +-------------------------------------------------------------------------------------------------------+  |
|          |                         |                        |                           |                   |
|  +-------------------+  +--------------------+  +----------------------+  +------------------------------+  |
|  | Smart Booking &   |  | Live Queue Engine  |  | 9-Stage Procurement  |  | Congestion Heatmap &         |  |
|  | QR Token Gen      |  | & Sub-5s ETA Recalc|  | & Weighing Discrep.  |  | Recommendation Decision      |  |
|  +-------------------+  +--------------------+  +----------------------+  +------------------------------+  |
+-------------------------------------------------------------------------------------------------------------+
                                       |                                    |
          HTTP / REST API Calls        |                                    |  WebSocket Events (Socket.IO)
                                       v                                    v
+-------------------------------------------------------------------------------------------------------------+
|                                    NEXT.JS SERVER + SOCKET.IO WRAPPER                                       |
|  - RESTful Service Layer: Auth, KYC, Centres, Booking, Queue, Weighing, Quality, Payment, Incidents, Notify |
|  - Real-Time Hub: Room-based socket broadcasting (centre:{id}, booking:{id}, admin:analytics, farmer:{id}) |
|  - Edge Middleware: Role-based route protection for 6 distinct roles                                        |
+-------------------------------------------------------------------------------------------------------------+
                                       |
                                       v
+-------------------------------------------------------------------------------------------------------------+
|                                    PRISMA ORM & PERSISTENCE LAYER                                           |
|  - Normalized relational schema with 14 models, relational constraints, cascading audits, and indexes       |
|  - Mock Government Registry (Aadhaar + Kisan ID pre-validation)                                             |
|  - Seed Data: 10 Centres, 4 Crops (MSP), 25+ Farmers, Active Incidents, Varied 9-Stage Bookings, Payments   |
+-------------------------------------------------------------------------------------------------------------+
```

---

## 1. Web Portal Architecture & UI/UX Design

### 1.1 Technology Stack Selection
- **Framework**: Next.js 14+ (App Router architecture with React Server Components + Client Components where interactivity is required).
- **Language**: TypeScript (strict mode enabled across all layers).
- **Styling**: Tailwind CSS with custom design tokens tuned for Indian agricultural/government portal aesthetic:
  - *Primary Theme*: Vibrant Agri-Emerald (`#059669`, `#10B981`, `#34D399`)
  - *Secondary Theme*: Harvest Gold / Amber (`#D97706`, `#F59E0B`, `#FDE68A`)
  - *Surface / Neutral*: Slate (`#0F172A`, `#1E293B`, `#F8FAFC`)
  - *Status Alerting*: Congestion Red (`#EF4444`), Warning Amber (`#F59E0B`), Operational Green (`#10B981`), Maintenance Grey (`#64748B`)
- **Component Primitives**: Radix UI primitives with shadcn/ui modular components.
- **Icons**: `lucide-react` (high legibility, SVG-based, tree-shakeable).
- **Animations**: `framer-motion` (used intentionally for queue rank shifts, timeline milestone completions, modal slides, and pulse alerts).
- **Form Management**: `react-hook-form` with `zod` schema validation for zero-defect client and server validation.
- **State Management**:
  - *Server State*: `@tanstack/react-query` (TanStack Query) for automatic caching, background re-validation, and optimistic mutations.
  - *Client State*: Lightweight React Context (`AuthContext`, `LanguageContext`, `OfflineContext`, `SocketContext`).
- **QR Code Engine**: `qrcode.react` / `qrcode` (for generating scannable SVG/Canvas QR tokens and camera/simulated scanning on operator tablets).

### 1.2 Responsive Layout & Viewport Strategy
- **Farmer Portal**: **Mobile-First** design (320px – 768px optimized).
  - Bottom navigation bar on mobile viewports for one-thumb reachability (Home, Book Slot, My Queue, Payments, Profile).
  - High-contrast touch targets ($\ge 48\text{px}$) with large numerical displays for token numbers and arrival times.
  - Multilingual voice/text clarity with Hindi transliteration and intuitive icons.
- **Centre Operator Portal**: **Tablet & Desktop** optimized (768px – 1440px).
  - Split-pane layout: Live Queue Stream on the left; Scanner & Weighing Action Terminal on the right.
  - Fast-action hotkeys and instant manual ID fallback for QR scan failures.
- **Quality Inspector Portal**: **Lab Terminal** layout.
  - Form-centric grading interface with immediate automatic deduction and payable quantity preview.
- **Admin Analytics Dashboard**: **Desktop Command Centre** layout (1024px – 1920px).
  - Live KPI cards, interactive SVG/Leaflet Congestion Heatmap, hourly throughput bar charts, queue bottleneck metrics, and algorithmic decision cards.

---

## 2. Real-Time Infrastructure (WebSockets / Socket.IO)

### 2.1 Server Architecture: Custom HTTP Server Wrapper
To ensure seamless persistent WebSocket connections within Next.js App Router without serverless connection dropouts, KRISHI FLOW utilizes a unified Node.js HTTP server wrapper (`server.ts` or `server.js`):

```typescript
// server.ts / server.js conceptual architecture
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { registerSocketHandlers } from './src/lib/socket/socketHandler';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const PORT = process.env.PORT || 3000;

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(httpServer, {
    path: '/api/socket',
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  // Global socket accessor for API routes and server services
  (global as any).io = io;

  registerSocketHandlers(io);

  httpServer.listen(PORT, () => {
    console.log(`[KRISHI FLOW] Web Portal running at http://localhost:${PORT}`);
  });
});
```

### 2.2 Room Architecture & Event Payloads

#### Socket Rooms
| Room Name | Target Audience | Purpose |
|---|---|---|
| `centre:{centreId}` | Farmers booked at centre, Centre Operators, District Admins | Centre queue updates, incident alerts, local delays |
| `booking:{bookingId}` | Specific Farmer & Operator handling booking | Direct stage progression, QR check-in acknowledgement |
| `farmer:{farmerId}` | Individual Farmer | Personal push notifications, payment updates, delay warnings |
| `admin:analytics` | District Admins, State Admins, Super Admins | Statewide congestion changes, throughput updates, recommendations |

#### Event Definitions & Schemas
1. `queue:updated`:
   ```json
   {
     "centreId": "centre-karnal-01",
     "totalWaiting": 14,
     "averageWaitMinutes": 35,
     "activeServingToken": "TK-104",
     "entries": [
       { "token": "TK-104", "bookingId": "KF-2026-0081", "farmerName": "Ram Singh", "crop": "Wheat", "quantity": 40, "status": "PROCESSING", "etaMinutes": 0, "stage": "PRODUCE_WEIGHED" },
       { "token": "TK-105", "bookingId": "KF-2026-0082", "farmerName": "Suresh Patel", "crop": "Wheat", "quantity": 25, "status": "CALLED", "etaMinutes": 8, "stage": "IDENTITY_VERIFIED" },
       { "token": "TK-106", "bookingId": "KF-2026-0083", "farmerName": "Harpreet Kaur", "crop": "Paddy", "quantity": 60, "status": "WAITING", "etaMinutes": 22, "stage": "CHECKED_IN" }
     ],
     "timestamp": "2026-08-26T10:15:00Z"
   }
   ```
2. `incident:reported` / `incident:resolved`:
   ```json
   {
     "incidentId": "inc-009",
     "centreId": "centre-karnal-01",
     "type": "WEIGHING_MACHINE_DOWN",
     "severity": "HIGH",
     "description": "Weighbridge #1 load cell calibration error",
     "delayImpactMinutes": 25,
     "recalculatedEtas": [
       { "bookingId": "KF-2026-0083", "previousEta": "10:35 AM", "newEta": "11:00 AM", "deltaMinutes": 25 }
     ],
     "timestamp": "2026-08-26T10:15:02Z"
   }
   ```
3. `procurement:stage_changed`:
   ```json
   {
     "bookingId": "KF-2026-0081",
     "previousStage": "IDENTITY_VERIFIED",
     "currentStage": "PRODUCE_WEIGHED",
     "actor": "Suraj Meena (Operator)",
     "timestamp": "2026-08-26T10:18:30Z",
     "details": { "grossWeight": 42.5, "tareWeight": 2.5, "netWeight": 40.0 }
   }
   ```

### 2.3 Sub-5-Second ETA Recalculation Engine
When an operational incident occurs or a queue delay is detected:
1. Operator submits incident (e.g. `WEIGHING_MACHINE_DOWN` at Karnal PACS).
2. Server executes `recalculateCentreETAs(centreId)`:
   - Queries active bookings in status `CONFIRMED`, `CHECKED_IN`, `IN_PROGRESS` ordered by `queuePosition`.
   - Computes capacity factor: $\text{ActiveThroughput} = \text{BaseSpeed} \times (1 - \text{CapacityReductionPercentage})$.
   - Evaluates dynamic formula for each booking $i$:
     $$\text{EstimatedWait}_i = \sum_{k=1}^{i-1} \left( \frac{Q_k \times \text{Factor}_{\text{crop}}}{N_{\text{active\_scales}}} + T_{\text{insp}} \right) + \Delta T_{\text{incident\_penalty}}$$
   - Updates `Booking.dynamicEstimatedArrival` and `QueueEntry.etaMinutes` in database transaction.
3. Server emits `incident:reported` and `queue:updated` over `io.to('centre:' + centreId)` within **$< 1.5$ seconds** (well within the $\le 5$ second acceptance requirement).
4. Connected farmer clients receive WebSocket event, trigger sound/toast alert, and smoothly animate updated ETA cards via Framer Motion.

---

## 3. Database Schema & Data Modeling (Prisma ORM)

### 3.1 Database Provider Strategy
- **Development & Hackathon Demo**: SQLite (`file:./dev.db`) for 100% zero-configuration, instant clone-and-run portability across any OS.
- **Production Option**: PostgreSQL with connection pooling (Prisma schema uses standard types compatible with both SQLite and Postgres).

### 3.2 Complete Entity-Relationship Model (14 Models)

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  FARMER
  CENTRE_OPERATOR
  QUALITY_INSPECTOR
  DISTRICT_ADMIN
  STATE_ADMIN
  SUPER_ADMIN
}

enum KycStatus {
  PENDING
  VERIFIED
  REJECTED
}

enum CentreStatus {
  ACTIVE
  CONGESTED
  MAINTENANCE
  INACTIVE
}

enum TransportType {
  SELF_TRANSPORT
  TEAM_VISIT
}

enum BookingStatus {
  PENDING_VISIT
  CONFIRMED
  CHECKED_IN
  IN_PROGRESS
  COMPLETED
  CANCELLED
  NO_SHOW
  RESCHEDULED
}

enum QueueStatus {
  WAITING
  CALLED
  PROCESSING
  COMPLETED
  SKIPPED
  NO_SHOW
}

enum ProcurementStage {
  SLOT_BOOKED
  CHECKED_IN
  IDENTITY_VERIFIED
  DOCUMENTS_VERIFIED
  PRODUCE_WEIGHED
  QUALITY_INSPECTED
  PROCUREMENT_ACCEPTED
  PAYMENT_PROCESSING
  PAYMENT_COMPLETED
}

enum InspectionDecision {
  ACCEPT
  PARTIAL_ACCEPT
  REJECT
  REINSPECT
}

enum QualityGrade {
  GRADE_A
  GRADE_B
  GRADE_C
  REJECTED
}

enum PaymentStatus {
  NOT_INITIATED
  INITIATED
  PROCESSING
  SUCCESSFUL
  FAILED
}

enum BoostStatus {
  NONE
  PENDING
  APPROVED
  EXPEDITED
}

enum IncidentType {
  EQUIPMENT_FAILURE
  WEIGHING_MACHINE_DOWN
  MOISTURE_METER_DOWN
  STAFF_SHORTAGE
  WEATHER_DISRUPTION
  POWER_OUTAGE
  SYSTEM_GLITCH
  CROWD_SURGE
}

enum IncidentSeverity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum NotificationType {
  BOOKING_CONFIRMED
  QUEUE_APPROACHING
  DELAY_ALERT
  INCIDENT_ALERT
  STAGE_COMPLETED
  PAYMENT_UPDATE
  GENERAL
}

model User {
  id               String            @id @default(cuid())
  phone            String            @unique
  name             String
  role             Role              @default(FARMER)
  language         String            @default("en")
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt
  farmerProfile    FarmerProfile?
  operatorCentres  ProcurementCentre[] @relation("CentreOperators")
  inspections      QualityInspection[]
  procurements     ProcurementRecord[]
  incidentsReported OperationalIncident[]
  notifications    Notification[]
  auditLogs        AuditLog[]
}

model FarmerProfile {
  id                 String     @id @default(cuid())
  userId             String     @unique
  user               User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  aadhaarNumber      String     // Stored masked e.g. "XXXX-XXXX-1234"
  kisanId            String     @unique // e.g. "KID-HR-2024-8891"
  village            String
  district           String
  state              String
  pincode            String
  bankAccountNumber  String
  ifscCode           String
  bankName           String
  landAreaAcres      Float      @default(5.0)
  kycStatus          KycStatus  @default(PENDING)
  kycVerifiedAt      DateTime?
  bookings           Booking[]
  payments           Payment[]
  createdAt          DateTime   @default(now())
  updatedAt          DateTime   @updatedAt
}

model GovRegistry {
  id                 String   @id @default(cuid())
  aadhaarNumber      String   @unique
  kisanId            String   @unique
  farmerName         String
  state              String
  district           String
  registeredLandAcres Float
  active             Boolean  @default(true)
}

model ProcurementCentre {
  id                     String              @id @default(cuid())
  name                   String
  code                   String              @unique
  latitude               Float
  longitude              Float
  address                String
  district               String
  state                  String
  capacityPerDayQuintals Float               @default(1000.0)
  currentLoadQuintals    Float               @default(0.0)
  processingSpeedPerHour Float               @default(100.0)
  operatingHours         String              @default("08:00 AM - 06:00 PM")
  activeCounters         Int                 @default(3)
  weighingMachinesTotal  Int                 @default(2)
  weighingMachinesActive Int                 @default(2)
  moistureMetersTotal    Int                 @default(2)
  moistureMetersActive   Int                 @default(2)
  status                 CentreStatus        @default(ACTIVE)
  operators              User[]              @relation("CentreOperators")
  cropsSupported         CentreCrop[]
  slots                  Slot[]
  bookings               Booking[]
  queueEntries           QueueEntry[]
  incidents              OperationalIncident[]
  procurementRecords     ProcurementRecord[]
  createdAt              DateTime            @default(now())
  updatedAt              DateTime            @updatedAt
}

model Crop {
  id                          String       @id @default(cuid())
  name                        String       @unique
  nameHindi                   String
  category                    String       // "Cereals", "Oilseeds", "Pulses"
  basePricePerQuintal         Float        // MSP Rate in INR
  moistureStandardMax         Float        @default(12.0)
  foreignMaterialMax          Float        @default(2.0)
  damagedGrainMax             Float        @default(3.0)
  baseProcessingMinutesPerQuintal Float   @default(0.8)
  centreCrops                 CentreCrop[]
  bookings                    Booking[]
  createdAt                   DateTime     @default(now())
}

model CentreCrop {
  id                   String            @id @default(cuid())
  centreId             String
  cropId               String
  centre               ProcurementCentre @relation(fields: [centreId], references: [id], onDelete: Cascade)
  crop                 Crop              @relation(fields: [cropId], references: [id], onDelete: Cascade)
  dailyQuotaQuintals   Float             @default(500.0)
  procuredTodayQuintals Float            @default(0.0)
  available            Boolean           @default(true)

  @@unique([centreId, cropId])
}

model Slot {
  id                    String            @id @default(cuid())
  centreId              String
  centre                ProcurementCentre @relation(fields: [centreId], references: [id], onDelete: Cascade)
  date                  String            // YYYY-MM-DD
  startTime             String            // HH:mm
  endTime               String            // HH:mm
  maxCapacityQuintals   Float
  bookedCapacityQuintals Float            @default(0.0)
  status                String            @default("AVAILABLE") // AVAILABLE, FULL, BLOCKED
  bookings              Booking[]
  createdAt             DateTime          @default(now())

  @@index([centreId, date])
}

model Booking {
  id                            String             @id @default(cuid())
  bookingNumber                 String             @unique // e.g. "KF-2026-0042"
  farmerId                      String
  farmer                        FarmerProfile      @relation(fields: [farmerId], references: [id], onDelete: Cascade)
  centreId                      String
  centre                        ProcurementCentre  @relation(fields: [centreId], references: [id])
  cropId                        String
  crop                          Crop               @relation(fields: [cropId], references: [id])
  slotId                        String?
  slot                          Slot?              @relation(fields: [slotId], references: [id])
  estimatedQuantityQuintals     Float
  actualQuantityQuintals        Float?
  vehicleType                   String             // "Tractor-Trolley", "Pickup Truck", "Bullock Cart", "Mini Van"
  transportType                 TransportType      @default(SELF_TRANSPORT)
  status                        BookingStatus      @default(CONFIRMED)
  currentStage                  ProcurementStage   @default(SLOT_BOOKED)
  qrToken                       String             @unique // Encoded token payload
  arrivalWindowStart            DateTime
  arrivalWindowEnd              DateTime
  estimatedProcessingTimeMinutes Int                @default(30)
  originalEstimatedArrival      DateTime
  dynamicEstimatedArrival       DateTime
  teamVisitScheduledAt          DateTime?
  teamVisitNotes                String?
  queueEntry                    QueueEntry?
  procurementRecord             ProcurementRecord?
  qualityInspection             QualityInspection?
  payment                       Payment?
  createdAt                     DateTime           @default(now())
  updatedAt                     DateTime           @updatedAt

  @@index([farmerId])
  @@index([centreId, status])
}

model QueueEntry {
  id             String            @id @default(cuid())
  bookingId      String            @unique
  booking        Booking           @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  centreId       String
  centre         ProcurementCentre @relation(fields: [centreId], references: [id])
  tokenNumber    String            // e.g. "TK-104"
  queuePosition  Int
  priorityScore  Float             @default(1.0)
  status         QueueStatus       @default(WAITING)
  currentStage   ProcurementStage  @default(CHECKED_IN)
  etaMinutes     Int               @default(0)
  checkInTime    DateTime          @default(now())
  calledTime     DateTime?
  completedTime  DateTime?
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt

  @@index([centreId, status])
}

model ProcurementRecord {
  id                            String            @id @default(cuid())
  bookingId                     String            @unique
  booking                       Booking           @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  centreId                      String
  centre                        ProcurementCentre @relation(fields: [centreId], references: [id])
  operatorId                    String
  operator                      User              @relation(fields: [operatorId], references: [id])
  grossWeightQuintals           Float
  tareWeightQuintals            Float
  netWeightQuintals             Float
  weightDiscrepancyPercentage   Float             @default(0.0)
  discrepancyFlagged            Boolean           @default(false)
  discrepancyResolved           Boolean           @default(false)
  discrepancyNotes              String?
  weighedAt                     DateTime          @default(now())
}

model QualityInspection {
  id                         String             @id @default(cuid())
  bookingId                  String             @unique
  booking                    Booking            @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  inspectorId                String
  inspector                  User               @relation(fields: [inspectorId], references: [id])
  moisturePercentage         Float
  foreignMaterialPercentage  Float
  damagedGrainPercentage     Float
  assignedGrade              QualityGrade
  decision                   InspectionDecision
  acceptedQuantityQuintals   Float
  rejectedQuantityQuintals   Float              @default(0.0)
  deductionPercentage        Float              @default(0.0)
  remarks                    String?
  inspectedAt                DateTime           @default(now())
}

model Payment {
  id                     String        @id @default(cuid())
  bookingId              String        @unique
  booking                Booking       @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  farmerId               String
  farmer                 FarmerProfile @relation(fields: [farmerId], references: [id])
  grossAmount            Float
  deductionAmount        Float         @default(0.0)
  netPayableAmount       Float
  mspRateApplied         Float
  paymentStatus          PaymentStatus @default(NOT_INITIATED)
  transactionReference   String?
  paymentGateway         String        @default("PFMS_DIRECT_DBT")
  initiatedAt            DateTime?
  completedAt            DateTime?
  boostRequested         Boolean       @default(false)
  boostRequestedAt       DateTime?
  boostReason            String?
  boostStatus            BoostStatus   @default(NONE)
  createdAt              DateTime      @default(now())
  updatedAt              DateTime      @updatedAt

  @@index([farmerId, paymentStatus])
}

model OperationalIncident {
  id                           String            @id @default(cuid())
  centreId                     String
  centre                       ProcurementCentre @relation(fields: [centreId], references: [id])
  reporterId                   String
  reporter                     User              @relation(fields: [reporterId], references: [id])
  incidentType                 IncidentType
  severity                     IncidentSeverity  @default(MEDIUM)
  description                  String
  impactDelayMinutesPerSlot    Int               @default(15)
  capacityReductionPercentage  Float             @default(25.0)
  status                       String            @default("ACTIVE") // ACTIVE, RESOLVED
  reportedAt                   DateTime          @default(now())
  resolvedAt                   DateTime?

  @@index([centreId, status])
}

model Notification {
  id           String           @id @default(cuid())
  userId       String
  user         User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  title        String
  titleHindi   String
  message      String
  messageHindi String
  type         NotificationType
  read         Boolean          @default(false)
  metadata     String?          // JSON metadata e.g. { "bookingId": "...", "link": "/queue" }
  createdAt    DateTime         @default(now())

  @@index([userId, read])
}

model AuditLog {
  id         String   @id @default(cuid())
  userId     String?
  user       User?    @relation(fields: [userId], references: [id])
  action     String   // e.g. "CHECK_IN", "WEIGH_RECORDED", "INCIDENT_REPORTED"
  entityType String   // e.g. "Booking", "Payment", "Incident"
  entityId   String
  details    String?  // JSON string
  ipAddress  String?
  timestamp  DateTime @default(now())
}
```

### 3.3 Realistic Demo Seeding Strategy
The database seed script (`prisma/seed.ts`) populates an immediate rich state:
1. **Mock Government Registry (`GovRegistry`)**: 30 verified Aadhaar + Kisan ID combinations with verified names and land records.
2. **10 Strategic Procurement Centres**:
   - *Centre 1*: Karnal Central APMC (Karnal, Haryana) — Capacity 1200Q, High Load (92% - RED CONGESTED), 1 active incident (Scale #2 offline).
   - *Centre 2*: Nilokheri Cooperative Society (Karnal, Haryana) — Capacity 800Q, Low Load (38% - GREEN), recommended for rerouting.
   - *Centre 3*: Ludhiana Main Mandi (Ludhiana, Punjab) — Capacity 1500Q, Moderate Load (68% - YELLOW).
   - *Centre 4*: Khanna Grain Market (Ludhiana, Punjab) — Capacity 2000Q, GREEN (45%).
   - *Centre 5*: Indore Agricultural Mandi (Indore, MP) — Capacity 1000Q, RED (88%).
   - *Centre 6*: Sanwer PACS Sub-Centre (Indore, MP) — Capacity 600Q, GREEN (30%).
   - *Centre 7*: Nashik District Mandi (Nashik, Maharashtra) — Capacity 900Q, YELLOW (72%).
   - *Centre 8*: Warangal Grain Complex (Warangal, Telangana) — Capacity 1100Q, GREEN (52%).
   - *Centre 9*: Kota Krishi Upaj Mandi (Kota, Rajasthan) — Capacity 1300Q, YELLOW (65%).
   - *Centre 10*: Jabalpur Rice Procurement Hub (Jabalpur, MP) — Capacity 750Q, GREY (MAINTENANCE).
3. **4 Core Crops with 2026 Government MSP Rates**:
   - *Wheat (गेहूं)*: ₹2,275 / Quintal (Moisture limit: 12.0%, Foreign: 2.0%, Damaged: 3.0%)
   - *Paddy / Rice (धान)*: ₹2,183 / Quintal (Moisture limit: 17.0%, Foreign: 1.0%, Damaged: 4.0%)
   - *Maize (मक्का)*: ₹2,090 / Quintal (Moisture limit: 14.0%, Foreign: 2.0%, Damaged: 3.0%)
   - *Soybean (सोयाबीन)*: ₹4,600 / Quintal (Moisture limit: 12.0%, Foreign: 2.0%, Damaged: 2.0%)
4. **25+ Farmers with Pre-Seeded Realistic Bookings**:
   - 4 bookings in `SLOT_BOOKED` (Upcoming)
   - 4 bookings in `CHECKED_IN` / `WAITING` (In Virtual Queue)
   - 3 bookings in `PRODUCE_WEIGHED` (1 with flagged $>20\%$ quantity discrepancy for demo alert)
   - 3 bookings in `QUALITY_INSPECTED` (Grade A, Grade B, and 1 Partial Accept)
   - 4 bookings in `PAYMENT_PROCESSING` (with 2 Payment Boost Requests: 1 pending, 1 expedited)
   - 5 bookings in `PAYMENT_COMPLETED` (with transaction references e.g. `PFMS-2026-TXN-88192`)
   - 2 bookings in `PENDING_VISIT` (Large quantity farmer team-visit workflow)
   - 2 bookings in `NO_SHOW` (Available for instant 1-click reschedule demo)

---

## 4. Authentication, KYC Verification & Role-Based Access Control

### 4.1 Mock OTP & KYC Verification Architecture
To ensure zero friction during hackathon evaluation while maintaining authentic user flow:
1. **Phone Input**: Farmer enters 10-digit Indian mobile number.
2. **OTP Step**: Generates 6-digit OTP. In demo mode, the active OTP (`123456`) is clearly displayed on the screen with a "Quick Fill Demo OTP" button.
3. **KYC Verification Step**:
   - Farmer enters 12-digit Aadhaar Number (`1234 5678 9012`) and Kisan ID (`KID-HR-2024-8891`).
   - Server verifies combination against `GovRegistry`.
   - *If Match*: Auto-populates farmer name, registered village/district, and verified land acres; marks `kycStatus = VERIFIED`.
   - *If Mismatch*: Returns friendly error *"Aadhaar and Kisan ID do not match Ministry of Agriculture Registry records. Please check your credentials."* and provides a dropdown of pre-configured demo test farmers for instant testing.

### 4.2 Demo Credentials for All 6 Roles

| Role | Demo Phone / Login | Mock Password / OTP | Purpose / Landing Page |
|---|---|---|---|
| `FARMER` | `9876543210` | `123456` | `/dashboard` — Mobile-first booking, live queue, payment tracker |
| `CENTRE_OPERATOR` | `9876543220` | `123456` | `/operator/dashboard` — QR scanner, queue call, weighing console |
| `QUALITY_INSPECTOR` | `9876543230` | `123456` | `/inspector/dashboard` — Grain moisture, foreign matter, grading form |
| `DISTRICT_ADMIN` | `9876543240` | `123456` | `/admin/analytics` — District queue congestion, centre re-allocation |
| `STATE_ADMIN` | `9876543250` | `123456` | `/admin/analytics` — Statewide MSP disbursement, macro heatmaps |
| `SUPER_ADMIN` | `9876543260` | `123456` | `/admin/analytics` — System settings, master crops, full audit logs |

*Note*: A persistent top-bar **"Demo Quick Role Switcher"** allows the evaluator to jump between any of the 6 roles in 1 click without retyping credentials.

### 4.3 Route Protection Middleware (`middleware.ts`)
Next.js Edge Middleware checks signed session tokens / cookies and role permissions:
- `/dashboard`, `/book`, `/queue`, `/timeline/*`, `/payment` $\rightarrow$ `FARMER`
- `/operator/*` $\rightarrow$ `CENTRE_OPERATOR`, `DISTRICT_ADMIN`, `SUPER_ADMIN`
- `/inspector/*` $\rightarrow$ `QUALITY_INSPECTOR`, `SUPER_ADMIN`
- `/admin/*` $\rightarrow$ `DISTRICT_ADMIN`, `STATE_ADMIN`, `SUPER_ADMIN`
- Unauthenticated requests are seamlessly redirected to `/login?callbackUrl=...`.

---

## 5. Core Algorithms & Business Logic

### 5.1 Smart Centre Recommendation Engine (5+ Weighted Factors)
When a farmer searches for procurement centres, the recommendation engine calculates a normalized suitability score ($S \in [0, 100]$):

$$S = 100 - \left( w_1 \cdot \hat{D} + w_2 \cdot \hat{Q} + w_3 \cdot \hat{W} + w_4 \cdot \hat{C} + w_5 \cdot \hat{H} - w_6 \cdot \hat{S}_{\text{proc}} \right)$$

Where:
- $\hat{D}$: Normalized Distance ($\text{km} / 50\text{km}$) — weight $w_1 = 25$
- $\hat{Q}$: Current Queue Length ($\text{Farmers Waiting} / 30$) — weight $w_2 = 20$
- $\hat{W}$: Estimated Wait Time ($\text{Minutes} / 120\text{min}$) — weight $w_3 = 20$
- $\hat{C}$: Centre Congestion Ratio ($\text{Current Load} / \text{Daily Capacity}$) — weight $w_4 = 15$
- $\hat{H}$: Historical Delay Incident Frequency — weight $w_5 = 10$
- $\hat{S}_{\text{proc}}$: Processing Speed Bonus ($\text{Q/hour} / 150$) — weight $w_6 = 10$

**"Why We Recommend This" Transparency Card**:
The UI renders a badge breakdown:
- *"Lowest Wait Time (18 mins vs avg 45 mins)"*
- *"Closest Proximity (4.2 km)"*
- *"High Throughput (2 weighing bridges operational)"*
- *"Optimal Capacity (Only 38% full today)"*

### 5.2 Dynamic Slot Arrival Window & Processing Time Formula
Processing time calculation per booking:

$$\text{Processing Time (mins)} = T_{\text{base}} + (Q \times F_{\text{crop}}) + T_{\text{insp}} + \Delta T_{\text{vehicle}} + \Delta T_{\text{penalty}}$$

- $T_{\text{base}} = 10\text{ minutes}$ (entry check-in & initial paper check)
- $Q \times F_{\text{crop}}$: Quantity factor (e.g. $40\text{Q} \times 0.8\text{ mins/Q} = 32\text{ mins}$)
- $T_{\text{insp}} = 8\text{ minutes}$ (sampling, moisture measurement, grading)
- $\Delta T_{\text{vehicle}}$: $+5\text{ mins}$ for Tractor-Trolley, $+0\text{ mins}$ for Pickup, $+10\text{ mins}$ for Bullock Cart
- $\Delta T_{\text{penalty}}$: Calculated from active centre incidents

**Arrival Window Generation**:
- Arrival Window Start = $\text{Slot Start Time} - 10\text{ mins}$ (Grace lead time)
- Arrival Window End = $\text{Slot Start Time} + 20\text{ mins}$
- After Arrival Window End $+ 15\text{ mins}$ without check-in, system automatically marks status as `NO_SHOW` and notifies farmer with 1-click reschedule options.

### 5.3 Small vs. Large Quantity Farmer Workflows
1. **Small Quantity Farmer ($\le 100$ Quintals)**:
   - Capable of self-transport via tractor/pickup.
   - Immediate slot selection on calendar, instant scannable QR token generation, and real-time virtual queue placement.
2. **Large Quantity Farmer ($> 100$ Quintals or Farm-Gate Request)**:
   - Automatically triggers **"Team Visit Request"** workflow.
   - Screen prompts farmer for farm location, road accessibility, and preferred harvest inspection date.
   - PACS Centre Operator receives on-site inspection task in Operator Dashboard.
   - Operator records pre-inspection quantity and approves slot directly into bulk procurement schedule.

### 5.4 9-Stage Procurement Lifecycle State Machine

```
[1. SLOT_BOOKED] 
       │ (Farmer arrives at Mandi Gate & scans QR at Operator Terminal)
       ▼
[2. CHECKED_IN] 
       │ (Operator cross-verifies Aadhaar / Photo ID)
       ▼
[3. IDENTITY_VERIFIED] 
       │ (Land records & crop booking quota verified against portal)
       ▼
[4. DOCUMENTS_VERIFIED] 
       │ (Vehicle enters weighbridge: Gross - Tare = Net Weight)
       │ [Discrepancy Check: If |Actual - Booked| > 20%, Operator Alert Triggered]
       ▼
[5. PRODUCE_WEIGHED] 
       │ (Sample taken to Quality Lab: Moisture, Foreign Matter, Damaged Grain)
       ▼
[6. QUALITY_INSPECTED] 
       │ (Decision: Accept / Partial Accept / Reject / Reinspect; Grade A/B/C)
       ▼
[7. PROCUREMENT_ACCEPTED] 
       │ (MSP Rate applied: Net Weight × MSP - Deductions = Payable Amount)
       ▼
[8. PAYMENT_PROCESSING] 
       │ (Direct Benefit Transfer via PFMS simulation; Boost Request enabled)
       ▼
[9. PAYMENT_COMPLETED] 
       (UTR / Transaction Reference generated: e.g. PFMS-2026-TXN-88192)
```

Each stage records: `timestamp`, `actorName`, `actorRole`, `status`, and `metadataNotes`.

### 5.5 Weighing Discrepancy & Quality Inspection Rules
- **Discrepancy Alert**: If $\frac{|\text{Actual Weight} - \text{Booked Weight}|}{\text{Booked Weight}} > 0.20$ (e.g. Booked 20Q, Actual 68Q):
  - Operator UI displays amber warning banner: *"High Quantity Discrepancy Detected (+240%)"*.
  - Action Buttons: `[Approve Quota Override]`, `[Flag for Supervisor Verification]`, `[Split into Multi-Batch Booking]`.
- **Quality Grading Matrix**:
  - **Grade A (100% MSP payout)**: Moisture $\le 12.0\%$, Foreign Matter $\le 1.0\%$, Damaged $\le 2.0\%$.
  - **Grade B (2% Deduction)**: Moisture $12.1 - 14.0\%$, Foreign Matter $1.1 - 2.0\%$, Damaged $2.1 - 3.5\%$.
  - **Grade C (5% Deduction)**: Moisture $14.1 - 16.0\%$, Foreign Matter $2.1 - 3.0\%$, Damaged $3.6 - 5.0\%$.
  - **Reject / Reinspect**: Moisture $> 16.0\%$ or Foreign Matter $> 3.0\%$ or Damaged $> 5.0\%$.

### 5.6 Payment Calculation & Boost Request Engine
- **Gross Calculation**: $\text{Gross} = \text{Accepted Quantity (Q)} \times \text{MSP Rate (₹/Q)}$
- **Deductions**: $\text{Deductions} = \text{Gross} \times \text{Deduction Percentage}$
- **Net Payable**: $\text{Net} = \text{Gross} - \text{Deductions}$
- **Payment Boost Request**:
  - If payment remains in `PAYMENT_PROCESSING` for $> 24\text{ hours}$ (simulated via timestamp or trigger), farmer sees an active **"Request Payment Boost"** button.
  - Farmer submits reason (e.g. *"Urgent seed purchase required for Kharif cycle"*).
  - Admin dashboard highlights expedited ticket; District Admin clicks `[Approve Boost]` $\rightarrow$ status instantly advances to `PAYMENT_COMPLETED` with simulated UTR.

---

## 6. Multilingual & Offline Architecture

### 6.1 Bilingual i18n Architecture (English + Hindi)
- Lightweight, zero-dependency translation dictionary architecture (`src/locales/en.json`, `src/locales/hi.json`) integrated with a custom `LanguageProvider` and `useTranslation` hook.
- Persistent language preference saved in `localStorage` and cookie `NEXT_LOCALE`.
- Comprehensive translations covering all domain terms:
  - *Slot Booking* $\rightarrow$ *"स्लॉट बुकिंग"*
  - *Token Number* $\rightarrow$ *"टोकन संख्या"*
  - *Estimated Wait Time* $\rightarrow$ *"अनुमानित प्रतीक्षा समय"*
  - *Moisture Content* $\rightarrow$ *"नमी का स्तर"*
  - *Minimum Support Price (MSP)* $\rightarrow$ *"न्यूनतम समर्थन मूल्य (MSP)"*
  - *Payment Successful* $\rightarrow$ *"भुगतान सफल"*
  - *Weighing Machine Down* $\rightarrow$ *"वजन तौल मशीन बंद"*

### 6.2 4-State Offline Resilient Caching Layer
Agricultural regions frequently face intermittent 2G/3G connectivity. KRISHI FLOW implements a persistent client-side caching engine:
- **Cached Entities**:
  1. Active Booking Token & Scannable QR Code (data URL / SVG stored in `localStorage` / `IndexedDB`).
  2. Last Known Queue Position & Arrival Window.
  3. Centre Emergency Contact Phone & Address.
- **Top Bar Offline Status Banner**:
  - `ONLINE`: Green indicator (`● ONLINE`) — live WebSocket connected.
  - `SYNCING`: Amber spinning icon (`⟳ SYNCING`) — reconnecting and flushing offline actions.
  - `OFFLINE`: Red alert badge (`⚠ OFFLINE MODE`) — displaying cached QR token and offline advisories.
  - `LAST SYNCED`: Timestamp disclosure (`Last updated: 10:14 AM`).
- **Network Simulation Toggle**: Demo header includes an "Offline Simulation Toggle" allowing evaluators to simulate network disconnects and verify that cached QR tokens and queue details persist smoothly.

---

## 7. Complete System Directory Structure

```
KRISHI_FLOW/
├── .env.example
├── .gitignore
├── README.md
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── next.config.mjs
├── server.ts                       # Custom Node.js HTTP + Socket.IO Server wrapper
├── prisma/
│   ├── schema.prisma               # 14 normalized models (SQLite / Postgres)
│   └── seed.ts                     # Rich seed script (10 centres, 4 crops, 25+ farmers, incidents)
├── src/
│   ├── middleware.ts               # Role-based route guard middleware
│   ├── app/
│   │   ├── layout.tsx              # Root layout with Providers & Offline Banner
│   │   ├── page.tsx                # High-impact Hero Landing Page
│   │   ├── unauthorized/page.tsx   # 403 Forbidden page
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx      # Phone OTP & Demo Quick Switcher
│   │   │   ├── register/page.tsx   # Farmer KYC Registration (Aadhaar/Kisan ID)
│   │   │   └── verify/page.tsx     # OTP verification
│   │   ├── (farmer)/
│   │   │   ├── dashboard/page.tsx  # Farmer home dashboard
│   │   │   ├── book/page.tsx       # Smart booking & AI centre recommendation
│   │   │   ├── queue/page.tsx      # Live virtual queue tracker
│   │   │   ├── timeline/[id]/page.tsx # 9-stage procurement timeline
│   │   │   ├── payment/page.tsx    # Payment status & boost requests
│   │   │   └── notifications/page.tsx # Notification centre
│   │   ├── (operator)/
│   │   │   ├── operator/dashboard/page.tsx # Queue management & counter overview
│   │   │   ├── operator/scan/page.tsx      # QR Code Check-in scanner
│   │   │   ├── operator/weighing/page.tsx  # Weighbridge entry & discrepancy alert
│   │   │   └── operator/incidents/page.tsx # Incident reporting & delay controls
│   │   ├── (inspector)/
│   │   │   ├── inspector/dashboard/page.tsx   # Quality lab queue
│   │   │   └── inspector/inspect/[id]/page.tsx# Moisture & Grading inspection form
│   │   ├── (admin)/
│   │   │   ├── admin/analytics/page.tsx      # KPI cards & recommendations
│   │   │   ├── admin/congestion-map/page.tsx # Congestion heatmap (GREEN/YELLOW/RED/GREY)
│   │   │   ├── admin/centres/page.tsx        # Centre capacity & queue oversight
│   │   │   └── admin/reports/page.tsx        # Procurement & payout reports
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── login/route.ts
│   │       │   ├── verify-otp/route.ts
│   │       │   ├── verify-kyc/route.ts
│   │       │   └── me/route.ts
│   │       ├── centres/
│   │       │   ├── route.ts
│   │       │   ├── recommend/route.ts
│   │       │   └── [id]/route.ts
│   │       ├── bookings/
│   │       │   ├── route.ts
│   │       │   ├── [id]/route.ts
│   │       │   └── [id]/reschedule/route.ts
│   │       ├── queue/
│   │       │   ├── [centreId]/route.ts
│   │       │   └── check-in/route.ts
│   │       ├── procurement/
│   │       │   ├── weigh/route.ts
│   │       │   ├── inspect/route.ts
│   │       │   └── [id]/timeline/route.ts
│   │       ├── payments/
│   │       │   ├── route.ts
│   │       │   └── [id]/boost/route.ts
│   │       ├── incidents/
│   │       │   ├── route.ts
│   │       │   └── [id]/resolve/route.ts
│   │       └── notifications/
│   │           └── route.ts
│   ├── components/
│   │   ├── ui/                     # Radix / shadcn reusable UI primitives
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── table.tsx
│   │   │   ├── select.tsx
│   │   │   ├── slider.tsx
│   │   │   ├── switch.tsx
│   │   │   └── progress.tsx
│   │   ├── layout/
│   │   │   ├── Navbar.tsx          # Top navigation with role indicator & language toggle
│   │   │   ├── MobileBottomNav.tsx # Farmer bottom navigation
│   │   │   ├── OfflineBanner.tsx   # ONLINE / SYNCING / OFFLINE banner
│   │   │   └── RoleSwitcher.tsx    # 1-Click demo role switcher bar
│   │   ├── farmer/
│   │   │   ├── CentreRecommendationCard.tsx
│   │   │   ├── QRTokenCard.tsx
│   │   │   ├── LiveQueueProgress.tsx
│   │   │   ├── ProcurementTimelineStepper.tsx
│   │   │   └── PaymentBoostModal.tsx
│   │   ├── operator/
│   │   │   ├── QRScannerModal.tsx
│   │   │   ├── WeighingForm.tsx
│   │   │   ├── DiscrepancyAlert.tsx
│   │   │   └── IncidentLoggerModal.tsx
│   │   ├── inspector/
│   │   │   └── QualityGradingForm.tsx
│   │   ├── admin/
│   │   │   ├── CongestionMap.tsx
│   │   │   ├── ThroughputChart.tsx
│   │   │   ├── BottleneckCard.tsx
│   │   │   └── ActionRecommendationCard.tsx
│   │   └── common/
│   │       ├── LanguageToggle.tsx
│   │       └── StatCard.tsx
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   ├── LanguageContext.tsx
│   │   ├── OfflineContext.tsx
│   │   └── SocketContext.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useSocket.ts
│   │   ├── useTranslation.ts
│   │   └── useOfflineSync.ts
│   ├── lib/
│   │   ├── db/
│   │   │   └── prisma.ts           # Singleton Prisma client instance
│   │   ├── socket/
│   │   │   ├── socketHandler.ts    # Socket.IO room & event registration
│   │   │   └── socketEmitter.ts    # Server-side event broadcast helpers
│   │   ├── services/
│   │   │   ├── recommendationEngine.ts # 5-Factor scoring algorithm
│   │   │   ├── etaCalculator.ts        # Sub-5-second ETA recalculation
│   │   │   ├── queueService.ts         # Queue management & token calling
│   │   │   ├── procurementService.ts   # 9-stage progression logic
│   │   │   ├── paymentService.ts       # MSP calculation & PFMS simulation
│   │   │   ├── kycService.ts           # GovRegistry Aadhaar+Kisan ID verification
│   │   │   └── notificationService.ts  # Push notification triggers
│   │   ├── validations/
│   │   │   ├── authSchema.ts
│   │   │   ├── bookingSchema.ts
│   │   │   ├── weighingSchema.ts
│   │   │   └── inspectionSchema.ts
│   │   └── utils/
│   │       ├── formatters.ts
│   │       ├── qrGenerator.ts
│   │       └── constants.ts
│   └── locales/
│       ├── en.json                 # English translation dictionary
│       └── hi.json                 # Hindi translation dictionary
```

---

## 8. Multi-Agent Parallel Implementation Boundaries

To enable seamless parallel implementation across multiple coding agents without git/file merge conflicts, work is divided into strict modular boundaries:

| Agent / Milestone | Primary Responsibility | File Ownership Scope | Non-Overlapping Deliverables |
|---|---|---|---|
| **Agent 1: Core Data & Services** | Data Architecture, Prisma Schema, Mock Gov DB, Seed Script | `prisma/`, `src/lib/db/`, `src/lib/validations/`, `src/lib/services/kycService.ts` | Complete Prisma models, seeding 10 centres, 4 crops, 25+ farmers, mock registry |
| **Agent 2: Auth, Security & i18n** | Authentication, KYC Onboarding, RBAC Middleware, Bilingual i18n | `src/context/AuthContext.tsx`, `src/context/LanguageContext.tsx`, `src/locales/`, `src/middleware.ts`, `src/app/(auth)/` | Mobile OTP flow, Aadhaar validation UI, role guards, EN/HI language switcher |
| **Agent 3: Real-Time Engine & Queue** | Socket.IO Server, Virtual Queue Engine, Sub-5s ETA Recalculation | `server.ts`, `src/lib/socket/`, `src/context/SocketContext.tsx`, `src/lib/services/etaCalculator.ts`, `src/lib/services/queueService.ts` | Unified HTTP/Socket server, room broadcasting, incident penalty propagation |
| **Agent 4: Farmer Portal & Offline** | Farmer UI, Smart Booking, QR Token, Timeline, Payment Tracker, Offline Cache | `src/app/(farmer)/`, `src/components/farmer/`, `src/context/OfflineContext.tsx`, `src/hooks/useOfflineSync.ts` | Mobile-first farmer screens, AI recommendation cards, 9-stage timeline, offline QR cache |
| **Agent 5: Operator & Quality Portals** | Operator Console, QR Scanner, Weighing & Discrepancy Alerts, Lab Grading | `src/app/(operator)/`, `src/app/(inspector)/`, `src/components/operator/`, `src/components/inspector/` | Check-in scanner, weighing bridge console with $>20\%$ alert, moisture grading form |
| **Agent 6: Admin Analytics & Heatmap** | Admin Command Centre, Congestion Heatmap, Throughput Charts, Decision Engine | `src/app/(admin)/`, `src/components/admin/`, `src/lib/services/recommendationEngine.ts` | Interactive Mandi congestion map, bottleneck alerts, rerouting decision cards |

---

## 9. Verification & Acceptance Checklist

| Requirement | Implementation Verification Method | Target Result |
|---|---|---|
| **R1. Auth & KYC** | Submit valid & invalid Aadhaar+Kisan ID combinations in `/register` | Valid returns verified profile; invalid returns structured rejection |
| **R2. Smart Booking** | Book 40Q wheat slot at Karnal; book 150Q wheat slot | 40Q gets scannable QR token; 150Q triggers Team Visit Request |
| **R3. Sub-5s ETA Recalc** | Trigger `WEIGHING_MACHINE_DOWN` incident in `/operator/incidents` | All waiting farmers' ETAs update in `< 2` seconds via WebSocket |
| **R4. 9-Stage Lifecycle** | Progress booking through scan $\rightarrow$ weigh $\rightarrow$ grade $\rightarrow$ accept | Visual timeline updates with timestamps, operator names, and remarks |
| **R5. Weighing Alert** | Enter actual weight 68Q for 20Q booking | System displays high discrepancy alert ($>20\%$) with override buttons |
| **R6. Quality Form** | Submit moisture 13.5% (Grade B) vs 11.0% (Grade A) | Grade B computes 2% deduction; farmer sees accepted quantity & grade |
| **R7. Payment Boost** | Click "Request Payment Boost" on delayed payment | Admin receives ticket; approval marks transaction `SUCCESSFUL` |
| **R8. Admin Congestion** | Navigate to `/admin/congestion-map` | 10 centres rendered with GREEN/YELLOW/RED/GREY and reroute card |
| **R9. Multilingual** | Toggle EN $\leftrightarrow$ HI on navbar | Farmer dashboard, booking, and queue terms instantly switch to Hindi |
| **R10. Offline Caching** | Toggle offline mode in header | Offline banner appears; cached QR token and token number remain visible |
| **R11. Zero Terminal Friction** | Run `npm run dev` and open `http://localhost:3000` | Full point-and-click browser experience with zero terminal intervention |

---
*End of Technical Architecture Specification for KRISHI FLOW (SIH 2026).*
