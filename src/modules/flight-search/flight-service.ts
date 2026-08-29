import type { SearchInput } from "@/src/modules/alerts/schemas";
import { RyanairProvider } from "@/src/modules/flight-search/providers/ryanair-provider";
import { SerpApiProvider } from "@/src/modules/flight-search/providers/serpapi-provider";
import type { FlightOffer, FlightProvider } from "@/src/modules/flight-search/types";

function configuredProviders(): FlightProvider[] {
  const serpApiKey = process.env.SERPAPI_API_KEY?.trim();
  return serpApiKey ? [new SerpApiProvider(serpApiKey)] : [new RyanairProvider()];
}

export async function searchFlights(input: SearchInput, providers = configuredProviders()): Promise<FlightOffer[]> {
  const offers: FlightOffer[] = [];
  for (const provider of providers) {
    try { offers.push(...await provider.search(input)); }
    catch (error) { console.error("Flight provider failed", { provider: provider.name, route: `${input.origin}-${input.destination}`, error }); }
  }
  return offers.sort((a, b) => a.price - b.price);
}
