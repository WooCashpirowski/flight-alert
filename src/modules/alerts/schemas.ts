import { z } from "zod";

const AlertFieldsSchema = z.object({
  origin: z.string().trim().min(3, "Podaj 3-literowy kod lotniska").max(3).transform((value) => value.toUpperCase()),
  destination: z.string().trim().min(3, "Podaj 3-literowy kod lub ANY").max(3).transform((value) => value.toUpperCase()),
  isRoundTrip: z.boolean().default(true),
  departureDate: z.iso.date("Wybierz datę wylotu"),
  returnDate: z.iso.date("Wybierz poprawną datę").optional().or(z.literal("")),
  flexDays: z.number().int().min(0).max(3).default(0),
  maxPrice: z.number().positive("Cena musi być większa od 0"),
  active: z.boolean().default(true),
});

export const CreateAlertSchema = AlertFieldsSchema
  .refine((data) => !data.isRoundTrip || Boolean(data.returnDate), {
    message: "Data powrotu jest wymagana dla lotu w dwie strony",
    path: ["returnDate"],
  })
  .refine((data) => !data.returnDate || data.returnDate >= data.departureDate, {
    message: "Powrót nie może być przed wylotem",
    path: ["returnDate"],
  });

export type CreateAlertFormInput = z.input<typeof CreateAlertSchema>;
export type CreateAlertInput = z.output<typeof CreateAlertSchema>;
export const SearchInputSchema = AlertFieldsSchema.pick({ origin: true, destination: true, isRoundTrip: true, departureDate: true, returnDate: true, flexDays: true });
export type SearchInput = z.infer<typeof SearchInputSchema>;