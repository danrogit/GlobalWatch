/**
 * Geocoder Client
 * 
 * Wrapper for Nominatim (OpenStreetMap) geocoding API
 * Converts location names to lat/lon coordinates
 */

import * as fs from 'fs';
import * as path from 'path';

export interface GeocodingResult {
    lat: number;
    lon: number;
    displayName: string;
    confidence: number;
}

// Static country capital coordinates (fallback)
const COUNTRY_CAPITALS: Record<string, { lat: number; lon: number }> = {
    'Denmark': { lat: 55.6761, lon: 12.5683 }, // Copenhagen
    'Sweden': { lat: 59.3293, lon: 18.0686 }, // Stockholm
    'Norway': { lat: 59.9139, lon: 10.7522 }, // Oslo
    'Finland': { lat: 60.1699, lon: 24.9384 }, // Helsinki
    'Germany': { lat: 52.5200, lon: 13.4050 }, // Berlin
    'France': { lat: 48.8566, lon: 2.3522 }, // Paris
    'United Kingdom': { lat: 51.5074, lon: -0.1278 }, // London
    'UK': { lat: 51.5074, lon: -0.1278 },
    'United States': { lat: 38.9072, lon: -77.0369 }, // Washington DC
    'USA': { lat: 38.9072, lon: -77.0369 },
    'Russia': { lat: 55.7558, lon: 37.6173 }, // Moscow
    'China': { lat: 39.9042, lon: 116.4074 }, // Beijing
    'Japan': { lat: 35.6762, lon: 139.6503 }, // Tokyo
    'India': { lat: 28.6139, lon: 77.2090 }, // New Delhi
    'Brazil': { lat: -15.7975, lon: -47.8919 }, // Brasília
    'Australia': { lat: -35.2809, lon: 149.1300 }, // Canberra
    'Canada': { lat: 45.4215, lon: -75.6972 }, // Ottawa
    'Spain': { lat: 40.4168, lon: -3.7038 }, // Madrid
    'Italy': { lat: 41.9028, lon: 12.4964 }, // Rome
    'Poland': { lat: 52.2297, lon: 21.0122 }, // Warsaw
    'Ukraine': { lat: 50.4501, lon: 30.5234 }, // Kyiv
    'Israel': { lat: 31.7683, lon: 35.2137 }, // Jerusalem
    'Palestine': { lat: 31.9522, lon: 35.2332 }, // Ramallah
    'Iran': { lat: 35.6892, lon: 51.3890 }, // Tehran
    'Turkey': { lat: 39.9334, lon: 32.8597 }, // Ankara
    'Egypt': { lat: 30.0444, lon: 31.2357 }, // Cairo
    'South Africa': { lat: -25.7479, lon: 28.2293 }, // Pretoria
    'Mexico': { lat: 19.4326, lon: -99.1332 }, // Mexico City
    'Argentina': { lat: -34.6037, lon: -58.3816 }, // Buenos Aires
    'Netherlands': { lat: 52.3676, lon: 4.9041 }, // Amsterdam
    'Belgium': { lat: 50.8503, lon: 4.3517 }, // Brussels
    'Austria': { lat: 48.2082, lon: 16.3738 }, // Vienna
    'Switzerland': { lat: 46.9480, lon: 7.4474 }, // Bern
    'Greece': { lat: 37.9838, lon: 23.7275 }, // Athens
    'Portugal': { lat: 38.7223, lon: -9.1393 }, // Lisbon
    'Czech Republic': { lat: 50.0755, lon: 14.4378 }, // Prague
    'Romania': { lat: 44.4268, lon: 26.1025 }, // Bucharest
    'Hungary': { lat: 47.4979, lon: 19.0402 }, // Budapest
    'Ireland': { lat: 53.3498, lon: -6.2603 }, // Dublin
    'Qatar': { lat: 25.2854, lon: 51.5310 }, // Doha
    'Hong Kong': { lat: 22.3193, lon: 114.1694 },
};

// Danish city coordinates
const DANISH_CITIES: Record<string, { lat: number; lon: number }> = {
    'København': { lat: 55.6761, lon: 12.5683 },
    'Copenhagen': { lat: 55.6761, lon: 12.5683 },
    'Aarhus': { lat: 56.1629, lon: 10.2039 },
    'Odense': { lat: 55.4038, lon: 10.4024 },
    'Aalborg': { lat: 57.0488, lon: 9.9217 },
    'Esbjerg': { lat: 55.4761, lon: 8.4594 },
    'Randers': { lat: 56.4607, lon: 10.0363 },
    'Kolding': { lat: 55.4904, lon: 9.4727 },
    'Horsens': { lat: 55.8607, lon: 9.8503 },
    'Vejle': { lat: 55.7113, lon: 9.5364 },
    'Roskilde': { lat: 55.6419, lon: 12.0878 },
    'Herning': { lat: 56.1393, lon: 8.9734 },
    'Silkeborg': { lat: 56.1699, lon: 9.5450 },
};

// Major world city coordinates
const MAJOR_CITIES: Record<string, { lat: number; lon: number }> = {
    'Washington': { lat: 38.9072, lon: -77.0369 },
    'New York': { lat: 40.7128, lon: -74.0060 },
    'Los Angeles': { lat: 34.0522, lon: -118.2437 },
    'London': { lat: 51.5074, lon: -0.1278 },
    'Paris': { lat: 48.8566, lon: 2.3522 },
    'Berlin': { lat: 52.5200, lon: 13.4050 },
    'Moscow': { lat: 55.7558, lon: 37.6173 },
    'Beijing': { lat: 39.9042, lon: 116.4074 },
    'Shanghai': { lat: 31.2304, lon: 121.4737 },
    'Tokyo': { lat: 35.6762, lon: 139.6503 },
    'Mumbai': { lat: 19.0760, lon: 72.8777 },
    'Sydney': { lat: -33.8688, lon: 151.2093 },
    'Toronto': { lat: 43.6532, lon: -79.3832 },
    'Stockholm': { lat: 59.3293, lon: 18.0686 },
    'Oslo': { lat: 59.9139, lon: 10.7522 },
    'Helsinki': { lat: 60.1699, lon: 24.9384 },
    'Kyiv': { lat: 50.4501, lon: 30.5234 },
    'Kiev': { lat: 50.4501, lon: 30.5234 },
    'Tel Aviv': { lat: 32.0853, lon: 34.7818 },
    'Jerusalem': { lat: 31.7683, lon: 35.2137 },
};

// Cache file path
const CACHE_FILE = path.join(process.cwd(), 'data', 'cache', 'geocode.json');

let geocodeCache: Record<string, GeocodingResult> = {};

/**
 * Load geocode cache from disk
 */
function loadCache(): void {
    try {
        if (fs.existsSync(CACHE_FILE)) {
            const data = fs.readFileSync(CACHE_FILE, 'utf8');
            geocodeCache = JSON.parse(data);
        }
    } catch (error) {
        console.warn('[Geocoder] Failed to load cache:', error);
        geocodeCache = {};
    }
}

/**
 * Save geocode cache to disk
 */
function saveCache(): void {
    try {
        const dir = path.dirname(CACHE_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(CACHE_FILE, JSON.stringify(geocodeCache, null, 2));
    } catch (error) {
        console.warn('[Geocoder] Failed to save cache:', error);
    }
}

// Load cache on module init
loadCache();

/**
 * Geocode a location name to coordinates
 * Uses: 1) Static lookup, 2) Cache, 3) Nominatim API
 */
export async function geocode(locationName: string, locationType: 'city' | 'country' = 'city'): Promise<GeocodingResult | null> {
    const cacheKey = locationName.toLowerCase();

    // 1. Check static lookups first (fastest)
    if (DANISH_CITIES[locationName]) {
        const coords = DANISH_CITIES[locationName];
        return { ...coords, displayName: locationName, confidence: 1.0 };
    }

    if (MAJOR_CITIES[locationName]) {
        const coords = MAJOR_CITIES[locationName];
        return { ...coords, displayName: locationName, confidence: 1.0 };
    }

    if (COUNTRY_CAPITALS[locationName]) {
        const coords = COUNTRY_CAPITALS[locationName];
        return { ...coords, displayName: locationName, confidence: 0.9 };
    }

    // 2. Check cache
    if (geocodeCache[cacheKey]) {
        return geocodeCache[cacheKey];
    }

    // 3. Query Nominatim API
    try {
        const nominatimUrl = process.env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org';
        const url = `${nominatimUrl}/search?q=${encodeURIComponent(locationName)}&format=json&limit=1`;

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'GlobalWatch/1.0 (News Aggregator)'
            }
        });

        // Rate limiting: wait 1 second between Nominatim requests
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (!response.ok) {
            console.warn(`[Geocoder] Nominatim error: ${response.status}`);
            return null;
        }

        const results = await response.json();

        if (results && results.length > 0) {
            const result: GeocodingResult = {
                lat: parseFloat(results[0].lat),
                lon: parseFloat(results[0].lon),
                displayName: results[0].display_name,
                confidence: 0.7
            };

            // Cache the result
            geocodeCache[cacheKey] = result;
            saveCache();

            return result;
        }
    } catch (error) {
        console.warn(`[Geocoder] Failed to geocode "${locationName}":`, error);
    }

    return null;
}

/**
 * Get coordinates for a country (capital city)
 */
export function getCountryCoordinates(country: string): { lat: number; lon: number } | null {
    return COUNTRY_CAPITALS[country] || null;
}
