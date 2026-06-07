import { z } from "zod";
import {
  positiveIntSchema,
  booleanSchema,
  emailSchema,
  normalizedRequiredStringSchema,
  normalizedOptionalStringSchema,
} from "./common.schema.js";

const userRoleSchema = z.enum(["USER", "ADMIN", "SUPERADMIN"]);

const passwordSchema = z
  .string({ required_error: "Campo obligatorio" })
  .transform((value) => value.trim())
  .refine((value) => value.length >= 6, {
    message: "La contraseña debe tener al menos 6 caracteres",
  });

const optionalPasswordSchema = z
  .string()
  .transform((value) => value.trim())
  .refine((value) => value === "" || value.length >= 6, {
    message: "La contraseña debe tener al menos 6 caracteres",
  })
  .optional();

export const userIdParamsSchema = z.object({
  id: positiveIntSchema,
});

export const createUserBodySchema = z.object({
  username: normalizedRequiredStringSchema,
  email: emailSchema,
  password: passwordSchema,
  role: userRoleSchema,
  active: booleanSchema.optional(),
});

export const updateUserBodySchema = z
  .object({
    username: normalizedOptionalStringSchema,
    email: emailSchema.optional(),
    password: optionalPasswordSchema,
    role: userRoleSchema.optional(),
    active: booleanSchema.optional(),
  })
  .refine(
    (data) =>
      data.username !== undefined ||
      data.email !== undefined ||
      data.password !== undefined ||
      data.role !== undefined ||
      data.active !== undefined,
    {
      message: "Debe enviarse al menos un campo para actualizar",
    }
  );

export const updateUserStatusBodySchema = z.object({
  active: booleanSchema,
});

export const updateOwnProfileBodySchema = z
  .object({
    username: normalizedOptionalStringSchema,
    email: emailSchema.optional(),
    password: z
      .string()
      .transform((value) => value.trim())
      .refine((value) => value === "" || value.length >= 6, {
        message: "La contraseña debe tener al menos 6 caracteres",
      })
      .optional(),
  })
  .refine(
    (data) =>
      data.username !== undefined ||
      data.email !== undefined ||
      data.password !== undefined,
    {
      message: "Debe enviarse al menos un campo para actualizar",
    }
  );