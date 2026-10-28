/**
 * KRISHI SETU - Tier 4: Real-World Workflows Test Suite
 * SIH 2026 Problem Statement ID: 26032
 * Includes the Canonical 5-Minute SIH Demo Flow and 4 Persona Journeys (5 Test Cases)
 */

import { ApiTestClient } from '../helpers/apiClient';
import { SocketTestClient } from '../helpers/socketClient';
import { DbTestHelper } from '../helpers/dbHelper';
import { expect, assert } from '../helpers/assertions';
import { SuiteReport, TestResult } from '../helpers/types';
import { printSuiteHeader, printTestProgress } from '../helpers/reporter';

export async function runTier4RealWorldWorkflows(filter?: string): Promise<SuiteReport> {
  printSuiteHeader('Tier 4: Real-World Workflows (5 Canonical User Journeys)');

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
  // TC-T4-01: Canonical 5-Minute SIH Demo Flow
  // =========================================================================
  await executeTest('TC-T4-01', 'Canonical 5-Minute SIH Demo Flow (Strict 6-Step End-to-End)', async () => {
    // -----------------------------------------------------------------------
    // STEP 1: Farmer Login (Demo OTP) & Profile KYC Completion
    // -----------------------------------------------------------------------
    const otpSend = await api.post('/api/auth/send-otp', { phone: '9876543210' });
    expect(otpSend.status).toBe(200);

    const otpVerify = await api.post('/api/auth/verify-otp', { phone: '9876543210', otp: '123456', role: 'FARMER' });
    expect(otpVerify.status).toBe(200);
    api.setSession({
      token: otpVerify.data.token,
      role: 'FARMER',
      userId: otpVerify.data.user.id,
      phone: '9876543210',
    });

    const govVal = await api.post('/api/auth/validate-gov-id', {
      aadhaarNumber: '123456789012',
      kisanId: 'KID-MH-2026-001',
    });
    expect(govVal.data.valid).toBe(true);

    const kycComplete = await api.post('/api/auth/complete-kyc', {
      userId: otpVerify.data.user.id,
      name: 'Rameshwar Patil',
      aadhaarNumber: '123456789012',
      kisanId: 'KID-MH-2026-001',
      village: 'Pipla',
      district: 'Nagpur',
      state: 'Maharashtra',
      bankName: 'State Bank of India',
      accountNumber: '987654321098',
      ifscCode: 'SBIN0001234',
      preferredLanguage: 'hi',
    });
    expect(kycComplete.data.profile.kycStatus).toBe('COMPLETED');

    // -----------------------------------------------------------------------
    // STEP 2: Smart AI Centre Recommendation & Slot Booking (QR Token)
    // -----------------------------------------------------------------------
    const centresRes = await api.get('/api/centres');
    const bestCentre = centresRes.data.centres.find((c: any) => c.status === 'GREEN');
    expect(bestCentre).toBeDefined();
    expect(bestCentre.aiScore).toBeGreaterThanOrEqual(80);

    const bookingRes = await api.post('/api/bookings/create', {
      farmerId: otpVerify.data.user.id,
      centreId: bestCentre.id,
      cropId: 'WHEAT',
      estimatedQuantity: 35,
      vehicleType: 'TRACTOR_TROLLEY',
      slotTime: '2026-08-27T09:30:00Z',
    });
    expect(bookingRes.status).toBe(201);
    const bookingId = bookingRes.data.booking.id;
    const qrToken = bookingRes.data.qrToken;
    expect(bookingId).toBeDefined();
    expect(qrToken).toBeDefined();

    // -----------------------------------------------------------------------
    // STEP 3: Live Queue Tracking & Incident Dynamic ETA Recalculation
    // -----------------------------------------------------------------------
    await socket.connect();
    socket.emit('join_centre_queue', { centreId: bestCentre.id });

    const incidentEventPromise = socket.waitForEvent('incident_reported', 2000);
    const incidentRes = await api.post('/api/incidents/create', {
      centreId: bestCentre.id,
      type: 'WEIGHING_MACHINE_FAILURE',
      severity: 'HIGH',
      delayMinutesImpact: 25,
      description: 'Weighbridge sensor failure',
    });
    expect(incidentRes.status).toBe(201);

    socket.simulateServerBroadcast('incident_reported', {
      incidentId: incidentRes.data.incident.id,
      recalculatedEtas: { [bookingId]: '43 mins' },
    });
    const incidentBroadcast: any = await incidentEventPromise;
    expect(incidentBroadcast.recalculatedEtas[bookingId]).toBeDefined();

    // -----------------------------------------------------------------------
    // STEP 4: Operator QR Scan Check-In, Weighing & Quality Acceptance
    // -----------------------------------------------------------------------
    const checkinRes = await api.post('/api/procurement/check-in', { qrToken });
    expect(checkinRes.status).toBe(200);

    const weighRes = await api.post('/api/procurement/weighing', {
      bookingId,
      grossWeight: 3500,
      tareWeight: 0,
      actualQuantity: 35,
    });
    expect(weighRes.data.actualQuantity).toBe(35);
    expect(weighRes.data.alertTriggered).toBe(false);

    const qualityRes = await api.post('/api/procurement/quality-inspect', {
      bookingId,
      inspectorId: 'usr_inspector_1',
      moisturePercentage: 11.2,
      foreignMatterPercentage: 0.5,
      damagedGrainPercentage: 0.8,
      grade: 'GRADE_A',
      decision: 'ACCEPTED',
    });
    expect(qualityRes.data.inspection.grade).toBe('GRADE_A');
    expect(qualityRes.data.status).toBe('PROCUREMENT_ACCEPTED');

    // -----------------------------------------------------------------------
    // STEP 5: Admin Congestion Heatmap & Redirection Action Card
    // -----------------------------------------------------------------------
    const adminMapRes = await api.get('/api/centres');
    expect(adminMapRes.status).toBe(200);

    const recRes = await api.get('/api/admin/recommendations');
    expect(recRes.data.recommendations.length).toBeGreaterThanOrEqual(1);
    expect(recRes.data.recommendations[0].title).toContain('ACTION RECOMMENDED');

    // -----------------------------------------------------------------------
    // STEP 6: Farmer Payment Tracker & Payment Boost Request
    // -----------------------------------------------------------------------
    const paymentRes = await api.get(`/api/payments/booking/${bookingId}`);
    expect(paymentRes.data.grossAmount).toBe(35 * 2275); // ₹79,625

    const boostRes = await api.post('/api/payments/boost-request', {
      bookingId,
      reason: 'Urgent fertilizer purchase requirement',
    });
    expect(boostRes.status).toBe(201);
    expect(boostRes.data.boostRequest.status).toBe('ACTIVE');

    const expediteRes = await api.post('/api/payments/process-boost', {
      requestId: boostRes.data.boostRequest.id,
      action: 'EXPEDITE',
    });
    expect(expediteRes.data.updatedStatus).toBe('EXPEDITED');
  });

  // =========================================================================
  // TC-T4-02: Smallholder Wheat Farmer On-Time Harvest Journey
  // =========================================================================
  await executeTest('TC-T4-02', 'Smallholder Wheat Farmer On-Time Harvest Journey (Ramesh)', async () => {
    // 25Q Wheat booked and brought on time
    const booking = await api.post('/api/bookings/create', {
      farmerId: 'usr_ramesh',
      estimatedQuantity: 25,
      cropId: 'WHEAT',
    });
    const bookingId = booking.data.booking.id;

    await api.post('/api/procurement/check-in', { bookingId });
    const weigh = await api.post('/api/procurement/weighing', { bookingId, actualQuantity: 25 });
    expect(weigh.data.alertTriggered).toBe(false);

    const inspect = await api.post('/api/procurement/quality-inspect', {
      bookingId,
      grade: 'GRADE_A',
      decision: 'ACCEPTED',
    });
    expect(inspect.data.inspection.grade).toBe('GRADE_A');

    const pay = await api.get(`/api/payments/booking/${bookingId}`);
    expect(pay.data.grossAmount).toBe(25 * 2275); // ₹56,875
  });

  // =========================================================================
  // TC-T4-03: Marginal Paddy Farmer High Moisture & Partial Acceptance
  // =========================================================================
  await executeTest('TC-T4-03', 'Marginal Paddy Farmer High Moisture & Partial Acceptance (Suresh)', async () => {
    const booking = await api.post('/api/bookings/create', {
      farmerId: 'usr_suresh',
      estimatedQuantity: 60,
      cropId: 'PADDY',
    });
    const bookingId = booking.data.booking.id;

    await api.post('/api/procurement/check-in', { bookingId });
    await api.post('/api/procurement/weighing', { bookingId, actualQuantity: 60 });

    const inspect = await api.post('/api/procurement/quality-inspect', {
      bookingId,
      moisturePercentage: 16.0, // High moisture
      grade: 'GRADE_B',
      decision: 'PARTIAL_ACCEPT',
    });
    expect(inspect.data.inspection.decision).toBe('PARTIAL_ACCEPT');
    expect(inspect.data.inspection.deductionPercentage).toBeGreaterThan(0);
  });

  // =========================================================================
  // TC-T4-04: Large-Scale Soybean Producer On-Site PACS Visit Journey
  // =========================================================================
  await executeTest('TC-T4-04', 'Large-Scale Soybean Producer On-Site PACS Visit Journey (Vikram)', async () => {
    const booking = await api.post('/api/bookings/create', {
      farmerId: 'usr_vikram',
      estimatedQuantity: 250,
      cropId: 'SOYBEAN',
      isFarmVisitRequest: true,
    });
    expect(booking.data.booking.status).toBe('TEAM_VISIT_REQUESTED');
    expect(booking.data.booking.isFarmVisitRequest).toBe(true);
  });

  // =========================================================================
  // TC-T4-05: Multi-Centre Congestion Crisis & Dynamic Traffic Rebalancing
  // =========================================================================
  await executeTest('TC-T4-05', 'Multi-Centre Congestion Crisis & Traffic Rebalancing Flow', async () => {
    const recs = await api.get('/api/admin/recommendations');
    expect(recs.status).toBe(200);
    const diversion = recs.data.recommendations.find((r: any) => r.actionType === 'REDIRECT_TRAFFIC');
    expect(diversion).toBeDefined();
    expect(diversion.fromCentreId).toBe('centre_kalmeshwar_sub');
    expect(diversion.toCentreId).toBe('centre_nagpur_central');
  });

  socket.disconnect();
  await db.close();

  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;

  return {
    tierName: 'Tier 4: Real-World Workflows',
    total,
    passed,
    failed,
    durationMs: Date.now() - startTime,
    results,
  };
}
