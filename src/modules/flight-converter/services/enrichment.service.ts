import { cacheWrapperService } from "../../../services/cacheWrapper.service";
import type { ParseWarning } from "../flight-converter.types";
import { Airline } from "../models/airline.model";
import { Airport } from "../models/airport.model";

const CACHE_TTL = 86400;

async function getAirlineByCode(code: string) {
  return cacheWrapperService.getOrSet({
    key: `ref:airline:${code}`,
    ttl: CACHE_TTL,
    fetcher: () => Airline.findOne({ iata: code.toUpperCase() }).lean(),
  });
}

async function getAirportByCode(code: string) {
  return cacheWrapperService.getOrSet({
    key: `ref:airport:${code}`,
    ttl: CACHE_TTL,
    fetcher: () => Airport.findOne({ iata: code.toUpperCase() }).lean(),
  });
}

export async function resolveAirline(
  code: string,
  warnings: ParseWarning[],
  line?: number,
): Promise<{ name: string; logoPath: string }> {
  const upper = code.toUpperCase();
  const doc = await getAirlineByCode(upper);

  if (doc) {
    return { name: doc.name, logoPath: doc.logoPath };
  }

  warnings.push({
    line,
    code: "UNKNOWN_AIRLINE",
    message: `Airline code "${upper}" is not in the reference database.`,
  });

  return {
    name: upper,
    logoPath: `/airlines/${upper.toLowerCase()}.png`,
  };
}

export async function resolveAirport(
  code: string,
  warnings: ParseWarning[],
  line?: number,
): Promise<string> {
  const upper = code.toUpperCase();
  const doc = await getAirportByCode(upper);

  if (doc) {
    return doc.name;
  }

  warnings.push({
    line,
    code: "UNKNOWN_AIRPORT",
    message: `Airport code "${upper}" is not in the reference database.`,
  });

  return upper;
}
