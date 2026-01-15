/**
 * Database Cleanup Utilities
 * 
 * Enforces data retention policies:
 * - Hard delete data older than 90 days
 */

import { db } from './index';

export function deleteOldArticles(retentionDays = 90) {
    console.log(`[Cleanup] Deleting data older than ${retentionDays} days...`);

    try {
        // 1. Delete old RSS articles
        const resultArticles = db.prepare(`
            DELETE FROM rss_articles 
            WHERE date(published_at) < date('now', '-' || ? || ' days')
        `).run(retentionDays);

        // 2. Delete old Events
        const resultEvents = db.prepare(`
            DELETE FROM geo_events 
            WHERE date(event_date) < date('now', '-' || ? || ' days')
        `).run(retentionDays);

        console.log(`  ✅ Deleted ${resultArticles.changes} old articles`);
        console.log(`  ✅ Deleted ${resultEvents.changes} old events`);

        return {
            deletedArticles: resultArticles.changes,
            deletedEvents: resultEvents.changes
        };

    } catch (error: any) {
        console.error(`[Cleanup] Failed to delete old data: ${error.message}`);
        return { deletedArticles: 0, deletedEvents: 0 };
    }
}
