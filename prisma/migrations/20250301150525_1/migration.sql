-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "telegramName" TEXT NOT NULL,
    "telegramUsername" TEXT NOT NULL,
    "danaNumber" TEXT NOT NULL,
    "danaName" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "todayAdViews" INTEGER NOT NULL DEFAULT 0,
    "totalAdViews" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdrawals" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "remainingBalance" DOUBLE PRECISION NOT NULL,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_telegramUsername_key" ON "users"("telegramUsername");

-- AddForeignKey
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
