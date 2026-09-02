import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const AIRPORTS_URL =
    'https://davidmegginson.github.io/ourairports-data/airports.csv';
const COUNTRIES_URL =
    'https://davidmegginson.github.io/ourairports-data/countries.csv';

const POLISH_OVERRIDES = {
    WAW: { city: 'Warszawa', name: 'Lotnisko Chopina' },
    WMI: { city: 'Warszawa', name: 'Modlin' },
    KRK: { city: 'Kraków', name: 'Balice' },
    GDN: { city: 'Gdańsk', name: 'Rębiechowo' },
    KTW: { city: 'Katowice', name: 'Pyrzowice' },
    WRO: { city: 'Wrocław', name: 'Strachowice' },
    POZ: { city: 'Poznań', name: 'Ławica' },
    FCO: { city: 'Rzym', name: 'Fiumicino' },
    CIA: { city: 'Rzym', name: 'Ciampino' },
    BCN: { city: 'Barcelona', name: 'El Prat' },
    GRO: { city: 'Girona', name: 'Costa Brava' },
    LIS: { city: 'Lizbona', name: 'Humberto Delgado' },
    PMI: { city: 'Palma', name: 'Mallorca' },
    AGP: { city: 'Malaga', name: 'Costa del Sol' },
};

const TYPE_PRIORITY = {
    large_airport: 0,
    medium_airport: 1,
    small_airport: 2,
};

function parseCsv(source) {
    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;

    for (let index = 0; index < source.length; index += 1) {
        const character = source[index];
        if (quoted) {
            if (character === '"' && source[index + 1] === '"') {
                field += '"';
                index += 1;
            } else if (character === '"') {
                quoted = false;
            } else {
                field += character;
            }
        } else if (character === '"') {
            quoted = true;
        } else if (character === ',') {
            row.push(field);
            field = '';
        } else if (character === '\n') {
            row.push(field.replace(/\r$/, ''));
            rows.push(row);
            row = [];
            field = '';
        } else {
            field += character;
        }
    }

    if (field || row.length) {
        row.push(field.replace(/\r$/, ''));
        rows.push(row);
    }

    const [headers, ...values] = rows;
    return values
        .filter((valuesRow) => valuesRow.some(Boolean))
        .map((valuesRow) =>
            Object.fromEntries(
                headers.map((header, index) => [header, valuesRow[index] ?? '']),
            ),
        );
}

function normalizeSearchTerm(value) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[łŁ]/g, 'l')
        .toLocaleLowerCase('pl')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function uniqueSearchAliases(values, visibleValues) {
    const visible = new Set(visibleValues.map(normalizeSearchTerm));
    const seen = new Set();
    return values
        .flatMap((value) => (value || '').split(','))
        .map((value) => value.trim())
        .filter((value) => {
            const normalized = normalizeSearchTerm(value);
            if (!normalized || visible.has(normalized) || seen.has(normalized)) {
                return false;
            }
            seen.add(normalized);
            return true;
        })
        .join(', ');
}

async function fetchCsv(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to download ${url}: ${response.status}`);
    }
    return {
        lastModified: response.headers.get('last-modified'),
        rows: parseCsv(await response.text()),
    };
}

const [{ rows: airportRows, lastModified }, { rows: countryRows }] =
    await Promise.all([fetchCsv(AIRPORTS_URL), fetchCsv(COUNTRIES_URL)]);

const countryDisplayNames = new Intl.DisplayNames(['pl'], { type: 'region' });
const countries = new Map(
    countryRows.map((country) => [country.code, country]),
);
const airportsByCode = new Map();

for (const airport of airportRows) {
    const code = airport.iata_code.toUpperCase();
    const priority = TYPE_PRIORITY[airport.type];
    if (
        airport.scheduled_service !== 'yes' ||
        !/^[A-Z]{3}$/.test(code) ||
        priority === undefined
    ) {
        continue;
    }

    const current = airportsByCode.get(code);
    if (current && current.priority <= priority) continue;

    const country = countries.get(airport.iso_country);
    const override = POLISH_OVERRIDES[code];
    const sourceCity = airport.municipality || airport.name;
    const sourceName = airport.name;
    const countryName =
        countryDisplayNames.of(airport.iso_country) ||
        country?.name ||
        airport.iso_country;
    const city = override?.city || sourceCity;
    const name = override?.name || sourceName;
    const keywords = uniqueSearchAliases(
        [
            sourceCity,
            sourceName,
            airport.keywords,
            country?.name,
            country?.keywords,
        ],
        [code, city, name, countryName],
    );

    airportsByCode.set(code, {
        code,
        city,
        name,
        country: countryName,
        keywords,
        priority,
    });
}

const airports = [...airportsByCode.values()].sort((left, right) =>
    left.code.localeCompare(right.code),
);

for (const requiredCode of ['WAW', 'BCN', 'MLA']) {
    if (!airportsByCode.has(requiredCode)) {
        throw new Error(`Required airport ${requiredCode} is missing`);
    }
}

const output = {
    source: AIRPORTS_URL,
    sourceUpdatedAt: lastModified,
    airports,
};
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(
    scriptDirectory,
    '../src/modules/alerts/data/airport-catalog.generated.json',
);
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(output)}\n`, 'utf8');

console.log(`Generated ${airports.length} airports at ${outputPath}`);
