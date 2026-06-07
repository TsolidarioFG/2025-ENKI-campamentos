import { z } from "zod";
import { normalizedRequiredStringSchema } from "./common.schema.js";

export const loginBodySchema = z.object({
  identifier: normalizedRequiredStringSchema,
  password: normalizedRequiredStringSchema,
});