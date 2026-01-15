/**
 * Article Enrichment Module
 * 
 * Processes high-value articles to extract:
 * 1. Location (country, city)
 * 2. Coordinates (lat/lon via geocoding)
 * 3. Danish translation (for English content)
 * 4. Key quotes
 */

import { extractLocation, extractCountryFromUrl } from '../geo/location-extractor';
import { geocode, getCountryCoordinates } from '../geo/geocoder';
import { translateToDanish } from '../translate/danish';
import { db } from '../db/index';

export interface EnrichedArticle {
    id: string;
    title: string;
    danishTitle: string;
    description: string;
    country: string;
    city: string | null;
    lat: number;
    lon: number;
    quotes: string[];
    isEnriched: boolean;
}

// Simple quote extraction patterns
const QUOTE_PATTERNS = [
    /"([^"]{20,200})"/g,           // Standard double quotes
    /'([^']{20,200})'/g,           // Single quotes
    /«([^»]{20,200})»/g,           // French guillemets
    /„([^"]{20,200})"/g,           // German quotes
    /"([^"]{20,200})"/g,           // Smart quotes
];

/**
 * Extract quotes from text
 */
export function extractQuotes(text: string): string[] {
    const quotes: string[] = [];

    for (const pattern of QUOTE_PATTERNS) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            const quote = match[1].trim();
            // Filter out noise
            if (quote.length > 20 && !quotes.includes(quote)) {
                quotes.push(quote);
            }
        }
    }

    return quotes.slice(0, 3); // Max 3 quotes per article
}

/**
 * Detect if text is likely English
 */
function isEnglish(text: string): boolean {
    const englishWords = ['the', 'is', 'are', 'was', 'were', 'has', 'have', 'been', 'will', 'would', 'could', 'should', 'said', 'says'];
    const textLower = text.toLowerCase();
    const matches = englishWords.filter(w => textLower.includes(` ${w} `));
    return matches.length >= 2;
}

/**
 * Enrich a single article with location, translation, and quotes
 */
export async function enrichArticle(article: {
    id: string;
    title: string;
    description: string;
    feed_url: string;
}): Promise<EnrichedArticle> {
    const text = `${article.title} ${article.description || ''}`;

    // 1. Extract location from article text
    let location = extractLocation(article.title, article.description);
    let country = location?.type === 'country' ? location.name :
        location?.type === 'city' ? null : null;
    let city = location?.type === 'city' ? location.name : null;

    // 2. Fallback to feed URL for country detection
    if (!country) {
        country = extractCountryFromUrl(article.feed_url) || 'Ukendt';
    }

    // 3. Geocode to get coordinates
    let lat = 56.0, lon = 10.0; // Default to Denmark

    if (city) {
        const coords = await geocode(city, 'city');
        if (coords) {
            lat = coords.lat;
            lon = coords.lon;
        }
    } else if (country && country !== 'Ukendt') {
        const coords = getCountryCoordinates(country);
        if (coords) {
            lat = coords.lat;
            lon = coords.lon;
        }
    }

    // 4. Translate title to Danish (if English)
    let danishTitle = article.title;
    if (isEnglish(article.title)) {
        try {
            const result = await translateToDanish(article.title);
            if (result.success) {
                danishTitle = result.translated;
            }
        } catch (err) {
            // Keep original if translation fails
        }
    }

    // 5. Extract quotes
    const quotes = extractQuotes(text);

    return {
        id: article.id,
        title: article.title,
        danishTitle,
        description: article.description,
        country: country || 'Ukendt',
        city,
        lat,
        lon,
        quotes,
        isEnriched: true
    };
}

/**
 * Enrich all high-value articles in the database
 */
export async function enrichHighValueArticles(options: {
    maxArticles?: number;
    delayMs?: number;
} = {}) {
    const { maxArticles = 100, delayMs = 200 } = options;

    console.log(`[Enrichment] Starting enrichment of up to ${maxArticles} articles...`);

    // Get high-value articles that need enrichment
    const articles = db.prepare(`
        SELECT id, title, description, feed_url 
        FROM rss_articles 
        WHERE geopolitics_score >= 30 
        ORDER BY published_at DESC 
        LIMIT ?
    `).all(maxArticles) as any[];

    let enrichedCount = 0;

    for (const article of articles) {
        try {
            const enriched = await enrichArticle(article);

            // Update article in DB
            db.prepare(`
                UPDATE rss_articles SET
                    country_mentions = ?,
                    tags = ?
                WHERE id = ?
            `).run(
                JSON.stringify([enriched.country]),
                JSON.stringify({ quotes: enriched.quotes, danishTitle: enriched.danishTitle, lat: enriched.lat, lon: enriched.lon }),
                article.id
            );

            enrichedCount++;

            if (enrichedCount % 10 === 0) {
                console.log(`[Enrichment] Processed ${enrichedCount}/${articles.length} articles...`);
            }

            // Rate limiting
            await new Promise(r => setTimeout(r, delayMs));

        } catch (err) {
            console.error(`[Enrichment] Failed to enrich article ${article.id}:`, err);
        }
    }

    console.log(`[Enrichment] Complete. Enriched ${enrichedCount} articles.`);
    return enrichedCount;
}
