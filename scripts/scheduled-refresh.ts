import { runIngestionPipeline } from '../src/lib/ingestion/pipeline';
import { generateEventsFromArticles } from '../src/lib/ingestion/event-generator';
import { deleteOldEvents } from '../src/lib/db/events';
import { initDatabase } from '../src/lib/db/index';

const REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

async function runScheduledRefresh() {
    console.log('='.repeat(60));
    console.log(`[Scheduler] Starting refresh at ${new Date().toISOString()}`);

    try {
        // 1. Cleanup old events (7-day retention)
        deleteOldEvents(7);

        // 2. Ingest new articles
        await runIngestionPipeline();

        // 3. Generate/update events from high-value articles
        generateEventsFromArticles();

        console.log('[Scheduler] Refresh complete.');
    } catch (error) {
        console.error('[Scheduler] Refresh failed:', error);
    }

    console.log(`[Scheduler] Next refresh in ${REFRESH_INTERVAL_MS / 60000} minutes.`);
    console.log('='.repeat(60));
}

// Initialize DB schema
initDatabase();

// Run immediately on start
runScheduledRefresh();

// Schedule recurring refresh
setInterval(runScheduledRefresh, REFRESH_INTERVAL_MS);

console.log('[Scheduler] Started. Press Ctrl+C to stop.');
