/**
 * Database Migration: Add Source Domain Field
 * 
 * Adds source_domain field to rss_articles table
 */

import { db } from '../src/lib/db/index';

console.log('[Migration] Adding source_domain field...');

try {
    const tableInfo = db.prepare("PRAGMA table_info(rss_articles)").all() as any[];
    const existingColumns = new Set(tableInfo.map((col: any) => col.name));

    if (!existingColumns.has('source_domain')) {
        db.prepare('ALTER TABLE rss_articles ADD COLUMN source_domain TEXT').run();
        console.log('✅ Added source_domain column');
    } else {
        console.log('⏭️  source_domain column already exists');
    }

    // Also check for danish_title used in translation step
    if (!existingColumns.has('danish_title')) {
        db.prepare('ALTER TABLE rss_articles ADD COLUMN danish_title TEXT').run();
        console.log('✅ Added danish_title column');
    } else {
        console.log('⏭️  danish_title column already exists');
    }

    console.log('\n✅ Migration complete!');

} catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
}
