import { z } from "zod";
import {
  positiveIntSchema,
  booleanSchema,
  emailSchema,
  normalizedRequiredStringSchema,
} from "./common.schema.js";

const creatableUserRoleSchema = z.enum(["ADMIN", "USER"]);

const passwordSchema = z
  .string({ required_error: "Campo obligatorio" })
  .transform((value) => value.trim())
  .refine((value) => value.length >= 6, {
    message: "La contraseña debe tener al menos 6 caracteres",
  });

export const createUserBodySchema = z.object({
  username: normalizedRequiredStringSchema,
  email: emailSchema,
  password: passwordSchema,
  role: creatableUserRoleSchema,
  active: booleanSchema.optional(),
});

export const userIdParamsSchema = z.object({
  id: positiveIntSchema,
});

export const updateUserStatusBodySchema = z.object({
  active: booleanSchema,
});