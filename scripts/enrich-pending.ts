/**
 * Enrich Pending Articles
 * 
 * Enriches articles that are already in the DB but missing enrichment data.
 * Useful for running in parallel with ingestion or for re-processing.
 */

import { db } from '../src/lib/db/index';
import { enrichArticleLocation } from '../src/lib/geo/multi-layer-enrichment';
import { translateToDanish, isLibreTranslateAvailable } from '../src/lib/translation/libretranslate';

async function enrichPending() {
    console.log('[Enrich Pending] Starting enrichment of pending articles...');

    const translationAvailable = await isLibreTranslateAvailable();
    console.log(`  Translation available: ${translationAvailable}`);

    // Get high score articles that haven't been enriched yet
    const pendingArticles = db.prepare(`
        SELECT * FROM rss_articles 
        WHERE geopolitics_score >= 30 
        AND location_source IS NULL
        ORDER BY published_at DESC
        LIMIT 50
    `).all() as any[];

    console.log(`  Found ${pendingArticles.length} pending articles to enrich.`);

    let enrichedCount = 0;

    for (const article of pendingArticles) {
        try {
            console.log(`\nProcessing: ${article.title}`);
            const enrichment = await enrichArticleLocation(article.title, article.url);

            if (enrichment) {
                // Update enrichment data
                db.prepare(`
                    UPDATE rss_articles 
                    SET article_content = ?,
                        quotes = ?,
                        content_fetched_at = ?,
                        location_confidence = ?,
                        location_source = ?,
                        image_url = ?,
                        lat = ?,
                        lon = ?,
                        location_label = ?
                    WHERE url = ?
                `).run(
                    enrichment.article_content,
                    JSON.stringify(enrichment.quotes),
                    enrichment.content_fetched_at,
                    enrichment.location_confidence,
                    enrichment.location_source,
                    enrichment.imageUrl,
                    enrichment.lat,
                    enrichment.lon,
                    enrichment.location_label,
                    article.url
                );

                enrichedCount++;
                console.log(`  ✅ Enriched (Location: ${enrichment.location_label})`);
            }

            // Translate title if needed
            if (translationAvailable && !article.danish_title) {
                try {
                    const danishTitle = await translateToDanish(article.title);
                    db.prepare('UPDATE rss_articles SET danish_title = ? WHERE url = ?')
                        .run(danishTitle, article.url);
                    console.log(`  ✅ Translated title`);
                } catch (e: any) {
                    console.log(`  ⚠️ Translation failed: ${e.message}`);
                }
            }

            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error: any) {
            console.error(`  ❌ Error: ${error.message}`);
        }
    }

    console.log(`\n✅ Finished enriching ${enrichedCount} articles.`);
}

enrichPending().catch(console.error);
