/**
 * Test Multi-Layer Location Enrichment
 * 
 * Tests the 5-layer location extraction on sample articles
 */

import { enrichArticleLocation } from '../src/lib/geo/multi-layer-enrichment';

// Test articles
const testArticles = [
    {
        title: 'Attack in Cabo Delgado, Mozambique kills 12',
        url: 'https://www.bbc.com/news/world-africa-12345678',
    },
    {
        title: 'EU imposes sanctions on Russia over Ukraine',
        url: 'https://www.reuters.com/world/europe/eu-sanctions-russia-2024-01-15/',
    },
    {
        title: 'Protest in Paris draws thousands',
        url: 'https://www.france24.com/en/france/20240115-paris-protest',
    },
    {
        title: 'Biden announces new policy at White House',
        url: 'https://www.washingtonpost.com/politics/2024/01/15/biden-white-house/',
    },
];

async function testEnrichment() {
    console.log('🧪 Testing Multi-Layer Location Enrichment\n');
    console.log('='.repeat(60));

    for (const article of testArticles) {
        console.log(`\n📰 Article: ${article.title}`);
        console.log(`🔗 URL: ${article.url}`);
        console.log('-'.repeat(60));

        try {
            const result = await enrichArticleLocation(article.title, article.url);

            if (result) {
                console.log('\n✅ ENRICHMENT RESULT:');
                console.log(`   Location: ${result.location_label}`);
                console.log(`   Coordinates: ${result.lat.toFixed(4)}, ${result.lon.toFixed(4)}`);
                console.log(`   Confidence: ${(result.location_confidence * 100).toFixed(1)}%`);
                console.log(`   Source: ${result.location_source}`);
                console.log(`   Event Type: ${result.event_type}`);
                console.log(`   Strategy: ${result.event_strategy}`);

                if (result.secondary_label) {
                    console.log(`   Secondary: ${result.secondary_label} (${result.secondary_lat?.toFixed(4)}, ${result.secondary_lon?.toFixed(4)})`);
                }

                if (result.quotes.length > 0) {
                    console.log(`\n   💬 Quotes (${result.quotes.length}):`);
                    result.quotes.slice(0, 2).forEach(q => {
                        const speaker = q.speaker ? ` — ${q.speaker}` : '';
                        console.log(`      "${q.text.substring(0, 80)}..."${speaker}`);
                    });
                }
            } else {
                console.log('\n❌ Enrichment failed');
            }

        } catch (error: any) {
            console.log(`\n❌ Error: ${error.message}`);
        }

        console.log('\n' + '='.repeat(60));

        // Delay between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n✅ Test complete!');
}

testEnrichment().catch(console.error);
