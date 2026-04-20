import { z } from "zod";
import {
  positiveIntSchema,
  nonNegativeNumberSchema,
  normalizedOptionalStringSchema,
  optionalNullableDateSchema,
} from "./common.schema.js";
import {
  paymentMethodSchema,
  paymentModeSchema,
  paymentStatusSchema,
  paymentTypeSchema,
  paymentPurposeSchema,
} from "./enums.schema.js";

export const getPaymentsQuerySchema = z.object({
  inscriptionId: positiveIntSchema.optional(),
  status: paymentStatusSchema.optional(),
  paymentType: paymentTypeSchema.optional(),
});

export const getPaymentByIdParamsSchema = z.object({
  id: positiveIntSchema,
});

export const createExtraPaymentBodySchema = z.object({
  inscriptionId: positiveIntSchema,
  weekId: positiveIntSchema,
  purpose: paymentPurposeSchema,
  amount: z.coerce.number().positive("amount debe ser un número mayor que 0"),
  paymentMode: paymentModeSchema,
  concept: normalizedOptionalStringSchema,
  dueDate: optionalNullableDateSchema,
  notes: normalizedOptionalStringSchema,
  receiptRequested: z.boolean().optional(),
  isMandatory: z.boolean().optional(),
});

export const registerPaymentParamsSchema = z.object({
  id: positiveIntSchema,
});

export const registerPaymentBodySchema = z.object({
  method: paymentMethodSchema,
  paidAt: optionalNullableDateSchema,
  notes: normalizedOptionalStringSchema,
});