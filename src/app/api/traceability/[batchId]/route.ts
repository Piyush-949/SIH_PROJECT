import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ batchId: string }> | { batchId: string } }
) {
  try {
    const resolvedParams = await params;
    const batchId = resolvedParams.batchId || "LOT-HR-2026-009182";

    // Generate complete 5-stage PDS supply chain lifecycle for this bag batch
    const bagBatch = {
      batchNumber: batchId,
      cropType: "WHEAT (Kalyan Sona Sharbati)",
      totalBags: 80, // 80 bags of 50kg = 40 Quintals
      weightPerBagKg: 50,
      totalWeightQuintals: 40.0,
      agmarknetGrade: "GRADE_A (Verified Moisture 11.2%)",
      originFarmer: {
        name: "Ramesh Kumar",
        kisanId: "KID-HR-2024-8891",
        village: "Taraori, Karnal",
        aadhaarMasked: "XXXX-XXXX-9012",
        harvestDate: "2026-08-20",
      },
      digitalSignatureSha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      blockchainLedgerTxn: "0x8f23b984a1e948c27941098421094892109489201948",
      supplyChainJourney: [
        {
          stage: "FARM_GATE_HARVEST",
          title: "Harvest & On-Farm Bagging",
          location: "Plot #4B, Taraori Village, Karnal",
          timestamp: "2026-08-22 07:00 AM",
          actor: "Farmer Ramesh Kumar",
          status: "COMPLETED",
          details: "80 standard 50kg jute gunny bags packed and barcoded.",
        },
        {
          stage: "MANDI_PROCUREMENT_INTAKE",
          title: "Mandi Inward & Agmarknet Lab Testing",
          location: "Karnal Central APMC Mandi (Bay #3)",
          timestamp: "2026-08-24 09:15 AM",
          actor: "Dr. Anil Sharma (Chief Quality Assessor)",
          status: "COMPLETED",
          details: "Weighbridge Gross 67.0Q / Tare 27.0Q = Net 40.0Q. Agmarknet Grade A certified.",
        },
        {
          stage: "FCI_SILO_TRANSIT",
          title: "FCI Buffer Stock Warehouse Dispatch",
          location: "FCI Central Storage Silo #7, Panipat Depot",
          timestamp: "2026-08-25 04:30 PM",
          actor: "Food Corporation of India Logistics Fleet",
          status: "COMPLETED",
          details: "Consignment sealed in moisture-controlled metallic hermetic storage silo.",
        },
        {
          stage: "DISTRICT_CIVIL_SUPPLIES",
          title: "District Civil Supplies Allocation",
          location: "District Food & Civil Supplies Warehouse, Karnal",
          timestamp: "2026-08-26 11:00 AM",
          actor: "District Supply Officer (DSO)",
          status: "COMPLETED",
          details: "Allocated to Fair Price Shops under Pradhan Mantri Garib Kalyan Anna Yojana (PMGKAY).",
        },
        {
          stage: "PDS_RATION_SHOP_DELIVERY",
          title: "Ration Shop Beneficiary Distribution",
          location: "FPS Shop #104, Ward 12, Karnal",
          timestamp: "2026-08-26 03:30 PM",
          actor: "Ration Dealer / POS Biometric Authentication",
          status: "IN_TRANSIT",
          details: "Available for public distribution to Antyodaya & NFSA ration card holders with zero pilferage.",
        },
      ],
      serializedBags: Array.from({ length: 8 }, (_, i) => ({
        bagTag: `BAG-${batchId}-${String(i + 1).padStart(3, "0")}`,
        netWeightKg: 50.0,
        rfidTagId: `RFID-9048-${i + 101}`,
        status: i < 6 ? "DELIVERED_TO_PDS" : "IN_DEPOT_BUFFER",
      })),
    };

    return NextResponse.json({
      success: true,
      batch: bagBatch,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch supply chain traceability batch" },
      { status: 500 }
    );
  }
}
