/**
 * Cron Worker for GlobalWatch
 * 
 * Schedules regular ingestion and cleanup tasks.
 * 
 * Schedule:
 * - Every 15 minutes: Fetch new articles & Process pending queue
 * - Daily at 03:00: Cleanup old data > 90 days
 */

import cron from 'node-cron';
import { fetchAndSaveArticles, processPendingQueue } from '../src/lib/ingestion/enhanced-pipeline';
import { generateEventsFromEnrichedArticles } from '../src/lib/ingestion/event-generation';
import { deleteOldArticles } from '../src/lib/db/cleanup';
import { db } from '../src/lib/db/index';

console.log('⏰ Starting GlobalWatch Cron Worker...');
console.log('   Schedule: Ingestion every 15m (0,15,30,45), Cleanup daily at 03:00');

// Lock mechanism to prevent overlapping runs if a job takes > 15m
let isIngestionRunning = false;

// Task 1: Ingestion & Processing (Every 15 minutes)
cron.schedule('0,15,30,45 * * * *', async () => {
    if (isIngestionRunning) {
        console.log('⚠️ Previous ingestion job still running. Skipping this cycle.');
        return;
    }

    isIngestionRunning = true;
    console.log(`\n[Cron ${new Date().toISOString()}] Starting ingestion cycle...`);

    try {
        // 1. Fetch new articles from ALL 1,124 feeds
        await fetchAndSaveArticles({
            maxArticlesPerFeed: 500, // Get everything available
            maxConcurrent: 100, // High concurrency
            enableEnrichment: true
        });

        // 2. Process pending queue (Enrich + Translate)
        await processPendingQueue({
            enrichmentBatchSize: 50, // Process more at once
            enrichmentDelay: 500, // Faster processing
            enableEnrichment: true,
            enableTranslation: true
        });

        // 3. Generate events from enriched articles
        await generateEventsFromEnrichedArticles();

    } catch (error: any) {
        console.error('❌ Ingestion job failed:', error.message);
    } finally {
        isIngestionRunning = false;
        console.log(`[Cron] Cycle complete.`);
    }
});

// Task 2: Cleanup (Daily at 03:00)
cron.schedule('0 3 * * *', () => {
    console.log(`\n[Cron ${new Date().toISOString()}] Running daily cleanup...`);
    deleteOldArticles(90); // 90 days retention
});

// Keep process alive
process.stdin.resume();

// Initial run on startup (optional, helps verify it works immediately)
console.log('🚀 Triggering initial run...');
(async () => {
    if (!isIngestionRunning) {
        isIngestionRunning = true;
        try {
            await fetchAndSaveArticles({ maxArticlesPerFeed: 100, maxConcurrent: 100 });
            await processPendingQueue({ enrichmentBatchSize: 50, enrichmentDelay: 500 });
            await generateEventsFromEnrichedArticles();
        } catch (e) {
            console.error(e);
        } finally {
            isIngestionRunning = false;
        }
    }
})();
