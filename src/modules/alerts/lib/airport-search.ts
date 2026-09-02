import catalog from '@/src/modules/alerts/data/airport-catalog.generated.json';

export interface AirportOption {
    code: string;
    city: string;
    name: string;
    country: string;
    keywords: string;
    priority: number;
}

interface IndexedAirport {
    airport: AirportOption;
    code: string;
    city: string;
    name: string;
    country: string;
    keywords: string;
    all: string;
}

export const airportCatalogMetadata = {
    source: catalog.source,
    sourceUpdatedAt: catalog.sourceUpdatedAt,
    count: catalog.airports.length,
};

export function normalizeAirportQuery(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[łŁ]/g, 'l')
        .toLocaleLowerCase('pl')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

const indexedAirports: IndexedAirport[] = catalog.airports.map((airport) => {
    const normalized = {
        code: airport.code.toLocaleLowerCase('pl'),
        city: normalizeAirportQuery(airport.city),
        name: normalizeAirportQuery(airport.name),
        country: normalizeAirportQuery(airport.country),
        keywords: normalizeAirportQuery(airport.keywords),
    };
    return {
        airport,
        ...normalized,
        all: Object.values(normalized).join(' '),
    };
});

const airportsByCode = new Map(
    indexedAirports.map(({ airport }) => [airport.code, airport]),
);

function startsWithWord(value: string, query: string) {
    return value === query || value.startsWith(`${query} `) || value.includes(` ${query}`);
}

function airportScore(indexed: IndexedAirport, query: string) {
    const tokens = query.split(' ');
    if (!tokens.every((token) => indexed.all.includes(token))) return null;

    let matchScore = 70;
    let specificity = 0;
    if (indexed.code === query) matchScore = 0;
    else if (indexed.code.startsWith(query)) matchScore = 10;
    else if (indexed.city === query) matchScore = 15;
    else if (indexed.country === query) matchScore = 16;
    else if (indexed.country.startsWith(query)) {
        matchScore = 17;
        specificity = indexed.country.length - query.length;
    } else if (indexed.city.startsWith(query)) {
        matchScore = 20;
        specificity = indexed.city.length - query.length;
    } else if (indexed.name.startsWith(query)) {
        matchScore = 25;
        specificity = indexed.name.length - query.length;
    }
    else if (startsWithWord(indexed.keywords, query)) matchScore = 35;
    else if (indexed.city.includes(query)) matchScore = 45;
    else if (indexed.country.includes(query)) matchScore = 48;
    else if (indexed.name.includes(query)) matchScore = 52;

    return (
        matchScore * 100 +
        indexed.airport.priority * 20 +
        Math.min(Math.max(specificity, 0), 20)
    );
}

export function getAirportByCode(code: string) {
    return airportsByCode.get(code.trim().toUpperCase());
}

export function searchAirports(query: string, limit = 8) {
    const normalizedQuery = normalizeAirportQuery(query);
    if (normalizedQuery.length < 2) return [];

    return indexedAirports
        .map((indexed) => ({
            airport: indexed.airport,
            score: airportScore(indexed, normalizedQuery),
        }))
        .filter(
            (candidate): candidate is { airport: AirportOption; score: number } =>
                candidate.score !== null,
        )
        .sort(
            (left, right) =>
                left.score - right.score ||
                left.airport.city.localeCompare(right.airport.city, 'pl') ||
                left.airport.code.localeCompare(right.airport.code),
        )
        .slice(0, limit)
        .map(({ airport }) => airport);
}
