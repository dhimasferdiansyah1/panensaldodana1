import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  try {
    // Ambil data pengguna untuk danaNumber dan danaName
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        danaNumber: true,
        danaName: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan" },
        { status: 404 }
      );
    }

    // Ambil riwayat penarikan berdasarkan userId
    const withdrawals = await prisma.withdrawal.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }, // Urutkan dari yang terbaru
      select: {
        id: true,
        createdAt: true,
        amount: true,
        status: true,
      },
    });

    return NextResponse.json({
      danaNumber: user.danaNumber,
      danaName: user.danaName,
      withdrawals,
    });
  } catch (error) {
    console.error("Error fetching withdrawal history:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil riwayat penarikan" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
