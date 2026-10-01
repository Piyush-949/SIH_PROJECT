<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:1a4314,50:2d6a2e,100:8bc34a&height=200&section=header&text=Krishi%20Setu&fontSize=60&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=कृषि%20सेतु%20—%20Intelligent%20Agri%20Procurement%20%26%20Logistics&descAlignY=58&descSize=18" width="100%"/>

<a href="https://github.com/Piyush-949/SIH_PROJECT">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=22&pause=1200&color=4CAF50&center=true&vCenter=true&width=700&lines=Ending+multi-day+truck+queues+at+the+mandi+gate;Transparent+MSP+payments%2C+not+promises;AI+grain+grading+before+you+even+leave+the+farm;Built+for+Smart+India+Hackathon+2026" alt="Typing SVG" />
</a>

<br/>

[![Next.js](https://img.shields.io/badge/Next.js-14.2.5-black.svg?style=for-the-badge&logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.18-2D3748.svg?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7-010101.svg?style=for-the-badge&logo=socketdotio)](https://socket.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

<img src="https://img.shields.io/github/stars/Piyush-949/SIH_PROJECT?style=social" />
<img src="https://img.shields.io/github/forks/Piyush-949/SIH_PROJECT?style=social" />

**🏆 SIH26032 · Agriculture · Software · Team Levithan**

[Live Demo](https://sih-project-ruby.vercel.app) · [Report Bug](https://github.com/Piyush-949/SIH_PROJECT/issues) · [Request Feature](https://github.com/Piyush-949/SIH_PROJECT/issues)

</div>

<br/>

## 📌 Executive Summary

**Krishi Setu** digitizes India's agricultural procurement chain end-to-end — orchestrating mandi gate operations, real-time vehicle dispatch, AI-assisted quality assaying, and transparent MSP disbursement. It doesn't promise farmers will be paid *faster*; it guarantees they can always see *where their payment stands*, in real time.

> 🚜 **The signature feature:** a shared-trolley pooling system — "Uber for Tractors" — that lets smallholders split transport costs to the mandi.

<br/>

## 🚀 Key Capabilities

<table>
<tr>
<td width="50%" valign="top">

### 📍 Smart Centre Recommendation
6-factor live scoring — mandi load, Haversine road distance, active weighbridges, moisture-meter health, throughput history, rainfall risk — plus personalized arrival windows and an interactive Leaflet capacity map.

### 🛡️ KYC & Identity Engine
Aadhaar + PM-Kisan cross-verification, automated PIN/state/district autofill, and persistent verified-farmer sessions. Flow starts at **registration → KYC → document verification**, then the rest.

### 🔍 AI Grain Quality Pre-Scanner
Farmers upload a grain photo *before* transit; Gemini estimates moisture, foreign matter, and predicted Agmarknet grade, with drying/winnowing advice attached.

</td>
<td width="50%" valign="top">

### ⏱️ 9-Stage Procurement Lifecycle
```
[01] Slot Booked      ➔ [02] Arrived
[03] Gate Verified    ➔ [04] Sample Collected
[05] Quality Assayed  ➔ [06] Gross Weighed
[07] Tare Weighed     ➔ [08] MSP Settlement
[09] Direct DBT Disbursed ✅
```

### ⚖️ Weighbridge & Discrepancy Engine
Dual gross–tare weighing with automatic net-grain computation and tolerance-threshold flagging against the booked quantity.

### 💳 MSP + Direct Benefit Transfer
Live MSP settlement against benchmark prices (auto-updating, not hard-coded) and instant PFMS-style transaction references.

</td>
</tr>
</table>

### 📡 Real-time & Offline-first
Native Socket.IO pushes live queue status and lane callouts; an offline-first cache keeps field operators working through patchy mandi connectivity.

<br/>

## 🏗️ Tech Stack

<div align="center">

| Layer | Stack |
|---|---|
| **Web** | Next.js 14 (App Router) · React 18 · Tailwind CSS · Framer Motion |
| **State / i18n** | Context API · React Query · custom English/Hindi engine |
| **Maps** | Leaflet · React-Leaflet · OpenStreetMap |
| **Backend** | Node.js · custom Socket.IO server (`server.ts`) · Next.js API routes |
| **Data** | Prisma ORM on SQLite (Postgres/MySQL drop-in ready) |
| **AI** | Google Gemini 1.5 Pro/Flash (multimodal) |

</div>

<br/>

## 👥 Role Portals

| Role | Path | Responsibilities |
|---|---|---|
| 🌾 **Farmer** | `/farmer/dashboard` | Book slots, pre-scan quality, track queue & MSP status |
| 🚦 **Gate Operator** | `/operator` | Check in vehicles, scan QR tokens, record weighbridge readings |
| 🔬 **Quality Inspector** | `/inspector` | Assay moisture, assign Agmarknet grade, log rejections |
| 🖥️ **Administrator** | `/admin` | Monitor quotas state-wide, resolve bottlenecks, manage capacity |

<br/>

## 📁 Repository Structure

```text
├── prisma/            # schema.prisma + seed.ts (Odisha & national mandi network)
├── public/            # static assets & branding
├── src/
│   ├── app/            # App Router pages + REST endpoints
│   │   ├── admin/        → analytics & congestion dashboard
│   │   ├── api/          → auth, centres, bookings, AI quality, weather
│   │   ├── farmer/       → self-service portal
│   │   ├── inspector/    → grading terminal
│   │   ├── operator/     → gate & weighbridge terminal
│   │   └── onboarding/   → Aadhaar / Kisan ID verification
│   ├── components/     # Navbar, Footer, Maps, Modals
│   ├── lib/
│   │   ├── algorithms/   → scoring, arrival windows, MSP, grading
│   │   ├── auth/         → JWT + demo credentials
│   │   ├── data/         → weather API, Gemini client, offline store
│   │   └── i18n/         → English/Hindi dictionary engine
│   └── types/          # strict domain models
├── tests/             # algorithm unit tests + e2e suite
└── server.ts          # production server with Socket.IO
```

<br/>

## ⚡ Getting Started

```bash
# 1. Clone
git clone https://github.com/Piyush-949/SIH_PROJECT.git
cd SIH_PROJECT

# 2. Install
npm install

# 3. Configure .env
DATABASE_URL="file:./dev.db"
JWT_SECRET="krishi_setu_enterprise_jwt_secret_key_2026"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
GEMINI_API_KEY="your_gemini_api_key_here"   # optional, enables live AI advisory

# 4. Database
npm run prisma:generate
npm run prisma:push
npm run prisma:seed

# 5. Run
npm run dev
```

Open **http://localhost:3000** 🎉

**Requires:** Node.js ≥ 18.17.0 · npm ≥ 9.0.0

<br/>

## 🧪 Testing

```bash
npm test          # algorithms, arrival windows, grade slabs, MSP settlement
npm run test:e2e  # full end-to-end suite
```

<br/>

## 🗺️ Roadmap

- [x] 9-stage procurement lifecycle
- [x] AI grain quality pre-scan
- [x] Shared-trolley pooling ("Uber for Tractors")
- [ ] Auto-syncing MSP rates from live government feeds
- [ ] SMS-based status updates via Fast2SMS for non-smartphone users

<br/>

## 🤝 Contributing

Contributions are welcome — this was built as a Smart India Hackathon 2026 entry by **Team Levithan**.

1. Fork the repo
2. Create your branch (`git checkout -b feature/thing`)
3. Commit (`git commit -m 'Add thing'`)
4. Push (`git push origin feature/thing`)
5. Open a Pull Request

<br/>

## 📜 License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for details.

<br/>

<div align="center">

### Built for 🇮🇳 by Team Levithan — SIH 2026

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:8bc34a,50:2d6a2e,100:1a4314&height=120&section=footer" width="100%"/>

</div>
