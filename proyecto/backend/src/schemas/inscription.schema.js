import { z } from "zod";
import {
  positiveIntSchema,
  booleanSchema,
  emailSchema,
  optionalEmailSchema,
  phoneSchema,
  optionalPhoneSchema,
  dniNieSchema,
  optionalDniNieSchema,
  postalCodeSchema,
  optionalPostalCodeSchema,
  healthCardSchema,
  normalizedRequiredStringSchema,
  normalizedOptionalStringSchema,
  dateSchema,
} from "./common.schema.js";
import {
  paymentModeSchema,
  inscriptionStatusSchema,
} from "./enums.schema.js";

const participantSchema = z.object({
  name: normalizedRequiredStringSchema,
  surname: normalizedRequiredStringSchema,
  birthdate: dateSchema,
  gender: normalizedOptionalStringSchema,
  healthCard: healthCardSchema.optional().nullable(),
  repeatedBefore: booleanSchema.optional(),
  siblings: booleanSchema.optional(),
  schoolRelated: booleanSchema.optional(),
  schoolObservations: normalizedOptionalStringSchema,
  hasDisability: booleanSchema.optional(),
  notes: normalizedOptionalStringSchema,
});

const guardianSchema = z.object({
  name: normalizedRequiredStringSchema,
  surname: normalizedRequiredStringSchema,
  dni: optionalDniNieSchema,
  phone: phoneSchema,
  phone2: optionalPhoneSchema,
  email: emailSchema,
  email2: optionalEmailSchema,
  relation: normalizedOptionalStringSchema,
});

const addressSchema = z.object({
  street: normalizedOptionalStringSchema,
  city: normalizedRequiredStringSchema,
  province: normalizedRequiredStringSchema,
  postalCode: optionalPostalCodeSchema,
});

const authorizedPersonSchema = z.object({
  name: normalizedRequiredStringSchema,
  surname: normalizedRequiredStringSchema,
  dni: optionalDniNieSchema,
  phone: optionalPhoneSchema,
  relation: normalizedOptionalStringSchema,
});

const inscriptionDataSchema = z
  .object({
    paymentMode: paymentModeSchema,
    invoiceRequested: booleanSchema.optional(),
    invoiceName: normalizedOptionalStringSchema,
    invoiceDni: optionalDniNieSchema,
    dataTreatmentAccepted: z.literal(true, {
      errorMap: () => ({
        message: "Debe aceptarse el tratamiento de datos",
      }),
    }),
    outingsAccepted: booleanSchema,
    imagesAccepted: booleanSchema,
    notes: normalizedOptionalStringSchema,
  })
  .superRefine((data, ctx) => {
    if (data.invoiceRequested === true) {
      if (!data.invoiceName || data.invoiceName.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["invoiceName"],
          message: "inscription.invoiceName es obligatorio si se solicita factura",
        });
      }
    }
  });

const selectedWeekSchema = z.object({
  summerCampId: positiveIntSchema,
  number: positiveIntSchema,
  breakfast: booleanSchema.optional(),
  lunch: booleanSchema.optional(),
  earlyRise: booleanSchema.optional(),
});

const discountCodeSchema = z
  .string()
  .transform((value) => value.trim().toUpperCase())
  .refine((value) => value.length > 0, {
    message: "Código de descuento inválido",
  });

export const getInscriptionsQuerySchema = z.object({
  summerCampId: positiveIntSchema.optional(),
  number: positiveIntSchema.optional(),
  globalStatus: inscriptionStatusSchema.optional(),
  paymentMode: paymentModeSchema.optional(),
});

export const inscriptionIdParamsSchema = z.object({
  id: positiveIntSchema,
});

export const createInscriptionBodySchema = z
  .object({
    participant: participantSchema,
    guardian: guardianSchema,
    address: addressSchema,
    authorizedPeople: z.array(authorizedPersonSchema),
    inscription: inscriptionDataSchema,
    weeks: z.array(selectedWeekSchema).min(1, "weeks debe tener al menos una semana"),
    discounts: z.array(discountCodeSchema).optional().default([]),
  })
  .superRefine((data, ctx) => {
    const seen = new Set();

    data.weeks.forEach((week, index) => {
      const key = `${week.summerCampId}-${week.number}`;
      if (seen.has(key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["weeks", index],
          message: "No se puede repetir la misma semana en una inscripción",
        });
      }
      seen.add(key);
    });
  });