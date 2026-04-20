import { z } from "zod";
import {
  positiveIntSchema,
  nonNegativeNumberSchema,
  normalizedOptionalStringSchema,
} from "./common.schema.js";

export const getPricesQuerySchema = z
  .object({
    summerCampId: positiveIntSchema,
    number: positiveIntSchema.optional(),
  });

export const createPriceBodySchema = z.object({
  summerCampId: positiveIntSchema,
  number: positiveIntSchema,
  basePrice: nonNegativeNumberSchema,
  disabilityPrice: nonNegativeNumberSchema,
  earlyRisePrice: nonNegativeNumberSchema,
  breakfastPrice: nonNegativeNumberSchema,
  lunchPrice: nonNegativeNumberSchema,
  notes: normalizedOptionalStringSchema,
});

export const updatePriceBodySchema = z
  .object({
    summerCampId: positiveIntSchema,
    number: positiveIntSchema,
    basePrice: nonNegativeNumberSchema.optional(),
    disabilityPrice: nonNegativeNumberSchema.optional(),
    earlyRisePrice: nonNegativeNumberSchema.optional(),
    breakfastPrice: nonNegativeNumberSchema.optional(),
    lunchPrice: nonNegativeNumberSchema.optional(),
    notes: normalizedOptionalStringSchema,
  })
  .superRefine((data, ctx) => {
    const hasAnyPriceField =
      data.basePrice !== undefined ||
      data.disabilityPrice !== undefined ||
      data.earlyRisePrice !== undefined ||
      data.breakfastPrice !== undefined ||
      data.lunchPrice !== undefined;

    const hasAllPriceFields =
      data.basePrice !== undefined &&
      data.disabilityPrice !== undefined &&
      data.earlyRisePrice !== undefined &&
      data.breakfastPrice !== undefined &&
      data.lunchPrice !== undefined;

    const onlyNotesUpdate =
      !hasAnyPriceField && data.notes !== undefined;

    if (!onlyNotesUpdate && !hasAllPriceFields) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["basePrice"],
        message:
          "Para crear un nuevo precio debes enviar basePrice, disabilityPrice, earlyRisePrice, breakfastPrice y lunchPrice. Si solo quieres cambiar notes, envía únicamente notes",
      });
    }
  });