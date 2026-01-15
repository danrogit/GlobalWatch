import { db } from '../src/lib/db/index';

// Get counts
const articles = db.prepare('SELECT COUNT(*) as count FROM rss_articles').get() as { count: number };
const highValue = db.prepare('SELECT COUNT(*) as count FROM rss_articles WHERE geopolitics_score >= 60').get() as { count: number };
const events = db.prepare('SELECT COUNT(*) as count FROM geo_events').get() as { count: number };

console.log('='.repeat(50));
console.log('DATABASE STATUS');
console.log('='.repeat(50));
console.log('Total Articles:', articles.count);
console.log('High-Value (≥60):', highValue.count);
console.log('Events on Map:', events.count);

console.log('\nScore Distribution:');
const dist = db.prepare(`
    SELECT 
        CASE 
            WHEN geopolitics_score >= 80 THEN '80+'
            WHEN geopolitics_score >= 60 THEN '60-79'
            WHEN geopolitics_score >= 40 THEN '40-59'
            WHEN geopolitics_score >= 20 THEN '20-39'
            ELSE '0-19'
        END as score_range,
        COUNT(*) as count
    FROM rss_articles 
    GROUP BY 1 
    ORDER BY 1 DESC
`).all() as { score_range: string, count: number }[];

dist.forEach(r => console.log(`  ${r.score_range}: ${r.count}`));

console.log('\n' + '='.repeat(50));
console.log('WHY 321 EVENTS?');
console.log('='.repeat(50));
console.log(`
The pipeline flow:

1. Articles in DB: ${articles.count}
2. High-Value (≥60): ${highValue.count} ← Only these become events
3. Events created: ${events.count}

The discrepancy (${highValue.count} high-value → ${events.count} events) is because:
- Events from PREVIOUS runs are included
- Articles are GROUPED by normalized title
- Multiple articles about same topic = 1 event with multiple sources
`);
