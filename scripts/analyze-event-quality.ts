
import { db } from '../src/lib/db/index';

const allEvents = db.prepare('SELECT count(*) as count FROM geo_events').get() as { count: number };

const enrichedEvents = db.prepare(`
    SELECT count(*) as count 
    FROM geo_events 
    WHERE json_data LIKE '%"locationSource":"ner"%' 
    OR json_data LIKE '%"locationSource":"rss-geo"%'
    OR json_data LIKE '%"locationSource":"event-logic"%'
    OR json_data LIKE '%"locationSource":"city-match"%'
`).get() as { count: number };

const fallbackEvents = db.prepare(`
    SELECT count(*) as count 
    FROM geo_events 
    WHERE json_data NOT LIKE '%"locationSource":"ner"%' 
    AND json_data NOT LIKE '%"locationSource":"rss-geo"%'
    AND json_data NOT LIKE '%"locationSource":"event-logic"%'
    AND json_data NOT LIKE '%"locationSource":"city-match"%'
`).get() as { count: number };


console.log(`Total Events: ${allEvents.count}`);
console.log(`High Quality (Enriched): ${enrichedEvents.count}`);
console.log(`Low Quality (Fallback/Unknown): ${fallbackEvents.count}`);

// Sample a few low quality ones to check their attributes
const sampleBad = db.prepare(`
    SELECT title, json_data 
    FROM geo_events 
    WHERE json_data NOT LIKE '%"locationSource":"ner"%' 
    AND json_data NOT LIKE '%"locationSource":"rss-geo"%'
    AND json_data NOT LIKE '%"locationSource":"event-logic"%'
    AND json_data NOT LIKE '%"locationSource":"city-match"%'
    LIMIT 5
`).all() as any[];

console.log('Sample Low Quality Events:');
sampleBad.forEach(e => console.log(`- ${e.title}`));
