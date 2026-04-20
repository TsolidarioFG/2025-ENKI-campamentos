import { z } from "zod";
import {
  positiveIntSchema,
  optionalIdSchema,
  booleanSchema,
  normalizedOptionalStringSchema,
} from "./common.schema.js";
import {
  schoolingTypeSchema,
  supportTypeSchema,
  hygieneLevelSchema,
  sphincterControlLevelSchema,
  eatingSupportLevelSchema,
  swimmingLevelSchema,
  oralLanguageLevelSchema,
  imitationLevelSchema,
  writingLevelSchema,
  comprehensionLevelSchema,
  readingLevelSchema,
  alternativeCommunicationTypeSchema,
  mobilityLevelSchema,
  socialPlayLevelSchema,
  playDurationLevelSchema,
  foodSensitivityTypeSchema,
} from "./enums.schema.js";

const disabilitySchema = z.object({
  functionalDiversity: normalizedOptionalStringSchema,
  disabilityDegree: normalizedOptionalStringSchema,
  dependencyDegree: normalizedOptionalStringSchema,
  wheelchair: booleanSchema.optional(),
  mobilityAid: normalizedOptionalStringSchema,
  walking: mobilityLevelSchema.optional().nullable(),
  running: mobilityLevelSchema.optional().nullable(),
  climbing: mobilityLevelSchema.optional().nullable(),
  crawling: mobilityLevelSchema.optional().nullable(),
  jumping: mobilityLevelSchema.optional().nullable(),
  stairs: mobilityLevelSchema.optional().nullable(),
  outdoorMobility: mobilityLevelSchema.optional().nullable(),
});

const sportCreateOrUpdateSchema = z.object({
  id: optionalIdSchema,
  doesSport: booleanSchema.optional(),
  favoriteSports: normalizedOptionalStringSchema,
  swimmingLevel: swimmingLevelSchema.optional().nullable(),
  socialPlay: socialPlayLevelSchema.optional().nullable(),
  playFixation: playDurationLevelSchema.optional().nullable(),
});

const fearCreateOrUpdateSchema = z.object({
  id: optionalIdSchema,
  fears: normalizedOptionalStringSchema,
  copingMechanisms: normalizedOptionalStringSchema,
});

const communicationCreateOrUpdateSchema = z.object({
  id: optionalIdSchema,
  oralLanguage: oralLanguageLevelSchema.optional().nullable(),
  imitation: imitationLevelSchema.optional().nullable(),
  writing: writingLevelSchema.optional().nullable(),
  comprehension: comprehensionLevelSchema.optional().nullable(),
  reading: readingLevelSchema.optional().nullable(),
  alternativeCommunicationOther: normalizedOptionalStringSchema,
  comprehensionOther: normalizedOptionalStringSchema,
  readingOther: normalizedOptionalStringSchema,
  alternativeCommunication: alternativeCommunicationTypeSchema.optional().nullable(),
});

const foodSensitivityCreateOrUpdateSchema = z.object({
  id: optionalIdSchema,
  type: foodSensitivityTypeSchema,
  otherText: normalizedOptionalStringSchema,
});

export const participantIdParamsSchema = z.object({
  participantId: positiveIntSchema,
});

export const sportIdParamsSchema = z.object({
  sportId: positiveIntSchema,
});

export const fearIdParamsSchema = z.object({
  fearId: positiveIntSchema,
});

export const communicationIdParamsSchema = z.object({
  communicationId: positiveIntSchema,
});

export const foodSensitivityIdParamsSchema = z.object({
  foodSensitivityId: positiveIntSchema,
});

export const createExtraFormBodySchema = z.object({
  participantId: positiveIntSchema,

  calledBefore: booleanSchema.optional(),
  routines: normalizedOptionalStringSchema,
  emotionalRegulation: normalizedOptionalStringSchema,
  schoolingType: schoolingTypeSchema.optional().nullable(),
  schoolingTypeOther: normalizedOptionalStringSchema,
  supportType: supportTypeSchema.optional().nullable(),
  hygiene: hygieneLevelSchema.optional().nullable(),
  bladderControl: sphincterControlLevelSchema.optional().nullable(),
  bowelControl: sphincterControlLevelSchema.optional().nullable(),
  eatingSupport: eatingSupportLevelSchema.optional().nullable(),
  feedingAdaptation: normalizedOptionalStringSchema,
  chokingEpisodes: booleanSchema.optional(),
  extraInfo: normalizedOptionalStringSchema,

  disability: disabilitySchema.optional(),
  sports: z.array(sportCreateOrUpdateSchema).optional(),
  fears: z.array(fearCreateOrUpdateSchema).optional(),
  communication: z.array(communicationCreateOrUpdateSchema).optional(),
  foodSensitivities: z.array(foodSensitivityCreateOrUpdateSchema).optional(),
});

export const updateExtraFormBodySchema = z
  .object({
    participantId: positiveIntSchema,

    calledBefore: booleanSchema.optional(),
    routines: normalizedOptionalStringSchema,
    emotionalRegulation: normalizedOptionalStringSchema,
    schoolingType: schoolingTypeSchema.optional().nullable(),
    schoolingTypeOther: normalizedOptionalStringSchema,
    supportType: supportTypeSchema.optional().nullable(),
    hygiene: hygieneLevelSchema.optional().nullable(),
    bladderControl: sphincterControlLevelSchema.optional().nullable(),
    bowelControl: sphincterControlLevelSchema.optional().nullable(),
    eatingSupport: eatingSupportLevelSchema.optional().nullable(),
    feedingAdaptation: normalizedOptionalStringSchema,
    chokingEpisodes: booleanSchema.optional(),
    extraInfo: normalizedOptionalStringSchema,

    disability: disabilitySchema.optional(),
    sports: z.array(sportCreateOrUpdateSchema).optional(),
    fears: z.array(fearCreateOrUpdateSchema).optional(),
    communication: z.array(communicationCreateOrUpdateSchema).optional(),
    foodSensitivities: z.array(foodSensitivityCreateOrUpdateSchema).optional(),
  })
  .superRefine((data, ctx) => {
    const hasAnyField =
      data.calledBefore !== undefined ||
      data.routines !== undefined ||
      data.emotionalRegulation !== undefined ||
      data.schoolingType !== undefined ||
      data.schoolingTypeOther !== undefined ||
      data.supportType !== undefined ||
      data.hygiene !== undefined ||
      data.bladderControl !== undefined ||
      data.bowelControl !== undefined ||
      data.eatingSupport !== undefined ||
      data.feedingAdaptation !== undefined ||
      data.chokingEpisodes !== undefined ||
      data.extraInfo !== undefined ||
      data.disability !== undefined ||
      data.sports !== undefined ||
      data.fears !== undefined ||
      data.communication !== undefined ||
      data.foodSensitivities !== undefined;

    if (!hasAnyField) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [],
        message: "Debe enviarse al menos un campo para actualizar",
      });
    }
  });