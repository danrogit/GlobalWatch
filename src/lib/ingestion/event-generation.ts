import { db } from '../db/index';
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

export async function generateEventsFromEnrichedArticles() {
    console.log('[Event Generation] Starting event generation from enriched articles...');

    // 1. Fetch recent articles (last 3 days) - don't require location_source
    const articles = db.prepare(`
        SELECT * FROM rss_articles 
        WHERE published_at > date('now', '-3 days')
        AND geopolitics_score >= 15
        ORDER BY published_at DESC
    `).all() as any[];

    if (articles.length === 0) {
        console.log('[Event Generation] No enriched articles found to process.');
        return 0;
    }

    console.log(`[Event Generation] Processing ${articles.length} enriched articles...`);

    // 2. Group by normalized title
    const groups = new Map<string, any[]>();

    // Track unique IDs to avoid duplicates in groups if queried oddly
    const seenIds = new Set<string>();

    for (const article of articles) {
        if (seenIds.has(article.id)) continue;
        seenIds.add(article.id);

        const key = normalizeTitle(article.title);
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key)!.push(article);
    }

    let eventsCreated = 0;

    for (const [normalizedTitle, articleGroup] of groups) {
        // Only create event if score is high enough OR multiple sources
        // Single source events are okay if score > 60 (which they should be to be enriched)

        const primary = articleGroup[0];
        // Parse enriched data
        let enriched: any = {};
        try {
            // Some fields are stored as JSON strings in DB? 
            // In enhanced-pipeline, we stored:
            // country_mentions -> JSON string
            // tags -> JSON string { quotes, danishTitle, lat, lon }

            const tags = JSON.parse(primary.tags || '{}');
            const countryMentions = JSON.parse(primary.country_mentions || '[]');

            enriched = {
                danishTitle: primary.danish_title || tags.danishTitle || primary.title,
                lat: tags.lat || primary.lat, // fallback
                lon: tags.lon || primary.lon, // fallback
                quotes: tags.quotes || [],
                country: countryMentions[0] || 'Ukendt'
            };

            // If lat/lon missing in tags, try extracting from other columns if they exist
            // Actually, enhanced-pipeline updates 'tags' with lat/lon.
            // But let's check location_confidence column usage in pipeline?

        } catch (e) {
            console.warn(`[Event Generation] Error parsing tags for ${primary.id}`);
            continue;
        }

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
            sources: [...new Set(articleGroup.map(a => a.source_domain || a.source_name || 'Ukendt'))],
            source: primary.source_domain || primary.source_name || 'Ukendt',
            sourceUrl: primary.url,
            articles: articleGroup.map(a => ({
                source_name: a.source_domain || a.source_name,
                url: a.url,
                published_at: a.published_at,
                title: a.title,
                publisher: a.source_domain || a.source_name
            })),
            quotes: enriched.quotes || [],
            lat: enriched.lat || 56.0,
            lon: enriched.lon || 10.0,
            layer: 'political',
            dotColor: articleGroup.length >= 2 ? 'green' : 'orange',
            normalizedTitle,
            imageUrl: primary.image_url // Added image support
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

    console.log(`[Event Generation] Created/Updated ${eventsCreated} events from ${articles.length} enriched articles.`);
    return eventsCreated;
}
