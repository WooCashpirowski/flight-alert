import { z } from "zod";
import type { SearchInput } from "@/src/modules/alerts/schemas";
import type { FlightOffer, FlightProvider } from "@/src/modules/flight-search/types";

const FlightLegSchema = z.object({
  departure_airport: z.object({ id: z.string(), time: z.string() }),
  arrival_airport: z.object({ id: z.string(), time: z.string() }),
});

const ItinerarySchema = z.object({
  price: z.coerce.number(),
  flights: z.array(FlightLegSchema).min(1),
});

const ResponseSchema = z.object({
  search_metadata: z.object({ google_flights_url: z.string().url().optional() }).optional(),
  best_flights: z.array(ItinerarySchema).optional().default([]),
  other_flights: z.array(ItinerarySchema).optional().default([]),
});

function shiftDate(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function rotatingFlexOffset(flexDays: number) {
  if (flexDays === 0) return 0;
  const dayNumber = Math.floor(Date.now() / 86_400_000);
  return (dayNumber % (flexDays * 2 + 1)) - flexDays;
}

export class SerpApiProvider implements FlightProvider {
  readonly name = "Google Flights";

  constructor(private readonly apiKey: string) {}

  async search(input: SearchInput): Promise<FlightOffer[]> {
    const flexOffset = rotatingFlexOffset(input.flexDays);
    const departureDate = shiftDate(input.departureDate, flexOffset);
    const returnDate = input.returnDate ? shiftDate(input.returnDate, flexOffset) : undefined;
    const params = new URLSearchParams({
      engine: "google_flights",
      departure_id: input.origin,
      outbound_date: departureDate,
      type: input.isRoundTrip ? "1" : "2",
      currency: "PLN",
      gl: "pl",
      hl: "pl",
      api_key: this.apiKey,
    });
    if (input.destination !== "ANY") params.set("arrival_id", input.destination);
    if (input.isRoundTrip && returnDate) params.set("return_date", returnDate);

    try {
      const response = await fetch(`https://serpapi.com/search.json?${params}`, {
        headers: { accept: "application/json" },
        signal: AbortSignal.timeout(20_000),
      });
      if (!response.ok) throw new Error(`SerpApi: ${response.status}`);
      const result = ResponseSchema.parse(await response.json());
      const bookingUrl = result.search_metadata?.google_flights_url ?? "https://www.google.com/travel/flights?hl=pl&curr=PLN";
      return [...result.best_flights, ...result.other_flights].map((itinerary) => {
        const first = itinerary.flights[0];
        const last = itinerary.flights[itinerary.flights.length - 1];
        return {
          provider: this.name,
          origin: first.departure_airport.id,
          destination: last.arrival_airport.id,
          price: itinerary.price,
          currency: "PLN",
          departureDate: first.departure_airport.time.slice(0, 10),
          returnDate,
          bookingUrl,
        } satisfies FlightOffer;
      });
    } catch (error) {
      console.error("Google Flights search failed", {
        route: `${input.origin}-${input.destination}`,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      return [];
    }
  }
}
