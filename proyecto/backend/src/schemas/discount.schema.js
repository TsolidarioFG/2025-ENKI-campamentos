import { z } from "zod";
import {
  positiveIntSchema,
  nonNegativeNumberSchema,
  booleanSchema,
  normalizedRequiredStringSchema,
  normalizedOptionalStringSchema,
} from "./common.schema.js";

export const discountCodeSchema = z
  .string({ required_error: "Campo obligatorio" })
  .transform((value) => value.trim().replace(/\s+/g, " ").toUpperCase())
  .refine((value) => value.length > 0, {
    message: "No puede estar vacío",
  });

export const discountIdParamsSchema = z.object({
  discountId: positiveIntSchema,
});

export const createDiscountBodySchema = z.object({
  code: discountCodeSchema,
  question: normalizedRequiredStringSchema,
  percentage: nonNegativeNumberSchema,
  isActive: booleanSchema.optional(),
  notes: normalizedOptionalStringSchema,
});

export const updateDiscountBodySchema = z
  .object({
    code: discountCodeSchema.optional(),
    question: normalizedRequiredStringSchema.optional(),
    percentage: nonNegativeNumberSchema.optional(),
    isActive: booleanSchema.optional(),
    notes: normalizedOptionalStringSchema,
  })
  .refine(
    (data) =>
      data.code !== undefined ||
      data.question !== undefined ||
      data.percentage !== undefined ||
      data.isActive !== undefined ||
      data.notes !== undefined,
    {
      message: "Debe enviarse al menos un campo para actualizar",
    }
  );