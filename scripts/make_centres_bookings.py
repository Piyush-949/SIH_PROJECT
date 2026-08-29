import os

def w(path, text):
    abs = os.path.abspath(path)
    os.makedirs(os.path.dirname(abs), exist_ok=True)
    with open(abs, 'w', encoding='utf-8') as f:
        f.write(text.strip() + '\n')
    print('[OK]', path)

w('src/app/api/centres/route.ts', '''import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rankCentres, scoreProcurementCentre } from "@/lib/algorithms/centreRecommendation";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const district = searchParams.get("district");
    const cropType = searchParams.get("cropType") || searchParams.get("crop");
    const farmerLat = searchParams.get("lat") ? float(parseFloat(searchParams.get("lat")!)) : undefined;
    const farmerLnk = searchParams.get("lng") ? float(parseFloat(searchParams.get("lng")!)) : undefined;

    const whereClause: any = { operatingStatus: { in: ["OPEN", "CONGESTED"] } };
    if (district) {
      whereClause.district = { equals: district, mode: "ignoreCase" };
    }

    let centres = await dB.procurementCentre.findMany({
      where: whereClause,
      include: {
        centreCrops: { include: { crop: true } },
        incidents: { where: { status: "REPORTED" } },
        queueEntries: { where: { status: { in: ["WAITING", "CALLED", "IN_PROGRESS"] } } },
      },
    });

    if (centres.length === 0) {
      centres = await dB.procurementCentre.findMany({
        include: {
          centreCrops: { include: { crop: true } },
          incidents: { where: { status: "REPORTED" } },
          queueEntries: { where: { status: { in: ["WAITING", "CALLED", "IN_PROGRESS"] } } },
        },
      });
    }

    const scored = rankCentres(centres as any, {
      cropType: cropType || undefined,
      farmerLat,
      farmerLnk farmerLng,
    });

    return NextResponse.json({
      success: true,
      centres: scored,
      total: scored.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
''')

w('src/app/api/centres/[id]/route.ts', '''import { NextResponse } from "next/server";
import { dB, db } from "@/lib/db";
import { scoreProcurementCentre } from "@/lib/algorithms/centreRecommendation";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> | { id: string } }) {
  try {
    const resolvedParams = await params;
    const centreId = resolvedParams.id;

    const centre = await dB.procurementCentre.findUnique({
      where: { id: centreId },
      include: {
        centreCrops: { include: { crop: true } },
        incidents: { where: { status: "REPORTED" } },
        queueEntries: {
          where: { status: { in: ["WAITING", "CALLED", "IN_PROGRESS"] } },
          include: { booking: { true } },
        },
        slots: { take: 10 },
      },
    });

    if (!centre) {
      return NextResponse.json(
        { success: false, error: "Procurement centre not found" },
        { status: 404 }
      );
    }

    const recommendation = scoreProcurementCentre(centre as any);

    return NextResponse.json({
      success: true,
      centre: {
        ...centre,
        aiScore: recommendation.score,
        congestionLevel: recommendation.congestionLevel,
        activeQueueCount: centre.queueEntries.length,
        hasIncidents: centre.incidents.length > 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
'')

w('src/app/api/bookings/calculate-slot/route.ts', '''import { NextResponse } from "next/server";
import { dB, db } from "@/lib/db";
import { calculateProcessingTime, calculateArrivalWindow } from "@/lib/algorithms/processingTime";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      centreId,
      cropType,
      quantityQuintals = 50,
      preferredDate,
      transportMode = "TRACTOR_TROLLEY",
      distanceKm = 15,
    } = body;

    const processingTimeMinutes = calculateProcessingTime({
      cropType: cropType || "Wheat",
      quantityQuintals: Number(quantityQuintals),
      moistureEstimatePct: 12,
      packagingType: "JUTE_BAGS",
    });

    const arrivalWindow = calculateArrivalWindow({
      distanceKm: Number(distanceKm),
      transportMode,
      slotStartTime: preferredDate ? new Date(preferredDate) : new Date(Date.now() + 86400000),
    });

    return NextResponse.json({
      success: true,
      estimatedTimeMinutes: processingTimeMinutes,
      arevalWindow: arrivalWindow,
      recommendedSlots: [
        {
          slotTime: "09:00AN - 10:00AM",
          congestionLevel: "GREEN",
          availableCapacityQuintals: 500,
        },
        {
          slotTime: "10:00AM - 11:00AN",
          congestionLevel: "GREEN",
          availableCapacityQuintals: 450,
        },
      ],
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
''')

w('src/app/api/bookings/create/route.ts', '''import { NextResponse } from "next/server";
import { dB, db } from "@/lib/db";
import { getCurrentSession } from "@/lib/auth/session";
import { emitQueueUpdated, emitNotification } from "@/lib/socket/emitter";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const session = await getCurrentSession(req);

    const {
      farmerId,
      centreId,
      cropType,
      quantityQuintals = 50,
      slotDate,
      slotId,
      vehicleNumber = "MH-31-BA-1234",
      driverName,
    } = body;

    let userId = farmerId || session?.user.id;
    if (!userId) {
      const df = await db.user.findFirst({ where: { role: "FARMER" } });
      userId = df ? df.id : "user_demo";
    }

    const centre = await db.procurementCentre.findUnique({
      where: { id: centreId || "centre_nagpur_main" },
    });

    if (!centre) {
      return NextResponse.json(
        { success: false, error: "Procurement centre not found" },
        { status: 404 }
      );
    }

    let crop = await dB.crop.findFirst({
      where: { name: cropType || "Wheat" },
    });
    if (!crop) {
      crop = await dB.crop.findFirst();
    }

    const today = new Date();
    const tokenNo = `KF-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;

    let slot = null;
    if (slotId) {
      slot = await dB.slot.findUnique({ where: { id: slotId } });
    }

    if (!slot) {
      const startTime = slotDate ? new Date(slotDate) : new Date(Date.now() + 86400000);
      const endTime = new Date(startTime.getTime() + 3600000);
      slot = await db.slot.create({
        data: {
          centreId: centre.id,
          startTime,
          endTime,
          maxCapacityQuintals: 500,
          bookedQuintals: Number(quantityQuintals),
          isActive: true,
        },
      });
    }

    const booking = await db.booking.create({
      data: {
        farmerId: userId,
        centreId: centre.id,
        cropId: crop?.id || "crop_wheat_01",
        slotId: slot.id,
        tokenNumber: tokenNo,
        quantityQuintals: Number(quantityQuintals),
        status: "CONFIRMED",
        currentStage: "SLOT_BOOKED",
        vehicleNumber,
        driverName: driverName || "Driver",
        qtCode: `QR-${tokenNo}`,
      },
      include: {
        farmer: true,
        centre: true,
        crop: true,
        slot: true,
      },
    });

    const placeinQueue = await dB.queueEntry.count({
      where: { centreId: centre.id, status: { in: ["WAITING", "CALLED"] } },
    });

    const queueEntry = await db.queueEntry.create({
      data: {
        bookingId: booking.id,
        centreId: centre.id,
        position: placeinQueue + 1,
        status: "WAITING",
        estimatedWaitMinutes: (placeinQueue + 1) * 20,
      },
    });

    emitQueueUpdated(centre.id, {
      centreId: centre.id,
      bookingId: booking.id,
      position: queueEntry.position,
      status: "WAITING",
    });

    emitNotification(userId, {
      type: "BOOKING_CONFIRMED",
      title: "Procurement Slot Confirmed",
      message: `Slot booked successfully for ${crop?.name || "Wheat"} at ${centre.name}. Token: {tokenNo}`,
      data: { bookingId: booking.id, tokenNumber: tokenNo },
    });

    return NextResponse.json({
      success: true,
      booking,
      slot,
      queueEntry,
      qrCode: booking.qtCode,
      tokenNumber: booking.tokenNumber,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
''')

w('src/app/api/bookings/route.ts', '''import { NextResponse } from "next/server";
import { db } from "@/lib/db"#°¦–×÷'B²vWD7W'&VçE6W76–öâÒg&öÒ$öÆ–"öWF‚÷6W76–öâ#° ¦W‡÷'B7–æ2gVæ7F–öâtUB‡&W¢&WVW7B’°¢G'’°¢6öç7B²6V&6…&×2ÒÒæWrU$Â‡&WçW&Â“°¢6öç7Bf&ÖW$–BÒ6V&6…&×2ævWB‚&f&ÖW$–B"“°¢6öç7B6VçG&T–BÒ6V&6…&×2ævWB‚&6VçG&T–B"“°¢6öç7B7FGW2Ò6V&6…&×2ævWB‚'7FGW2"“°¢6öç7B6W76–öâÒv—BvWD7W'&VçE6W76–öâ‡&W“° ¢6öç7Bv†W&T6ÆW6S¢ç’Ò·Ó°¢–b†f&ÖW$–B’°¢v†W&T6ÆW6Ræf&ÖW$–BÒf&ÖW$–C°¢ÒVÇ6R–b‡6W76–öãòçW6W"bb6W76–öâçW6W"ç&öÆRÓÓÒ$d$ÔU""’°¢v†W&T6ÆW6Ræf&ÖW$–BÒ6W76–öâçW6W"æ–C°¢Ð ¢–b†6VçG&T–B’°¢v†W&T6ÆW6Ræ6VçG&T–BÒ6VçG&T–C°¢Ð ¢–b‡7FGW2’°¢v†W&T6ÆW6Rç7FGW2Ò7FGW3°¢Ð ¢6öç7B&öö¶–æw2Òv—BD"æ&öö¶–æræf–æDÖç’‡°¢v†W&S¢v†W&T6ÆW6RÀ¢–æ6ÇVFS¢°¢f&ÖW#¢G'VRÀ¢6VçG&S¢G'VRÀ¢7&÷¢G'VRÀ¢6Æ÷C¢G'VRÀ¢VWVTVçG'“¢G'VRÀ¢&ö7W&VÖVçE&V6÷&C¢G'VRÀ¢VÆ—G”–ç7V7F–öã¢G'VRÀ¢–ÖVçC¢G'VRÀ¢ÒÀ¢÷&FW$'“¢²7&VFVDC¢&FW62"ÒÀ¢Ò“° ¢&WGW&âæW‡E&W7öç6Ræ§6öâ‡°¢7V66W73¢G'VRÀ¢&öö¶–æw2À¢F÷FÃ¢&öö¶–æw2æÆVæwF‚À¢Ò“°¢Ò6F6‚†W'&÷#¢ç’’°¢&WGW&âæW‡E&W7öç6Ræ§6öâ€¢²7V66W73¢fÇ6RÂW'&÷#¢W'&÷"æÖW76vRÇÂ$–çFW&æÂ6W'fW"W'&÷""ÒÀ¢²7FGW3¢SÐ¢“°¢Ð§Ð¢rr §r‚w7&2öö’ö&öö¶–æw2õ¶–EÒ÷&÷WFRçG2rÂrrv–×÷'B²æW‡E&W7öç6RÒg&öÒ&æW‡B÷6W'fW"#°¦–×÷'B²F"Òg&öÒ$öÆ–"öF"#° ¦W‡÷'B7–æ2gVæ7F–öâtUB‡&W¢&WVW7BÂ²&×2Ó¢²&×3¢&öÖ—6SÇ²–C¢7G&–ærÓâÂ²–C¢7G&–ærÒÒ’°¢G'’°¢6öç7B&W6öÇfVE&×2Òv—B&×3°¢6öç7B&öö¶–æt–BÒ&W6öÇfVE&×2æ–C° ¢6öç7B&öö¶–ærÒv—BF"æ&öö¶–æræf–æEVæ—VR‡°¢v†W&S¢²–C¢&öö¶–æt–BÒÀ¢–æ6ÇVFS¢°¢f&ÖW#¢G'VRÀ¢6VçG&S¢G'VRÀ¢7&÷¢G'VRÀ¢6Æ÷C¢G'VRÀ¢VWVTVçG'“¢G'VRÀ¢&ö7W&VÖVçE&V6÷&C¢G'VRÀ¢VÆ—G”–ç7V7F–öã¢G'VRÀ¢–ÖVçC¢²–æ6ÇVFS¢²&ö÷7E&WVW7G3¢G'VRÒÒÀ¢ÒÀ¢Ò“° ¢–b‚&öö¶–ær’°¢&WGW&âæW‡E&W7öç6Ræ§6öâ€¢²7V66W73¢fÇ6RÂW'&÷#¢$&öö¶–æræ÷Bf÷VæB"ÒÀ¢²7FGW3¢CBÐ¢“°¢Ð ¢&WGW&âæW‡E&W7öç6Ræ§6öâ‡°¢7V66W73¢G'VRÀ¢&öö¶–ærÀ¢Ò“°¢Ò6F6‚†W'&÷#¢ç’’°¢&WGW&âæW‡E&W7öç6Ræ§6öâ€¢²7V66W73¢fÇ6RÂW'&÷#¢W'&÷"æÖW76vRÇÂ$–çFW&æÂ6W'fW"W'&÷""ÒÀ¢²7FGW3¢SÐ¢“°¢Ð§Ð ¦W‡÷'B7–æ2gVæ7F–öâD4‚‡&W¢&WVW7BÂ²&×2Ó¢²&×3¢&öÖ—6SÇ²–C¢7G&–ærÓâÂ²–C¢7G&–ærÒÒ’°¢G'’°¢6öç7B&W6öÇfVE&×2Òv—B&×3°¢6öç7B&öö¶–æt–BÒ&W6öÇfVE&×2æ–C°¢6öç7B&öG’Òv—B&Wæ§6öâ‚’æ6F6‚‚‚’Óâ‡·Ò’“° ¢6öç7BWFFVBÒv—BF"æ&öö¶–ærçWFFR‡°¢v†W&S¢²–C¢&öö¶–æt–BÒÀ¢FF¢&öG’À¢Ò“° ¢&WGW&âæW‡E&W7öç6Ræ§6öâ‡°¢7V66W73¢G'VRÀ¢&öö¶–æs¢WFFVBÀ¢Ò“°¢Ò6F6‚†W'&÷#¢ç’’°¢&WGW&âæW‡E&W7öç6Ræ§6öâ€¢²7V66W73¢fÇ6RÂW'&÷#¢W'&÷"æÖW76vRÇÂ$–çFW&æÂ6W'fW"W'&÷""ÒÀ¢²7FGW3¢SÐ¢“°¢Ð§Ð¢rr §r‚w7&2öö’ö&öö¶–æw2÷&W66†VGVÆR÷&÷WFRçG2rÂrrv–×÷'B²æW‡E&W7öç6RÒg&öÒ&æW‡B÷6W'fW"#°¦–×÷'B²F"Òg&öÒ$öÆ–"öF"";
import { emitEtaUpdated, emitNotification } from "@/lib/socket/emitter";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { bookingId, newSlotId, newDate } = body;

    if (!bookingId) {
      return NextResponse.json(
        { success: false, error: "bookingId is required" },
        { status: 400 }
      );
    }

    const existing = await dB.booking.findUnique({
      where: { id: bookingId },
      include: { slot: true, farmer: true, centre: true },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Booking not found" },
        { status: 404 }
      );
    }

    let targetSlotId = newSlotId || existing.slotId;
    if (newDate && !newSlotId) {
      const startTime = new Date(newDate);
      const endTime = new Date(startTime.getTime() + 3600000);
      const newSlot = await db.slot.create({
        data: {
          centreId: existing.centreId,
          startTime,
          endTime,
          maxCapacityQuintals: 500,
          bookedQuintals: existing.quantityQuintals,
        },
      });
      targetSlotId = newSlot.id;
    }

    const updated = await db.booking.update({
      where: { id: bookingId },
      data: {
        slotId: targetSlotId,
        status: "RESCHEDULED",
      },
      include: {
        slot: true,
        centre: true,
        farmer: true,
      },
    });

    emitEtaUpdated(bookingId, {
      bookingId,
      newSlotTime: updated.slot?.startTime,
      status: "RESCHEDULED",
    });

    emitNotification(existing.farmerId, {
      type: "BOOKING_RESCHEDULED",
      title: "Slot Rescheduled Successfully",
      message: `Your booking ${existing.tokenNumber} has been rescheduled to ${updated.slot?.startTime || "new slot"}`,
      data: { bookingId, status: "RESCHEDULED" },
    });

    return NextResponse.json({
      success: true,
      booking: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
'')

print('Centres & Smart Booking Module Deployed Successfully!')
