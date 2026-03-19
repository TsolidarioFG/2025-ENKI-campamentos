/*
  Warnings:

  - The values [REJECTED] on the enum `WeekInscriptionStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "PaymentPurpose" AS ENUM ('RESERVATION', 'BREAKFAST', 'LUNCH', 'EARLY_RISE', 'OTHER');

-- AlterEnum
BEGIN;
CREATE TYPE "WeekInscriptionStatus_new" AS ENUM ('PENDING', 'ACCEPTED', 'WAITLIST', 'CANCELLED');
ALTER TABLE "public"."SignedUp" ALTER COLUMN "state" DROP DEFAULT;
ALTER TABLE "SignedUp" ALTER COLUMN "state" TYPE "WeekInscriptionStatus_new" USING ("state"::text::"WeekInscriptionStatus_new");
ALTER TYPE "WeekInscriptionStatus" RENAME TO "WeekInscriptionStatus_old";
ALTER TYPE "WeekInscriptionStatus_new" RENAME TO "WeekInscriptionStatus";
DROP TYPE "public"."WeekInscriptionStatus_old";
ALTER TABLE "SignedUp" ALTER COLUMN "state" SET DEFAULT 'PENDING';
COMMIT;

-- CreateTable
CREATE TABLE "PaymentSignedUp" (
    "id" SERIAL NOT NULL,
    "paymentId" INTEGER NOT NULL,
    "inscriptionId" INTEGER NOT NULL,
    "weekId" INTEGER NOT NULL,
    "purpose" "PaymentPurpose" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentSignedUp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentSignedUp_paymentId_idx" ON "PaymentSignedUp"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentSignedUp_inscriptionId_weekId_idx" ON "PaymentSignedUp"("inscriptionId", "weekId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentSignedUp_paymentId_inscriptionId_weekId_purpose_key" ON "PaymentSignedUp"("paymentId", "inscriptionId", "weekId", "purpose");

-- AddForeignKey
ALTER TABLE "PaymentSignedUp" ADD CONSTRAINT "PaymentSignedUp_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentSignedUp" ADD CONSTRAINT "PaymentSignedUp_inscriptionId_weekId_fkey" FOREIGN KEY ("inscriptionId", "weekId") REFERENCES "SignedUp"("inscriptionId", "weekId") ON DELETE RESTRICT ON UPDATE CASCADE;
