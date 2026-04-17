export const normalizeText = (value) => {
  if (typeof value !== "string") return value;
  return value.trim().replace(/\s+/g, " ");
};

export const normalizeEmail = (value) => {
  if (typeof value !== "string") return value;
  return value.trim().toLowerCase();
};

export const isNonEmptyString = (value) => {
  return typeof value === "string" && value.trim() !== "";
};

export const isValidEmail = (email) => {
  if (typeof email !== "string") return false;
  const normalized = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
};

export const isValidPhone = (phone) => {
  if (typeof phone !== "string" && typeof phone !== "number") return false;
  const cleaned = String(phone).replace(/\s+/g, "").replace(/[-().]/g, "");
  return /^(\+?\d{9,15})$/.test(cleaned);
};

export const isValidPostalCode = (postalCode) => {
  if (typeof postalCode !== "string" && typeof postalCode !== "number") return false;
  return /^\d{5}$/.test(String(postalCode).trim());
};

export const isValidHealthCard = (healthCard) => {
  if (typeof healthCard !== "string" && typeof healthCard !== "number") return false;
  const cleaned = String(healthCard).trim();
  return /^[A-Za-z0-9\-]{5,30}$/.test(cleaned);
};

export const isValidDniNie = (value) => {
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
    const number = parseInt(
      prefixMap[cleaned[0]] + cleaned.slice(1, 8),
      10
    );
    const letter = cleaned.slice(8);
    return letters[number % 23] === letter;
  }

  return false;
};