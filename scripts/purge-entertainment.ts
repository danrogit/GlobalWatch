/**
 * Purge entertainment content from database
 * Removes events with entertainment keywords in title
 */

import { db } from '../src/lib/db/index';

const ENTERTAINMENT_PATTERNS = [
    '%cat%', '%cats%', '%dog%', '%dogs%', '%puppy%', '%kitten%',
    '%cute%', '%adorable%', '%fluffy%', '%funny%', '%hilarious%',
    '%meme%', '%memes%', '%celebrity%', '%hollywood%',
    '%movie%', '%film%', '%netflix%', '%music%', '%concert%',
    '%recipe%', '%cooking%', '%food%', '%restaurant%',
    '%fashion%', '%beauty%', '%makeup%', '%skincare%',
    '%horoscope%', '%zodiac%', '%astrology%',
    '%dating%', '%relationship%', '%wedding%',
    '%game%', '%gaming%', '%esports%',
    '%sport%', '%football%', '%soccer%', '%basketball%', '%cricket%', '%ashes%',
    '%premier league%', '%champions league%', '%world cup%', '%olympics%',
    '%cheezburger%', '%boredpanda%', '%buzzfeed%', '%9gag%',
    '%feline%', '%whisker%', '%purrfect%', '%meow%',
];

async function purgeEntertainment() {
    console.log('[Purge] Starting entertainment content removal...');

    let totalDeleted = 0;

    for (const pattern of ENTERTAINMENT_PATTERNS) {
        try {
            const result = db.prepare(`
                DELETE FROM geo_events 
                WHERE LOWER(title) LIKE ?
            `).run(pattern);

            if (result.changes > 0) {
                console.log(`  Deleted ${result.changes} events matching "${pattern}"`);
                totalDeleted += result.changes;
            }
        } catch (err) {
            // Continue on error
        }
    }

    // Also delete from rss_articles
    for (const pattern of ENTERTAINMENT_PATTERNS) {
        try {
            const result = db.prepare(`
                DELETE FROM rss_articles 
                WHERE LOWER(title) LIKE ?
            `).run(pattern);

            if (result.changes > 0) {
                console.log(`  Deleted ${result.changes} articles matching "${pattern}"`);
            }
        } catch (err) {
            // Continue on error
        }
    }

    console.log(`\n✅ Purge complete. Removed ${totalDeleted} entertainment events.`);

    // Get remaining count
    const remainingEvents = db.prepare('SELECT COUNT(*) as count FROM geo_events').get() as { count: number };
    const remainingArticles = db.prepare('SELECT COUNT(*) as count FROM rss_articles').get() as { count: number };

    console.log(`Remaining: ${remainingEvents.count} events, ${remainingArticles.count} articles`);
}

purgeEntertainment().catch(console.error);
