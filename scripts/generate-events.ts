/**
 * Generate Events from Authenticated Articles
 * 
 * Creates geo_events from high-scoring rss_articles.
 * Populates all enriched data including quotes and images.
 */

import { db } from '../src/lib/db/index';
import crypto from 'crypto';

async function generateEvents() {
    console.log('[Generate Events] transforming articles to events...');

    // Get high scoring articles
    const articles = db.prepare(`
        SELECT * FROM rss_articles 
        WHERE geopolitics_score >= 30 
    `).all() as any[];

    console.log(`  Found ${articles.length} candidates.`);

    let createdCount = 0;

    for (const article of articles) {
        try {
            const eventId = crypto.createHash('md5').update(article.url).digest('hex');

            // Determine country
            let country = 'Denmark'; // Default
            let lat = 55.68;
            let lon = 12.57;

            // STRICT FILTERING: Only use enriched locations
            if (article.location_source && article.lat && article.lon) {
                lat = article.lat;
                lon = article.lon;

                // Try to extract country from label "City, Country"
                if (article.location_label && article.location_label.includes(',')) {
                    country = article.location_label.split(',').pop()?.trim() || 'Ukendt';
                } else if (article.location_label) {
                    country = article.location_label;
                }
            } else {
                // Skip articles without precise location - avoids "fucked up" events
                continue;
            }

            // Slug generator helper
            const generateSlug = (text: string) => {
                return text.toLowerCase()
                    .replace(/æ/g, 'ae')
                    .replace(/ø/g, 'oe')
                    .replace(/å/g, 'aa')
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '');
            };

            const slug = generateSlug(article.danish_title || article.title);

            // Prepare JSON data
            const jsonData = {
                id: eventId,
                slug: slug, // Added slug
                title: article.title,
                danishTitle: article.danish_title || article.title,
                description: article.description,
                notes: article.article_content ? article.article_content.substring(0, 500) + '...' : article.description,
                category: 'Geopolitics', // Generic for now
                danishCategory: 'Geopolitik',
                country: country,
                timestamp: article.published_at,
                addedAt: article.fetched_at || new Date().toISOString(),
                status: 'REPORTED',
                source: article.source_domain || 'RSS',
                sourceUrl: article.url,
                lat: lat,
                lon: lon,
                layer: 'incident',
                dotColor: 'orange',

                // Enriched data
                quotes: article.quotes ? JSON.parse(article.quotes) : [],
                imageUrl: article.image_url,
                locationLabel: article.location_label,
                locationConfidence: article.location_confidence,
                locationSource: article.location_source
            };

            // Insert into geo_events
            db.prepare(`
                INSERT OR REPLACE INTO geo_events (
                    event_id, title, summary, category, subcategory, countries, 
                    event_date, detected_at, source_count, verification_status, 
                    confidence_score, json_data, normalized_title
                ) VALUES (
                    ?, ?, ?, ?, ?, ?, 
                    ?, ?, ?, ?, 
                    ?, ?, ?
                )
            `).run(
                eventId,
                jsonData.danishTitle, // Use Danish title for main display
                jsonData.notes,
                jsonData.category,
                '', // subcategory
                JSON.stringify([country]),
                jsonData.timestamp,
                jsonData.addedAt,
                1, // source_count
                jsonData.status,
                article.geopolitics_score / 100, // naive score
                JSON.stringify(jsonData),
                article.title.toLowerCase().replace(/[^a-z0-9]/g, '')
            );

            createdCount++;

        } catch (error: any) {
            console.error(`  Error creating event for ${article.title}: ${error.message}`);
        }
    }

    console.log(`\n✅ Created/Updated ${createdCount} filtered events.`);
}

generateEvents().catch(console.error);
