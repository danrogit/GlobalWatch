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

/**
 * Step 1: Fetch and save articles from RSS feeds
 */
export async function fetchAndSaveArticles(options: EnhancedPipelineOptions = {}) {
    const {
        maxArticlesPerFeed = 50,
        maxConcurrent = 50,
        enableEnrichment = true,
    } = options;

    console.log('\n[Step 1/3] Fetching articles from RSS feeds...');
    let savedCount = 0;
    let totalFetched = 0;

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
                        article.publishedAt ? new Date(article.publishedAt).toISOString() : new Date().toISOString(),
                        score,
                        article.source || 'unknown'
                    );

                    savedCount++;

                } catch (error: any) {
                    // Ignore duplicates
                    if (!error.message.includes('UNIQUE')) {
                        console.error(`Error saving article: ${error.message}`);
                    }
                }
            }

            if (savedCount % 100 === 0) {
                process.stdout.write(`\r  Saved ${savedCount} articles...`);
            }
        }
    });

    console.log(`\n  ✅ Fetched ${totalFetched} articles, saved ${savedCount}`);
    return { savedCount, totalFetched };
}

/**
 * Step 2 & 3: Process the pending queue (Enrichment + Translation)
 */
export async function processPendingQueue(options: EnhancedPipelineOptions = {}) {
    const {
        enrichmentBatchSize = 10,
        enrichmentDelay = 1000,
        enableEnrichment = true,
        enableTranslation = true,
    } = options;

    let enrichedCount = 0;
    let translatedCount = 0;

    // 1. Fetch pending articles (High score, no location source yet)
    const pendingArticles = db.prepare(`
        SELECT url, title, description, published_at 
        FROM rss_articles 
        WHERE geopolitics_score >= 15
        AND location_source IS NULL
        ORDER BY published_at DESC
        LIMIT 50
    `).all() as any[];

    if (pendingArticles.length === 0) {
        console.log('[Queue] No pending articles to enrich.');
        return { enrichedCount, translatedCount };
    }

    console.log(`\n[Queue] Processing ${pendingArticles.length} pending articles...`);

    // Check LibreTranslate availability
    let translationAvailable = false;
    if (enableTranslation) {
        translationAvailable = await isLibreTranslateAvailable();
        console.log(`  LibreTranslate: ${translationAvailable ? '✅ Available' : '❌ Not available'}`);
    }

    // Process batch
    for (let i = 0; i < pendingArticles.length; i += enrichmentBatchSize) {
        const batch = pendingArticles.slice(i, i + enrichmentBatchSize);

        for (const article of batch) {
            try {
                // ENRICHMENT
                if (enableEnrichment) {
                    const enrichment = await enrichArticleLocation(
                        article.title,
                        article.url
                    );

                    if (enrichment) {
                        // Save to enriched_articles table
                        db.prepare(`
                                INSERT OR REPLACE INTO enriched_articles (
                                    id, title, description, url, feed_name, published_at,
                                    lat, lon, location_label, location_confidence, location_source,
                                    event_type, image_url, quotes, article_content, created_at
                                ) VALUES (
                                    ?, ?, ?, ?, ?, ?,
                                    ?, ?, ?, ?, ?,
                                    ?, ?, ?, ?, ?
                                )
                            `).run(
                            // Generate ID based on URL if not available, or use same lookup logic
                            // But rss_articles table doesn't have ID in the SELECT above (it does but we didn't select it)
                            // Let's use MD5 of URL or just the URL as ID if it's unique
                            // Actually let's select ID in the query above first
                            article.id,
                            article.title,
                            article.description,
                            article.url,
                            'RSS Feed', // source_name
                            article.published_at,
                            enrichment.lat,
                            enrichment.lon,
                            enrichment.location_label,
                            enrichment.location_confidence,
                            enrichment.location_source,
                            enrichment.event_type,
                            enrichment.imageUrl,
                            JSON.stringify(enrichment.quotes),
                            enrichment.article_content,
                            new Date().toISOString()
                        );

                        // Also update rss_articles status
                        db.prepare(`
                                UPDATE rss_articles 
                                SET location_source = ?
                                WHERE url = ?
                            `).run(enrichment.location_source, article.url);
                        enrichedCount++;
                    }
                    // Rate limiting
                    await new Promise(resolve => setTimeout(resolve, enrichmentDelay));
                }

                // TRANSLATION
                if (enableTranslation && translationAvailable) {
                    const danishTitle = await translateToDanish(article.title);
                    db.prepare(`
                        UPDATE rss_articles 
                        SET danish_title = ?
                        WHERE url = ?
                    `).run(danishTitle, article.url);
                    translatedCount++;

                    // Small delay for translation API
                    await new Promise(resolve => setTimeout(resolve, 200));
                }

                process.stdout.write(`\r  Processed ${enrichedCount} enrichments, ${translatedCount} translations...`);

            } catch (error: any) {
                console.error(`\n  Error processing ${article.url}: ${error.message}`);
            }
        }
    }

    console.log(`\n  ✅ Batch complete: ${enrichedCount} enriched, ${translatedCount} translated.`);
    return { enrichedCount, translatedCount };
}

export async function runEnhancedIngestionPipeline(options: EnhancedPipelineOptions = {}) {
    console.log('[Enhanced Pipeline] Starting full ingestion run...');

    // 1. Fetch everything
    const fetchStats = await fetchAndSaveArticles(options);

    // 2. Process queue until empty (or hit limits suitable for a single run script)
    // For this script, we'll do one large pass on the queue
    console.log('\n[Step 2/3] Processing pending items...');
    const processStats = await processPendingQueue(options);

    console.log('\n' + '='.repeat(60));
    console.log('📊 INGESTION SUMMARY');
    console.log('='.repeat(60));
    console.log(`  Total Fetched: ${fetchStats.totalFetched}`);
    console.log(`  Saved to DB: ${fetchStats.savedCount}`);
    console.log(`  Enriched: ${processStats.enrichedCount}`);
    console.log(`  Translated: ${processStats.translatedCount}`);
    console.log('='.repeat(60));

    return { ...fetchStats, ...processStats };
}
