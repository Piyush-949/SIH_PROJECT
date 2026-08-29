import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";
import { emitQueueUpdated, emitNotification } from "@/lib/socket/emitter";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      farmerId,
      centreId,
      cropId,
      cropType,
      estimatedQuantity,
      quantityQuintals,
      quantity,
      vehicleType = "TRACTOR_TROLLEY",
      isFarmVisitRequest = false,
      slotTime,
    } = body;

    const qty =
      estimatedQuantity !== undefined
        ? Number(estimatedQuantity)
        : quantityQuintals !== undefined
        ? Number(quantityQuintals)
        : quantity !== undefined
        ? Number(quantity)
        : 30;

    if (qty >= 5000) {
      return NextResponse.json(
        { success: false, error: "Bulk procurement >5000Q requires state-level clearance" },
        { status: 422 }
      );
    }

    if (qty <= 0) {
      return NextResponse.json(
        { success: false, error: "Quantity must be greater than 0" },
        { status: 400 }
      );
    }

    // Get authenticated farmer from JWT session
    const session = await getCurrentSession(req);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required. Please login first." },
        { status: 401 }
      );
    }

    // Look up the farmer's profile in DB
    let farmer = null;

    if (farmerId) {
      farmer = await db.farmerProfile.findFirst({
        where: { OR: [{ id: farmerId }, { userId: farmerId }] },
      });
    }

    // Fallback: find by authenticated user's ID
    if (!farmer) {
      farmer = await db.farmerProfile.findUnique({
        where: { userId: session.user.id },
      });
    }

    if (!farmer) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Farmer profile not found. Please complete your KYC registration before booking a slot.",
        },
        { status: 404 }
      );
    }

    // Look up the centre
    let centre = null;
    if (centreId) {
      centre = await db.procurementCentre.findUnique({ where: { id: centreId } });
    }
    if (!centre) {
      centre = await db.procurementCentre.findFirst({ where: { status: "ACTIVE" } });
    }
    if (!centre) {
      return NextResponse.json(
        { success: false, error: "No active procurement centres found" },
        { status: 404 }
      );
    }

    // Look up the crop
    let crop = null;
    if (cropId) {
      crop = await db.crop.findFirst({
        where: { OR: [{ id: cropId }, { name: cropId }] },
      });
    } else if (cropType) {
      crop = await db.crop.findFirst({
        where: { name: cropType },
      });
    }
    if (!crop) {
      crop = await db.crop.findFirst();
    }
    if (!crop) {
      return NextResponse.json(
        { success: false, error: "No crops found in the system" },
        { status: 404 }
      );
    }

    // Generate booking number and token
    const tokenNo =
      "TK-" + (crop.name?.slice(0, 3)?.toUpperCase() || "WHT") + "-" + Math.floor(100 + Math.random() * 900);
    const bookingNo = "BK-2026-" + Math.floor(1000 + Math.random() * 9000);

    const isVisit = Boolean(isFarmVisitRequest || qty > 100);

    const qrPayload = JSON.stringify({
      bookingId: bookingNo,
      tokenNumber: tokenNo,
      farmerId: farmer.id,
      crop: crop.name || "Wheat",
      quantity: qty,
      centreId: centre.id,
      centreName: centre.name,
      timestamp: new Date().toISOString(),
    });

    const now = new Date();
    const slotDate = slotTime ? new Date(slotTime) : new Date(now.getTime() + 2 * 60 * 60 * 1000);

    const booking = await db.booking.create({
      data: {
        bookingNumber: bookingNo,
        farmerId: farmer.id,
        centreId: centre.id,
        cropId: crop.id,
        estimatedQuantityQuintals: qty,
        vehicleType,
        transportType: isVisit ? "TEAM_VISIT" : "SELF_TRANSPORT",
        status: isVisit ? "PENDING_VISIT" : "CONFIRMED",
        currentStage: isVisit ? "TEAM_VISIT_REQUESTED" : "SLOT_BOOKED",
        qrToken: qrPayload,
        arrivalWindowStart: slotDate,
        arrivalWindowEnd: new Date(slotDate.getTime() + 7200000),
        estimatedProcessingTimeMinutes: Math.ceil(qty * (crop.baseProcessingMinutesPerQuintal || 0.8)),
        originalEstimatedArrival: slotDate,
        dynamicEstimatedArrival: slotDate,
      },
      include: {
        farmer: true,
        centre: true,
        crop: true,
      },
    });

    // Create queue entry for normal bookings (not farm visits)
    if (!isVisit) {
      const qCount = await db.queueEntry.count({
        where: { centreId: centre.id, status: { in: ["WAITING", "CALLED", "PROCESSING"] } },
      });

      await db.queueEntry.create({
        data: {
          bookingId: booking.id,
          centreId: centre.id,
          tokenNumber: tokenNo,
          queuePosition: qCount + 1,
          status: "WAITING",
          currentStage: "SLOT_BOOKED",
          etaMinutes: (qCount + 1) * 20,
        },
      });

      emitQueueUpdated(centre.id, {
        centreId: centre.id,
        activeQueueCount: qCount + 1,
      });
    }

    // Send notification
    emitNotification(farmer.userId, {
      type: "BOOKING_CONFIRMED",
      title: "Slot Booked Successfully",
      message: `Token ${tokenNo} generated for ${qty}Q ${crop.name}`,
      data: { bookingId: booking.id, tokenNumber: tokenNo },
    });

    // Persist notification in DB
    await db.notification.create({
      data: {
        userId: farmer.userId,
        title: "Slot Booked Successfully",
        titleHindi: "स्लॉट सफलतापूर्वक बुक किया गया",
        message: `Token ${tokenNo} generated for ${qty}Q ${crop.name} at ${centre.name}`,
        messageHindi: `${centre.name} पर ${qty}Q ${crop.name} के लिए टोकन ${tokenNo} जारी किया गया`,
        category: "BOOKING",
        metadata: JSON.stringify({ bookingId: booking.id, tokenNumber: tokenNo }),
      },
    });

    return NextResponse.json(
      {
        success: true,
        booking: {
          ...booking,
          id: booking.id,
          status: isVisit ? "TEAM_VISIT_REQUESTED" : "SLOT_BOOKED",
          tokenNumber: tokenNo,
          isFarmVisitRequest: isVisit,
        },
        qrToken: qrPayload,
        tokenNumber: tokenNo,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
