/**
 * Re-enrich events with proper city-level geocoding
 * Extracts city names from article text and places events at exact coordinates
 */

import { db } from '../src/lib/db/index';
import { extractCityFromText, CITY_COORDS } from '../src/lib/geo/city-coords';
import { extractCountryFromUrl } from '../src/lib/geo/location-extractor';

// Country capital coordinates (fallback if no city found)
const COUNTRY_CAPITALS: Record<string, { lat: number; lon: number }> = {
    'Denmark': { lat: 55.68, lon: 12.57 },
    'USA': { lat: 38.9, lon: -77.04 },
    'United States': { lat: 38.9, lon: -77.04 },
    'UK': { lat: 51.51, lon: -0.13 },
    'United Kingdom': { lat: 51.51, lon: -0.13 },
    'Germany': { lat: 52.52, lon: 13.41 },
    'France': { lat: 48.86, lon: 2.35 },
    'Russia': { lat: 55.76, lon: 37.62 },
    'China': { lat: 39.9, lon: 116.4 },
    'Japan': { lat: 35.68, lon: 139.69 },
    'India': { lat: 28.61, lon: 77.21 },
    'Australia': { lat: -33.87, lon: 151.21 },
    'Canada': { lat: 45.42, lon: -75.7 },
    'Brazil': { lat: -15.79, lon: -47.88 },
    'Netherlands': { lat: 52.37, lon: 4.89 },
    'Belgium': { lat: 50.85, lon: 4.35 },
    'Spain': { lat: 40.42, lon: -3.7 },
    'Italy': { lat: 41.9, lon: 12.5 },
    'Poland': { lat: 52.23, lon: 21.01 },
    'Ukraine': { lat: 50.45, lon: 30.52 },
    'Sweden': { lat: 59.33, lon: 18.07 },
    'Norway': { lat: 59.91, lon: 10.75 },
    'Finland': { lat: 60.17, lon: 24.94 },
    'Israel': { lat: 31.78, lon: 35.21 },
    'Iran': { lat: 35.69, lon: 51.39 },
    'South Africa': { lat: -33.92, lon: 18.42 },
    'Qatar': { lat: 25.27, lon: 51.53 },
    'UAE': { lat: 25.28, lon: 55.3 },
    'Saudi Arabia': { lat: 24.69, lon: 46.72 },
    'Egypt': { lat: 30.04, lon: 31.24 },
    'Turkey': { lat: 39.93, lon: 32.85 },
    'Greece': { lat: 37.98, lon: 23.73 },
    'Switzerland': { lat: 46.95, lon: 7.45 },
    'Austria': { lat: 48.21, lon: 16.37 },
    'Ireland': { lat: 53.35, lon: -6.26 },
    'Mexico': { lat: 19.43, lon: -99.13 },
    'Argentina': { lat: -34.6, lon: -58.38 },
    'Taiwan': { lat: 25.03, lon: 121.57 },
    'South Korea': { lat: 37.57, lon: 126.98 },
    'Singapore': { lat: 1.29, lon: 103.85 },
    'Thailand': { lat: 13.76, lon: 100.5 },
    'Indonesia': { lat: -6.21, lon: 106.85 },
    'Malaysia': { lat: 3.14, lon: 101.69 },
    'Vietnam': { lat: 21.03, lon: 105.85 },
    'Philippines': { lat: 14.6, lon: 120.98 },
    'Pakistan': { lat: 33.69, lon: 73.07 },
};

async function reEnrichWithCities() {
    console.log('[City Re-Enrich] Starting city-level geocoding...');

    // Get all events
    const events = db.prepare('SELECT event_id, title, json_data FROM geo_events').all() as any[];
    console.log(`[City Re-Enrich] Processing ${events.length} events...`);

    let updated = 0;
    let cityMatches = 0;
    let countryFallbacks = 0;
    const cityStats: Record<string, number> = {};
    const countryStats: Record<string, number> = {};

    for (const event of events) {
        try {
            const data = JSON.parse(event.json_data || '{}');
            const title = data.title || event.title || '';
            const description = data.description || '';
            const feedUrl = data.sourceUrl || data.source_url || '';

            // Full text to search for cities
            const fullText = `${title} ${description}`;

            // Try to extract city from article text
            const cityMatch = extractCityFromText(fullText);

            let lat: number;
            let lon: number;
            let country: string;

            if (cityMatch) {
                // Found a city! Use exact coordinates
                lat = cityMatch.lat;
                lon = cityMatch.lon;
                country = cityMatch.country;
                cityMatches++;

                // Track which cities we matched
                const cityName = Object.entries(CITY_COORDS)
                    .find(([_, coords]) => coords.lat === cityMatch.lat && coords.lon === cityMatch.lon)?.[0] || 'unknown';
                cityStats[cityName] = (cityStats[cityName] || 0) + 1;
            } else {
                // No city found - use country from feed URL
                country = extractCountryFromUrl(feedUrl) || 'Global';
                const countryCoords = COUNTRY_CAPITALS[country];

                if (countryCoords) {
                    // Add small jitter so events don't stack exactly
                    const jitter = () => (Math.random() - 0.5) * 1; // +/- 0.5 degrees
                    lat = countryCoords.lat + jitter();
                    lon = countryCoords.lon + jitter();
                } else {
                    // Complete fallback - random location
                    lat = (Math.random() - 0.5) * 100;
                    lon = (Math.random() - 0.5) * 200;
                }
                countryFallbacks++;
            }

            countryStats[country] = (countryStats[country] || 0) + 1;

            // Update json_data
            data.country = country;
            data.lat = lat;
            data.lon = lon;

            db.prepare('UPDATE geo_events SET json_data = ? WHERE event_id = ?')
                .run(JSON.stringify(data), event.event_id);

            updated++;

        } catch (err) {
            console.error(`[City Re-Enrich] Error processing event ${event.event_id}:`, err);
        }
    }

    console.log(`\n[City Re-Enrich] Updated ${updated} events`);
    console.log(`  ✅ City matches: ${cityMatches}`);
    console.log(`  📍 Country fallbacks: ${countryFallbacks}`);

    console.log('\nTop 20 Cities Matched:');
    Object.entries(cityStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .forEach(([city, count]) => {
            console.log(`  ${city}: ${count}`);
        });

    console.log('\nEvents by Country:');
    Object.entries(countryStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .forEach(([country, count]) => {
            console.log(`  ${country}: ${count}`);
        });

    console.log('\n✅ City-level re-enrichment complete!');
}

reEnrichWithCities().catch(console.error);
