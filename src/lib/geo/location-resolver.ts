/**
 * Location Resolver
 * 
 * Resolves NER entities to precise coordinates using city database
 * Implements disambiguation rules: City > Region > Country
 */

import { extractCityFromText, getCityCoords, CITY_COORDS, type CityCoords } from '../geo/city-coords';
import type { LocationEntity } from '../nlp/ner-extractor';

export interface ResolvedLocation {
    lat: number;
    lon: number;
    label: string; // e.g., "Washington DC, USA"
    confidence: number;
    source: 'ner' | 'city-match' | 'country-fallback';
    type: 'city' | 'region' | 'country' | 'landmark';
}

/**
 * Resolve location entities to coordinates
 * Applies disambiguation rules and confidence scoring
 */
export function resolveLocation(
    entities: Array<LocationEntity & { confidence: number }>
): ResolvedLocation | null {
    if (entities.length === 0) return null;

    // Sort by confidence descending
    const sorted = [...entities].sort((a, b) => b.confidence - a.confidence);

    // Try to match each entity to city coordinates
    for (const entity of sorted) {
        const cityMatch = matchToCity(entity.text);

        if (cityMatch) {
            return {
                lat: cityMatch.lat,
                lon: cityMatch.lon,
                label: `${entity.text}, ${cityMatch.country}`,
                confidence: entity.confidence * 0.95, // High confidence for city match
                source: 'city-match',
                type: entity.type,
            };
        }
    }

    // No city match - use first entity with country fallback
    const topEntity = sorted[0];
    const countryCoords = getCountryCoords(topEntity.text);

    if (countryCoords) {
        return {
            lat: countryCoords.lat,
            lon: countryCoords.lon,
            label: topEntity.text,
            confidence: topEntity.confidence * 0.5, // Lower confidence for country fallback
            source: 'country-fallback',
            type: topEntity.type,
        };
    }

    // FALLBACK: If no city or country match, return the first entity with low confidence
    // This is better than failing completely - we can still show SOMETHING on the map
    if (sorted.length > 0) {
        const topEntity = sorted[0];
        console.warn(`[Location Resolver] No exact match for "${topEntity.text}", using approximate location`);

        // Use a generic location based on entity type
        // For now, default to a central location (Europe) with very low confidence
        return {
            lat: 50.0, // Central Europe
            lon: 10.0,
            label: topEntity.text,
            confidence: 0.1, // Very low confidence
            source: 'country-fallback',
            type: topEntity.type,
        };
    }

    return null;
}

/**
 * Match entity text to city coordinates database
 */
function matchToCity(text: string): CityCoords | null {
    const normalized = text.toLowerCase().trim();

    // Direct match
    if (CITY_COORDS[normalized]) {
        return CITY_COORDS[normalized];
    }

    // Fuzzy match (contains)
    for (const [cityName, coords] of Object.entries(CITY_COORDS)) {
        if (normalized.includes(cityName) || cityName.includes(normalized)) {
            return coords;
        }
    }

    return null;
}

/**
 * Get country coordinates (capital city)
 */
function getCountryCoords(countryName: string): CityCoords | null {
    const countryToCapital: Record<string, string> = {
        'usa': 'washington',
        'united states': 'washington',
        'uk': 'london',
        'united kingdom': 'london',
        'germany': 'berlin',
        'france': 'paris',
        'russia': 'moscow',
        'china': 'beijing',
        'japan': 'tokyo',
        'india': 'delhi',
        'australia': 'sydney',
        'canada': 'ottawa',
        'brazil': 'brasilia',
        'denmark': 'copenhagen',
        'sweden': 'stockholm',
        'norway': 'oslo',
        'finland': 'helsinki',
        'spain': 'madrid',
        'italy': 'rome',
        'poland': 'warsaw',
        'ukraine': 'kyiv',
        'israel': 'jerusalem',
        'iran': 'tehran',
        'turkey': 'ankara',
        'egypt': 'cairo',
        'south africa': 'cape town',
        'mexico': 'mexico city',
        'argentina': 'buenos aires',
        'lebanon': 'beirut',
        'syria': 'damascus',
        'iraq': 'baghdad',
        'saudi arabia': 'riyadh',
        'qatar': 'doha',
        'uae': 'dubai',
        'palestine': 'ramallah', // or Gaza?
        'afghanistan': 'kabul',
        'pakistan': 'islamabad',
        'nigeria': 'lagos',
        'kenya': 'nairobi',
        'sudan': 'khartoum',
        'indonesia': 'jakarta',
        'thailand': 'bangkok',
        'vietnam': 'hanoi',
        'philippines': 'manila',
        'north korea': 'pyongyang',
        'south korea': 'seoul',
        'taiwan': 'taipei',
        'myanmar': 'yangon',
        'venezuela': 'caracas',
        'colombia': 'bogota',
        'chile': 'santiago',
        'peru': 'lima',
        'netherlands': 'amsterdam',
        'belgium': 'brussels',
        'austria': 'vienna',
        'switzerland': 'bern', // Need coords for Bern or Zurich
        'ireland': 'dublin',
        'portugal': 'lisbon',
        'greece': 'athens',
        'hungary': 'budapest',
        'romania': 'bucharest',
        'czech republic': 'prague',
        'slovakia': 'bratislava',
        'estonia': 'tallinn',
        'latvia': 'riga',
        'lithuania': 'vilnius',
    };

    const normalized = countryName.toLowerCase();
    const capitalCity = countryToCapital[normalized];

    if (capitalCity && CITY_COORDS[capitalCity]) {
        return CITY_COORDS[capitalCity];
    }

    return null;
}

/**
 * Resolve multiple locations (for events with primary + secondary locations)
 */
export function resolveMultipleLocations(
    entities: Array<LocationEntity & { confidence: number }>
): { primary: ResolvedLocation | null; secondary: ResolvedLocation | null } {
    if (entities.length === 0) {
        return { primary: null, secondary: null };
    }

    // Sort by confidence
    const sorted = [...entities].sort((a, b) => b.confidence - a.confidence);

    // Primary location (highest confidence)
    const primary = resolveLocation([sorted[0]]);

    // Secondary location (second highest, if significantly different)
    let secondary: ResolvedLocation | null = null;
    if (sorted.length > 1) {
        const secondEntity = sorted[1];
        const secondResolved = resolveLocation([secondEntity]);

        // Only include if it's a different location
        if (secondResolved && primary &&
            (Math.abs(secondResolved.lat - primary.lat) > 1 ||
                Math.abs(secondResolved.lon - primary.lon) > 1)) {
            secondary = secondResolved;
        }
    }

    return { primary, secondary };
}

/**
 * Disambiguate ambiguous location names
 * Example: "Washington" -> Washington DC vs Washington State
 */
export function disambiguateLocation(
    locationText: string,
    context: string
): string {
    const lower = locationText.toLowerCase();

    // Washington disambiguation
    if (lower === 'washington') {
        if (context.toLowerCase().includes('state') ||
            context.toLowerCase().includes('seattle')) {
            return 'Washington State';
        }
        return 'Washington DC'; // Default to DC for geopolitical news
    }

    // Paris disambiguation
    if (lower === 'paris') {
        if (context.toLowerCase().includes('texas')) {
            return 'Paris, Texas';
        }
        return 'Paris'; // Default to France
    }

    // Georgia disambiguation
    if (lower === 'georgia') {
        if (context.toLowerCase().includes('atlanta') ||
            context.toLowerCase().includes('us')) {
            return 'Georgia, USA';
        }
        return 'Georgia'; // Default to country
    }

    return locationText;
}
