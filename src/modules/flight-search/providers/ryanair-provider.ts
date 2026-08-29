import { z } from "zod";
import type { SearchInput } from "@/src/modules/alerts/schemas";
import type { FlightOffer, FlightProvider } from "@/src/modules/flight-search/types";

const FareSchema = z.object({
  outbound: z.object({
    departureDate: z.string(),
    departureAirport: z.object({ iataCode: z.string() }),
    arrivalAirport: z.object({ iataCode: z.string() }),
    price: z.object({ value: z.number(), currencyCode: z.string() }),
  }),
});
const ResponseSchema = z.object({ fares: z.array(FareSchema).default([]) });
type RyanairFare = z.infer<typeof FareSchema>;

function dateWindow(date: string, flexDays: number) {
  const base = new Date(`${date}T12:00:00Z`);
  const shift = (days: number) => { const value = new Date(base); value.setUTCDate(value.getUTCDate() + days); return value.toISOString().slice(0, 10); };
  return { from: shift(-flexDays), to: shift(flexDays) };
}

export class RyanairProvider implements FlightProvider {
  readonly name = "Ryanair";
  private readonly endpoint = "https://services-api.ryanair.com/fareresources/v3/oneWayFares";

  private async fetchLeg(origin: string, destination: string, date: string, flexDays: number): Promise<RyanairFare[]> {
    const window = dateWindow(date, flexDays);
    const params = new URLSearchParams({
      departureAirportIataCode: origin,
      outboundDepartureDateFrom: window.from,
      outboundDepartureDateTo: window.to,
      currency: "PLN",
    });
    if (destination !== "ANY") params.set("arrivalAirportIataCode", destination);
    const response = await fetch(`${this.endpoint}?${params}`, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(12_000) });
    if (!response.ok) throw new Error(`Ryanair API: ${response.status}`);
    return ResponseSchema.parse(await response.json()).fares;
  }

  async search(input: SearchInput): Promise<FlightOffer[]> {
    try {
      const outbound = await this.fetchLeg(input.origin, input.destination, input.departureDate, input.flexDays);
      if (!input.isRoundTrip || !input.returnDate) return outbound.map((fare) => this.toOffer(fare));

      const candidates = outbound.slice(0, 8);
      const paired = await Promise.all(candidates.map(async (outboundFare): Promise<FlightOffer | null> => {
        try {
          const destination = outboundFare.outbound.arrivalAirport.iataCode;
          const returns = await this.fetchLeg(destination, input.origin, input.returnDate ?? input.departureDate, input.flexDays);
          const cheapestReturn = returns.sort((a, b) => a.outbound.price.value - b.outbound.price.value)[0];
          if (!cheapestReturn) return null;
          const offer = this.toOffer(outboundFare);
          return { ...offer, price: offer.price + cheapestReturn.outbound.price.value, returnDate: cheapestReturn.outbound.departureDate };
        } catch (error) {
          console.error("Ryanair return leg failed", { route: `${outboundFare.outbound.arrivalAirport.iataCode}-${input.origin}`, error });
          return null;
        }
      }));
      return paired.filter((offer): offer is FlightOffer => offer !== null);
    } catch (error) {
      console.error("Ryanair search failed", { input, error });
      return [];
    }
  }

  private toOffer(fare: RyanairFare): FlightOffer {
    const origin = fare.outbound.departureAirport.iataCode;
    const destination = fare.outbound.arrivalAirport.iataCode;
    return { provider: this.name, origin, destination, price: fare.outbound.price.value, currency: fare.outbound.price.currencyCode, departureDate: fare.outbound.departureDate, bookingUrl: `https://www.ryanair.com/pl/pl/trip/flights/select?originIata=${origin}&destinationIata=${destination}` };
  }
}