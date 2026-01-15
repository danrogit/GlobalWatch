import { runIngestionPipeline } from '../src/lib/ingestion/pipeline';

(async () => {
    try {
        await runIngestionPipeline();
    } catch (error) {
        console.error('Ingestion failed:', error);
        process.exit(1);
    }
})();
