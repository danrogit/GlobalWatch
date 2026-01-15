/**
 * Re-enrich all events with improved country detection
 * Updates events to have proper lat/lon based on country
 */

import { db } from '../src/lib/db/index';
import { extractCountryFromUrl } from '../src/lib/geo/location-extractor';

// Country capital coordinates
const COUNTRY_COORDS: Record<string, { lat: number; lon: number }> = {
    // Scandinavia
    'Denmark': { lat: 55.68, lon: 12.57 },
    'Sweden': { lat: 59.33, lon: 18.07 },
    'Norway': { lat: 59.91, lon: 10.75 },
    'Finland': { lat: 60.17, lon: 24.94 },

    // Major Powers
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

    // Europe
    'Netherlands': { lat: 52.37, lon: 4.89 },
    'Belgium': { lat: 50.85, lon: 4.35 },
    'Austria': { lat: 48.21, lon: 16.37 },
    'Switzerland': { lat: 46.95, lon: 7.45 },
    'Poland': { lat: 52.23, lon: 21.01 },
    'Ukraine': { lat: 50.45, lon: 30.52 },
    'Spain': { lat: 40.42, lon: -3.7 },
    'Italy': { lat: 41.9, lon: 12.5 },
    'Portugal': { lat: 38.72, lon: -9.14 },
    'Greece': { lat: 37.98, lon: 23.73 },
    'Ireland': { lat: 53.35, lon: -6.26 },
    'Turkey': { lat: 39.93, lon: 32.85 },

    // Middle East
    'Israel': { lat: 31.78, lon: 35.21 },
    'Iran': { lat: 35.69, lon: 51.39 },
    'Saudi Arabia': { lat: 24.69, lon: 46.72 },
    'UAE': { lat: 25.28, lon: 55.3 },
    'Qatar': { lat: 25.27, lon: 51.53 },
    'Egypt': { lat: 30.04, lon: 31.24 },

    // Asia
    'South Korea': { lat: 37.57, lon: 126.98 },
    'Taiwan': { lat: 25.03, lon: 121.57 },
    'Hong Kong': { lat: 22.32, lon: 114.17 },
    'Thailand': { lat: 13.76, lon: 100.5 },
    'Vietnam': { lat: 21.03, lon: 105.85 },
    'Indonesia': { lat: -6.21, lon: 106.85 },
    'Malaysia': { lat: 3.14, lon: 101.69 },
    'Singapore': { lat: 1.29, lon: 103.85 },
    'Philippines': { lat: 14.6, lon: 120.98 },
    'Pakistan': { lat: 33.69, lon: 73.07 },

    // Americas
    'Canada': { lat: 45.42, lon: -75.7 },
    'Mexico': { lat: 19.43, lon: -99.13 },
    'Brazil': { lat: -15.79, lon: -47.88 },
    'Argentina': { lat: -34.6, lon: -58.38 },
    'Colombia': { lat: 4.71, lon: -74.07 },
    'Chile': { lat: -33.45, lon: -70.67 },
    'Venezuela': { lat: 10.49, lon: -66.88 },

    // Oceania
    'Australia': { lat: -33.87, lon: 151.21 },
    'New Zealand': { lat: -41.29, lon: 174.78 },

    // Africa
    'South Africa': { lat: -25.75, lon: 28.19 },
    'Nigeria': { lat: 9.08, lon: 7.4 },
    'Kenya': { lat: -1.29, lon: 36.82 },
    'Africa': { lat: 0, lon: 20 },
};

async function reEnrichEvents() {
    console.log('[Re-Enrich] Starting event re-enrichment with improved country detection...');

    // Get all events
    const events = db.prepare('SELECT event_id, title, json_data FROM geo_events').all() as any[];
    console.log(`[Re-Enrich] Processing ${events.length} events...`);

    let updated = 0;
    const countryStats: Record<string, number> = {};

    for (const event of events) {
        try {
            const data = JSON.parse(event.json_data || '{}');
            const feedUrl = data.sourceUrl || data.source_url || '';

            // Try to detect country from feed URL
            let country = extractCountryFromUrl(feedUrl);

            // If still no country, use the existing one if not Ukendt
            if (!country && data.country && data.country !== 'Ukendt') {
                country = data.country;
            }

            // Default to Denmark if we can't detect (since most feeds are Danish)
            if (!country) {
                country = 'Denmark';
            }

            // Get coordinates
            const coords = COUNTRY_COORDS[country] || COUNTRY_COORDS['Denmark'];

            // Add some jitter to avoid all events at exact same spot
            const jitter = () => (Math.random() - 0.5) * 2; // +/- 1 degree
            const lat = coords.lat + jitter();
            const lon = coords.lon + jitter();

            // Update json_data
            data.country = country;
            data.lat = lat;
            data.lon = lon;

            db.prepare('UPDATE geo_events SET json_data = ? WHERE event_id = ?')
                .run(JSON.stringify(data), event.event_id);

            updated++;
            countryStats[country] = (countryStats[country] || 0) + 1;

        } catch (err) {
            console.error(`[Re-Enrich] Error processing event ${event.event_id}:`, err);
        }
    }

    console.log(`\n[Re-Enrich] Updated ${updated} events`);
    console.log('\nEvents by Country:');
    Object.entries(countryStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .forEach(([country, count]) => {
            console.log(`  ${country}: ${count}`);
        });

    console.log('\n✅ Re-enrichment complete!');
}

reEnrichEvents().catch(console.error);
