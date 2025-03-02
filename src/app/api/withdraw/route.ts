import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  const { userId, danaNumber, danaName, amount } = await request.json();

  if (!userId || !danaNumber || !danaName || !amount) {
    return NextResponse.json(
      { error: "Semua field wajib diisi" },
      { status: 400 }
    );
  }

  const withdrawAmount = parseFloat(amount);
  if (isNaN(withdrawAmount) || withdrawAmount < 3000) {
    return NextResponse.json(
      { error: "Jumlah penarikan minimal Rp3000" },
      { status: 400 }
    );
  }

  try {
    // Ambil data pengguna
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Pengguna tidak ditemukan" },
        { status: 404 }
      );
    }

    if (withdrawAmount > user.balance) {
      return NextResponse.json(
        { error: "Saldo tidak mencukupi" },
        { status: 400 }
      );
    }

    // Update data pengguna dan catat penarikan dalam transaksi
    const updatedUser = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          danaNumber,
          danaName,
          balance: user.balance - withdrawAmount,
        },
      }),
      prisma.withdrawal.create({
        data: {
          userId,
          amount: withdrawAmount,
          remainingBalance: user.balance - withdrawAmount,
          status: "PENDING",
        },
      }),
    ]);

    return NextResponse.json({
      remainingBalance: updatedUser[0].balance,
      message: "Penarikan berhasil diajukan",
    });
  } catch (error) {
    console.error("Error processing withdrawal:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memproses penarikan" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
