import { enrichHighValueArticles } from '../src/lib/ingestion/enrichment';

(async () => {
    try {
        await enrichHighValueArticles({ maxArticles: 50, delayMs: 300 });
        console.log('✅ Enrichment complete.');
    } catch (error) {
        console.error('❌ Enrichment failed:', error);
        process.exit(1);
    }
})();
