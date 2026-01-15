/**
 * Cron Worker for GlobalWatch
 * 
 * Runs RSS ingestion pipeline every 15 minutes
 */

import { runEnhancedIngestionPipeline } from '../src/lib/ingestion/enhanced-pipeline';
import { generateEventsFromEnrichedArticles } from '../src/lib/ingestion/event-generation';
import { initDatabase } from '../src/lib/db/index';

const INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

async function runCronJob() {
    console.log('\n🔄 [Cron] Starting RSS ingestion...');

    try {
        // Run ingestion pipeline
        await runEnhancedIngestionPipeline({
            maxArticlesPerFeed: 50,
            maxConcurrent: 20,
            enableEnrichment: true,
            enableTranslation: true,
            enrichmentBatchSize: 10,
            enrichmentDelay: 1000,
        });

        // Generate events
        console.log('\n🗺️ [Cron] Generating events...');
        await generateEventsFromEnrichedArticles();

        console.log('✅ [Cron] Job completed successfully\n');
    } catch (error: any) {
        console.error('❌ [Cron] Job failed:', error.message);
        console.error(error.stack);
    }
}

// Run immediately on start
console.log('🚀 Starting Cron Worker...');
initDatabase(); // Ensure DB tables exist
runCronJob();

// Then run every 15 minutes
setInterval(runCronJob, INTERVAL_MS);

console.log(`⏰ Cron worker running (interval: ${INTERVAL_MS / 1000 / 60} minutes)`);
