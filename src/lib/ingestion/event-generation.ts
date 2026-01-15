/**
 * Event Generation from Enriched Articles
 * 
 * Converts enriched articles into geo_events for the map
 */

import { db } from '../db/index';

/**
 * Generate events from enriched articles
 */
export async function generateEventsFromEnrichedArticles(): Promise<void> {
    console.log('[Event Generation] Starting...');

    try {
        // Get enriched articles that don't have events yet
        const articles = db.prepare(`
            SELECT e.*, r.danish_title 
            FROM enriched_articles e
            LEFT JOIN rss_articles r ON e.url = r.url
            WHERE e.event_generated IS NULL OR e.event_generated = 0
            ORDER BY e.published_at DESC 
            LIMIT 100
        `).all() as any[];

        console.log(`[Event Generation] Found ${articles.length} articles to process`);

        let created = 0;
        let skipped = 0;

        const insertEvent = db.prepare(`
            INSERT INTO geo_events (
                event_id, title, summary, category, subcategory, countries,
                event_date, detected_at, source_count, verification_status,
                confidence_score, json_data, normalized_title
            ) VALUES (
                @event_id, @title, @summary, @category, @subcategory, @countries,
                @event_date, @detected_at, @source_count, @verification_status,
                @confidence_score, @json_data, @normalized_title
            )
        `);

        const markProcessed = db.prepare(`
            UPDATE enriched_articles 
            SET event_generated = 1 
            WHERE id = ?
        `);

        for (const article of articles) {
            try {
                // Skip if no valid location
                if (!article.lat || !article.lon) {
                    console.log(`[Event Generation] Skipping article ${article.id} - no location`);
                    skipped++;
                    continue;
                }

                // Use Danish title if available, otherwise fallback to original
                const displayTitle = article.danish_title || article.title;

                // Create event JSON
                const normalizedTitle = displayTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

                const eventData = {
                    id: article.id,
                    title: displayTitle,
                    description: article.description || '',
                    lat: article.lat,
                    lon: article.lon,
                    location: article.location_label || 'Unknown',
                    confidence: article.location_confidence || 0.5,
                    category: article.event_type || 'other',
                    timestamp: article.published_at,
                    sources: [{
                        name: article.feed_name || 'Unknown',
                        url: article.url,
                    }],
                    imageUrl: article.image_url,
                    quotes: article.quotes ? JSON.parse(article.quotes) : [],
                    content: article.article_content,
                    slug: normalizedTitle,
                };

                // Insert event
                insertEvent.run({
                    event_id: article.id,
                    title: displayTitle,
                    summary: article.description || '',
                    category: article.event_type || 'other',
                    subcategory: '',
                    countries: JSON.stringify([]),
                    event_date: article.published_at,
                    detected_at: new Date().toISOString(),
                    source_count: 1,
                    verification_status: 'reported',
                    confidence_score: article.location_confidence || 0.5,
                    json_data: JSON.stringify(eventData),
                    normalized_title: normalizedTitle,
                });

                // Mark as processed
                markProcessed.run(article.id);

                created++;
            } catch (error: any) {
                console.error(`[Event Generation] Failed to create event for article ${article.id}:`, error.message);
                skipped++;
            }
        }

        console.log(`[Event Generation] Complete: ${created} created, ${skipped} skipped`);
    } catch (error: any) {
        console.error('[Event Generation] Error:', error.message);
        throw error;
    }
}
