/*
  Warnings:

  - A unique constraint covering the columns `[year]` on the table `SummerCamp` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `summerCampId` to the `Inscription` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Inscription" ADD COLUMN     "summerCampId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "SummerCamp_year_key" ON "SummerCamp"("year");

-- AddForeignKey
ALTER TABLE "Inscription" ADD CONSTRAINT "Inscription_summerCampId_fkey" FOREIGN KEY ("summerCampId") REFERENCES "SummerCamp"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
