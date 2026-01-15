
import { db } from '../src/lib/db/index';

console.log('[Migration] Adding lat/lon fields to rss_articles...');

try {
    db.prepare('ALTER TABLE rss_articles ADD COLUMN lat REAL').run();
    console.log('✅ Added lat column');
} catch (e: any) {
    if (e.message.includes('duplicate column')) {
        console.log('ℹ️ lat column already exists');
    } else {
        console.error('❌ Error adding lat:', e.message);
    }
}

try {
    db.prepare('ALTER TABLE rss_articles ADD COLUMN lon REAL').run();
    console.log('✅ Added lon column');
} catch (e: any) {
    if (e.message.includes('duplicate column')) {
        console.log('ℹ️ lon column already exists');
    } else {
        console.error('❌ Error adding lon:', e.message);
    }
}

try {
    db.prepare('ALTER TABLE rss_articles ADD COLUMN location_label TEXT').run();
    console.log('✅ Added location_label column');
} catch (e: any) {
    if (e.message.includes('duplicate column')) {
        console.log('ℹ️ location_label column already exists');
    } else {
        console.error('❌ Error adding location_label:', e.message);
    }
}

console.log('\n✅ Migration complete!');
