/**
 * Enhanced Ingestion Pipeline with Multi-Layer Enrichment
 * 
 * Includes:
 * - Multi-layer location extraction (5 layers)
 * - LibreTranslate for Danish translation
 * - Quote extraction
 * - Image/video extraction
 */

import { fetchAllFeeds } from '../rss/fetcher';
import { calculateGeopoliticsScore } from './scoring';
import { db } from '../db/index';
import { enrichArticleLocation } from '../geo/multi-layer-enrichment';
import { translateToDanish, isLibreTranslateAvailable } from '../translation/libretranslate';

export interface EnhancedPipelineOptions {
    maxArticlesPerFeed?: number;
    maxConcurrent?: number;
    enableEnrichment?: boolean; // Enable multi-layer location extraction
    enableTranslation?: boolean; // Enable LibreTranslate
    enrichmentBatchSize?: number; // How many articles to enrich at once
    enrichmentDelay?: number; // Delay between enrichments (ms)
}

export async function runEnhancedIngestionPipeline(options: EnhancedPipelineOptions = {}) {
    const {
        maxArticlesPerFeed = 50,
        maxConcurrent = 50,
        enableEnrichment = true,
        enableTranslation = true,
        enrichmentBatchSize = 10,
        enrichmentDelay = 1000,
    } = options;

    console.log('[Enhanced Pipeline] Starting ingestion...');
    console.log(`  Enrichment: ${enableEnrichment ? '✅' : '❌'}`);
    console.log(`  Translation: ${enableTranslation ? '✅' : '❌'}`);

    // Check LibreTranslate availability
    let translationAvailable = false;
    if (enableTranslation) {
        translationAvailable = await isLibreTranslateAvailable();
        console.log(`  LibreTranslate: ${translationAvailable ? '✅ Available' : '❌ Not available'}`);
    }

    let savedCount = 0;
    let enrichedCount = 0;
    let translatedCount = 0;
    let totalFetched = 0;
    const articlesToEnrich: any[] = [];

    // Step 1: Fetch and score articles
    console.log('\n[Step 1/3] Fetching articles from RSS feeds...');
    await fetchAllFeeds({
        maxArticlesPerFeed,
        maxConcurrent,
        onArticles: (batch) => {
            totalFetched += batch.length;

            for (const article of batch) {
                const score = calculateGeopoliticsScore(article);

                // Save to database
                try {
                    db.prepare(`
                        INSERT OR IGNORE INTO rss_articles (
                            url, title, description, published_at, 
                            geopolitics_score, source_domain
                        ) VALUES (?, ?, ?, ?, ?, ?)
                    `).run(
                        article.url,
                        article.title,
                        article.description || '',
                        article.pubDate ? new Date(article.pubDate).toISOString() : new Date().toISOString(),
                        score,
                        article.source || 'unknown'
                    );

                    savedCount++;

                    // Queue for enrichment if score is high enough
                    if (enableEnrichment && score >= 30) {
                        articlesToEnrich.push(article);
                    }
                } catch (error: any) {
                    // Ignore duplicates
                    if (!error.message.includes('UNIQUE')) {
                        console.error(`Error saving article: ${error.message}`);
                    }
                }
            }

            if (savedCount % 100 === 0) {
                process.stdout.write(`\r  Saved ${savedCount} articles (${articlesToEnrich.length} queued for enrichment)...`);
            }
        }
    });

    console.log(`\n  ✅ Fetched ${totalFetched} articles, saved ${savedCount}`);

    // Step 2: Enrich articles with multi-layer location extraction
    if (enableEnrichment && articlesToEnrich.length > 0) {
        console.log(`\n[Step 2/3] Enriching ${articlesToEnrich.length} articles with multi-layer location extraction...`);

        for (let i = 0; i < articlesToEnrich.length; i += enrichmentBatchSize) {
            const batch = articlesToEnrich.slice(i, i + enrichmentBatchSize);

            for (const article of batch) {
                try {
                    const enrichment = await enrichArticleLocation(
                        article.title,
                        article.url
                    );

                    if (enrichment) {
                        // Update article with enrichment data
                        db.prepare(`
                            UPDATE rss_articles 
                            SET article_content = ?,
                                quotes = ?,
                                content_fetched_at = ?,
                                location_confidence = ?,
                                location_source = ?,
                                image_url = ?
                            WHERE url = ?
                        `).run(
                            enrichment.article_content,
                            JSON.stringify(enrichment.quotes),
                            enrichment.content_fetched_at,
                            enrichment.location_confidence,
                            enrichment.location_source,
                            enrichment.imageUrl,
                            article.url
                        );

                        enrichedCount++;

                        if (enrichedCount % 5 === 0) {
                            process.stdout.write(`\r  Enriched ${enrichedCount}/${articlesToEnrich.length} articles...`);
                        }
                    }

                    // Rate limiting
                    await new Promise(resolve => setTimeout(resolve, enrichmentDelay));

                } catch (error: any) {
                    console.error(`\n  Error enriching ${article.url}: ${error.message}`);
                }
            }
        }

        console.log(`\n  ✅ Enriched ${enrichedCount} articles`);
    }

    // Step 3: Translate titles to Danish
    if (enableTranslation && translationAvailable) {
        console.log(`\n[Step 3/3] Translating titles to Danish...`);

        const articlesNeedingTranslation = db.prepare(`
            SELECT url, title FROM rss_articles 
            WHERE geopolitics_score >= 30 
            AND article_content IS NOT NULL
            LIMIT 100
        `).all() as any[];

        for (const article of articlesNeedingTranslation) {
            try {
                const danishTitle = await translateToDanish(article.title);

                db.prepare(`
                    UPDATE rss_articles 
                    SET danish_title = ?
                    WHERE url = ?
                `).run(danishTitle, article.url);

                translatedCount++;

                if (translatedCount % 10 === 0) {
                    process.stdout.write(`\r  Translated ${translatedCount}/${articlesNeedingTranslation.length} titles...`);
                }

                // Rate limiting for LibreTranslate
                await new Promise(resolve => setTimeout(resolve, 200));

            } catch (error: any) {
                console.error(`\n  Translation error: ${error.message}`);
            }
        }

        console.log(`\n  ✅ Translated ${translatedCount} titles`);
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 INGESTION SUMMARY');
    console.log('='.repeat(60));
    console.log(`  Total Fetched: ${totalFetched}`);
    console.log(`  Saved to DB: ${savedCount}`);
    console.log(`  Enriched (location + quotes): ${enrichedCount}`);
    console.log(`  Translated to Danish: ${translatedCount}`);
    console.log('='.repeat(60));

    return { savedCount, enrichedCount, translatedCount };
}
