/**
 * Multi-Layer Location Enrichment
 * 
 * Integrates all 5 layers of location extraction:
 * 1. RSS geo metadata
 * 2. NER extraction
 * 3. Geopolitical disambiguation
 * 4. Event-type logic
 * 5. Quote extraction
 */

import { fetchArticleContent, extractFirstParagraphs } from '../content/article-fetcher';
import { extractQuotes, getPrimaryQuote } from '../content/quote-extractor';
import { extractLocationsWithConfidence, getBestLocation } from '../nlp/ner-extractor';
import { resolveMultipleLocations } from './location-resolver';
import { classifyEventType, applyEventTypeStrategy, type EventType } from './event-location-strategy';

export interface EnrichmentResult {
    // Location data
    lat: number;
    lon: number;
    location_label: string;
    location_confidence: number;
    location_source: 'rss-geo' | 'ner' | 'event-logic' | 'fallback' | 'city-match' | 'country-fallback';

    // Secondary location (if applicable)
    secondary_lat?: number;
    secondary_lon?: number;
    secondary_label?: string;

    // Event classification
    event_type: EventType;
    event_strategy: string;

    // Content data
    article_content: string | null;
    imageUrl: string | null;
    quotes: Array<{ text: string; speaker: string | null }>;

    // Metadata
    content_fetched_at: number;
}

/**
 * Enrich article with multi-layer location extraction
 */
export async function enrichArticleLocation(
    title: string,
    url: string,
    rssData?: any
): Promise<EnrichmentResult | null> {
    console.log(`[Enrichment] Processing: ${title.substring(0, 60)}...`);

    // Layer 1: Check RSS geo metadata
    if (rssData?.geo_lat && rssData?.geo_lon) {
        console.log('  ✅ Layer 1: RSS geo metadata found');
        return {
            lat: parseFloat(rssData.geo_lat),
            lon: parseFloat(rssData.geo_lon),
            location_label: rssData.location || 'Unknown',
            location_confidence: 0.95,
            location_source: 'rss-geo',
            event_type: 'other',
            event_strategy: 'RSS metadata',
            article_content: null,
            imageUrl: null,
            quotes: [],
            content_fetched_at: Date.now(),
        };
    }

    // Fetch article content
    console.log('  📥 Fetching article content...');
    let articleContent = await fetchArticleContent(url);
    let textContent = '';
    let firstParagraphs = '';

    if (!articleContent) {
        console.log('  ⚠️ Direct fetch failed - using RSS description as fallback');

        // FALLBACK: Use RSS description + title as content
        textContent = `${title}\n\n`;
        firstParagraphs = textContent;

        // Create minimal article content object
        articleContent = {
            title: title,
            content: textContent,
            textContent: textContent,
            excerpt: '',
            byline: null,
            length: textContent.length,
            siteName: null,
            imageUrl: null,
        };
    } else {
        textContent = articleContent.textContent;
        firstParagraphs = extractFirstParagraphs(textContent, 2);
    }

    // Layer 2: NER extraction
    console.log('  🧠 Layer 2: Running NER...');
    const locationEntities = extractLocationsWithConfidence(title, firstParagraphs);
    console.log(`  Found ${locationEntities.length} location entities`);

    if (locationEntities.length === 0) {
        console.log('  ⚠️ No locations found via NER - using title-based extraction');

        // FALLBACK: Try to extract from title only
        const titleEntities = extractLocationsWithConfidence(title, '');

        if (titleEntities.length === 0) {
            console.log('  ❌ No locations found at all');
            return null;
        }

        locationEntities.push(...titleEntities);
    }

    // Layer 3: Resolve to coordinates
    console.log('  📍 Layer 3: Resolving locations...');
    const resolved = resolveMultipleLocations(locationEntities);

    if (!resolved.primary) {
        console.log('  ⚠️ Failed to resolve location - using default location');

        // FALLBACK: Use a default location (Copenhagen) so we don't lose the article
        resolved.primary = {
            lat: 55.6761, // Copenhagen
            lon: 12.5683,
            label: 'Unknown Location',
            confidence: 0.05,
            source: 'country-fallback',
            type: 'city',
        };
    }

    console.log(`  ✅ Resolved to: ${resolved.primary.label} (confidence: ${resolved.primary.confidence.toFixed(2)})`);

    // Layer 4: Apply event-type logic
    console.log('  🎯 Layer 4: Applying event-type logic...');
    const eventType = classifyEventType(title, firstParagraphs);
    const eventLocation = applyEventTypeStrategy(resolved, eventType, title, firstParagraphs);

    if (!eventLocation) {
        console.log('  ❌ Event-type strategy failed');
        return null;
    }

    console.log(`  Event type: ${eventType}, Strategy: ${eventLocation.strategy}`);

    // Layer 5: Extract quotes
    console.log('  💬 Layer 5: Extracting quotes...');
    const quotes = extractQuotes(textContent);
    console.log(`  Found ${quotes.length} quotes`);

    // Build result
    const result: EnrichmentResult = {
        lat: eventLocation.primary.lat,
        lon: eventLocation.primary.lon,
        location_label: eventLocation.primary.label,
        location_confidence: eventLocation.primary.confidence,
        location_source: eventLocation.primary.source as any, // Cast to match union type
        event_type: eventType,
        event_strategy: eventLocation.strategy,
        article_content: textContent,
        imageUrl: articleContent.imageUrl,
        quotes: quotes.map(q => ({ text: q.text, speaker: q.speaker })),
        content_fetched_at: Date.now(),
    };

    // Add secondary location if present
    if (eventLocation.secondary) {
        result.secondary_lat = eventLocation.secondary.lat;
        result.secondary_lon = eventLocation.secondary.lon;
        result.secondary_label = eventLocation.secondary.label;
    }

    console.log('  ✅ Enrichment complete!');
    return result;
}

/**
 * Batch enrich multiple articles
 */
export async function batchEnrichArticles(
    articles: Array<{ title: string; url: string; rssData?: any }>,
    delayMs: number = 1000
): Promise<Map<string, EnrichmentResult | null>> {
    const results = new Map<string, EnrichmentResult | null>();

    for (const article of articles) {
        const result = await enrichArticleLocation(article.title, article.url, article.rssData);
        results.set(article.url, result);

        // Rate limiting
        if (delayMs > 0) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }

    return results;
}
