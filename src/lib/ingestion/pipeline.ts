import { fetchAllFeeds } from '../rss/fetcher';
import { calculateGeopoliticsScore } from './scoring';
import { saveArticle } from '../db/articles';

export async function runIngestionPipeline() {
    console.log('[Pipeline] Starting ingestion...');

    let savedCount = 0;
    let highValueCount = 0;
    let totalFetched = 0;

    const articles = await fetchAllFeeds({
        maxArticlesPerFeed: 50,
        maxConcurrent: 50,
        onArticles: (batch) => {
            totalFetched += batch.length;
            for (const article of batch) {
                const score = calculateGeopoliticsScore(article);

                // Using source domain as proxy or empty string for now.
                // In future fetcher should return { article, feedUrl }
                saveArticle(article, score, article.source);

                if (score >= 60) highValueCount++;
                savedCount++;
            }
            if (savedCount % 100 <= 50) { // Log occasionally
                process.stdout.write(`\r[Pipeline] Saved ${savedCount} articles (High Value: ${highValueCount})...`);
            }
        }
    });

    console.log(`\n[Pipeline] Ingestion complete.`);
    console.log(`   - Total Fetched: ${totalFetched}`);
    console.log(`   - Saved: ${savedCount}`);
    console.log(`   - High Value (>60): ${highValueCount}`);

    return { savedCount, highValueCount };
}
