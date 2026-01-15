// Test script for article extraction and translation pipeline
// Run with: npx tsx src/lib/articles/test-pipeline.ts

import { extractArticle } from './extractor';
import { extractSnippet } from './snippets';
import { translateToDanish } from '../translate/danish';
import { loadEventsFromDisk, getEvents } from '../gdelt/store';

async function testPipeline() {
    console.log('\n========================================');
    console.log('ARTICLE EXTRACTION & TRANSLATION TEST');
    console.log('========================================\n');

    // Load events
    loadEventsFromDisk();
    const events = getEvents();

    if (events.length === 0) {
        console.log('No events found.');
        return;
    }

    // Take first event with source URLs
    const event = events.find(e => e.gdelt.sourceUrls.length > 0);
    if (!event) {
        console.log('No events with source URLs found.');
        return;
    }

    console.log(`Event: ${event.title}`);
    console.log(`Location: ${event.city}, ${event.country}`);
    console.log(`URLs available: ${event.gdelt.sourceUrls.length}\n`);

    // Process first 2 URLs
    const urlsToTest = event.gdelt.sourceUrls.slice(0, 2);
    let successCount = 0;

    for (let i = 0; i < urlsToTest.length; i++) {
        const url = urlsToTest[i];
        console.log(`\n--- Article ${i + 1}/${urlsToTest.length} ---`);
        console.log(`URL: ${url.substring(0, 60)}...`);

        // Extract article
        const article = await extractArticle(url);

        if (!article.success) {
            console.log(`FAILED: ${article.error}`);
            continue;
        }

        console.log(`Title: ${(article.title || 'No title').substring(0, 50)}...`);

        // Extract snippet
        const snippet = extractSnippet(article);

        if (!snippet) {
            console.log('Could not extract snippet');
            continue;
        }

        // Translate
        const translation = await translateToDanish(snippet.original);

        if (translation.success) {
            successCount++;
            console.log('\n[ORIGINAL]');
            console.log(snippet.original.substring(0, 200) + '...');
            console.log('\n[DANISH TRANSLATION]');
            console.log(translation.translated.substring(0, 200) + '...');
        } else {
            console.log(`Translation failed: ${translation.error}`);
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1500));
    }

    console.log('\n========================================');
    console.log(`COMPLETE: ${successCount}/${urlsToTest.length} articles processed`);
    console.log('========================================\n');
}

testPipeline().catch(console.error);
