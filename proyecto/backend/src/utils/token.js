import crypto from "crypto";

export const generateSecureToken = () => {
  return crypto.randomBytes(32).toString("hex");
};