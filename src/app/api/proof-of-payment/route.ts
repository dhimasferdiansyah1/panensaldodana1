// app/api/proof-of-payment/route.ts
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const withdrawals = await prisma.withdrawal.findMany({
      include: {
        user: {
          select: {
            telegramUsername: true,
            danaNumber: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 100,
    });

    const responseData = withdrawals.map((withdrawal) => ({
      id: withdrawal.id,
      amount: withdrawal.amount,
      status: withdrawal.status,
      updatedAt: withdrawal.updatedAt.toISOString(),
      user: {
        telegramUsername: withdrawal.user.telegramUsername ?? "Unknown",
        danaNumber: withdrawal.user.danaNumber ?? "N/A",
      },
    }));

    return NextResponse.json({ withdrawals: responseData });
  } catch (error) {
    console.error("Database error:", error);
    return NextResponse.json(
      {
        error: "Terjadi kesalahan saat mengambil data pembayaran",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
