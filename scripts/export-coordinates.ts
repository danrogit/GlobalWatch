import { db } from '../src/lib/db/index';
import * as fs from 'fs';
import * as path from 'path';

// Get all events with lat/lon
const events = db.prepare(`
    SELECT event_id, title, json_data 
    FROM geo_events
`).all() as any[];

console.log(`Total events in DB: ${events.length}`);

// Parse json_data to extract lat/lon
const coordinates: { lat: number; lon: number; title: string; country: string }[] = [];

events.forEach(event => {
    try {
        const data = JSON.parse(event.json_data || '{}');
        coordinates.push({
            lat: data.lat || 56.0,
            lon: data.lon || 10.0,
            title: data.title || event.title,
            country: data.country || 'Ukendt'
        });
    } catch (e) {
        console.error('Failed to parse event:', event.event_id);
    }
});

// Count unique lat/lon pairs
const uniqueCoords = new Set(coordinates.map(c => `${c.lat.toFixed(2)},${c.lon.toFixed(2)}`));
console.log(`Unique lat/lon pairs (2 decimal): ${uniqueCoords.size}`);

// Count coordinates by region
const regions: Record<string, number> = {};
coordinates.forEach(c => {
    let region = 'Unknown';
    if (c.lat >= 54 && c.lat <= 58 && c.lon >= 7 && c.lon <= 16) region = 'Denmark';
    else if (c.lat >= 35 && c.lat <= 71 && c.lon >= -10 && c.lon <= 40) region = 'Europe';
    else if (c.lat >= 24 && c.lat <= 50 && c.lon >= -125 && c.lon <= -66) region = 'USA';
    else if (c.lat >= -35 && c.lat <= 35 && c.lon >= -80 && c.lon <= -35) region = 'South America';
    else if (c.lat >= 0 && c.lat <= 55 && c.lon >= 60 && c.lon <= 180) region = 'Asia';
    else if (c.lat >= -45 && c.lat <= -10 && c.lon >= 110 && c.lon <= 155) region = 'Australia';
    else if (c.lat >= -35 && c.lat <= 35 && c.lon >= -20 && c.lon <= 55) region = 'Africa';

    regions[region] = (regions[region] || 0) + 1;
});

console.log('\nEvents by Region:');
Object.entries(regions).sort((a, b) => b[1] - a[1]).forEach(([region, count]) => {
    console.log(`  ${region}: ${count}`);
});

// Count events at default Denmark coordinates (56, 10)
const defaultCoords = coordinates.filter(c =>
    Math.abs(c.lat - 56.0) < 0.1 && Math.abs(c.lon - 10.0) < 0.1
);
console.log(`\n⚠️  Events at DEFAULT coords (56, 10): ${defaultCoords.length}`);

// Count "Ukendt" countries
const unknownCountry = coordinates.filter(c => c.country === 'Ukendt' || !c.country);
console.log(`Events with "Ukendt" country: ${unknownCountry.length}`);

// Export full list to CSV
const csvPath = path.join(process.cwd(), 'data', 'event-coordinates.csv');
const csvContent = 'lat,lon,country,title\n' +
    coordinates.map(c => `${c.lat},${c.lon},"${c.country}","${c.title?.replace(/"/g, '""').substring(0, 100)}"`).join('\n');
fs.writeFileSync(csvPath, csvContent);
console.log(`\n✅ Full coordinate list exported to: ${csvPath}`);
