/**
 * Auto-Learning Location Database
 * 
 * When an unknown location is detected, automatically:
 * 1. Search for coordinates using SearXNG
 * 2. Add to database for future use
 * 3. System learns and improves over time
 */

import * as fs from 'fs';
import * as path from 'path';

interface LearnedLocation {
    name: string;
    lat: number;
    lon: number;
    country: string;
    learnedAt: string;
    source: 'searxng' | 'manual';
}

const LEARNED_DB_PATH = path.join(process.cwd(), 'data', 'learned-locations.json');

/**
 * Load learned locations from disk
 */
export function loadLearnedLocations(): Record<string, LearnedLocation> {
    try {
        if (fs.existsSync(LEARNED_DB_PATH)) {
            const data = fs.readFileSync(LEARNED_DB_PATH, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('[Location Learning] Failed to load learned locations:', error);
    }
    return {};
}

/**
 * Save learned location to disk
 */
export function saveLearnedLocation(name: string, location: LearnedLocation): void {
    try {
        const learned = loadLearnedLocations();
        learned[name.toLowerCase()] = location;

        // Ensure directory exists
        const dir = path.dirname(LEARNED_DB_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(LEARNED_DB_PATH, JSON.stringify(learned, null, 2), 'utf8');
        console.log(`[Location Learning] ✅ Learned new location: ${name} (${location.lat}, ${location.lon})`);
    } catch (error) {
        console.error('[Location Learning] Failed to save location:', error);
    }
}

/**
 * Search for location coordinates using SearXNG
 */
export async function geocodeWithSearXNG(locationName: string): Promise<{ lat: number; lon: number; country: string } | null> {
    try {
        const searxngUrl = process.env.SEARXNG_URL || 'https://searx.be';

        // Search for the location with geocoding context
        const searchUrl = `${searxngUrl}/search?q=${encodeURIComponent(locationName + ' coordinates latitude longitude')}&format=json&categories=general`;

        const response = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'GlobalWatch/1.0',
            },
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        const results = data.results || [];

        // Look for coordinate patterns in results
        for (const result of results.slice(0, 5)) {
            const text = (result.content || '') + ' ' + (result.title || '');

            // Try to extract coordinates from text
            // Pattern: "lat: 64.1814, lon: -51.6941" or "64.1814°N, 51.6941°W"
            const coordMatch = text.match(/(\-?\d+\.?\d*)[°\s,]+([NS])?[\s,]+(\-?\d+\.?\d*)[°\s,]+([EW])?/i);

            if (coordMatch) {
                let lat = parseFloat(coordMatch[1]);
                let lon = parseFloat(coordMatch[3]);

                // Handle N/S/E/W indicators
                if (coordMatch[2]?.toUpperCase() === 'S') lat = -lat;
                if (coordMatch[4]?.toUpperCase() === 'W') lon = -lon;

                // Validate coordinates
                if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
                    // Try to extract country from result
                    const countryMatch = text.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/);
                    const country = countryMatch ? countryMatch[1] : 'Unknown';

                    return { lat, lon, country };
                }
            }
        }

        return null;
    } catch (error) {
        console.error('[Location Learning] SearXNG geocoding failed:', error);
        return null;
    }
}

/**
 * Learn a new location automatically
 */
export async function learnLocation(locationName: string): Promise<{ lat: number; lon: number; country: string } | null> {
    // Check if already learned
    const learned = loadLearnedLocations();
    const key = locationName.toLowerCase();

    if (learned[key]) {
        console.log(`[Location Learning] Already know ${locationName}`);
        return { lat: learned[key].lat, lon: learned[key].lon, country: learned[key].country };
    }

    console.log(`[Location Learning] 🔍 Learning new location: ${locationName}`);

    // Try to geocode with SearXNG
    const coords = await geocodeWithSearXNG(locationName);

    if (coords) {
        // Save to database
        saveLearnedLocation(locationName, {
            name: locationName,
            lat: coords.lat,
            lon: coords.lon,
            country: coords.country,
            learnedAt: new Date().toISOString(),
            source: 'searxng',
        });

        return coords;
    }

    console.warn(`[Location Learning] ❌ Could not learn ${locationName}`);
    return null;
}

/**
 * Get location from learned database
 */
export function getLearnedLocation(locationName: string): { lat: number; lon: number; country: string } | null {
    const learned = loadLearnedLocations();
    const key = locationName.toLowerCase();

    if (learned[key]) {
        return { lat: learned[key].lat, lon: learned[key].lon, country: learned[key].country };
    }

    return null;
}
