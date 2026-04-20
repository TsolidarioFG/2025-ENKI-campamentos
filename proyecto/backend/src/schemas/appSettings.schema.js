import { z } from "zod";
import { positiveIntSchema } from "./common.schema.js";

export const updateAppSettingsBodySchema = z.object({
  pendingReservationHours: positiveIntSchema,
});