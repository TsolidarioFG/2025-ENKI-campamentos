/*
  Warnings:

  - You are about to drop the column `amountApplied` on the `InscriptionDiscount` table. All the data in the column will be lost.
  - You are about to drop the column `justification` on the `InscriptionDiscount` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Communication_extraFormId_key";

-- DropIndex
DROP INDEX "Fear_extraFormId_key";

-- DropIndex
DROP INDEX "Sport_extraFormId_key";

-- AlterTable
ALTER TABLE "InscriptionDiscount" DROP COLUMN "amountApplied",
DROP COLUMN "justification";

-- CreateTable
CREATE TABLE "ExtraFormToken" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "participantId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtraFormToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExtraFormToken_token_key" ON "ExtraFormToken"("token");

-- AddForeignKey
ALTER TABLE "ExtraFormToken" ADD CONSTRAINT "ExtraFormToken_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
