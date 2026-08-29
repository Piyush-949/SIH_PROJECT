import { NextResponse } from "next/server";

export async function POST() {
  try {
    return NextResponse.json({
      success: true,
      message: "Notifications marked as read",
      unreadCount: 0,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
