import { z } from "zod";
import {
  positiveIntSchema,
  booleanFromAnySchema,
} from "./common.schema.js";
import {
  weekInscriptionStatusSchema,
  paymentModeSchema,
} from "./enums.schema.js";

export const updateSignedUpStatusParamsSchema = z.object({
  inscriptionId: positiveIntSchema,
  weekId: positiveIntSchema,
});

export const updateSignedUpStatusBodySchema = z.object({
  newState: weekInscriptionStatusSchema,
  paymentModeForNewReservation: paymentModeSchema.optional(),
});

export const getSignedUpsByWeekParamsSchema = z.object({
  weekId: positiveIntSchema,
});

export const getSignedUpsByWeekQuerySchema = z.object({
  state: weekInscriptionStatusSchema.optional(),
  breakfast: booleanFromAnySchema.optional(),
  lunch: booleanFromAnySchema.optional(),
  earlyRise: booleanFromAnySchema.optional(),
  hasDisability: booleanFromAnySchema.optional(),
  accepted: booleanFromAnySchema.optional(),
  waitlist: booleanFromAnySchema.optional(),
});

export const getWeekWaitlistParamsSchema = z.object({
  weekId: positiveIntSchema,
});