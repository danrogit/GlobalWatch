/**
 * Full Production Pipeline
 * 
 * Complete ingestion cycle:
 * 1. Fetch new articles from RSS feeds (skip existing by URL)
 * 2. Score articles for geopolitical relevance
 * 3. For high-value articles (≥60):
 *    - Translate title to Danish
 *    - Extract location and geocode
 *    - Extract quotes
 * 4. Group articles into events by normalized title
 * 5. Cleanup old events (7-day retention)
 */

import { fetchAllFeeds } from '../src/lib/rss/fetcher';
import { calculateGeopoliticsScore } from '../src/lib/ingestion/scoring';
import { enrichArticle } from '../src/lib/ingestion/enrichment';
import { db, initDatabase } from '../src/lib/db/index';
import { deleteOldEvents } from '../src/lib/db/events';
import crypto from 'crypto';

// Danish category labels
const DANISH_CATEGORIES: Record<string, string> = {
    'military_security': 'Militær & sikkerhed',
    'diplomacy': 'Diplomati',
    'sanctions_trade': 'Sanktioner & handel',
    'elections_power': 'Valg & magtskifte',
    'protests_unrest': 'Protester & uro',
    'borders_territory': 'Grænser & territorier',
    'government_actions': 'Statslige beslutninger',
    'info_warfare': 'Informationskrig'
};

function mapCategory(text: string): string {
    const t = text.toLowerCase();
    if (t.includes('military') || t.includes('war') || t.includes('troops') || t.includes('attack')) return 'military_security';
    if (t.includes('election') || t.includes('vote') || t.includes('ballot')) return 'elections_power';
    if (t.includes('diploma') || t.includes('summit') || t.includes('treaty')) return 'diplomacy';
    if (t.includes('sanction') || t.includes('embargo') || t.includes('tariff')) return 'sanctions_trade';
    if (t.includes('protest') || t.includes('unrest') || t.includes('riot')) return 'protests_unrest';
    if (t.includes('border') || t.includes('territory') || t.includes('annex')) return 'borders_territory';
    return 'government_actions';
}

function normalizeTitle(title: string): string {
    return title.toLowerCase()
        .replace(/[^a-z0-9æøå\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 60);
}

function generateSlug(title: string): string {
    return title.toLowerCase()
        .replace(/[æå]/g, 'a')
        .replace(/ø/g, 'o')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 80);
}

// Check if article already exists
const checkExisting = db.prepare('SELECT id FROM rss_articles WHERE id = ?');

// Insert new article
const insertArticle = db.prepare(`
    INSERT OR IGNORE INTO rss_articles (
        id, title, url, description, published_at, source_name, feed_url,
        tags, country_mentions, geopolitics_score, fetched_at
    ) VALUES (
        @id, @title, @url, @description, @published_at, @source_name, @feed_url,
        @tags, @country_mentions, @geopolitics_score, @fetched_at
    )
`);

// Insert/update event
const insertEvent = db.prepare(`
    INSERT OR REPLACE INTO geo_events (
        event_id, title, summary, category, subcategory, countries,
        event_date, detected_at, source_count, verification_status,
        confidence_score, json_data, normalized_title
    ) VALUES (
        @event_id, @title, @summary, @category, @subcategory, @countries,
        @event_date, @detected_at, @source_count, @verification_status,
        @confidence_score, @json_data, @normalized_title
    )
`);

async function runFullPipeline() {
    const startTime = Date.now();
    console.log('='.repeat(70));
    console.log(`[Pipeline] Starting full cycle at ${new Date().toISOString()}`);
    console.log('='.repeat(70));

    // Stats tracking
    let totalFetched = 0;
    let newArticles = 0;
    let highValueArticles = 0;
    let enrichedArticles = 0;
    let eventsCreated = 0;

    // Step 1: Cleanup old events
    console.log('\n[1/5] Cleaning up old events...');
    const deleted = deleteOldEvents(7);
    console.log(`      Deleted ${deleted} events older than 7 days`);

    // Step 2: Fetch feeds and process articles
    console.log('\n[2/5] Fetching RSS feeds...');

    const articlesToEnrich: any[] = [];

    await fetchAllFeeds({
        maxConcurrent: 20,
        delayMs: 100,
        maxArticlesPerFeed: 20,
        onArticles: (batch) => {
            for (const article of batch) {
                totalFetched++;

                // Generate unique ID from URL
                const id = crypto.createHash('md5').update(article.url).digest('hex');

                // Check if already exists
                const existing = checkExisting.get(id);
                if (existing) continue;

                newArticles++;

                // Score the article
                const score = calculateGeopoliticsScore(article);

                // Save to database
                insertArticle.run({
                    id,
                    title: article.title,
                    url: article.url,
                    description: article.description || '',
                    published_at: article.pubDate || new Date().toISOString(),
                    source_name: article.source,
                    feed_url: article.feedUrl || '',
                    tags: '{}',
                    country_mentions: '[]',
                    geopolitics_score: score,
                    fetched_at: new Date().toISOString()
                });

                // Queue high-value for enrichment
                if (score >= 60) {
                    highValueArticles++;
                    articlesToEnrich.push({
                        id,
                        title: article.title,
                        description: article.description || '',
                        feed_url: article.feedUrl || '',
                        url: article.url,
                        published_at: article.pubDate || new Date().toISOString(),
                        source_name: article.source,
                        score
                    });
                }
            }
        }
    });

    console.log(`      Fetched: ${totalFetched}, New: ${newArticles}, High-Value: ${highValueArticles}`);

    // Step 3: Enrich high-value articles
    console.log(`\n[3/5] Enriching ${articlesToEnrich.length} high-value articles...`);

    const enrichedData: Map<string, any> = new Map();

    for (let i = 0; i < articlesToEnrich.length; i++) {
        const article = articlesToEnrich[i];

        try {
            const enriched = await enrichArticle(article);
            enrichedData.set(article.id, enriched);

            // Update article in DB with enriched data
            db.prepare(`
                UPDATE rss_articles SET
                    country_mentions = ?,
                    tags = ?
                WHERE id = ?
            `).run(
                JSON.stringify([enriched.country]),
                JSON.stringify({
                    danishTitle: enriched.danishTitle,
                    lat: enriched.lat,
                    lon: enriched.lon,
                    quotes: enriched.quotes
                }),
                article.id
            );

            enrichedArticles++;

            if ((i + 1) % 10 === 0) {
                console.log(`      Enriched ${i + 1}/${articlesToEnrich.length}...`);
            }

            // Rate limiting for translation API
            await new Promise(r => setTimeout(r, 200));

        } catch (err) {
            console.error(`      Error enriching ${article.id}:`, err);
        }
    }

    console.log(`      Enriched ${enrichedArticles} articles`);

    // Step 4: Group into events
    console.log('\n[4/5] Grouping articles into events...');

    // Group by normalized title
    const groups = new Map<string, any[]>();

    for (const article of articlesToEnrich) {
        const key = normalizeTitle(article.title);
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key)!.push({
            ...article,
            enriched: enrichedData.get(article.id)
        });
    }

    for (const [normalizedTitle, articleGroup] of groups) {
        const primary = articleGroup[0];
        const enriched = primary.enriched || {};

        const slug = generateSlug(primary.title);
        const category = mapCategory(primary.title + ' ' + (primary.description || ''));

        const event = {
            id: `evt-${crypto.createHash('md5').update(normalizedTitle).digest('hex').substring(0, 12)}`,
            slug,
            title: primary.title,
            danishTitle: enriched.danishTitle || primary.title,
            description: primary.description || '',
            category,
            danishCategory: DANISH_CATEGORIES[category] || category,
            country: enriched.country || 'Ukendt',
            countries: [enriched.country].filter(Boolean),
            timestamp: primary.published_at,
            addedAt: new Date().toISOString(),
            status: articleGroup.length >= 2 ? 'VERIFIED' : 'REPORTED',
            sources: [...new Set(articleGroup.map(a => a.source_name))],
            source: primary.source_name,
            sourceUrl: primary.url,
            articles: articleGroup.map(a => ({
                source_name: a.source_name,
                url: a.url,
                published_at: a.published_at,
                title: a.title
            })),
            quotes: enriched.quotes || [],
            lat: enriched.lat || 56.0,
            lon: enriched.lon || 10.0,
            layer: 'political',
            dotColor: articleGroup.length >= 2 ? 'green' : 'orange',
            normalizedTitle
        };

        insertEvent.run({
            event_id: event.id,
            title: event.title,
            summary: event.description,
            category: event.category,
            subcategory: '',
            countries: JSON.stringify(event.countries),
            event_date: event.timestamp,
            detected_at: event.addedAt,
            source_count: event.sources.length,
            verification_status: event.status.toLowerCase(),
            confidence_score: articleGroup.length >= 2 ? 0.8 : 0.5,
            json_data: JSON.stringify(event),
            normalized_title: normalizedTitle
        });

        eventsCreated++;
    }

    console.log(`      Created/Updated ${eventsCreated} events`);

    // Step 5: Summary
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('\n[5/5] Pipeline complete!');
    console.log('='.repeat(70));
    console.log('SUMMARY');
    console.log('='.repeat(70));
    console.log(`Duration: ${duration}s`);
    console.log(`Articles Fetched: ${totalFetched}`);
    console.log(`New Articles: ${newArticles}`);
    console.log(`High-Value Articles: ${highValueArticles}`);
    console.log(`Enriched (translated/geocoded): ${enrichedArticles}`);
    console.log(`Events Created/Updated: ${eventsCreated}`);
    console.log('='.repeat(70));

    // Get current totals
    const totalArticles = db.prepare('SELECT COUNT(*) as count FROM rss_articles').get() as { count: number };
    const totalEvents = db.prepare('SELECT COUNT(*) as count FROM geo_events').get() as { count: number };

    console.log(`\nDatabase Status:`);
    console.log(`  Total Articles: ${totalArticles.count}`);
    console.log(`  Total Events: ${totalEvents.count}`);
    console.log('='.repeat(70));

    return {
        duration,
        totalFetched,
        newArticles,
        highValueArticles,
        enrichedArticles,
        eventsCreated
    };
}

// Initialize and run
initDatabase();
runFullPipeline()
    .then(stats => {
        console.log('\n✅ Full pipeline completed successfully!');
        process.exit(0);
    })
    .catch(err => {
        console.error('\n❌ Pipeline failed:', err);
        process.exit(1);
    });
