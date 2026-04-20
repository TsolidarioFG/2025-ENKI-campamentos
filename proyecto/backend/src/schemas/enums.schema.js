import { z } from "zod";

export const userRoleSchema = z.enum([
  "USER",
  "ADMIN",
  "SUPERADMIN",
]);

export const paymentModeSchema = z.enum([
  "ONE_PAYMENT",
  "TWO_PAYMENTS",
]);

export const paymentTypeSchema = z.enum([
  "FULL",
  "FIRST_INSTALLMENT",
  "SECOND_INSTALLMENT",
  "EXTRA",
]);

export const paymentStatusSchema = z.enum([
  "PENDING",
  "PAID",
  "OVERDUE",
  "CANCELLED",
]);

export const paymentMethodSchema = z.enum([
  "BANK_TRANSFER",
  "CASH",
  "CARD",
  "BIZUM",
  "OTHER",
]);

export const paymentPurposeSchema = z.enum([
  "RESERVATION",
  "BREAKFAST",
  "LUNCH",
  "EARLY_RISE",
  "OTHER",
]);

export const inscriptionStatusSchema = z.enum([
  "PENDING",
  "PARTIALLY_ACCEPTED",
  "ACCEPTED",
  "WAITLIST",
  "REJECTED",
  "CANCELLED",
  "COMPLETED",
]);

export const weekInscriptionStatusSchema = z.enum([
  "PENDING",
  "ACCEPTED",
  "WAITLIST",
  "CANCELLED",
]);

export const schoolingTypeSchema = z.enum([
  "ORDINARY",
  "SPECIAL",
  "OTHER",
]);

export const swimmingLevelSchema = z.enum([
  "YES",
  "NO",
  "WITH_TECHNICAL_AIDS",
  "WITH_SUPPORT",
]);

export const supportTypeSchema = z.enum([
  "NONE",
  "INTERMITTENT",
  "LIMITED_EXTENSIVE",
  "GENERALIZED_CONSTANT",
]);

export const hygieneLevelSchema = z.enum([
  "INDEPENDENT",
  "NEEDS_SUPERVISION",
  "NEEDS_PHYSICAL_SUPPORT",
]);

export const sphincterControlLevelSchema = z.enum([
  "GOES_ALONE",
  "ASKS_OR_WARNS",
  "MUST_BE_ASKED",
  "USES_DIAPER",
]);

export const eatingSupportLevelSchema = z.enum([
  "INDEPENDENT",
  "NEEDS_SUPERVISION",
  "NEEDS_INTERMITTENT_SUPPORT",
  "NEEDS_CONTINUOUS_SUPPORT",
]);

export const oralLanguageLevelSchema = z.enum([
  "SOUNDS",
  "SOME_WORDS",
  "PHRASES",
  "FLUENT",
  "DOES_NOT_SPEAK",
]);

export const imitationLevelSchema = z.enum([
  "IMITATES_GESTURES",
  "IMITATES_COMPLEX_ACTIONS",
  "IMITATES_SOUNDS",
  "IMITATES_WORDS",
  "DOES_NOT_IMITATE",
]);

export const alternativeCommunicationTypeSchema = z.enum([
  "NONE",
  "SIGN_LANGUAGE",
  "PECS",
  "COMMUNICATOR",
  "BRAILLE",
  "OTHER",
]);

export const comprehensionLevelSchema = z.enum([
  "UNDERSTANDS_NO_ONLY",
  "UNDERSTANDS_SIMPLE_COMMANDS",
  "UNDERSTANDS_COMPLEX_COMMANDS",
  "NO_COMPREHENSION",
  "OTHER",
]);

export const readingLevelSchema = z.enum([
  "LETTERS",
  "NUMBERS",
  "WORDS",
  "SENTENCES",
  "TEXTS",
  "DOES_NOT_READ",
  "OTHER",
]);

export const writingLevelSchema = z.enum([
  "LETTERS",
  "NUMBERS",
  "WORDS",
  "SENTENCES",
  "TEXTS",
]);

export const mobilityLevelSchema = z.enum([
  "INDEPENDENT",
  "NEEDS_SUPERVISION",
  "NEEDS_PHYSICAL_SUPPORT_OR_AID",
]);

export const socialPlayLevelSchema = z.enum([
  "NO_INTEREST_IN_GROUP_PLAY",
  "SMALL_GROUPS",
  "LARGE_GROUPS",
]);

export const playDurationLevelSchema = z.enum([
  "SHORT_TIME",
  "LONG_TIME",
]);

export const foodSensitivityTypeSchema = z.enum([
  "SOLIDS",
  "PUREES",
  "SOUPS",
  "WATER_JUICES",
  "YOGURTS",
  "FRUIT",
  "NONE",
  "OTHER",
]);