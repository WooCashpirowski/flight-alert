import type { SearchInput } from "@/src/modules/alerts/schemas";

export interface FlightOffer {
  provider: string;
  origin: string;
  destination: string;
  price: number;
  currency: string;
  departureDate: string;
  returnDate?: string;
  bookingUrl: string;
}

export interface FlightProvider {
  readonly name: string;
  search(input: SearchInput): Promise<FlightOffer[]>;
}