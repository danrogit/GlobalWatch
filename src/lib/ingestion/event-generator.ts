import { db } from '../db/index';
import { saveGeoEvent, getEventByNormalizedTitle } from '../db/events';
import crypto from 'crypto';

// Simple heuristic mapping
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
    return title
        .toLowerCase()
        .replace(/[^a-z0-9æøå\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 60);
}

function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[æå]/g, 'a')
        .replace(/ø/g, 'o')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 80);
}

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

export function generateEventsFromArticles() {
    console.log('[EventGen] Generating events from high-value articles...');

    const articles = db.prepare('SELECT * FROM rss_articles WHERE geopolitics_score >= 30').all() as any[];

    // Group articles by normalized title
    const groups = new Map<string, any[]>();

    for (const article of articles) {
        const key = normalizeTitle(article.title);
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key)!.push(article);
    }

    let generatedCount = 0;
    let updatedCount = 0;

    for (const [normalizedTitle, articleGroup] of groups) {
        const primaryArticle = articleGroup[0];
        const slug = generateSlug(primaryArticle.title);
        const category = mapCategory((primaryArticle.title + ' ' + (primaryArticle.description || '')));

        // Check if event already exists
        const existing = getEventByNormalizedTitle(normalizedTitle);

        if (existing) {
            // Merge sources only
            const existingData = JSON.parse(existing.json_data);
            const newSources = articleGroup.map(a => ({
                source_name: a.source_name,
                url: a.url,
                published_at: a.published_at
            }));

            // Add new sources (avoid duplicates)
            const existingUrls = new Set(existingData.articles?.map((a: any) => a.url) || []);
            for (const src of newSources) {
                if (!existingUrls.has(src.url)) {
                    existingData.articles = existingData.articles || [];
                    existingData.articles.push(src);
                    existingData.sources = [...new Set([...(existingData.sources || []), src.source_name])];
                }
            }

            // Update event
            db.prepare('UPDATE geo_events SET json_data = ?, source_count = ? WHERE event_id = ?')
                .run(JSON.stringify(existingData), existingData.articles?.length || 1, existing.event_id);

            updatedCount++;
        } else {
            // Create new event
            // Parse enriched data from tags if available
            let enrichedData: any = {};
            try {
                enrichedData = JSON.parse(primaryArticle.tags || '{}');
            } catch (e) { }

            const countryMentions = JSON.parse(primaryArticle.country_mentions || '[]');
            const country = countryMentions[0] || enrichedData.country || 'Ukendt';
            const lat = enrichedData.lat || 56.0;
            const lon = enrichedData.lon || 10.0;
            const danishTitle = enrichedData.danishTitle || primaryArticle.title;

            const event = {
                id: `evt-${crypto.createHash('md5').update(normalizedTitle).digest('hex').substring(0, 12)}`,
                slug: slug,
                title: primaryArticle.title,
                danishTitle: danishTitle,
                description: primaryArticle.description || '',
                category: category,
                danishCategory: DANISH_CATEGORIES[category] || category,
                country: country,
                countries: countryMentions,
                timestamp: primaryArticle.published_at,
                addedAt: new Date().toISOString(),
                status: articleGroup.length >= 2 ? 'VERIFIED' : 'REPORTED',
                sources: [...new Set(articleGroup.map(a => a.source_name))],
                source: articleGroup[0].source_name,
                sourceUrl: articleGroup[0].url,
                articles: articleGroup.map(a => ({
                    source_name: a.source_name,
                    url: a.url,
                    published_at: a.published_at,
                    title: a.title
                })),
                quotes: enrichedData.quotes || [],
                lat: lat,
                lon: lon,
                layer: 'political',
                dotColor: articleGroup.length >= 2 ? 'green' : 'orange',
                normalizedTitle: normalizedTitle
            };

            saveGeoEvent(event);
            generatedCount++;
        }
    }

    console.log(`[EventGen] Generated ${generatedCount} new events, updated ${updatedCount} existing.`);
}
