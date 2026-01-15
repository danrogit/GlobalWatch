/**
 * Test RSS Fetcher
 * Run with: npx tsx scripts/test-rss.ts
 */

import 'dotenv/config';
import { fetchAllFeeds, fetchDanishFeeds } from '../src/lib/rss/fetcher';
import { extractLocation, extractCountryFromUrl } from '../src/lib/geo/location-extractor';
import { geocode, getCountryCoordinates } from '../src/lib/geo/geocoder';

async function main() {
    console.log('📰 Testing RSS Fetcher...\n');

    // Fetch all feeds
    const articles = await fetchAllFeeds({ maxArticlesPerFeed: 5 });
    console.log(`\n📊 Total articles fetched: ${articles.length}`);

    // Show first 10 articles
    console.log('\n📝 Sample articles:');
    for (const article of articles.slice(0, 10)) {
        console.log(`\n  [${article.source}] ${article.title}`);
        console.log(`     URL: ${article.url}`);
        console.log(`     Date: ${article.publishedAt}`);
        console.log(`     Lang: ${article.language}`);

        // Try to extract location
        const extracted = extractLocation(article.title, article.description);
        if (extracted) {
            console.log(`     📍 Location: ${extracted.name} (${extracted.type}, confidence: ${extracted.confidence})`);

            // Try to geocode
            const coords = await geocode(extracted.name, extracted.type);
            if (coords) {
                console.log(`     🌍 Coords: ${coords.lat}, ${coords.lon}`);
            }
        } else {
            // Fall back to country from URL
            const country = extractCountryFromUrl(article.url);
            if (country) {
                console.log(`     📍 Fallback Country: ${country}`);
                const coords = getCountryCoordinates(country);
                if (coords) {
                    console.log(`     🌍 Coords: ${coords.lat}, ${coords.lon}`);
                }
            }
        }
    }

    // Stats
    const danishCount = articles.filter(a => a.language === 'da').length;
    console.log(`\n📊 Danish articles: ${danishCount}`);
    console.log(`📊 English articles: ${articles.length - danishCount}`);
}

main().catch(console.error);
