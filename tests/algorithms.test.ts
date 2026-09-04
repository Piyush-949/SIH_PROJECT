/**
 * KRISHI SETU — Core Algorithm Test Suite
 * Validates processing time formulas, arrival windows, suitability scoring, Agmarknet grading, discrepancy detection, and MSP calculations.
 */

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

function runAlgorithmTests() {
  console.log("=================================================");
  console.log("🧪 KRISHI SETU — CORE ALGORITHM VERIFICATION TESTS");
  console.log("=================================================");

  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean, details?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name} ${details ? `(${details})` : ""}`);
      failed++;
    }
  }

  // 1. Processing Time Formula Tests
  console.log("\n--- [Test Group 1] Processing Time Formula & Dynamic Arrival Window ---");
  const proc1 = calculateProcessingTime({
    quantityQuintals: 40,
    cropBaseMinutesPerQuintal: 0.8,
    vehicleType: "TRACTOR_TROLLEY",
    baseEntryMinutes: 10,
    inspectionBaseMinutes: 8,
    activeIncidentPenaltyMinutes: 0,
  });
  // 10 + round(40 * 0.8 = 32) + 8 + 5 (tractor) + 0 = 55 minutes
  assert("Processing time for 40Q wheat by tractor is 55 mins", proc1.totalEstimatedMinutes === 55, `Got ${proc1.totalEstimatedMinutes}`);

  const proc2 = calculateProcessingTime({
    quantityQuintals: 20,
    cropBaseMinutesPerQuintal: 0.8,
    vehicleType: "PICKUP_TRUCK",
    baseEntryMinutes: 10,
    inspectionBaseMinutes: 8,
    activeIncidentPenaltyMinutes: 25, // Weighbridge incident penalty
  });
  // 10 + 16 + 8 + 0 + 25 = 59 mins
  assert("Processing time with 25m incident penalty adds up correctly", proc2.totalEstimatedMinutes === 59, `Got ${proc2.totalEstimatedMinutes}`);

  const arrivalWin = calculateArrivalWindow("2026-08-26", "10:00");
  assert("Arrival window starts 10m before slot start", arrivalWin.windowStart.getMinutes() === 50 && arrivalWin.windowStart.getHours() === 9);
  assert("Arrival window ends 20m after slot start", arrivalWin.windowEnd.getMinutes() === 20 && arrivalWin.windowEnd.getHours() === 10);
  assert("Grace expiry is 15m after window end (10:35)", arrivalWin.graceExpiryTime.getMinutes() === 35 && arrivalWin.graceExpiryTime.getHours() === 10);

  // 2. 5-Factor AI Centre Recommendation Engine Tests
  console.log("\n--- [Test Group 2] 5-Factor AI Centre Recommendation Engine ---");
  const centreLowLoad = scoreProcurementCentre({
    centreId: "PC-HR-002",
    centreName: "Nilokheri Cooperative PACS",
    distanceKm: 8,
    waitingQueueCount: 3,
    estimatedWaitMinutes: 18,
    currentLoadQuintals: 304,
    capacityPerDayQuintals: 800,
    processingSpeedPerHour: 90,
    activeIncidentsCount: 0,
    weighingMachinesActive: 2,
    weighingMachinesTotal: 2,
    status: "ACTIVE",
  });

  const centreHighLoad = scoreProcurementCentre({
    centreId: "PC-HR-001",
    centreName: "Karnal Central APMC",
    distanceKm: 5,
    waitingQueueCount: 22,
    estimatedWaitMinutes: 65,
    currentLoadQuintals: 1104,
    capacityPerDayQuintals: 1200,
    processingSpeedPerHour: 120,
    activeIncidentsCount: 1,
    weighingMachinesActive: 1,
    weighingMachinesTotal: 2,
    status: "CONGESTED",
  });

  assert("Low load centre gets GREEN status", centreLowLoad.congestionStatus === "GREEN");
  assert("High load (92%) centre gets RED status", centreHighLoad.congestionStatus === "RED");
  assert("Low load centre scores higher than congested centre", centreLowLoad.score > centreHighLoad.score, `${centreLowLoad.score} vs ${centreHighLoad.score}`);
  assert("Explanation reasons generated for low load centre", centreLowLoad.reasons.length > 0);

  const ranked = rankCentres([
    {
      centreId: "PC-HR-001",
      centreName: "Karnal Central APMC",
      distanceKm: 5,
      waitingQueueCount: 22,
      estimatedWaitMinutes: 65,
      currentLoadQuintals: 1104,
      capacityPerDayQuintals: 1200,
      processingSpeedPerHour: 120,
      activeIncidentsCount: 1,
      weighingMachinesActive: 1,
      weighingMachinesTotal: 2,
      status: "CONGESTED",
    },
    {
      centreId: "PC-HR-002",
      centreName: "Nilokheri PACS",
      distanceKm: 8,
      waitingQueueCount: 3,
      estimatedWaitMinutes: 18,
      currentLoadQuintals: 304,
      capacityPerDayQuintals: 800,
      processingSpeedPerHour: 90,
      activeIncidentsCount: 0,
      weighingMachinesActive: 2,
      weighingMachinesTotal: 2,
      status: "ACTIVE",
    },
  ]);

  assert("Nilokheri PACS is ranked #1 with primaryRecommendation true", ranked[0].centreId === "PC-HR-002" && ranked[0].primaryRecommendation === true);

  // 3. Agmarknet Quality Grading & Deduction Tests
  console.log("\n--- [Test Group 3] Agmarknet Quality Grading Matrix ---");
  const gradeA = evaluateQuality({
    moisturePercentage: 11.2,
    foreignMaterialPercentage: 0.8,
    damagedGrainPercentage: 1.5,
    moistureStandardMax: 12.0,
    foreignMaterialMax: 2.0,
    damagedGrainMax: 3.0,
    submittedQuantityQuintals: 40,
  });
  assert("Moisture 11.2% qualifies as GRADE_A", gradeA.grade === "GRADE_A");
  assert("GRADE_A has 0.0% deduction", gradeA.deductionPercentage === 0);
  assert("GRADE_A accepts 100% quantity (40Q)", gradeA.acceptedQuantityQuintals === 40);

  const gradeB = evaluateQuality({
    moisturePercentage: 13.5,
    foreignMaterialPercentage: 1.8,
    damagedGrainPercentage: 2.5,
    moistureStandardMax: 12.0,
    foreignMaterialMax: 2.0,
    damagedGrainMax: 3.0,
    submittedQuantityQuintals: 50,
  });
  assert("Moisture 13.5% qualifies as GRADE_B", gradeB.grade === "GRADE_B");
  assert("GRADE_B applies 2.0% deduction", gradeB.deductionPercentage === 2.0);
  assert("GRADE_B accepts 49.0Q of 50.0Q", gradeB.acceptedQuantityQuintals === 49);

  const gradeReject = evaluateQuality({
    moisturePercentage: 18.5, // > 12 + 4.5 = 16.5
    foreignMaterialPercentage: 5.0,
    damagedGrainPercentage: 7.0,
    moistureStandardMax: 12.0,
    foreignMaterialMax: 2.0,
    damagedGrainMax: 3.0,
    submittedQuantityQuintals: 30,
  });
  assert("Excessive moisture & foreign matter triggers REJECTED", gradeReject.grade === "REJECTED" && gradeReject.decision === "REJECT");
  assert("Rejected lot accepted quantity is 0", gradeReject.acceptedQuantityQuintals === 0);

  // 4. Weighbridge Weight & Discrepancy Alert Tests
  console.log("\n--- [Test Group 4] Weighbridge Discrepancy & Weight Engine ---");
  const weighNormal = calculateWeighingDiscrepancy({
    grossWeightQuintals: 72.2,
    tareWeightQuintals: 27.0,
    bookedEstimatedQuantityQuintals: 45.0,
  });
  assert("Net weight = 72.2 - 27.0 = 45.2Q", weighNormal.netWeightQuintals === 45.2);
  assert("Normal weight is not flagged for discrepancy", weighNormal.isDiscrepancyFlagged === false);

  const weighDiscrepant = calculateWeighingDiscrepancy({
    grossWeightQuintals: 95.0,
    tareWeightQuintals: 27.0,
    bookedEstimatedQuantityQuintals: 20.0,
  });
  // Net = 68Q vs Booked 20Q => Diff = +48Q, Discrepancy = 240%
  assert("Discrepant batch (Booked 20Q, Actual 68Q) is flagged", weighDiscrepant.isDiscrepancyFlagged === true);
  assert("Discrepancy percentage is 240%", weighDiscrepant.discrepancyPercentage === 240, `Got ${weighDiscrepant.discrepancyPercentage}`);
  assert("Suggested action options provided for operator", weighDiscrepant.suggestedActions.length > 0);

  // 5. MSP Payment & Transaction Reference Tests
  console.log("\n--- [Test Group 5] MSP Calculation & PFMS Direct Benefit Transfer ---");
  const paymentA = calculateMspPayment({
    acceptedQuantityQuintals: 40.0,
    mspRatePerQuintal: 2275.0, // Wheat MSP
    qualityDeductionPercentage: 0,
  });
  assert("40Q Wheat at ₹2,275/Q gross amount = ₹91,000", paymentA.grossAmount === 91000);
  assert("0% deduction leaves net payable = ₹91,000", paymentA.netPayableAmount === 91000);

  const paymentB = calculateMspPayment({
    acceptedQuantityQuintals: 29.4,
    mspRatePerQuintal: 2090.0, // Maize MSP
    qualityDeductionPercentage: 2.0,
  });
  // Gross = 29.4 * 2090 = 61446; Deduction = 61446 * 0.02 = 1228.92; Net = 60217.08
  assert("Maize with 2% deduction calculated accurately", paymentB.netPayableAmount === 60217.08, `Got ${paymentB.netPayableAmount}`);

  const txnRef = generatePfmsTransactionRef("KF-2026-0001");
  assert("PFMS transaction reference follows standard format", txnRef.startsWith("PFMS-") && txnRef.includes("-TXN-"), `Got ${txnRef}`);

  console.log("\n=================================================");
  console.log(`📊 SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runAlgorithmTests();
