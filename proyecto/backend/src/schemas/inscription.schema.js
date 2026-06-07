import { z } from "zod";
import {
  positiveIntSchema,
  booleanSchema,
  emailSchema,
  optionalEmailSchema,
  phoneSchema,
  optionalPhoneSchema,
  optionalDniNieSchema,
  optionalPostalCodeSchema,
  healthCardSchema,
  normalizedRequiredStringSchema,
  normalizedOptionalStringSchema,
  dateSchema,
} from "./common.schema.js";
import {
  paymentModeSchema,
  inscriptionStatusSchema,
  schoolingTypeSchema,
supportTypeSchema,
hygieneLevelSchema,
sphincterControlLevelSchema,
eatingSupportLevelSchema,
mobilityLevelSchema,
swimmingLevelSchema,
socialPlayLevelSchema,
playDurationLevelSchema,
oralLanguageLevelSchema,
imitationLevelSchema,
writingLevelSchema,
comprehensionLevelSchema,
readingLevelSchema,
alternativeCommunicationTypeSchema,
foodSensitivityTypeSchema,
} from "./enums.schema.js";
import { discountCodeSchema } from "./discount.schema.js";

const participantSchema = z.object({
  name: normalizedRequiredStringSchema,
  surname: normalizedRequiredStringSchema,
  birthdate: dateSchema,
  gender: normalizedOptionalStringSchema,
  healthCard: healthCardSchema.optional().nullable(),

  repeatedBefore: booleanSchema.optional(),
  siblings: booleanSchema.optional(),
  schoolRelated: booleanSchema.optional(),

  hasDisability: booleanSchema.optional(),
  disabilityDegree: normalizedOptionalStringSchema,
  dependencyDegree: normalizedOptionalStringSchema,
  disabilityInfo: normalizedOptionalStringSchema,

  allergyDescription: normalizedOptionalStringSchema,
  medicationDescription: normalizedOptionalStringSchema,
  symptomsInfo: normalizedOptionalStringSchema,

  // ya no se usa desde el frontend,  considerar modificar la BD para eliminarlo
  schoolObservations: normalizedOptionalStringSchema,

  // Lo dejamos por compatibilidad, pero lo construiremos en el backend.
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
    summerCampId: positiveIntSchema,
    participant: participantSchema,
    guardian: guardianSchema,
    address: addressSchema,
    authorizedPeople: z
      .array(authorizedPersonSchema)
      .min(1, "Debe indicarse al menos una persona autorizada"),
    inscription: inscriptionDataSchema,
    weeks: z.array(selectedWeekSchema).min(1, "weeks debe tener al menos una semana"),
    discounts: z
      .array(discountCodeSchema)
      .optional()
      .default([])
      .transform((codes) => [...new Set(codes)]),
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
export const updateInscriptionDetailsBodySchema = z.object({
  inscription: z
    .object({
      paymentMode: paymentModeSchema.optional(),
      invoiceRequested: z.boolean().optional(),
      invoiceIssued: z.boolean().optional(),
      invoiceName: normalizedOptionalStringSchema,
      invoiceDni: normalizedOptionalStringSchema,
      dataTreatmentAccepted: z.boolean().optional(),
      outingsAccepted: z.boolean().optional(),
      imagesAccepted: z.boolean().optional(),
      notes: normalizedOptionalStringSchema,
    })
    .optional(),

  participant: z
    .object({
      name: normalizedRequiredStringSchema.optional(),
      surname: normalizedRequiredStringSchema.optional(),
      birthdate: z.string().optional(),
      gender: normalizedOptionalStringSchema,
      healthCard: normalizedOptionalStringSchema,
      repeatedBefore: z.boolean().optional(),
      siblings: z.boolean().optional(),
      schoolRelated: z.boolean().optional(),
      schoolObservations: normalizedOptionalStringSchema,
      hasDisability: z.boolean().optional(),
      notes: normalizedOptionalStringSchema,
    })
    .optional(),

  guardian: z
    .object({
      name: normalizedRequiredStringSchema.optional(),
      surname: normalizedRequiredStringSchema.optional(),
      dni: normalizedOptionalStringSchema,
      phone: normalizedRequiredStringSchema.optional(),
      phone2: normalizedOptionalStringSchema,
      email: normalizedRequiredStringSchema.optional(),
      email2: normalizedOptionalStringSchema,
      relation: normalizedOptionalStringSchema,
    })
    .optional(),

  address: z
    .object({
      street: normalizedOptionalStringSchema,
      city: normalizedOptionalStringSchema,
      province: normalizedOptionalStringSchema,
      postalCode: normalizedOptionalStringSchema,
    })
    .optional(),

  allergies: z
    .array(
      z.object({
        description: normalizedOptionalStringSchema,
      })
    )
    .optional(),

  medications: z
    .array(
      z.object({
        description: normalizedOptionalStringSchema,
      })
    )
    .optional(),

  authorizedPeople: z
    .array(
      z.object({
        name: normalizedOptionalStringSchema,
        surname: normalizedOptionalStringSchema,
        dni: normalizedOptionalStringSchema,
        phone: normalizedOptionalStringSchema,
        relation: normalizedOptionalStringSchema,
      })
    )
    .optional(),

    extraForm: z
  .object({
    calledBefore: z.boolean().nullable().optional(),
    routines: normalizedOptionalStringSchema,
    emotionalRegulation: normalizedOptionalStringSchema,
    schoolingType: schoolingTypeSchema.nullable().optional(),
    schoolingTypeOther: normalizedOptionalStringSchema,
    supportType: supportTypeSchema.nullable().optional(),
    hygiene: hygieneLevelSchema.nullable().optional(),
    bladderControl: sphincterControlLevelSchema.nullable().optional(),
    bowelControl: sphincterControlLevelSchema.nullable().optional(),
    eatingSupport: eatingSupportLevelSchema.nullable().optional(),
    feedingAdaptation: normalizedOptionalStringSchema,
    chokingEpisodes: z.boolean().nullable().optional(),
    extraInfo: normalizedOptionalStringSchema,
  })
  .optional(),

disability: z
  .object({
    functionalDiversity: normalizedOptionalStringSchema,
    disabilityDegree: normalizedOptionalStringSchema,
    dependencyDegree: normalizedOptionalStringSchema,
    wheelchair: z.boolean().nullable().optional(),
    mobilityAid: normalizedOptionalStringSchema,
    walking: mobilityLevelSchema.nullable().optional(),
    running: mobilityLevelSchema.nullable().optional(),
    climbing: mobilityLevelSchema.nullable().optional(),
    crawling: mobilityLevelSchema.nullable().optional(),
    jumping: mobilityLevelSchema.nullable().optional(),
    stairs: mobilityLevelSchema.nullable().optional(),
    outdoorMobility: mobilityLevelSchema.nullable().optional(),
  })
  .optional(),

sports: z
  .array(
    z.object({
      doesSport: z.boolean().nullable().optional(),
      favoriteSports: normalizedOptionalStringSchema,
      swimmingLevel: swimmingLevelSchema.nullable().optional(),
      socialPlay: socialPlayLevelSchema.nullable().optional(),
      playFixation: playDurationLevelSchema.nullable().optional(),
    })
  )
  .optional(),

fears: z
  .array(
    z.object({
      fears: normalizedOptionalStringSchema,
      copingMechanisms: normalizedOptionalStringSchema,
    })
  )
  .optional(),

communication: z
  .array(
    z.object({
      oralLanguage: oralLanguageLevelSchema.nullable().optional(),
      imitation: imitationLevelSchema.nullable().optional(),
      writing: writingLevelSchema.nullable().optional(),
      comprehension: comprehensionLevelSchema.nullable().optional(),
      reading: readingLevelSchema.nullable().optional(),
      alternativeCommunication:
        alternativeCommunicationTypeSchema.nullable().optional(),
      alternativeCommunicationOther: normalizedOptionalStringSchema,
      comprehensionOther: normalizedOptionalStringSchema,
      readingOther: normalizedOptionalStringSchema,
    })
  )
  .optional(),

foodSensitivities: z
  .array(
    z.object({
      type: foodSensitivityTypeSchema,
      otherText: normalizedOptionalStringSchema,
    })
  )
  .optional(),
});