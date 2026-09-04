import { z } from "zod";
import { alertTranslations } from "@/src/translations/pl/alerts";
import { todayInWarsaw } from "@/src/modules/alerts/dates";

const AlertFieldsSchema = z.object({
  origin: z.string().trim().min(3, alertTranslations.validation.origin).max(3).transform((value) => value.toUpperCase()),
  destination: z.string().trim().min(3, alertTranslations.validation.destination).max(3).transform((value) => value.toUpperCase()),
  isRoundTrip: z.boolean().default(true),
  departureDate: z.iso.date(alertTranslations.validation.departureDate),
  returnDate: z.iso.date(alertTranslations.validation.returnDate).optional().or(z.literal("")),
  flexDays: z.number().int().min(0).max(3).default(0),
  maxPrice: z.number().positive(alertTranslations.validation.positivePrice),
  active: z.boolean().default(true),
});

export const StoredAlertSchema = AlertFieldsSchema
  .refine((data) => !data.isRoundTrip || Boolean(data.returnDate), {
    message: alertTranslations.validation.roundTripReturnRequired,
    path: ["returnDate"],
  })
  .refine((data) => !data.isRoundTrip || !data.returnDate || data.returnDate >= data.departureDate, {
    message: alertTranslations.validation.returnBeforeDeparture,
    path: ["returnDate"],
  });

export const CreateAlertSchema = StoredAlertSchema.superRefine((data, context) => {
  const today = todayInWarsaw();
  if (data.departureDate < today) {
    context.addIssue({ code: 'custom', path: ['departureDate'], message: alertTranslations.validation.pastDate });
  }
  if (data.isRoundTrip && data.returnDate && data.returnDate < today) {
    context.addIssue({ code: 'custom', path: ['returnDate'], message: alertTranslations.validation.pastDate });
  }
});

export type CreateAlertFormInput = z.input<typeof CreateAlertSchema>;
export type CreateAlertInput = z.output<typeof CreateAlertSchema>;
export const SearchInputSchema = AlertFieldsSchema.pick({ origin: true, destination: true, isRoundTrip: true, departureDate: true, returnDate: true, flexDays: true });
export type SearchInput = z.infer<typeof SearchInputSchema>;
