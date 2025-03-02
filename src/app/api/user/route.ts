import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
dayjs.extend(utc);

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
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const today = dayjs().utc().format("YYYY-MM-DD");
  if (user.lastAdViewDate !== today) {
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { todayAdViews: 0, lastAdViewDate: today },
    });
    // Sertakan photoUrl, telegramName, dan telegramUsername
    return NextResponse.json({
      user: {
        ...updatedUser,
        photoUrl: updatedUser.photoUrl,
        telegramName: updatedUser.telegramName,
        telegramUsername: updatedUser.telegramUsername,
      },
    });
  }

  // Sertakan photoUrl, telegramName, dan telegramUsername
  return NextResponse.json({
    user: {
      ...user,
      photoUrl: user.photoUrl,
      telegramName: user.telegramName,
      telegramUsername: user.telegramUsername,
    },
  });
}

export async function POST(request: NextRequest) {
  const telegramData = await request.json(); // Ambil data dari body request
  const today = dayjs().utc().format("YYYY-MM-DD");

  // Gunakan optional chaining dan nullish coalescing operator
  const telegramName = telegramData?.telegramName ?? "Tidak memiliki nama";
  const telegramUsername =
    telegramData?.telegramUsername ?? "Tidak memiliki username";
  const photoUrl = telegramData?.photoUrl ?? null; //tetap null

  const user = await prisma.user.upsert({
    where: { telegramUsername: telegramUsername }, // Cukup gunakan telegramUsername
    update: {
      telegramName, // Selalu update nama dan foto
      photoUrl,
    },
    create: {
      telegramName,
      telegramUsername,
      danaNumber: "",
      danaName: "",
      balance: 0,
      todayAdViews: 0,
      totalAdViews: 0,
      lastAdViewDate: today,
      photoUrl, // Simpan photoUrl
    },
  });

  return NextResponse.json({ user });
}

export async function PUT(request: NextRequest) {
  const { userId, balance, todayAdViews, totalAdViews, lastAdViewDate } =
    await request.json();

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      balance,
      todayAdViews,
      totalAdViews,
      ...(lastAdViewDate && { lastAdViewDate }),
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ user });
}
