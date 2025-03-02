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

  try {
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
      return NextResponse.json({ user: updatedUser });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const today = dayjs().utc().format("YYYY-MM-DD");

    const user = await prisma.user.upsert({
      where: { id: data.id },
      update: {
        telegramName: data.telegramName,
        telegramUsername: data.telegramUsername,
        photoUrl: data.photoUrl,
      },
      create: {
        id: data.id,
        telegramName: data.telegramName ?? "Pengguna",
        telegramUsername: data.telegramUsername ?? "",
        photoUrl: data.photoUrl ?? null,
        danaNumber: "",
        danaName: "",
        balance: 0,
        todayAdViews: 0,
        totalAdViews: 0,
        lastAdViewDate: today,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId, balance, todayAdViews, totalAdViews, lastAdViewDate } =
      await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

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
  } catch (error) {
    console.error("PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Tambahkan di API /app/api/user/route.ts
export async function DELETE(request: NextRequest) {
  const { userId } = await request.json();
  await prisma.user.update({
    where: { id: userId },
    data: {
      balance: 0,
      todayAdViews: 0,
      totalAdViews: 0,
      lastAdViewDate: dayjs().utc().format("YYYY-MM-DD"),
    },
  });
  return NextResponse.json({ message: "User data reset" });
}
