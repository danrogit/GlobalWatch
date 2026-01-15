
import { db } from '../src/lib/db/index';

const rows = db.prepare(`
    SELECT title, location_source, lat, lon 
    FROM rss_articles 
    WHERE location_source IS NOT NULL 
    LIMIT 10
`).all();

console.log(`Articles with location_source: ${rows.length}`);
if (rows.length > 0) {
    console.log(rows[0]);
}

const count = db.prepare(`
    SELECT count(*) as count 
    FROM rss_articles 
    WHERE location_source IS NOT NULL AND lat IS NOT NULL AND lon IS NOT NULL
`).get() as any;

console.log(`Total enriched articles: ${count.count}`);
