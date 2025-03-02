import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 }); // Handle user not found
  }

  const today = new Date().toISOString().split("T")[0];
  if (user.lastAdViewDate !== today) {
    // Reset todayAdViews and update lastAdViewDate
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { todayAdViews: 0, lastAdViewDate: today },
    });
    return NextResponse.json({ user: { ...updatedUser, todayAdViews: 0 } }); // Return updated data
  }

  return NextResponse.json({ user });
}

export async function POST(request: NextRequest) {
  const { telegramName, telegramUsername, photoUrl, lastAdViewDate } =
    await request.json(); //terima lastAdView

  const user = await prisma.user.upsert({
    where: { telegramUsername: telegramUsername || `user_${Math.random()}` },
    update: {},
    create: {
      telegramName: telegramName || "Tanpa Nama",
      telegramUsername: telegramUsername || `user_${Math.random()}`,
      danaNumber: "", // Initialize danaNumber
      danaName: "", // Initialize danaName
      balance: 0,
      todayAdViews: 0,
      totalAdViews: 0,
      lastAdViewDate, // Gunakan lastAdViewDate yang diterima
      ...(photoUrl && { photoUrl }), // Conditional object spread
    },
  });

  return NextResponse.json({ user });
}

export async function PUT(request: NextRequest) {
  const { userId, balance, todayAdViews, totalAdViews, lastAdViewDate } =
    await request.json();

  // No need to check the date here, it is already handled on the client side
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      balance,
      todayAdViews,
      totalAdViews,
      ...(lastAdViewDate && { lastAdViewDate }), // Only update if provided.  Important!
      updatedAt: new Date(), // Always update updatedAt
    },
  });

  return NextResponse.json({ user });
}
