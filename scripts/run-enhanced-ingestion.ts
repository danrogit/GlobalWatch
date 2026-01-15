/**
 * Run Enhanced Ingestion Pipeline
 * 
 * Includes multi-layer location extraction, translation, and quote extraction
 */

import { runEnhancedIngestionPipeline } from '../src/lib/ingestion/enhanced-pipeline';

(async () => {
    try {
        console.log('🚀 Starting Enhanced Ingestion Pipeline\n');

        await runEnhancedIngestionPipeline({
            maxArticlesPerFeed: 20, // Limit for testing
            maxConcurrent: 10,
            enableEnrichment: true,
            enableTranslation: true,
            enrichmentBatchSize: 5,
            enrichmentDelay: 1500, // 1.5s between enrichments
        });

        console.log('\n✅ Pipeline complete!');
        process.exit(0);

    } catch (error: any) {
        console.error('\n❌ Pipeline failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
})();
