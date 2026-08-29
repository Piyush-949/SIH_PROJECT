/**
 * KRISHI SETU - Milestone 1 Empirical Referential Integrity & Stress Harness
 * Executed by Challenger 2 for independent validation.
 */

import { PrismaClient } from "@prisma/client";
import {
  calculateProcessingTime,
  calculateArrivalWindow,
  scoreProcurementCentre,
  rankCentres,
  evaluateQuality,
  calculateWeighingDiscrepancy,
  calculateMspPayment,
  generatePfmsTransactionRef,
} from "../src/lib/algorithms";

const prisma = new PrismaClient();

async function runEmpiricalVerification() {
  console.log("===============================================================");
  console.log("🔍 KRISHI SETU — CHALLENGER 2 EMPIRICAL VERIFICATION HARNESS");
  console.log("===============================================================");

  let passCount = 0;
  let failCount = 0;
  const findings: string[] = [];

  function recordAssert(testName: string, passed: boolean, details?: string) {
    if (passed) {
      console.log(`  ✅ PASS: ${testName}`);
      passCount++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${details ? `— ${details}` : ""}`);
      failCount++;
      findings.push(`${testName}: ${details || "Assertion failed"}`);
    }
  }

  // -------------------------------------------------------------------------
  // SECTION 1: SEED DATA & REFERENTIAL INTEGRITY CHECKS
  // -------------------------------------------------------------------------
  console.log("\n--- [SECTION 1] Seed Data Integrity & Relational Verification ---");

  // 1.1 GovRegistry Farmers
  const govFarmers = await prisma.govRegistry.findMany();
  recordAssert("GovRegistry contains exactly 25 farmers", govFarmers.length === 25, `Found ${govFarmers.length}`);

  const uniqueAadhaars = new Set(govFarmers.map((f) => f.aadhaarNumber));
  recordAssert("All 25 GovRegistry Aadhaar numbers are unique", uniqueAadhaars.size === 25, `Unique: ${uniqueAadhaars.size}`);

  const uniqueKisanIds = new Set(govFarmers.map((f) => f.kisanId));
  recordAssert("All 25 GovRegistry Kisan IDs are unique", uniqueKisanIds.size === 25, `Unique: ${uniqueKisanIds.size}`);

  const allAadhaar12Digits = govFarmers.every((f) => /^\d{12}$/.test(f.aadhaarNumber));
  recordAssert("All 25 GovRegistry Aadhaar numbers are 12 numeric digits", allAadhaar12Digits);

  // 1.2 Demo Users & Roles
  const users = await prisma.user.findMany({ include: { farmerProfile: true, operatorCentres: true } });
  recordAssert("Total Users seeded is at least 30 (6 demo + 24 extra)", users.length >= 30, `Found ${users.length}`);

  const demoRoles = [
    { phone: "9876543210", role: "FARMER", name: "Ramesh Kumar" },
    { phone: "9876543220", role: "CENTRE_OPERATOR", name: "Suraj Meena" },
    { phone: "9876543230", role: "QUALITY_INSPECTOR", name: "Dr. Anil Sharma" },
    { phone: "9876543240", role: "DISTRICT_ADMIN", name: "Vikas Verma" },
    { phone: "9876543250", role: "STATE_ADMIN", name: "Meenakshi Sundaram" },
    { phone: "9876543260", role: "SUPER_ADMIN", name: "Rajeshwari Singh" },
  ];

  for (const demo of demoRoles) {
    const u = users.find((x) => x.phone === demo.phone);
    recordAssert(`Demo user with phone ${demo.phone} exists with role ${demo.role}`, !!u && u.role === demo.role, `Found: ${u?.role}`);
    if (demo.role === "FARMER" && u) {
      recordAssert("Demo FARMER has associated FarmerProfile", !!u.farmerProfile, `Profile: ${!!u.farmerProfile}`);
    }
    if (demo.role === "CENTRE_OPERATOR" && u) {
      recordAssert("Demo OPERATOR is linked to at least 1 ProcurementCentre", u.operatorCentres.length > 0, `Centres: ${u.operatorCentres.length}`);
    }
  }

  // 1.3 Crops & MSP
  const crops = await prisma.crop.findMany();
  recordAssert("Exactly 4 crops seeded (Wheat, Paddy, Maize, Soybean)", crops.length === 4, `Found: ${crops.length}`);
  const cropNames = crops.map((c) => c.name);
  recordAssert("Crops include Wheat, Paddy, Maize, Soybean", ["Wheat", "Paddy", "Maize", "Soybean"].every((c) => cropNames.includes(c)));

  const wheatCrop = crops.find((c) => c.name === "Wheat");
  recordAssert("Wheat MSP is ₹2,275/Q", wheatCrop?.basePricePerQuintal === 2275.0, `Got: ${wheatCrop?.basePricePerQuintal}`);

  // 1.4 Procurement Centres & CentreCrops
  const centres = await prisma.procurementCentre.findMany({ include: { cropsSupported: true } });
  recordAssert("Exactly 12 Procurement Centres seeded", centres.length === 12, `Found: ${centres.length}`);

  const centreCodes = new Set(centres.map((c) => c.code));
  recordAssert("All 12 Centre codes are unique", centreCodes.size === 12, `Unique: ${centreCodes.size}`);

  const allCentresHave4Crops = centres.every((c) => c.cropsSupported.length === 4);
  recordAssert("All 12 Centres have 4 supported CentreCrop relations", allCentresHave4Crops);

  const statuses = new Set(centres.map((c) => c.status));
  recordAssert("Centres include ACTIVE, CONGESTED, and MAINTENANCE statuses", statuses.has("ACTIVE") && statuses.has("CONGESTED") && statuses.has("MAINTENANCE"));

  // 1.5 Multi-Stage Bookings & Referential Integrity
  const bookings = await prisma.booking.findMany({
    include: {
      farmer: { include: { user: true } },
      centre: true,
      crop: true,
      queueEntry: true,
      procurementRecord: true,
      qualityInspection: true,
      payment: { include: { boostRequests: true } },
      boostRequests: true,
    },
  });

  recordAssert("Exactly 14 multi-stage Bookings seeded", bookings.length === 14, `Found: ${bookings.length}`);

  // Check foreign key references
  const allBookingsHaveValidFarmer = bookings.every((b) => !!b.farmer && !!b.farmer.user);
  recordAssert("All 14 Bookings have valid foreign key to FarmerProfile and User", allBookingsHaveValidFarmer);

  const allBookingsHaveValidCentre = bookings.every((b) => !!b.centre);
  recordAssert("All 14 Bookings have valid foreign key to ProcurementCentre", allBookingsHaveValidCentre);

  const allBookingsHaveValidCrop = bookings.every((b) => !!b.crop);
  recordAssert("All 14 Bookings have valid foreign key to Crop", allBookingsHaveValidCrop);

  // Specific lifecycle stage validations
  const b1 = bookings.find((b) => b.bookingNumber === "KF-2026-0001");
  recordAssert("Booking 1 (KF-2026-0001) is CONFIRMED & SLOT_BOOKED", b1?.status === "CONFIRMED" && b1?.currentStage === "SLOT_BOOKED");

  const b2 = bookings.find((b) => b.bookingNumber === "KF-2026-0002");
  recordAssert("Booking 2 (KF-2026-0002) has QueueEntry in WAITING status", b2?.queueEntry?.status === "WAITING" && b2?.queueEntry?.tokenNumber === "TK-101");

  const b6 = bookings.find((b) => b.bookingNumber === "KF-2026-0006");
  recordAssert("Booking 6 (KF-2026-0006) has ProcurementRecord with 240% discrepancy flagged", b6?.procurementRecord?.discrepancyFlagged === true && b6?.procurementRecord?.weightDiscrepancyPercentage === 240);

  const b7 = bookings.find((b) => b.bookingNumber === "KF-2026-0007");
  recordAssert("Booking 7 (KF-2026-0007) has QualityInspection GRADE_A ACCEPT", b7?.qualityInspection?.assignedGrade === "GRADE_A" && b7?.qualityInspection?.decision === "ACCEPT");

  const b8 = bookings.find((b) => b.bookingNumber === "KF-2026-0008");
  recordAssert("Booking 8 (KF-2026-0008) has QualityInspection GRADE_B with 2% deduction", b8?.qualityInspection?.assignedGrade === "GRADE_B" && b8?.qualityInspection?.deductionPercentage === 2.0);

  const b11 = bookings.find((b) => b.bookingNumber === "KF-2026-0011");
  recordAssert("Booking 11 (KF-2026-0011) has Payment with boostRequested=true and PaymentBoostRequest", b11?.payment?.boostRequested === true && b11?.payment?.boostRequests.length === 1);

  const b12 = bookings.find((b) => b.bookingNumber === "KF-2026-0012");
  recordAssert("Booking 12 (KF-2026-0012) is COMPLETED with SUCCESSFUL payment & PFMS UTR ref", b12?.status === "COMPLETED" && b12?.payment?.paymentStatus === "SUCCESSFUL" && !!b12?.payment?.transactionReference);

  const b13 = bookings.find((b) => b.bookingNumber === "KF-2026-0013");
  recordAssert("Booking 13 (KF-2026-0013) is large farmer (150Q) TEAM_VISIT in PENDING_VISIT status", b13?.transportType === "TEAM_VISIT" && b13?.status === "PENDING_VISIT" && b13?.estimatedQuantityQuintals === 150);

  const b14 = bookings.find((b) => b.bookingNumber === "KF-2026-0014");
  recordAssert("Booking 14 (KF-2026-0014) is NO_SHOW (for reschedule demo)", b14?.status === "NO_SHOW");

  // 1.6 Operational Incidents
  const incidents = await prisma.operationalIncident.findMany({ include: { centre: true, reporter: true } });
  recordAssert("At least 1 active OperationalIncident seeded at Karnal Mandi", incidents.length >= 1 && incidents[0].incidentType === "WEIGHING_MACHINE_DOWN" && incidents[0].severity === "HIGH");

  // -------------------------------------------------------------------------
  // SECTION 2: ADVERSARIAL & STRESS-TESTING ALGORITHMIC ENGINES
  // -------------------------------------------------------------------------
  console.log("\n--- [SECTION 2] Adversarial Stress Testing on Core Algorithms ---");

  // Stress 2.1: Processing Time with 0 and Extreme Quantities
  const procZero = calculateProcessingTime({ quantityQuintals: 0, cropBaseMinutesPerQuintal: 0.8, vehicleType: "PICKUP_TRUCK" });
  recordAssert("Processing time for 0Q gracefully returns base time (18 mins)", procZero.totalEstimatedMinutes === 18, `Got: ${procZero.totalEstimatedMinutes}`);

  const procExtreme = calculateProcessingTime({ quantityQuintals: 10000, cropBaseMinutesPerQuintal: 0.8, vehicleType: "OTHER", activeIncidentPenaltyMinutes: 100 });
  recordAssert("Processing time for 10000Q produces finite positive number without overflow", Number.isFinite(procExtreme.totalEstimatedMinutes) && procExtreme.totalEstimatedMinutes > 8000);

  // Stress 2.2: AI Scoring Edge Cases (Division by zero protection)
  const zeroCapScore = scoreProcurementCentre({
    centreId: "PC-TEST-01",
    centreName: "Zero Cap Centre",
    distanceKm: 10,
    waitingQueueCount: 0,
    estimatedWaitMinutes: 0,
    currentLoadQuintals: 0,
    capacityPerDayQuintals: 0, // 0 capacity edge
    processingSpeedPerHour: 0, // 0 speed edge
    activeIncidentsCount: 0,
    weighingMachinesActive: 0,
    weighingMachinesTotal: 0,
    status: "INACTIVE",
  });
  recordAssert("AI scoring handles 0 capacity/speed without NaN or crash", !isNaN(zeroCapScore.score) && zeroCapScore.congestionStatus === "GREY", `Score: ${zeroCapScore.score}, Status: ${zeroCapScore.congestionStatus}`);

  // Stress 2.3: Quality Grading Boundary Conditions
  // Grade A upper boundary (12.0% moisture, 2.0% foreign, 3.0% damaged)
  const exactGradeA = evaluateQuality({
    moisturePercentage: 12.0,
    foreignMaterialPercentage: 2.0,
    damagedGrainPercentage: 3.0,
    moistureStandardMax: 12.0,
    foreignMaterialMax: 2.0,
    damagedGrainMax: 3.0,
    submittedQuantityQuintals: 100,
  });
  recordAssert("Exact boundary values (12.0% moisture, 2.0% FM, 3.0% DG) evaluate to GRADE_A with 0 deduction", exactGradeA.grade === "GRADE_A" && exactGradeA.deductionPercentage === 0);

  // Grade B lower boundary (12.1% moisture)
  const boundaryGradeB = evaluateQuality({
    moisturePercentage: 12.1,
    foreignMaterialPercentage: 2.0,
    damagedGrainPercentage: 3.0,
    moistureStandardMax: 12.0,
    foreignMaterialMax: 2.0,
    damagedGrainMax: 3.0,
    submittedQuantityQuintals: 100,
  });
  recordAssert("12.1% moisture evaluates to GRADE_B with deduction", boundaryGradeB.grade === "GRADE_B" && boundaryGradeB.deductionPercentage > 0);

  // Negative moisture / corrupt sensor value handling
  const negativeMoisture = evaluateQuality({
    moisturePercentage: -5.0,
    foreignMaterialPercentage: 1.0,
    damagedGrainPercentage: 1.0,
    moistureStandardMax: 12.0,
    foreignMaterialMax: 2.0,
    damagedGrainMax: 3.0,
    submittedQuantityQuintals: 50,
  });
  recordAssert("Negative sensor input produces bounded output without negative accepted quantity", negativeMoisture.acceptedQuantityQuintals >= 0);

  // Stress 2.4: Weighbridge Discrepancy Negative Net Weight
  const negGross = calculateWeighingDiscrepancy({
    grossWeightQuintals: 20.0,
    tareWeightQuintals: 25.0, // Tare > Gross => Net = -5Q
    bookedEstimatedQuantityQuintals: 30.0,
  });
  recordAssert("Negative net weight is flagged as discrepancy", negGross.isDiscrepancyFlagged === true && negGross.netWeightQuintals === 0);

  // Exact 20.0% discrepancy boundary (Booked 100Q, Actual 120Q -> 20.0%)
  const boundary20 = calculateWeighingDiscrepancy({
    grossWeightQuintals: 140.0,
    tareWeightQuintals: 20.0, // Net = 120Q
    bookedEstimatedQuantityQuintals: 100.0, // Discrepancy = 20.0%
    discrepancyThresholdPercentage: 20.0,
  });
  recordAssert("Exact 20.0% discrepancy is not flagged (threshold is strictly >20.0%)", boundary20.isDiscrepancyFlagged === false && boundary20.discrepancyPercentage === 20.0);

  // 20.01% discrepancy boundary (Booked 100Q, Actual 120.01Q -> 20.01%)
  const boundary2001 = calculateWeighingDiscrepancy({
    grossWeightQuintals: 140.01,
    tareWeightQuintals: 20.0, // Net = 120.01Q
    bookedEstimatedQuantityQuintals: 100.0,
    discrepancyThresholdPercentage: 20.0,
  });
  recordAssert("20.01% discrepancy is flagged as alert", boundary2001.isDiscrepancyFlagged === true && boundary2001.discrepancyPercentage === 20.01);

  // Stress 2.5: MSP Calculation Float Precision
  const fractionalMsp = calculateMspPayment({
    acceptedQuantityQuintals: 34.567,
    mspRatePerQuintal: 2275.0,
    qualityDeductionPercentage: 1.5,
  });
  // Gross = 34.567 * 2275 = 78639.925 => rounded 78639.93
  // Deduction = 78639.925 * 0.015 = 1179.598875 => rounded 1179.60
  // Net = 78639.925 - 1179.598875 = 77460.326125 => rounded 77460.33
  recordAssert("Fractional quantity MSP gross, deduction, net calculation precision matches 2 decimals", Math.abs(fractionalMsp.grossAmount - 78639.93) < 0.02 && Math.abs(fractionalMsp.netPayableAmount - 77460.33) < 0.02, `Gross: ${fractionalMsp.grossAmount}, Net: ${fractionalMsp.netPayableAmount}`);

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log("\n===============================================================");
  console.log(`📊 EMPIRICAL VERIFICATION SUMMARY: ${passCount} Passed, ${failCount} Failed`);
  console.log("===============================================================");

  if (findings.length > 0) {
    console.log("\n⚠️ FAILURES DETECTED:");
    findings.forEach((f, idx) => console.log(`  ${idx + 1}. ${f}`));
  }

  await prisma.$disconnect();

  if (failCount > 0) {
    process.exit(1);
  }
}

runEmpiricalVerification().catch(async (e) => {
  console.error("Verification failed with exception:", e);
  await prisma.$disconnect();
  process.exit(1);
});
