import { z } from "zod";
import {
  positiveIntSchema,
  nonNegativeIntSchema,
  nonNegativeNumberSchema,
  booleanSchema,
  normalizedRequiredStringSchema,
  normalizedOptionalStringSchema,
  optionalDateSchema,
  dateSchema,
} from "./common.schema.js";

const weekDefaultsSchema = z.object({
  totalPlaces: nonNegativeIntSchema,
  totalDisabilityPlaces: nonNegativeIntSchema,
});

const priceDefaultsSchema = z.object({
  basePrice: nonNegativeNumberSchema,
  disabilityPrice: nonNegativeNumberSchema,
  earlyRisePrice: nonNegativeNumberSchema,
  breakfastPrice: nonNegativeNumberSchema,
  lunchPrice: nonNegativeNumberSchema,
});

export const summerCampIdParamsSchema = z.object({
  id: positiveIntSchema,
});

export const getSummerCampQuerySchema = z.object({
  name: normalizedOptionalStringSchema,
  year: positiveIntSchema.optional(),
});

export const createSummerCampBodySchema = z
  .object({
    name: normalizedRequiredStringSchema,
    place: normalizedRequiredStringSchema,
    year: positiveIntSchema,
    description: normalizedOptionalStringSchema,
    startDate: dateSchema,
    endDate: dateSchema,
    inscriptionOpenDate: optionalDateSchema.nullable(),
    inscriptionCloseDate: optionalDateSchema.nullable(),
    formEnabled: booleanSchema.optional(),
    isActive: booleanSchema.optional(),
    weekDefaults: weekDefaultsSchema,
    priceDefaults: priceDefaultsSchema,
  })
  .superRefine((data, ctx) => {
    if (data.endDate <= data.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "endDate debe ser posterior a startDate",
      });
    }

    if (
      data.inscriptionOpenDate &&
      data.inscriptionCloseDate &&
      data.inscriptionCloseDate <= data.inscriptionOpenDate
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["inscriptionCloseDate"],
        message: "inscriptionCloseDate debe ser posterior a inscriptionOpenDate",
      });
    }

    if (
      data.inscriptionCloseDate &&
      data.inscriptionCloseDate > data.startDate
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["inscriptionCloseDate"],
        message: "inscriptionCloseDate no puede ser posterior al inicio del campamento",
      });
    }
  });

export const updateSummerCampBodySchema = z
  .object({
    name: normalizedRequiredStringSchema.optional(),
    place: normalizedRequiredStringSchema.optional(),
    year: positiveIntSchema.optional(),
    description: normalizedOptionalStringSchema,
    startDate: optionalDateSchema,
    endDate: optionalDateSchema,
    inscriptionOpenDate: optionalDateSchema.nullable(),
    inscriptionCloseDate: optionalDateSchema.nullable(),
    formEnabled: booleanSchema.optional(),
    isActive: booleanSchema.optional(),
    weekDefaults: weekDefaultsSchema.optional(),
    priceDefaults: priceDefaultsSchema.optional(),
  })
  .superRefine((data, ctx) => {
    const hasAnyField =
      data.name !== undefined ||
      data.place !== undefined ||
      data.year !== undefined ||
      data.description !== undefined ||
      data.startDate !== undefined ||
      data.endDate !== undefined ||
      data.inscriptionOpenDate !== undefined ||
      data.inscriptionCloseDate !== undefined ||
      data.formEnabled !== undefined ||
      data.isActive !== undefined ||
      data.weekDefaults !== undefined ||
      data.priceDefaults !== undefined;

    if (!hasAnyField) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [],
        message: "Debe enviarse al menos un campo para actualizar",
      });
    }

    const finalStartDate = data.startDate;
    const finalEndDate = data.endDate;

    if (finalStartDate && finalEndDate && finalEndDate <= finalStartDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "endDate debe ser posterior a startDate",
      });
    }

    if (
      data.inscriptionOpenDate &&
      data.inscriptionCloseDate &&
      data.inscriptionCloseDate <= data.inscriptionOpenDate
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["inscriptionCloseDate"],
        message: "inscriptionCloseDate debe ser posterior a inscriptionOpenDate",
      });
    }

    if (
      data.startDate &&
      data.inscriptionCloseDate &&
      data.inscriptionCloseDate > data.startDate
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["inscriptionCloseDate"],
        message: "inscriptionCloseDate no puede ser posterior al inicio del campamento",
      });
    }
    });