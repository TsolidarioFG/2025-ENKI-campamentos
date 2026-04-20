import { z } from "zod";
import {
  positiveIntSchema,
  nonNegativeIntSchema,
  nonNegativeNumberSchema,
  booleanSchema,
} from "./common.schema.js";

const priceDefaultsSchema = z.object({
  basePrice: nonNegativeNumberSchema,
  disabilityPrice: nonNegativeNumberSchema,
  earlyRisePrice: nonNegativeNumberSchema,
  breakfastPrice: nonNegativeNumberSchema,
  lunchPrice: nonNegativeNumberSchema,
});

export const getWeeksQuerySchema = z
  .object({
    summerCampId: positiveIntSchema.optional(),
    number: positiveIntSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.number !== undefined && data.summerCampId === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["summerCampId"],
        message:
          "Para filtrar por semana es necesario incluir el id del campamento asociado",
      });
    }
  });

export const createWeekBodySchema = z.object({
  summerCampId: positiveIntSchema,
  totalPlaces: nonNegativeIntSchema.optional(),
  totalDisabilityPlaces: nonNegativeIntSchema.optional(),
  priceDefaults: priceDefaultsSchema.optional(),
});

export const updateWeekParamsSchema = z.object({
  summerCampId: positiveIntSchema,
  number: positiveIntSchema,
});

export const updateWeekBodySchema = z
  .object({
    totalPlaces: nonNegativeIntSchema.optional(),
    availablePlaces: nonNegativeIntSchema.optional(),
    totalDisabilityPlaces: nonNegativeIntSchema.optional(),
    availableDisabilityPlaces: nonNegativeIntSchema.optional(),
    active: booleanSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.totalPlaces !== undefined &&
      data.availablePlaces !== undefined &&
      data.availablePlaces > data.totalPlaces
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["availablePlaces"],
        message: "availablePlaces no puede ser mayor que totalPlaces",
      });
    }

    if (
      data.totalDisabilityPlaces !== undefined &&
      data.availableDisabilityPlaces !== undefined &&
      data.availableDisabilityPlaces > data.totalDisabilityPlaces
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["availableDisabilityPlaces"],
        message:
          "availableDisabilityPlaces no puede ser mayor que totalDisabilityPlaces",
      });
    }

    const hasAnyField =
      data.totalPlaces !== undefined ||
      data.availablePlaces !== undefined ||
      data.totalDisabilityPlaces !== undefined ||
      data.availableDisabilityPlaces !== undefined ||
      data.active !== undefined;

    if (!hasAnyField) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [],
        message: "Debe enviarse al menos un campo para actualizar",
      });
    }
  });

export const deleteWeekParamsSchema = z.object({
  summerCampId: positiveIntSchema,
  number: positiveIntSchema,
});