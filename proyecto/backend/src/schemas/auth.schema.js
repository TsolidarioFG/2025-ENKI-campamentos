import { z } from "zod";
import { emailSchema, normalizedRequiredStringSchema } from "./common.schema.js";

export const loginBodySchema = z.object({
  email: emailSchema,
  password: normalizedRequiredStringSchema,
});