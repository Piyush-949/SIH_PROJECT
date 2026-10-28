import { NextResponse } from "next/server";

export async function GET() {
  try {
    const notifications = [
      {
        id: "notif_1",
        category: "INCIDENT",
        title: "Weighing Delay Alert",
        message: "Weighing equipment offline at Nagpur APMC. Estimated delay +25 mins.",
        isRead: false,
        read: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: "notif_2",
        category: "BOOKING",
        title: "Slot Confirmed",
        message: "Your slot for Wheat (35Q) is confirmed for 09:30 AM.",
        isRead: false,
        read: false,
        createdAt: new Date().toISOString(),
      },
    ];

    return NextResponse.json({
      success: true,
      unreadCount: 2,
      notifications,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    return NextResponse.json({
      success: true,
      notification: {
        id: "notif_" + Date.now(),
        ...body,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
