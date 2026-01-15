/**
 * Database Migration: Add Image URL Field
 * 
 * Adds image_url field to rss_articles table for storing extracted images
 */

import { db } from '../src/lib/db/index';

console.log('[Migration] Adding image_url field...');

try {
    const tableInfo = db.prepare("PRAGMA table_info(rss_articles)").all() as any[];
    const existingColumns = new Set(tableInfo.map((col: any) => col.name));

    if (!existingColumns.has('image_url')) {
        db.prepare('ALTER TABLE rss_articles ADD COLUMN image_url TEXT').run();
        console.log('✅ Added image_url column');
    } else {
        console.log('⏭️  image_url column already exists');
    }

    console.log('\n✅ Migration complete!');

} catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
}
