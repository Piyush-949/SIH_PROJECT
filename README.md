# 🌾 Krishi Setu (कृषि सेतु)
### Intelligent Agricultural Procurement & Logistics Orchestration Platform

[![Next.js 14](https://img.shields.io/badge/Next.js-14.2.5-black.svg?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.18-2D3748.svg?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7-010101.svg?style=flat-square&logo=socket.io)](https://socket.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

---

## 📌 Executive Summary

**Krishi Setu** is an end-to-end digital logistics and procurement platform engineered to modernize India's agricultural supply chain. By orchestrating mandi gate operations, real-time vehicle dispatching, automated quality assaying, and transparent Minimum Support Price (MSP) disbursements, Krishi Setu eliminates perennial bottlenecks such as multi-day truck queues, arbitrary grain downgrading, and payment delays.

---

## 🚀 Key Architectural Capabilities

### 1. 📍 Multi-Factor Procurement Centre Recommendation
- **6-Factor Dynamic Scoring**: Evaluates real-time mandi load, road distance (via Haversine & geospatial routing), active weighing machines, moisture meter health, historical throughput, and real-time precipitation risk.
- **Dynamic Arrival Windows**: Computes personalized arrival slots (windowStart, windowEnd, and graceExpiry) based on vehicle tonnage, crop processing baseline, and live weighbridge congestion.
- **Interactive Geospatial Map**: Integrated Leaflet interface displaying procurement centres with real-time status indicators, capacity utilization heatmaps, and route coordinates.

### 2. 🛡️ Identity & Land Verification (KYC Engine)
- **Aadhaar & PM-Kisan Cross-Verification**: Multi-stage identity validation preventing duplicate slot hoarding and unauthorized intermediary booking.
- **Automated Demographics Resolution**: Instant PIN code lookup, state/district cascading autofill, and landholding quota entitlement checks.
- **Persistent Session State**: Automatic synchronization between client cache and database, ensuring returning farmers retain their verified records.

### 3. 🔍 AI Optical Grain Quality Pre-Scanner
- **Pre-Mandi Computer Vision Assay**: Allows farmers to upload grain photographs from their smartphones before transit.
- **Agmarknet Standards Conformity**: Estimates moisture percentage, foreign matter, shriveled grains, and predicts the official Agmarknet Grade (Grade A, Grade B, or Rejection Risk).
- **Gemini Advisory Engine**: Contextual recommendations on drying time, winnowing steps, and optimal dispatch timing.

### 4. ⏱️ 9-Stage Transparent Procurement Lifecycle
Every produce consignment moves through a strict, auditable 9-stage state machine with instant digital receipts and QR token generation:

`
[01] Slot Booked ➔ [02] Farmer Arrived ➔ [03] Gate Verified ➔ [04] Sample Collected
       ➔ [05] Quality Assayed ➔ [06] Gross Weighed ➔ [07] Tare Weighed 
               ➔ [08] MSP Settlement ➔ [09] Direct DBT Disbursed
`

### 5. ⚖️ Automated Weighbridge & Discrepancy Engine
- Dual Gross-Tare vehicle weighing calculations with automatic net grain computation.
- Automated tolerance thresholds that detect and flag discrepancies between self-declared booking quantity and physical weighbridge readouts.

### 6. 💳 MSP Calculation & Direct Benefit Transfer (DBT)
- Real-time MSP settlement computation factoring government benchmark prices and official grade deduction slabs.
- Instant PFMS-compliant transaction reference generation (PFMS-YYYY-XXXX-TXN-#####) for direct treasury-to-bank transfer.

### 7. 📡 Real-Time WebSockets & Offline Resilience
- Native Socket.IO event bus pushing live queue status, lane callouts, and incident updates.
- Offline-first cache store supporting field operations during intermittent mandi network connectivity.

---

## 🏗️ Technical Architecture & Tech Stack

`
├── Web Presentation Layer    : Next.js 14 (App Router), React 18, Tailwind CSS, Framer Motion
├── State & Internationalization: Context API, React Query, Custom English / Hindi I18n Engine
├── Mapping & Geolocation      : Leaflet, React-Leaflet, OpenStreetMap Tile Services
├── Backend & Real-time        : Node.js, Custom HTTP/Socket Server (server.ts), Next.js API Routes
├── Data Persistence & Schema  : Prisma ORM with SQLite (PostgreSQL / MySQL drop-in ready)
├── Artificial Intelligence    : Google Gemini 1.5 Pro/Flash Multimodal API
└── Testing & Quality Assurance: Comprehensive Algorithmic Verification & End-to-End Suite
`

---

## 📁 Repository Structure

`
├── prisma/
│   ├── schema.prisma           # Relational schema (Users, Centres, Bookings, Incidents, Crops)
│   └── seed.ts                 # Database seeder with authentic Odisha & national mandi networks
├── public/                     # Static assets, branding, and icons
├── src/
│   ├── app/                    # Next.js App Router (Pages & REST Endpoints)
│   │   ├── admin/              # Administrative analytics & congestion dashboard
│   │   ├── api/                # API routes (auth, centres, bookings, AI quality, weather)
│   │   ├── farmer/             # Farmer self-service portals (dashboard, book slot, AI scan)
│   │   ├── inspector/          # Quality inspector grading terminal
│   │   ├── operator/           # Mandi gate & weighbridge operational terminal
│   │   ├── login/              # Secure authentication & role switcher
│   │   └── onboarding/         # Aadhaar & Kisan ID verification workflow
│   ├── components/             # Modular UI components (Navbar, Footer, Maps, Modals)
│   ├── lib/
│   │   ├── algorithms/         # Core algorithmic engines (Scoring, Arrival Windows, MSP, Grading)
│   │   ├── auth/               # Authentication contexts, JWT verification, demo credentials
│   │   ├── data/               # Weather API, Gemini client, mock offline store
│   │   ├── db/                 # Prisma database client singleton
│   │   └── i18n/               # Multi-language dictionary engine (English & Hindi)
│   └── types/                  # Strict TypeScript domain models & interfaces
├── tests/
│   ├── algorithms.test.ts      # Core mathematical & algorithm verification suite
│   └── e2e/                    # Multi-tier end-to-end integration test runner
└── server.ts                   # Custom production server with integrated Socket.IO engine
`

---

## ⚡ Getting Started

### Prerequisites
- **Node.js**: v18.17.0 or higher
- **npm**: v9.0.0 or higher

### 1. Clone the Repository
`ash
git clone https://github.com/Piyush-949/SIH_PROJECT.git
cd SIH_PROJECT
`

### 2. Install Dependencies
`ash
npm install
`

### 3. Configure Environment Variables
Create a .env file in the root directory:
`env
DATABASE_URL="file:./dev.db"
JWT_SECRET="krishi_setu_enterprise_jwt_secret_key_2026"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
GEMINI_API_KEY="your_gemini_api_key_here" # Optional: for live AI grain quality advisory
`

### 4. Database Setup & Seeding
Generate the Prisma client, push the schema to SQLite, and seed procurement centres, active crops, and demo records:
`ash
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
`

### 5. Start Development Server
`ash
npm run dev
`
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification

Run the comprehensive unit test suite validating core algorithms, arrival window mathematics, Agmarknet grade deduction slabs, and MSP settlement:
`ash
npm test
`

To execute the end-to-end integration tests:
`ash
npm run test:e2e
`

---

## 👥 Role Portals & Access

| Role | Portal Path | Responsibilities |
| :--- | :--- | :--- |
| **Farmer** | /farmer/dashboard | Book procurement slots, pre-scan crop quality, track live queue & MSP payment status. |
| **Gate Operator** | /operator | Check in vehicles, scan QR arrival tokens, record weighbridge gross & tare readings. |
| **Quality Inspector** | /inspector | Assay physical moisture, classify Agmarknet grade, approve or record rejection rationale. |
| **Administrator** | /admin | Monitor state-wide procurement quotas, resolve bottlenecks, and manage mandi capacity. |

---

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
