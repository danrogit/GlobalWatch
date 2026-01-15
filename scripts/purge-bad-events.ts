
import { db } from '../src/lib/db/index';

console.log('[Purge] Analyzing event quality...');

// Count before
const before = db.prepare('SELECT count(*) as count FROM geo_events').get() as { count: number };

// Delete events that don't have a specific location source (i.e. fallbacks)
// We look for the presence of "locationSource" and ensure it's NOT just the generic country fallback implies
// strict match on key sources
const result = db.prepare(`
    DELETE FROM geo_events 
    WHERE json_data NOT LIKE '%"locationSource":"ner"%' 
    AND json_data NOT LIKE '%"locationSource":"rss-geo"%'
    AND json_data NOT LIKE '%"locationSource":"event-logic"%'
    AND json_data NOT LIKE '%"locationSource":"city-match"%'
`).run();

// Count after
const after = db.prepare('SELECT count(*) as count FROM geo_events').get() as { count: number };

console.log(`[Purge] Deleted ${result.changes} low-quality events.`);
console.log(`[Purge] Remaining events: ${after.count}`);
