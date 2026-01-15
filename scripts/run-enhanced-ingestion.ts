/**
 * Run Enhanced Ingestion Pipeline
 * 
 * Includes multi-layer location extraction, translation, and quote extraction
 */

import { db } from '../src/lib/db/index';
import { runEnhancedIngestionPipeline } from '../src/lib/ingestion/enhanced-pipeline';

(async () => {
    try {
        console.log('🚀 Starting Enhanced Ingestion Pipeline\n');

        // Run pipeline - FULL PRODUCTION MODE
        await runEnhancedIngestionPipeline({
            maxArticlesPerFeed: 500, // Get everything available
            maxConcurrent: 100, // High concurrency for speed
            enableEnrichment: true,
            enableTranslation: true,
            enrichmentBatchSize: 50, // Process more at once
            enrichmentDelay: 500 // Faster processing
        });

        console.log('\n✅ Manual run complete.');
        process.exit(0);

    } catch (error: any) {
        console.error('\n❌ Pipeline failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
})();
