import { z } from "zod";
import { positiveIntSchema, booleanFromAnySchema } from "./common.schema.js";

export const getDashboardParamsSchema = z.object({
  summerCampId: positiveIntSchema,
});

export const getInscriptionsTableQuerySchema = z.object({
  summerCampId: positiveIntSchema.optional(),
  accepted: booleanFromAnySchema.optional(),
  waitlist: booleanFromAnySchema.optional(),
});