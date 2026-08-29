# Original User Request

## 2026-08-26T10:05:25Z

Build **KRISHI FLOW** — a complete, production-quality, full-stack intelligent agricultural procurement orchestration platform for Smart India Hackathon 2026 (Problem Statement ID: 26032). The system must eliminate farmer waiting times, reduce procurement-centre congestion, and provide end-to-end transparency from crop booking to payment.

> **CRITICAL DELIVERY REQUIREMENT**: This must be delivered as a **browser-accessible web portal**. Running `npm run dev` (or equivalent) must open the application in a browser at a localhost URL (e.g., `http://localhost:3000`). There must be NO terminal UI, no CLI interaction, and no command-line-only interface. Every feature — farmer portal, operator dashboard, admin analytics, queue tracking, payment tracker — must be navigable entirely through a web browser. The app should work by simply visiting the URL after setup.

Working directory: `C:\Users\piyus\Desktop\SIH_PROJECT`

Integrity mode: **demo** (polished prototype with realistic mock data; pre-built libraries and frameworks are encouraged)

---

## Requirements

### R1. Farmer Authentication & KYC Onboarding
Implement a secure onboarding flow: mobile OTP verification → farmer profile creation (name, Aadhaar number, Kisan ID, village, district, state, PIN, preferred language, bank details). Verify farmer authenticity by cross-checking Aadhaar + Kisan ID combination against a mock government database (seeded data). After verification, allow KYC completion. Use role-based authentication (FARMER, CENTRE_OPERATOR, QUALITY_INSPECTOR, DISTRICT_ADMIN, STATE_ADMIN, SUPER_ADMIN) with protected routes and session management.

### R2. Smart Procurement Booking System
Farmers must be able to discover nearby procurement centres on a map, view real-time capacity/congestion, and receive an AI-scored centre recommendation (weighted by distance, queue length, wait time, capacity, processing speed, crop availability, equipment status, historical delay rate). Slot booking must be dynamic — accepting crop type, estimated quantity, and vehicle type, then computing an intelligent arrival window based on processing time formula:

```
Estimated Processing Time = Base Time + Quantity Factor + Crop Complexity + Inspection Time + Delay Penalty
```

On booking confirmation, generate: Booking ID, queue token, QR code, arrival window, and estimated completion time.

Handle two farmer scenarios intelligently:
- **Small quantity farmer** (capable of self-transport): guide to nearest available slot, allow self-check-in.
- **Large quantity farmer** (requires procurement team to come): trigger a "team visit request" workflow where the PACS/operator schedules a farm visit, verifies crop quantity on-site before confirmation, then issues the slot.

### R3. Real-Time Virtual Queue & Procurement Lifecycle
Implement a live queue engine (WebSockets/Socket.IO) that responds to: check-ins, late arrivals, no-shows, equipment failures, staff shortages, and quantity discrepancies. When an operational incident occurs, automatically recalculate all ETAs and push notifications to affected farmers. Track the full procurement lifecycle per booking:

```
SLOT BOOKED → CHECKED IN → IDENTITY VERIFIED → DOCUMENTS VERIFIED → 
PRODUCE WEIGHED → QUALITY INSPECTED → PROCUREMENT ACCEPTED → 
PAYMENT PROCESSING → PAYMENT COMPLETED
```

Each stage must record timestamp, actor, status, and remarks. The weighing module must flag large discrepancies (e.g., booked 20Q, actual 68Q) and trigger operator actions. The quality inspection module must support Accept / Partial Accept / Reject / Reinspect decisions with grade (A/B/C), moisture %, foreign material %, and damaged grain %.

### R4. Payment Tracking & Boost Requests
After procurement acceptance, show: accepted quantity, applicable MSP rate, gross amount, deductions, final payable amount, payment status (NOT_INITIATED → INITIATED → PROCESSING → SUCCESSFUL/FAILED), and transaction reference. Allow farmers to submit a "Payment Boost Request" if payment is delayed beyond SLA. Payment processing may be fully simulated.

### R5. Multi-Role Portals & Admin Analytics
Build separate, role-appropriate portals:
- **Farmer Portal** (mobile-first): dashboard, centre map, slot booking, live queue, procurement timeline, payment tracker, notifications.
- **Operator Portal** (tablet/desktop): queue management, check-in scanner, weighing module, incident reporting, capacity controls.
- **Quality Inspector Portal**: inspection queue, inspection form, decision workflow.
- **Admin Dashboard** (desktop): live KPI cards, congestion heat map (GREEN/YELLOW/RED/GREY centres), centre comparison table, hourly throughput charts, bottleneck detection, decision-support recommendations (e.g., "Redirect bookings from Centre A at 96% to Centre B at 42%").

### R6. Notification System & Offline Support
Implement an in-app notification centre covering: booking confirmed, queue approaching, delay alerts, departure reminders, procurement status updates, payment updates. Architect for future SMS/WhatsApp/push channels. Provide offline-friendly behavior: cache booking info, QR code, last known queue position, and sync on reconnect. Show ONLINE / SYNCING / OFFLINE / LAST SYNCED status.

### R7. Technology Stack & Code Quality
- **Frontend**: Next.js 14+, TypeScript, Tailwind CSS, shadcn/ui, Lucide icons, Framer Motion (subtle), React Hook Form + Zod, TanStack Query.
- **Backend**: Next.js API routes or FastAPI, TypeScript, RESTful service-layer architecture.
- **Database**: PostgreSQL + Prisma ORM with full normalized schema (User, FarmerProfile, ProcurementCentre, Crop, CentreCrop, Slot, Booking, QueueEntry, ProcurementRecord, QualityInspection, Payment, OperationalIncident, Notification tables with foreign keys, indexes, enums, audit timestamps).
- **Real-time**: Socket.IO or Supabase Realtime.
- **Auth**: OTP mock auth with role-based protected routes.
- Seed realistic demo data: 8–15 centres, multiple crops (Wheat/Rice/Maize/Soybean), 20+ farmers, varied booking states, active incidents, payment states.
- Support English + Hindi with a language switcher and i18n architecture ready for more Indian languages.
- Include a complete `README.md` per spec section 51.

---

## Acceptance Criteria

### Authentication & Farmer Verification
- [ ] Farmer can register with mobile OTP → Aadhaar + Kisan ID → KYC profile completion
- [ ] Mock Aadhaar/Kisan ID validation rejects invalid combinations with clear error messages
- [ ] All 6 roles have distinct login credentials in demo data; role-based route guards work

### Smart Booking & Centre Recommendation
- [ ] Centre recommendation engine uses ≥5 weighted factors and displays "Why we recommend this" explanation
- [ ] Large-quantity farmer flow triggers a team-visit request instead of a direct slot assignment
- [ ] Booking confirmation generates a scannable QR token and computed arrival window
- [ ] At least 3 demo bookings exist in different states (confirmed, checked-in, completed)

### Real-Time Queue
- [ ] Queue position and ETA update live (WebSocket) when operator triggers an incident
- [ ] Operator marking "Weighing machine unavailable" visibly recalculates all farmer ETAs within 5 seconds
- [ ] No-show state is automatically assigned after grace period expiry
- [ ] Farmer can reschedule a missed slot and see ranked alternatives

### Procurement & Quality
- [ ] Full 9-stage procurement timeline is visible per booking with timestamps
- [ ] Quantity discrepancy (>20% difference) triggers an operator alert with action buttons
- [ ] Quality inspection form saves grade + all metrics; farmer sees accepted quantity and grade

### Payment & Boost Requests
- [ ] Payment tracker shows all 4 lifecycle states with amounts and transaction reference
- [ ] Farmer can submit a "Payment Boost Request" when payment is delayed; operator sees it in dashboard

### Admin & Operator Portals
- [ ] Admin congestion map renders all seeded centres with correct GREEN/YELLOW/RED/GREY status
- [ ] Admin sees at least one "ACTION RECOMMENDED" card (redirect or bottleneck suggestion)
- [ ] Operator portal supports check-in by QR scan simulation AND manual booking ID entry

### Notifications & Offline
- [ ] In-app notification centre shows categorised, unread-count-badged notifications
- [ ] Offline banner appears when network is simulated offline; cached QR/booking info remains visible

### Design & Multilingual
- [ ] UI is mobile-first for farmer portal; all major screens are fully populated (no placeholder-only pages)
- [ ] Language switcher toggles English ↔ Hindi on at least the farmer portal home and booking screens
- [ ] App runs without runtime errors; `npm run build` or equivalent succeeds

### Web Portal Accessibility
- [ ] Running `npm run dev` (or `npm start`) starts a local web server accessible at `http://localhost:3000` (or similar)
- [ ] ALL features are navigable through a web browser — no terminal interaction is required after the server starts
- [ ] The README includes a single-command setup and a URL to open in browser
- [ ] The app is Mobile-first responsive — works on both desktop browser and mobile viewport (320px–1440px)
- [ ] No feature requires the user to type commands in a terminal to use it; everything is point-and-click in the browser

---

## Demo Flow (Under 5 Minutes)

1. Login as farmer (demo OTP) → complete profile
2. View smart centre recommendation → book slot → receive QR token
3. Watch live queue → operator triggers weighing machine failure → ETA recalculates in real time → farmer receives notification
4. Operator checks farmer in via QR scan → weighing recorded → quality approved
5. Admin views congestion heat map + "Redirect to Centre B" recommendation
6. Farmer views payment tracker → submits boost request

All demo credentials must be documented in README.
