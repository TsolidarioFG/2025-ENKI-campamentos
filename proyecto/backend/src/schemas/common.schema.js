import { z } from "zod";

const normalizeText = (value) => {
  if (typeof value !== "string") return value;
  return value.trim().replace(/\s+/g, " ");
};

const normalizeEmail = (value) => {
  if (typeof value !== "string") return value;
  return value.trim().toLowerCase();
};

const isValidEmail = (email) => {
  if (typeof email !== "string") return false;
  const normalized = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
};

const isValidPhone = (phone) => {
  if (typeof phone !== "string" && typeof phone !== "number") return false;
  const cleaned = String(phone).replace(/\s+/g, "").replace(/[-().]/g, "");
  return /^(\+?\d{9,15})$/.test(cleaned);
};

const isValidPostalCode = (postalCode) => {
  if (typeof postalCode !== "string" && typeof postalCode !== "number") return false;
  return /^\d{5}$/.test(String(postalCode).trim());
};

const isValidHealthCard = (healthCard) => {
  if (typeof healthCard !== "string" && typeof healthCard !== "number") return false;
  const cleaned = String(healthCard).trim();
  return /^[A-Za-z0-9\-]{5,30}$/.test(cleaned);
};

const isValidDniNie = (value) => {
  if (typeof value !== "string") return false;

  const cleaned = value.trim().toUpperCase();
  const letters = "TRWAGMYFPDXBNJZSQVHLCKE";

  if (/^\d{8}[A-Z]$/.test(cleaned)) {
    const number = parseInt(cleaned.slice(0, 8), 10);
    const letter = cleaned.slice(8);
    return letters[number % 23] === letter;
  }

  if (/^[XYZ]\d{7}[A-Z]$/.test(cleaned)) {
    const prefixMap = { X: "0", Y: "1", Z: "2" };
    const number = parseInt(prefixMap[cleaned[0]] + cleaned.slice(1, 8), 10);
    const letter = cleaned.slice(8);
    return letters[number % 23] === letter;
  }

  return false;
};

export const positiveIntSchema = z.coerce
  .number()
  .int("Debe ser un entero")
  .positive("Debe ser mayor que 0");

export const nonNegativeIntSchema = z.coerce
  .number()
  .int("Debe ser un entero")
  .min(0, "Debe ser mayor o igual que 0");

export const nonNegativeNumberSchema = z.coerce
  .number()
  .min(0, "Debe ser mayor o igual que 0");

export const optionalIdSchema = positiveIntSchema.optional();

export const booleanSchema = z.boolean();

export const booleanFromAnySchema = z.preprocess((value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean());

export const normalizedRequiredStringSchema = z
  .string({ required_error: "Campo obligatorio" })
  .transform((value) => normalizeText(value))
  .refine((value) => value.length > 0, {
    message: "No puede estar vacío",
  });

export const normalizedOptionalStringSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === undefined || value === null) return value;
    const normalized = normalizeText(value);
    return normalized === "" ? null : normalized;
  });

export const emailSchema = z
  .string()
  .transform((value) => normalizeEmail(value))
  .refine((value) => isValidEmail(value), {
    message: "Email con formato inválido",
  });

export const optionalEmailSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === undefined || value === null) return value;
    const normalized = normalizeEmail(value);
    return normalized === "" ? null : normalized;
  })
  .refine((value) => value === undefined || value === null || isValidEmail(value), {
    message: "Email con formato inválido",
  });

export const phoneSchema = z
  .union([z.string(), z.number()])
  .transform((value) =>
    String(value).replace(/\s+/g, "").replace(/[-().]/g, "")
  )
  .refine((value) => isValidPhone(value), {
    message: "Teléfono con formato inválido",
  });

export const optionalPhoneSchema = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === undefined || value === null) return value;
    const normalized = String(value).replace(/\s+/g, "").replace(/[-().]/g, "");
    return normalized === "" ? null : normalized;
  })
  .refine((value) => value === undefined || value === null || isValidPhone(value), {
    message: "Teléfono con formato inválido",
  });

export const dniNieSchema = z
  .string()
  .transform((value) => normalizeText(value).toUpperCase())
  .refine((value) => isValidDniNie(value), {
    message: "DNI/NIE con formato inválido o letra incorrecta",
  });

export const optionalDniNieSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === undefined || value === null) return value;
    const normalized = normalizeText(value).toUpperCase();
    return normalized === "" ? null : normalized;
  })
  .refine((value) => value === undefined || value === null || isValidDniNie(value), {
    message: "DNI/NIE con formato inválido o letra incorrecta",
  });

export const postalCodeSchema = z
  .union([z.string(), z.number()])
  .transform((value) => String(value).trim())
  .refine((value) => isValidPostalCode(value), {
    message: "Código postal inválido",
  });

export const optionalPostalCodeSchema = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === undefined || value === null) return value;
    const normalized = String(value).trim();
    return normalized === "" ? null : normalized;
  })
  .refine((value) => value === undefined || value === null || isValidPostalCode(value), {
    message: "Código postal inválido",
  });

export const healthCardSchema = z
  .union([z.string(), z.number()])
  .transform((value) => normalizeText(String(value)).toUpperCase())
  .refine((value) => isValidHealthCard(value), {
    message: "Tarjeta sanitaria inválida",
  });

export const optionalHealthCardSchema = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === undefined || value === null) return value;
    const normalized = normalizeText(String(value)).toUpperCase();
    return normalized === "" ? null : normalized;
  })
  .refine((value) => value === undefined || value === null || isValidHealthCard(value), {
    message: "Tarjeta sanitaria inválida",
  });

export const dateSchema = z.coerce.date({
  errorMap: () => ({ message: "Fecha inválida" }),
});

export const optionalDateSchema = dateSchema.optional();
export const nullableDateSchema = dateSchema.nullable();
export const optionalNullableDateSchema = dateSchema.optional().nullable();

export const nonEmptyArray = (schema, message = "Debe contener al menos un elemento") =>
  z.array(schema).min(1, message);