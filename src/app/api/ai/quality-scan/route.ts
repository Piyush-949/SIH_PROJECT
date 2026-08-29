import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { cropType = "WHEAT", imageBase64, sampleWeightGrams = 100 } = body;

    // Simulate Computer Vision Convolutional Neural Network Analysis on grain sample
    const isWheat = cropType.toUpperCase().includes("WHEAT");
    const isPaddy = cropType.toUpperCase().includes("PADDY") || cropType.toUpperCase().includes("RICE");
    const isMaize = cropType.toUpperCase().includes("MAIZE");

    // Dynamic AI vision detection metrics with realistic variance
    const grainCount = Math.floor(450 + Math.random() * 80);
    const damagedCount = Math.floor(grainCount * (0.008 + Math.random() * 0.015));
    const foreignParticles = Math.floor(2 + Math.random() * 4);

    const moisturePercentage = parseFloat((10.8 + Math.random() * 2.2).toFixed(1));
    const damagedPercentage = parseFloat(((damagedCount / grainCount) * 100).toFixed(1));
    const foreignMaterialPercentage = parseFloat(((foreignParticles / grainCount) * 100).toFixed(2));

    // Determine Agmarknet Quality Grade
    let grade = "GRADE_A";
    let status = "OPTIMAL";
    let recommendation = "High-quality uniform grains. Eligible for 100% full MSP rate with zero deductions.";

    if (moisturePercentage > 14.0 || damagedPercentage > 3.0) {
      grade = "REJECTED";
      status = "HIGH_MOISTURE";
      recommendation = "Moisture exceeds permissible limits (>14.0%). Sun-dry grains for 4-6 hours before bringing to Mandi to avoid rejection.";
    } else if (moisturePercentage > 12.0 || damagedPercentage > 1.5) {
      grade = "GRADE_B";
      status = "ACCEPTABLE_WITH_DEDUCTION";
      recommendation = "Slightly elevated moisture (12-14%). Accepted with standard 1.5-2.0% quality cut rate as per Agmarknet rules.";
    }

    // Detected visual defects bounding boxes for UI overlay simulation
    const detectedDefects = [
      { id: "def-1", type: "SHRIVELED_GRAIN", confidence: 0.94, box: { x: 28, y: 35, width: 14, height: 14 } },
      { id: "def-2", type: "FOREIGN_HUSK", confidence: 0.89, box: { x: 62, y: 48, width: 18, height: 12 } },
      { id: "def-3", type: "DISCOLORED", confidence: 0.91, box: { x: 45, y: 72, width: 12, height: 12 } },
    ];

    return NextResponse.json({
      success: true,
      scanId: `SCAN-AI-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      cropType,
      sampleAnalysis: {
        totalGrainsAnalyzed: grainCount,
        moisturePercentage,
        damagedPercentage,
        foreignMaterialPercentage,
        lusterIndex: "AMBER_OPTIMAL",
        averageKernelSizeMm: isWheat ? 6.2 : isPaddy ? 7.8 : 9.1,
      },
      qualityAssessment: {
        grade,
        status,
        recommendation,
        estimatedMspPayoutPerQuintal: grade === "GRADE_A" ? 2275 : grade === "GRADE_B" ? 2230 : 0,
      },
      detectedDefects,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "AI Vision engine processing failed" },
      { status: 500 }
    );
  }
}
