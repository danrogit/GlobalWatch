/**
 * Nominatim Geocoding Client
 * 
 * Uses OpenStreetMap's Nominatim API for precise location geocoding
 */

const NOMINATIM_URL = process.env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org';

export interface NominatimResult {
    lat: number;
    lon: number;
    display_name: string;
    type: string;
    importance: number;
}

/**
 * Geocode a location using Nominatim
 */
export async function geocodeLocation(locationName: string): Promise<NominatimResult | null> {
    try {
        const searchUrl = `${NOMINATIM_URL}/search?q=${encodeURIComponent(locationName)}&format=json&limit=1`;

        const response = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'GlobalWatch/1.0 (https://globalwatch.danro.dk)',
            },
            signal: AbortSignal.timeout(5000), // 5s timeout
        });

        if (!response.ok) {
            console.error(`[Nominatim] Geocoding failed: ${response.status}`);
            return null;
        }

        const data = await response.json();

        if (!data || data.length === 0) {
            console.log(`[Nominatim] No results for "${locationName}"`);
            return null;
        }

        const result = data[0];

        return {
            lat: parseFloat(result.lat),
            lon: parseFloat(result.lon),
            display_name: result.display_name,
            type: result.type,
            importance: result.importance || 0.5,
        };

    } catch (error: any) {
        console.error('[Nominatim] Error:', error.message);
        return null;
    }
}

/**
 * Batch geocode multiple locations (with rate limiting)
 */
export async function geocodeLocations(locationNames: string[]): Promise<Map<string, NominatimResult>> {
    const results = new Map<string, NominatimResult>();

    for (const name of locationNames) {
        const result = await geocodeLocation(name);
        if (result) {
            results.set(name, result);
        }

        // Rate limit: 1 request per second (Nominatim policy)
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
}

/**
 * Check if Nominatim is available
 */
export async function isNominatimAvailable(): Promise<boolean> {
    try {
        const response = await fetch(`${NOMINATIM_URL}/status`, {
            signal: AbortSignal.timeout(3000),
        });
        return response.ok;
    } catch {
        return false;
    }
}
