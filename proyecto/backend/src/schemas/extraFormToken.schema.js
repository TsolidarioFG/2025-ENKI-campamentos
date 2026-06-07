import { z } from "zod";
import { positiveIntSchema } from "./common.schema.js";

export const participantIdParamsSchema = z.object({
  participantId: positiveIntSchema,
});

export const extraFormTokenParamsSchema = z.object({
  token: z
    .string()
    .min(32, "Token inválido")
    .max(200, "Token inválido"),
});