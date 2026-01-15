
import { db } from '../src/lib/db/index';

const rows = db.prepare(`
    SELECT json_data 
    FROM geo_events 
    LIMIT 5
`).all() as any[];

console.log('Checking for slugs in events:');
rows.forEach(row => {
    const data = JSON.parse(row.json_data);
    console.log(`- Slug: ${data.slug} (Title: ${data.title.substring(0, 30)}...)`);
});
