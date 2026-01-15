import { MultiSourceEngine } from './engine';
import { AggregatedEvent } from '../gdelt/types';
import { UnifiedEvent, VerificationStatus } from './types';
import { SearXNGClient } from '../search/searxng-client';

export class VerificationService {
    private engine: MultiSourceEngine;
    private searxng: SearXNGClient;

    constructor() {
        this.engine = new MultiSourceEngine();
        this.searxng = new SearXNGClient();
    }

    /**
     * 3-Layer Verification Pipeline:
     * 1. GDELT (Detection) - Already done by caller
     * 2. News APIs (Reassurance) - Query major publishers
     * 3. SearXNG (Independent Confirmation) - Search for additional sources
     */
    async verifySignal(signal: AggregatedEvent): Promise<UnifiedEvent | null> {
        console.log(`[VerificationService] Verifying signal: ${signal.title}`);

        // Construct a focused query
        const query = `${signal.country} ${signal.title.substring(0, 30)}`;

        // LAYER 2: News API Check
        const events = await this.engine.processSignal(query, signal.country);

        if (events.length > 0) {
            const bestMatch = events[0];

            // If already VERIFIED by News APIs, return immediately
            if (bestMatch.status === 'VERIFIED') {
                console.log(`[VerificationService] Already VERIFIED by News APIs`);
                return {
                    ...bestMatch,
                    id: `verified-${signal.id}`,
                    category: signal.eventType || bestMatch.category,
                };
            }

            // LAYER 3: SearXNG Confirmation (if REPORTED)
            if (bestMatch.status === 'REPORTED') {
                console.log(`[VerificationService] Status is REPORTED, querying SearXNG...`);

                const searchResults = await this.searxng.search(query, {
                    categories: 'news',
                    timeRange: 'week'
                });

                if (searchResults.length > 0) {
                    // Extract domains from SearXNG results
                    const searxngDomains = SearXNGClient.extractDomains(searchResults);

                    // Check if any SearXNG domain is different from existing sources
                    const existingDomains = new Set(
                        (bestMatch.sources || []).map(s => s.toLowerCase())
                    );

                    const newDomains = searxngDomains.filter(d => !existingDomains.has(d.toLowerCase()));

                    if (newDomains.length > 0) {
                        console.log(`[VerificationService] Found ${newDomains.length} new sources via SearXNG: ${newDomains.join(', ')}`);

                        // Convert SearXNG results to articles
                        const searxngArticles = SearXNGClient.toArticles(searchResults.slice(0, 5));

                        // Upgrade to VERIFIED and append articles
                        return {
                            ...bestMatch,
                            id: `verified-${signal.id}`,
                            category: signal.eventType || bestMatch.category,
                            status: 'VERIFIED',
                            articles: [...(bestMatch.articles || []), ...searxngArticles],
                            sources: [...(bestMatch.sources || []), ...newDomains],
                            dotColor: 'green'
                        };
                    } else {
                        console.log(`[VerificationService] SearXNG found results but no new domains`);
                    }
                } else {
                    console.log(`[VerificationService] SearXNG returned no results`);
                }
            }

            // Return the best match from News APIs (REPORTED or UNVERIFIED)
            return {
                ...bestMatch,
                id: `verified-${signal.id}`,
                category: signal.eventType || bestMatch.category,
            };
        }

        // If no news found, return null (signal remains UNVERIFIED)
        return null;
    }

    /**
     * Triggers the daily broad sweep for all providers to populate the cache.
     */
    async triggerDailySweep(): Promise<void> {
        await this.engine.performDailySweep();
    }
}
