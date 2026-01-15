/**
 * Database Migration: Add Article Content and Quotes Fields
 * 
 * Adds fields needed for multi-layer location extraction:
 * - article_content: Full article text for NER
 * - quotes: Extracted quotes (JSON array)
 * - content_fetched_at: Timestamp of content fetch
 */

import { db } from '../src/lib/db/index';

console.log('[Migration] Adding article content and quotes fields...');

try {
    // Check if columns already exist
    const tableInfo = db.prepare("PRAGMA table_info(rss_articles)").all() as any[];
    const existingColumns = new Set(tableInfo.map((col: any) => col.name));

    if (!existingColumns.has('article_content')) {
        db.prepare('ALTER TABLE rss_articles ADD COLUMN article_content TEXT').run();
        console.log('✅ Added article_content column');
    } else {
        console.log('⏭️  article_content column already exists');
    }

    if (!existingColumns.has('quotes')) {
        db.prepare('ALTER TABLE rss_articles ADD COLUMN quotes TEXT').run();
        console.log('✅ Added quotes column');
    } else {
        console.log('⏭️  quotes column already exists');
    }

    if (!existingColumns.has('content_fetched_at')) {
        db.prepare('ALTER TABLE rss_articles ADD COLUMN content_fetched_at INTEGER').run();
        console.log('✅ Added content_fetched_at column');
    } else {
        console.log('⏭️  content_fetched_at column already exists');
    }

    // Also add location confidence fields for multi-layer extraction
    if (!existingColumns.has('location_confidence')) {
        db.prepare('ALTER TABLE rss_articles ADD COLUMN location_confidence REAL').run();
        console.log('✅ Added location_confidence column');
    } else {
        console.log('⏭️  location_confidence column already exists');
    }

    if (!existingColumns.has('location_source')) {
        db.prepare('ALTER TABLE rss_articles ADD COLUMN location_source TEXT').run();
        console.log('✅ Added location_source column (rss-geo, ner, event-logic, fallback)');
    } else {
        console.log('⏭️  location_source column already exists');
    }

    console.log('\n✅ Migration complete!');

} catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
}
