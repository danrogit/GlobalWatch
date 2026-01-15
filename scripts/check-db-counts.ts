import { db } from '../src/lib/db/index';

try {
    const counts = db.prepare('SELECT count(*) as count FROM geo_events').get() as { count: number };
    console.log(`Total Events: ${counts.count}`);

    // Check slug validity
    const eventsWithSlug = db.prepare('SELECT count(*) as count FROM geo_events WHERE json_data LIKE ?').get('%"slug":"%') as { count: number };
    console.log(`Events with valid slug: ${eventsWithSlug?.count || 0}`);

    // Sample events
    const sample = db.prepare(`SELECT json_data FROM geo_events LIMIT 3`).all() as any[];
    console.log('\nSample Events:');
    for (const row of sample) {
        const event = JSON.parse(row.json_data);
        console.log(`  - Slug: ${event.slug}`);
        console.log(`    Title: ${event.title?.substring(0, 60)}...`);
        console.log(`    Sources: ${event.sources?.join(', ') || 'N/A'}`);
        console.log(`    Articles: ${event.articles?.length || 0}`);
        console.log('');
    }

} catch (err) {
    console.error('DB Check Failed:', err);
}
