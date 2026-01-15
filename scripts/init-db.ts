import { initDatabase } from '../src/lib/db/index';

try {
    initDatabase();
    console.log('✅ Database initialization complete.');
} catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
}
