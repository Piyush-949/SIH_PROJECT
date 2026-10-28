import { NextResponse } from "next/server";
import { sharedPools } from "../poolStore";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      hostFarmerName = "Farmer",
      hostFarmerPhone = "9876543210",
      originVillage = "Taraori",
      district = "Karnal",
      destinationCentreName = "Karnal Central APMC Mandi",
      destinationCentreId = "PC-HR-001",
      scheduledDeparture = "Tomorrow 08:30 AM",
      vehicleType = "TRACTOR_TROLLEY",
      totalCapacityQuintals = 60.0,
      hostQuantity = 20.0,
      cropType = "WHEAT",
      estimatedCostPerQuintal = 45,
    } = body;

    const newPool = {
      id: `pool-${Date.now()}`,
      poolNumber: `POOL-HR-${Date.now().toString().slice(-4)}`,
      hostFarmerName,
      hostFarmerPhone,
      originVillage,
      district,
      destinationCentreName,
      destinationCentreId,
      scheduledDeparture,
      vehicleType,
      totalCapacityQuintals: Number(totalCapacityQuintals),
      filledQuantityQuintals: Number(hostQuantity),
      availableCapacityQuintals: Math.max(0, Number(totalCapacityQuintals) - Number(hostQuantity)),
      cropType,
      estimatedCostPerQuintal: Number(estimatedCostPerQuintal),
      savingsPercentage: 65,
      status: "OPEN",
      participants: [
        { farmerName: `${hostFarmerName} (Host)`, quantity: Number(hostQuantity), village: originVillage },
      ],
    };

    sharedPools.unshift(newPool);

    return NextResponse.json({
      success: true,
      pool: newPool,
      message: `Shared Produce Pool ${newPool.poolNumber} created successfully! Nearby farmers can now join.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create shared pool" },
      { status: 500 }
    );
  }
}
