import { Article, NewsProvider, UnifiedEvent, VerificationStatus } from './types';
import { NewsDataClient } from './providers/newsdata-client';
import { ArticleCache } from './cache';
import { CurrentsClient } from './providers/currents-client';
import { GNewsClient } from './providers/gnews-client';
import { MediastackClient } from './providers/mediastack-client';
import { WorldNewsClient } from './providers/worldnews-client';

export class MultiSourceEngine {
    providers: NewsProvider[];

    cache: ArticleCache;

    constructor() {
        this.cache = new ArticleCache();
        this.providers = [
            new NewsDataClient(),
            new CurrentsClient(),
            new GNewsClient(),
            new MediastackClient(),
            new WorldNewsClient()
        ];
    }

    /**
     * Orchestrates the collection and verification process for a given signal (query).
     */
    async processSignal(query: string, country: string): Promise<UnifiedEvent[]> {
        console.log(`[NewsEngine] Processing signal for: "${query}" in ${country}`);

        // 1. Check Cache First (Hybrid Layer 3)
        // We look for articles in our daily cache that match the query/country
        const cacheHits = this.cache.search({
            keywords: [country, query],
            timeWindowStart: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() // Look back 48h
        });

        let allArticles: Article[] = [...cacheHits];

        // 2. Fallback to Live Search if needed (Targeted)
        // If cache has < 2 articles, we ideally fetch live to verify.
        if (cacheHits.length < 2) {
            console.log(`[NewsEngine] Cache match low (${cacheHits.length}). Falling back to live API search for: ${query}`);
            const liveArticles = await this.collectArticles(query);
            // We can optionally cache these targeted results too
            this.cache.addArticles(liveArticles, 'live-targeted');
            allArticles = [...allArticles, ...liveArticles];
        } else {
            console.log(`[NewsEngine] Cache match! Found ${cacheHits.length} articles. Skipping live API.`);
        }

        // 3. Cluster (on merged set)
        const clusters = this.clusterArticles(allArticles, country);
        const events = clusters.map(cluster => this.verifyCluster(cluster, country));

        return events;
    }

    /**
     * Run one broad query per provider to populate the cache.
     * Should be run once every ~24h externally.
     */
    async performDailySweep() {
        console.log('[NewsEngine] Starting Daily Broad Sweep...');
        const broadQuery = 'politics OR diplomacy OR sanctions OR conflict';
        const twentyFourHours = 24 * 60 * 60 * 1000;

        for (const provider of this.providers) {
            // Check last sweep time to avoid spamming on restart
            const lastSweep = this.cache.getLastSweepTime(provider.name);
            if (lastSweep && (Date.now() - lastSweep < twentyFourHours)) {
                console.log(`[NewsEngine] Skipping sweep for ${provider.name} (Swept < 24h ago)`);
                continue;
            }

            console.log(`[NewsEngine] Sweeping ${provider.name}...`);
            try {
                const articles = await provider.fetchLatest(broadQuery);
                this.cache.addArticles(articles, provider.name);
                console.log(`[NewsEngine] Swept ${articles.length} articles from ${provider.name}`);
            } catch (err) {
                console.error(`[NewsEngine] Sweep failed for ${provider.name}`, err);
            }
        }
        console.log('[NewsEngine] Daily Sweep Complete.');
    }

    private async collectArticles(query: string): Promise<Article[]> {
        const promises = this.providers.map(p =>
            p.fetchLatest(query).catch(err => {
                console.error(`[NewsEngine] Provider ${p.name} failed:`, err);
                return [];
            })
        );

        const results = await Promise.all(promises);
        return results.flat();
    }

    private clusterArticles(articles: Article[], country: string): Article[][] {
        // Basic deduplication by normalized URL
        const uniqueArticles = new Map<string, Article>();

        articles.forEach(a => {
            // Normalize: Strip params, lowercase
            try {
                const url = new URL(a.url);
                const cleanUrl = url.origin + url.pathname;
                if (!uniqueArticles.has(cleanUrl)) {
                    // Simple filter: Check if country name is in title/snippet if provided?
                    // For now, trust the search query context.
                    uniqueArticles.set(cleanUrl, a);
                }
            } catch (e) {
                // Invalid URL, skip
            }
        });

        // For this MVP, treat all unique results for this specific query as ONE cluster/event.
        // Ideally, we'd split them if they talk about different things.
        if (uniqueArticles.size === 0) return [];

        return [Array.from(uniqueArticles.values())];
    }

    private verifyCluster(articles: Article[], country: string): UnifiedEvent {
        // Extract unique publishers
        const publishers = new Set(articles.map(a => a.publisher));
        const sourceCount = publishers.size;

        // Trusted Publishers (High Confidence)
        const TRUSTED_DOMAINS = [
            'dr.dk', 'tv2.dk', 'reuters.com', 'bbc.co.uk',
            'aljazeera.com', 'apnews.com', 'afp.com', 'cnn.com'
        ];

        // Check for trusted sources
        const hasTrustedSource = articles.some(a =>
            TRUSTED_DOMAINS.some(d => a.publisher && a.publisher.toLowerCase().includes(d))
        );

        let status: VerificationStatus = 'UNVERIFIED';

        // Rule: >= 2 independent publishers = VERIFIED
        // Rule: 1 Trusted Source + 1 Independent = VERIFIED (Covered by >=2)
        // Rule: Single Trusted Source -> REPORTED (with high confidence weight)

        if (sourceCount >= 2) {
            status = 'VERIFIED';
        } else if (sourceCount === 1) {
            status = 'REPORTED';
        }

        // Sort by date descending
        articles.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

        const bestArticle = articles[0];

        return {
            id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            slug: `verified-${Math.random().toString(36).substr(2, 9)}`, // Temp
            source: 'News Engine',
            dotColor: status === 'VERIFIED' ? 'green' : 'orange',
            title: bestArticle.title,
            summary: bestArticle.snippet || 'No summary available.',
            country: country,
            location: { lat: 0, lon: 0 }, // Engine doesn't geocode yet, needs GDELT or Geocoder
            category: 'Unspecified', // Needs classifier
            status: status,
            articles: articles,
            sources: Array.from(publishers),
            firstDetectedAt: articles[articles.length - 1].publishedAt,
            lastUpdatedAt: new Date().toISOString()
        };
    }
}
