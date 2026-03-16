-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'SUPERADMIN');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('ONE_PAYMENT', 'TWO_PAYMENTS');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('FULL', 'FIRST_INSTALLMENT', 'SECOND_INSTALLMENT', 'EXTRA');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'CASH', 'CARD', 'BIZUM', 'OTHER');

-- CreateEnum
CREATE TYPE "InscriptionStatus" AS ENUM ('PENDING', 'PARTIALLY_ACCEPTED', 'ACCEPTED', 'WAITLIST', 'REJECTED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "WeekInscriptionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'WAITLIST', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SchoolingType" AS ENUM ('ORDINARY', 'SPECIAL', 'OTHER');

-- CreateEnum
CREATE TYPE "SwimmingLevel" AS ENUM ('YES', 'NO', 'WITH_TECHNICAL_AIDS', 'WITH_SUPPORT');

-- CreateEnum
CREATE TYPE "SupportType" AS ENUM ('NONE', 'INTERMITTENT', 'LIMITED_EXTENSIVE', 'GENERALIZED_CONSTANT');

-- CreateEnum
CREATE TYPE "HygieneLevel" AS ENUM ('INDEPENDENT', 'NEEDS_SUPERVISION', 'NEEDS_PHYSICAL_SUPPORT');

-- CreateEnum
CREATE TYPE "SphincterControlLevel" AS ENUM ('GOES_ALONE', 'ASKS_OR_WARNS', 'MUST_BE_ASKED', 'USES_DIAPER');

-- CreateEnum
CREATE TYPE "EatingSupportLevel" AS ENUM ('INDEPENDENT', 'NEEDS_SUPERVISION', 'NEEDS_INTERMITTENT_SUPPORT', 'NEEDS_CONTINUOUS_SUPPORT');

-- CreateEnum
CREATE TYPE "OralLanguageLevel" AS ENUM ('SOUNDS', 'SOME_WORDS', 'PHRASES', 'FLUENT', 'DOES_NOT_SPEAK');

-- CreateEnum
CREATE TYPE "ImitationLevel" AS ENUM ('IMITATES_GESTURES', 'IMITATES_COMPLEX_ACTIONS', 'IMITATES_SOUNDS', 'IMITATES_WORDS', 'DOES_NOT_IMITATE');

-- CreateEnum
CREATE TYPE "AlternativeCommunicationType" AS ENUM ('NONE', 'SIGN_LANGUAGE', 'PECS', 'COMMUNICATOR', 'BRAILLE', 'OTHER');

-- CreateEnum
CREATE TYPE "ComprehensionLevel" AS ENUM ('UNDERSTANDS_NO_ONLY', 'UNDERSTANDS_SIMPLE_COMMANDS', 'UNDERSTANDS_COMPLEX_COMMANDS', 'NO_COMPREHENSION', 'OTHER');

-- CreateEnum
CREATE TYPE "ReadingLevel" AS ENUM ('LETTERS', 'NUMBERS', 'WORDS', 'SENTENCES', 'TEXTS', 'DOES_NOT_READ', 'OTHER');

-- CreateEnum
CREATE TYPE "WritingLevel" AS ENUM ('LETTERS', 'NUMBERS', 'WORDS', 'SENTENCES', 'TEXTS');

-- CreateEnum
CREATE TYPE "MobilityLevel" AS ENUM ('INDEPENDENT', 'NEEDS_SUPERVISION', 'NEEDS_PHYSICAL_SUPPORT_OR_AID');

-- CreateEnum
CREATE TYPE "SocialPlayLevel" AS ENUM ('NO_INTEREST_IN_GROUP_PLAY', 'SMALL_GROUPS', 'LARGE_GROUPS');

-- CreateEnum
CREATE TYPE "PlayDurationLevel" AS ENUM ('SHORT_TIME', 'LONG_TIME');

-- CreateEnum
CREATE TYPE "FoodSensitivityType" AS ENUM ('SOLIDS', 'PUREES', 'SOUPS', 'WATER_JUICES', 'YOGURTS', 'FRUIT', 'NONE', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SummerCamp" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "place" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "inscriptionOpenDate" TIMESTAMP(3),
    "inscriptionCloseDate" TIMESTAMP(3),
    "formEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SummerCamp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportantDate" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "summerCampId" INTEGER NOT NULL,

    CONSTRAINT "ImportantDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Week" (
    "id" SERIAL NOT NULL,
    "number" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "totalPlaces" INTEGER NOT NULL,
    "availablePlaces" INTEGER NOT NULL,
    "totalDisabilityPlaces" INTEGER NOT NULL,
    "availableDisabilityPlaces" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "summerCampId" INTEGER NOT NULL,

    CONSTRAINT "Week_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Price" (
    "id" SERIAL NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "disabilityPrice" DOUBLE PRECISION NOT NULL,
    "earlyRisePrice" DOUBLE PRECISION NOT NULL,
    "breakfastPrice" DOUBLE PRECISION NOT NULL,
    "lunchPrice" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "weekId" INTEGER NOT NULL,

    CONSTRAINT "Price_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "birthdate" TIMESTAMP(3) NOT NULL,
    "gender" TEXT,
    "healthCard" TEXT,
    "repeatedBefore" BOOLEAN NOT NULL DEFAULT false,
    "siblings" BOOLEAN NOT NULL DEFAULT false,
    "schoolRelated" BOOLEAN,
    "schoolObservations" TEXT,
    "hasDisability" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guardian" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "dni" TEXT,
    "phone" TEXT NOT NULL,
    "phone2" TEXT,
    "email" TEXT NOT NULL,
    "email2" TEXT,
    "relation" TEXT,
    "signaturePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "participantId" INTEGER NOT NULL,

    CONSTRAINT "Guardian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthorizedPerson" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "dni" TEXT,
    "phone" TEXT,
    "relation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "participantId" INTEGER NOT NULL,

    CONSTRAINT "AuthorizedPerson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" SERIAL NOT NULL,
    "street" TEXT,
    "city" TEXT,
    "province" TEXT,
    "postalCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "participantId" INTEGER NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inscription" (
    "id" SERIAL NOT NULL,
    "inscriptionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMode" "PaymentMode" NOT NULL,
    "globalStatus" "InscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "totalAmountExpected" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmountPending" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "invoiceRequested" BOOLEAN NOT NULL DEFAULT false,
    "invoiceIssued" BOOLEAN NOT NULL DEFAULT false,
    "invoiceName" TEXT,
    "invoiceDni" TEXT,
    "dataTreatmentAccepted" BOOLEAN NOT NULL DEFAULT false,
    "outingsAccepted" BOOLEAN NOT NULL DEFAULT false,
    "imagesAccepted" BOOLEAN NOT NULL DEFAULT false,
    "reservationExpiresAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "participantId" INTEGER NOT NULL,

    CONSTRAINT "Inscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "paymentType" "PaymentType" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "method" "PaymentMethod",
    "amount" DOUBLE PRECISION NOT NULL,
    "concept" TEXT,
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "receiptRequested" BOOLEAN NOT NULL DEFAULT false,
    "receiptSent" BOOLEAN NOT NULL DEFAULT false,
    "receiptSentAt" TIMESTAMP(3),
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "inscriptionId" INTEGER NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Discount" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Discount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InscriptionDiscount" (
    "inscriptionId" INTEGER NOT NULL,
    "discountId" INTEGER NOT NULL,
    "amountApplied" DOUBLE PRECISION,
    "justification" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InscriptionDiscount_pkey" PRIMARY KEY ("inscriptionId","discountId")
);

-- CreateTable
CREATE TABLE "SignedUp" (
    "inscriptionId" INTEGER NOT NULL,
    "weekId" INTEGER NOT NULL,
    "state" "WeekInscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "priceApplied" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lunch" BOOLEAN NOT NULL DEFAULT false,
    "breakfast" BOOLEAN NOT NULL DEFAULT false,
    "earlyRise" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SignedUp_pkey" PRIMARY KEY ("inscriptionId","weekId")
);

-- CreateTable
CREATE TABLE "Allergy" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "participantId" INTEGER NOT NULL,

    CONSTRAINT "Allergy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medication" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "participantId" INTEGER NOT NULL,

    CONSTRAINT "Medication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExtraForm" (
    "id" SERIAL NOT NULL,
    "calledBefore" BOOLEAN,
    "routines" TEXT,
    "emotionalRegulation" TEXT,
    "schoolingType" "SchoolingType",
    "schoolingTypeOther" TEXT,
    "supportType" "SupportType",
    "hygiene" "HygieneLevel",
    "bladderControl" "SphincterControlLevel",
    "bowelControl" "SphincterControlLevel",
    "eatingSupport" "EatingSupportLevel",
    "feedingAdaptation" TEXT,
    "chokingEpisodes" BOOLEAN,
    "extraInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "participantId" INTEGER NOT NULL,

    CONSTRAINT "ExtraForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Disability" (
    "id" SERIAL NOT NULL,
    "functionalDiversity" TEXT,
    "disabilityDegree" TEXT,
    "dependencyDegree" TEXT,
    "wheelchair" BOOLEAN,
    "mobilityAid" TEXT,
    "walking" "MobilityLevel",
    "running" "MobilityLevel",
    "climbing" "MobilityLevel",
    "crawling" "MobilityLevel",
    "jumping" "MobilityLevel",
    "stairs" "MobilityLevel",
    "outdoorMobility" "MobilityLevel",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "extraFormId" INTEGER NOT NULL,

    CONSTRAINT "Disability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sport" (
    "id" SERIAL NOT NULL,
    "doesSport" BOOLEAN,
    "favoriteSports" TEXT,
    "swimmingLevel" "SwimmingLevel",
    "socialPlay" "SocialPlayLevel",
    "playFixation" "PlayDurationLevel",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "extraFormId" INTEGER NOT NULL,

    CONSTRAINT "Sport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fear" (
    "id" SERIAL NOT NULL,
    "fears" TEXT,
    "copingMechanisms" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "extraFormId" INTEGER NOT NULL,

    CONSTRAINT "Fear_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Communication" (
    "id" SERIAL NOT NULL,
    "oralLanguage" "OralLanguageLevel",
    "imitation" "ImitationLevel",
    "writing" "WritingLevel",
    "comprehension" "ComprehensionLevel",
    "reading" "ReadingLevel",
    "alternativeCommunicationOther" TEXT,
    "comprehensionOther" TEXT,
    "readingOther" TEXT,
    "alternativeCommunication" "AlternativeCommunicationType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "extraFormId" INTEGER NOT NULL,

    CONSTRAINT "Communication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FoodSensitivity" (
    "id" SERIAL NOT NULL,
    "type" "FoodSensitivityType" NOT NULL,
    "otherText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "extraFormId" INTEGER NOT NULL,

    CONSTRAINT "FoodSensitivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Week_summerCampId_number_key" ON "Week"("summerCampId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "Guardian_participantId_key" ON "Guardian"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "Address_participantId_key" ON "Address"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "Inscription_participantId_key" ON "Inscription"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "Discount_code_key" ON "Discount"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ExtraForm_participantId_key" ON "ExtraForm"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "Disability_extraFormId_key" ON "Disability"("extraFormId");

-- CreateIndex
CREATE UNIQUE INDEX "Sport_extraFormId_key" ON "Sport"("extraFormId");

-- CreateIndex
CREATE UNIQUE INDEX "Fear_extraFormId_key" ON "Fear"("extraFormId");

-- CreateIndex
CREATE UNIQUE INDEX "Communication_extraFormId_key" ON "Communication"("extraFormId");

-- CreateIndex
CREATE UNIQUE INDEX "FoodSensitivity_extraFormId_type_key" ON "FoodSensitivity"("extraFormId", "type");

-- AddForeignKey
ALTER TABLE "ImportantDate" ADD CONSTRAINT "ImportantDate_summerCampId_fkey" FOREIGN KEY ("summerCampId") REFERENCES "SummerCamp"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Week" ADD CONSTRAINT "Week_summerCampId_fkey" FOREIGN KEY ("summerCampId") REFERENCES "SummerCamp"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Price" ADD CONSTRAINT "Price_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "Week"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guardian" ADD CONSTRAINT "Guardian_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorizedPerson" ADD CONSTRAINT "AuthorizedPerson_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inscription" ADD CONSTRAINT "Inscription_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_inscriptionId_fkey" FOREIGN KEY ("inscriptionId") REFERENCES "Inscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InscriptionDiscount" ADD CONSTRAINT "InscriptionDiscount_inscriptionId_fkey" FOREIGN KEY ("inscriptionId") REFERENCES "Inscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InscriptionDiscount" ADD CONSTRAINT "InscriptionDiscount_discountId_fkey" FOREIGN KEY ("discountId") REFERENCES "Discount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignedUp" ADD CONSTRAINT "SignedUp_inscriptionId_fkey" FOREIGN KEY ("inscriptionId") REFERENCES "Inscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignedUp" ADD CONSTRAINT "SignedUp_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "Week"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allergy" ADD CONSTRAINT "Allergy_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medication" ADD CONSTRAINT "Medication_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExtraForm" ADD CONSTRAINT "ExtraForm_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Disability" ADD CONSTRAINT "Disability_extraFormId_fkey" FOREIGN KEY ("extraFormId") REFERENCES "ExtraForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sport" ADD CONSTRAINT "Sport_extraFormId_fkey" FOREIGN KEY ("extraFormId") REFERENCES "ExtraForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Fear" ADD CONSTRAINT "Fear_extraFormId_fkey" FOREIGN KEY ("extraFormId") REFERENCES "ExtraForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_extraFormId_fkey" FOREIGN KEY ("extraFormId") REFERENCES "ExtraForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FoodSensitivity" ADD CONSTRAINT "FoodSensitivity_extraFormId_fkey" FOREIGN KEY ("extraFormId") REFERENCES "ExtraForm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
