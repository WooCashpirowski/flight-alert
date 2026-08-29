import { z } from "zod";
import type { SearchInput } from "@/src/modules/alerts/schemas";
import type { FlightOffer, FlightProvider } from "@/src/modules/flight-search/types";

const TokenSchema = z.object({ access_token: z.string() });
const OffersSchema = z.object({ data: z.array(z.object({
  price: z.object({ grandTotal: z.string(), currency: z.string() }),
  itineraries: z.array(z.object({ segments: z.array(z.object({
    departure: z.object({ iataCode: z.string(), at: z.string() }),
    arrival: z.object({ iataCode: z.string() }),
  })) })),
})).default([]) });

export class AmadeusProvider implements FlightProvider {
  readonly name = "Amadeus";
  constructor(private readonly clientId: string, private readonly clientSecret: string) {}

  private async getToken() {
    const body = new URLSearchParams({ grant_type: "client_credentials", client_id: this.clientId, client_secret: this.clientSecret });
    const response = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body, signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error(`Amadeus token: ${response.status}`);
    return TokenSchema.parse(await response.json()).access_token;
  }

  async search(input: SearchInput): Promise<FlightOffer[]> {
    if (input.destination === "ANY") return [];
    try {
      const token = await this.getToken();
      const params = new URLSearchParams({ originLocationCode: input.origin, destinationLocationCode: input.destination, departureDate: input.departureDate, adults: "1", currencyCode: "PLN", max: "10" });
      if (input.isRoundTrip && input.returnDate) params.set("returnDate", input.returnDate);
      const response = await fetch(`https://test.api.amadeus.com/v2/shopping/flight-offers?${params}`, { headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(14_000) });
      if (!response.ok) throw new Error(`Amadeus offers: ${response.status}`);
      return OffersSchema.parse(await response.json()).data.map((offer) => {
        const first = offer.itineraries[0]?.segments[0];
        const last = offer.itineraries[0]?.segments.at(-1);
        return { provider: this.name, origin: first?.departure.iataCode ?? input.origin, destination: last?.arrival.iataCode ?? input.destination, price: Number(offer.price.grandTotal), currency: offer.price.currency, departureDate: first?.departure.at ?? input.departureDate, returnDate: offer.itineraries[1]?.segments[0]?.departure.at, bookingUrl: "https://www.amadeus.net/" };
      });
    } catch (error) {
      console.error("Amadeus search failed", { input, error });
      return [];
    }
  }
}