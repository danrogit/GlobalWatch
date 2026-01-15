/**
 * Import events from RSS feeds
 * Clears existing events and reimports from RSS
 * Run with: npx tsx scripts/import-rss-events.ts
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { fetchAllFeeds, RssArticle } from '../src/lib/rss/fetcher';
import { extractLocation, extractCountryFromUrl } from '../src/lib/geo/location-extractor';
import { geocode, getCountryCoordinates } from '../src/lib/geo/geocoder';
import { articleToEvent } from '../src/lib/rss/processor';
import { UnifiedEvent, EventCategory, CATEGORY_LABELS } from '../src/lib/data/types';

const STORE_PATH = path.join(process.cwd(), 'data', 'unified_events.json');

async function main() {
    console.log('🗑️  Clearing existing events...');

    // Clear existing store
    const emptyStore = {
        events: [],
        lastUpdated: new Date().toISOString(),
    };

    // Ensure data directory exists
    const dataDir = path.dirname(STORE_PATH);
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(STORE_PATH, JSON.stringify(emptyStore, null, 2));
    console.log('✅ Events cleared (unified_events.json)\n');

    console.log('📰 Fetching RSS feeds...');
    const articles = await fetchAllFeeds({ maxArticlesPerFeed: 15, maxConcurrent: 20 });
    console.log(`📋 Fetched ${articles.length} articles\n`);

    console.log('🌍 Processing and geocoding...');
    const events: UnifiedEvent[] = [];
    let processed = 0;
    let skipped = 0;

    // Process top 300 articles
    const topArticles = articles.slice(0, 300);

    for (let i = 0; i < topArticles.length; i++) {
        const article = topArticles[i];
        try {
            const event = await articleToEvent(article, i);
            if (event) {
                events.push(event);
                processed++;
                if (processed % 10 === 0) {
                    console.log(`  Processed ${processed} events...`);
                }
            } else {
                skipped++;
            }
        } catch (error) {
            skipped++;
        }
    }

    console.log(`\n✅ Processed ${processed} events, skipped ${skipped}\n`);

    // Save to store
    const store = {
        events,
        lastUpdated: new Date().toISOString(),
    };

    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2));
    console.log(`💾 Saved ${events.length} events to unified_events.json`);

    // Show category breakdown
    const categoryCount: Record<string, number> = {};
    for (const event of events) {
        categoryCount[event.danishCategory] = (categoryCount[event.danishCategory] || 0) + 1;
    }

    console.log('\n📊 Category breakdown:');
    for (const [cat, count] of Object.entries(categoryCount).sort((a, b) => b[1] - a[1])) {
        console.log(`  ${cat}: ${count}`);
    }
}

main().catch(console.error);

