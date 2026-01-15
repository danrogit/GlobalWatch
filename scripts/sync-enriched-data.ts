/**
 * Sync Enriched Data to Events
 * 
 * Synchronizes enriched data from rss_articles to geo_events
 * - Lat/Lon from multi-layer enrichment
 * - Quotes
 * - Image URLs
 * - Danish translation
 * - Location confidence/source
 */

import { db } from '../src/lib/db/index';

async function syncEnrichedData() {
    console.log('[Sync] Starting synchronization of enriched data to events...');

    // Get enriched articles that have corresponding events
    // We join on url (assuming geo_events.json_data contains sourceUrl)
    // Note: This is an expensive operation, but fine for a script
    const events = db.prepare('SELECT event_id, json_data FROM geo_events').all() as any[];

    let updatedCount = 0;

    for (const event of events) {
        try {
            const data = JSON.parse(event.json_data || '{}');
            const url = data.sourceUrl || data.source_url;

            if (!url) continue;

            // Find corresponding enriched article
            const article = db.prepare(`
                SELECT * FROM rss_articles 
                WHERE url = ? 
                AND (location_source IS NOT NULL OR quotes IS NOT NULL OR danish_title IS NOT NULL OR image_url IS NOT NULL)
            `).get(url) as any;

            if (article) {
                let changed = false;

                // Sync Location
                if (article.lat && article.lon) {
                    data.lat = article.lat;
                    data.lon = article.lon;
                    data.locationLabel = article.location_label; // Assuming column exists or we add it to json
                    data.locationConfidence = article.location_confidence;
                    data.locationSource = article.location_source;
                    changed = true;
                }

                // Sync Quotes
                if (article.quotes) {
                    try {
                        data.quotes = JSON.parse(article.quotes);
                        changed = true;
                    } catch (e) {
                        // Ignore parse error
                    }
                }

                // Sync Image
                if (article.image_url) {
                    data.imageUrl = article.image_url;
                    changed = true;
                }

                // Sync Translation
                if (article.danish_title) {
                    data.danishTitle = article.danish_title;
                    changed = true;
                }

                if (changed) {
                    // Update event
                    db.prepare(`
                        UPDATE geo_events 
                        SET json_data = ?,
                            lat = ?,
                            lon = ?
                        WHERE event_id = ?
                    `).run(
                        JSON.stringify(data),
                        data.lat || 0, // Fallback if no lat/lon (shouldn't happen if we enter block)
                        data.lon || 0,
                        event.event_id
                    );

                    updatedCount++;
                }
            }

        } catch (error: any) {
            console.error(`[Sync] Error syncing event ${event.event_id}:`, error.message);
        }
    }

    console.log(`\n✅ Synced enriched data to ${updatedCount} events`);
}

syncEnrichedData().catch(console.error);
