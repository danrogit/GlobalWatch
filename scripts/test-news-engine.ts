import { MultiSourceEngine } from '../src/lib/news/engine';
import { UnifiedEvent } from '../src/lib/news/types';
import { VerificationService } from '../src/lib/news/verification-service';
import { AggregatedEvent } from '../src/lib/gdelt/types';

// Load env vars via node --env-file=.env

async function main() {
    const engine = new MultiSourceEngine();
    const verifier = new VerificationService();

    console.log('🚀 Starting Full Pipeline Test...');

    // 1. Test Aggregation Engine directly
    const query = 'Ukraine';
    console.log(`\n\n--- 1. Testing Engine Collection (Query: "${query}") ---`);
    console.log('Querying all 5 providers: NewsData, Currents, GNews, Mediastack, WorldNews...');

    try {
        const events: UnifiedEvent[] = await engine.processSignal(query, 'Ukraine');

        if (events.length === 0) {
            console.log('❌ No events found.');
        } else {
            const evt = events[0]; // Focus on the main cluster
            console.log(`\n✅ Event Created: "${evt.title}"`);
            console.log(`   Status: ${evt.status}`);
            console.log(`   Total Articles: ${evt.articles.length}`);
            console.log(`   Unique Sources: ${evt.sources.length}`);

            // Count per provider
            const providerCounts: Record<string, number> = {};
            evt.articles.forEach(a => {
                providerCounts[a.apiSource] = (providerCounts[a.apiSource] || 0) + 1;
            });
            console.log('\n   📊 Articles by Provider:');
            Object.entries(providerCounts).forEach(([provider, count]) => {
                console.log(`      - ${provider}: ${count}`);
            });

            console.log('\n   📰 Top 5 Articles:');
            evt.articles.slice(0, 5).forEach(a => {
                console.log(`      - [${a.apiSource}] ${a.publisher}: ${a.title.substring(0, 60)}...`);
            });
        }

    } catch (error) {
        console.error('Engine test failed:', error);
    }

    // 2. Test Verification Service (Simulating a GDELT Signal)
    console.log('\n\n--- 2. Testing Verification Service (Simulated GDELT Signal) ---');
    const mockSignal: AggregatedEvent = {
        id: 'mock-gdelt-123',
        lat: 55.6761,
        lon: 12.5683,
        city: 'Copenhagen',
        country: 'Denmark',
        countryCode: 'dk',
        eventType: 'Diplomacy',
        eventTypeCode: '13',
        title: 'Government announces new policy', // Generic title to trigger broad search
        slug: 'mock-slug',
        timestamp: new Date().toISOString(),
        firstSeen: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        confidence: 'unverified',
        confidenceScore: 50,
        confidenceSignals: [],
        gdelt: {} as any,
        sources: [],
        severity: 'medium',
        severityScore: 5,
        eventCount: 1,
        actors: []
    };

    try {
        console.log(`Simulating signal: "${mockSignal.title}" in ${mockSignal.country}`);
        const verifiedEvent = await verifier.verifySignal(mockSignal);

        if (verifiedEvent) {
            console.log(`\n✅ Verification Result: MATCH FOUND`);
            console.log(`   New Status: ${verifiedEvent.status}`);
            console.log(`   Title: ${verifiedEvent.title}`);
            console.log(`   Sources: ${verifiedEvent.sources.join(', ')}`);
        } else {
            console.log(`\n⚠️ Verification Result: NO MATCH (Remains Unverified Signal)`);
            console.log(`   (This is expected if no news matches the mock signal '${mockSignal.title}')`);
        }

    } catch (error) {
        console.error('Verification test failed:', error);
    }
}

main();
