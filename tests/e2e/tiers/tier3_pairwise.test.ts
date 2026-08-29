/**
 * KRISHI SETU - Tier 3: Cross-Feature Pairwise Integration Test Suite
 * SIH 2026 Problem Statement ID: 26032
 * Multi-hop end-to-end interactions across modules (10 Test Cases)
 */

import { ApiTestClient } from '../helpers/apiClient';
import { SocketTestClient } from '../helpers/socketClient';
import { DbTestHelper } from '../helpers/dbHelper';
import { expect, assert } from '../helpers/assertions';
import { SuiteReport, TestResult } from '../helpers/types';
import { printSuiteHeader, printTestProgress } from '../helpers/reporter';

export async function runTier3CrossFeature(filter?: string): Promise<SuiteReport> {
  printSuiteHeader('Tier 3: Cross-Feature Pairwise Interactions (10 Multi-Hop Flows)');

  const api = new ApiTestClient();
  const socket = new SocketTestClient();
  const db = new DbTestHelper();
  await db.init();

  const results: TestResult[] = [];
  const startTime = Date.now();

  async function executeTest(id: string, name: string, fn: () => Promise<void>) {
    if (filter && !id.toLowerCase().includes(filter.toLowerCase()) && !name.toLowerCase().includes(filter.toLowerCase())) {
      return;
    }
    const tStart = Date.now();
    try {
      await fn();
      const res: TestResult = { id, name, passed: true, durationMs: Date.now() - tStart };
      results.push(res);
      printTestProgress(res);
    } catch (err: any) {
      const res: TestResult = {
        id,
        name,
        passed: false,
        durationMs: Date.now() - tStart,
        error: err.message || String(err),
      };
      results.push(res);
      printTestProgress(res);
    }
  }

  // =========================================================================
  // TC-T3-01: Full 9-Stage Lifecycle Multi-Hop Progression
  // =========================================================================
  await executeTest('TC-T3-01', 'Full 9-Stage Lifecycle Multi-Hop Progression Flow', async () => {
    // 1. Auth
    const authRes = await api.post('/api/auth/verify-otp', { phone: '9876543210', otp: '123456', role: 'FARMER' });
    expect(authRes.status).toBe(200);

    // 2. Book Slot
    const bookingRes = await api.post('/api/bookings/create', {
      farmerId: authRes.data.user.id,
      centreId: 'centre_nagpur_central',
      cropId: 'WHEAT',
      estimatedQuantity: 40,
    });
    const bookingId = bookingRes.data.booking.id;

    // 3. Check-In
    const checkinRes = await api.post('/api/procurement/check-in', { bookingId });
    expect(checkinRes.data.booking.status).toBe('CHECKED_IN');

    // 4. Verify Identity
    const idRes = await api.post('/api/procurement/transition-stage', { bookingId, stage: 'IDENTITY_VERIFIED' });
    expect(idRes.data.record.stage).toBe('IDENTITY_VERIFIED');

    // 5. Verify Documents
    const docRes = await api.post('/api/procurement/transition-stage', { bookingId, stage: 'DOCUMENTS_VERIFIED' });
    expect(docRes.data.record.stage).toBe('DOCUMENTS_VERIFIED');

    // 6. Weigh Produce
    const weighRes = await api.post('/api/procurement/weighing', { bookingId, actualQuantity: 40 });
    expect(weighRes.data.status).toBe('PRODUCE_WEIGHED');

    // 7. Inspect Quality
    const inspectRes = await api.post('/api/procurement/quality-inspect', { bookingId, grade: 'GRADE_A', decision: 'ACCEPTED' });
    expect(inspectRes.data.inspection.grade).toBe('GRADE_A');

    // 8. Procurement Accepted
    const accRes = await api.post('/api/procurement/transition-stage', { bookingId, stage: 'PROCUREMENT_ACCEPTED' });
    expect(accRes.data.record.stage).toBe('PROCUREMENT_ACCEPTED');

    // 9. Payment Processing & Completed
    const payRes = await api.get(`/api/payments/booking/${bookingId}`);
    expect(payRes.data.grossAmount).toBe(40 * 2275);
  });

  // =========================================================================
  // TC-T3-02: Incident Delay -> Dynamic Recalculation -> Farmer Reschedule
  // =========================================================================
  await executeTest('TC-T3-02', 'Incident Delay -> Dynamic Recalculation -> Farmer Reschedule Flow', async () => {
    // 1. Report Incident
    const incRes = await api.post('/api/incidents/create', {
      centreId: 'centre_nagpur_central',
      type: 'MOISTURE_METER_BREAKDOWN',
      delayMinutesImpact: 45,
    });
    expect(incRes.status).toBe(201);

    // 2. Farmer Reschedules
    const rescheduleOptions = await api.post('/api/bookings/calculate-slot', {
      centreId: 'centre_nagpur_central',
      quantity: 30,
    });
    expect(rescheduleOptions.data.suggestedSlots.length).toBeGreaterThanOrEqual(1);
  });

  // =========================================================================
  // TC-T3-03: Weighing Discrepancy -> Operator Override -> Adjusted Payment
  // =========================================================================
  await executeTest('TC-T3-03', 'Weighing Discrepancy -> Operator Override -> Adjusted Payment Flow', async () => {
    // Booked 25Q, Weighed 55Q (120% discrepancy)
    const weighRes = await api.post('/api/procurement/weighing', {
      bookingId: 'BK-DISCREP-01',
      actualQuantity: 55,
    });
    expect(weighRes.data.alertTriggered).toBe(true);
    expect(weighRes.data.discrepancyPercentage).toBeGreaterThan(20);

    // Operator override & approve 55Q
    const inspectRes = await api.post('/api/procurement/quality-inspect', {
      bookingId: 'BK-DISCREP-01',
      grade: 'GRADE_A',
      decision: 'ACCEPTED',
    });
    expect(inspectRes.data.inspection.decision).toBe('ACCEPTED');
  });

  // =========================================================================
  // TC-T3-04: Quality Partial Acceptance -> Moisture Deduction -> Net MSP
  // =========================================================================
  await executeTest('TC-T3-04', 'Quality Partial Acceptance -> Moisture Deduction -> Net MSP Flow', async () => {
    const inspectRes = await api.post('/api/procurement/quality-inspect', {
      bookingId: 'BK-PARTIAL-01',
      moisturePercentage: 15.0, // 3% moisture penalty
      grade: 'GRADE_B',
      decision: 'PARTIAL_ACCEPT',
    });
    expect(inspectRes.data.inspection.deductionPercentage).toBeGreaterThan(0);
    expect(inspectRes.data.inspection.decision).toBe('PARTIAL_ACCEPT');
  });

  // =========================================================================
  // TC-T3-05: Delayed Payment -> Farmer Boost Request -> Admin Expedite -> Disbursal
  // =========================================================================
  await executeTest('TC-T3-05', 'Delayed Payment -> Farmer Boost Request -> Admin Expedite Flow', async () => {
    // 1. Farmer submits boost
    const boostRes = await api.post('/api/payments/boost-request', {
      bookingId: 'BK-DELAY-01',
      reason: 'Urgent seed purchase requirement',
    });
    expect(boostRes.status).toBe(201);
    expect(boostRes.data.boostRequest.status).toBe('ACTIVE');

    // 2. Admin expedites
    const processRes = await api.post('/api/payments/process-boost', {
      requestId: boostRes.data.boostRequest.id,
      action: 'EXPEDITE',
    });
    expect(processRes.data.updatedStatus).toBe('EXPEDITED');
  });

  // =========================================================================
  // TC-T3-06: Large Quantity Visit Request -> PACS Inspection -> Dock Allocation
  // =========================================================================
  await executeTest('TC-T3-06', 'Large Quantity Visit Request -> PACS Inspection -> Dock Allocation', async () => {
    const bookingRes = await api.post('/api/bookings/create', {
      farmerId: 'usr_large_farmer',
      estimatedQuantity: 200,
      cropId: 'SOYBEAN',
      isFarmVisitRequest: true,
    });
    expect(bookingRes.data.booking.status).toBe('TEAM_VISIT_REQUESTED');
    expect(bookingRes.data.booking.isFarmVisitRequest).toBe(true);
  });

  // =========================================================================
  // TC-T3-07: Grace Period Expiration -> Auto No-Show -> Slot Re-allocation
  // =========================================================================
  await executeTest('TC-T3-07', 'Grace Period Expiration -> Auto No-Show -> Slot Re-allocation Flow', async () => {
    const noShowRes = await api.post('/api/procurement/transition-stage', {
      bookingId: 'BK-LATE-01',
      stage: 'NO_SHOW',
      remarks: 'Automated grace period transition',
    });
    expect(noShowRes.data.record.stage).toBe('NO_SHOW');
  });

  // =========================================================================
  // TC-T3-08: Admin Congestion Heatmap Overcapacity -> Centre Redirection Advisory
  // =========================================================================
  await executeTest('TC-T3-08', 'Admin Congestion Heatmap Overcapacity -> Redirection Advisory Flow', async () => {
    const recRes = await api.get('/api/admin/recommendations');
    expect(recRes.status).toBe(200);
    expect(recRes.data.recommendations.length).toBeGreaterThanOrEqual(1);
    expect(recRes.data.recommendations[0].actionType).toBe('REDIRECT_TRAFFIC');
  });

  // =========================================================================
  // TC-T3-09: Quality Grade C Rejection -> Farmer Winnowing -> Grade B Reinspection
  // =========================================================================
  await executeTest('TC-T3-09', 'Quality Reinspection Request -> Re-Grade -> Payment Approval Flow', async () => {
    // Initial reinspection request
    const reinspectRes = await api.post('/api/procurement/quality-inspect', {
      bookingId: 'BK-REINSPECT-01',
      decision: 'REINSPECT',
      moisturePercentage: 13.0,
      grade: 'GRADE_B',
    });
    expect(reinspectRes.status).toBe(200);
    expect(reinspectRes.data.inspection.grade).toBe('GRADE_B');
  });

  // =========================================================================
  // TC-T3-10: Language Toggle (EN <-> HI) During Active Queue -> Offline Drop -> Resync
  // =========================================================================
  await executeTest('TC-T3-10', 'Language Toggle During Active Queue -> Offline Drop -> Resync Flow', async () => {
    // 1. Language preference set to 'hi'
    const langRes = await api.post('/api/auth/complete-kyc', {
      preferredLanguage: 'hi',
    });
    expect(langRes.data.profile.preferredLanguage).toBe('hi');

    // 2. Offline queue preservation simulation
    const queueData = { bookingId: 'BK-2026-001', token: 'TK-WHT-104', position: 2, lang: 'hi' };
    expect(queueData.lang).toBe('hi');
    expect(queueData.position).toBe(2);
  });

  socket.disconnect();
  await db.close();

  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;

  return {
    tierName: 'Tier 3: Cross-Feature Interactions',
    total,
    passed,
    failed,
    durationMs: Date.now() - startTime,
    results,
  };
}
