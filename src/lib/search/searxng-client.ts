/**
 * SearXNG Client for Independent News Confirmation
 * 
 * SearXNG is a privacy-respecting metasearch engine that aggregates results
 * from multiple news sources. This enables us to search Danish news (DR, TV2,
 * Politiken, etc.) without needing to scrape individual sites.
 */

export interface SearXNGResult {
    title: string;
    url: string;
    content: string; // Snippet
    publishedDate?: string;
    engine: string;
    category?: string;
}

export interface SearXNGSearchResponse {
    query: string;
    number_of_results: number;
    results: SearXNGResult[];
}

export class SearXNGClient {
    private baseUrl: string;
    private timeout: number;

    constructor(baseUrl?: string, timeout = 10000) {
        this.baseUrl = baseUrl || process.env.SEARXNG_URL || 'http://localhost:8888';
        this.timeout = timeout;
    }

    /**
     * Search for news articles using SearXNG
     * @param query - Search query (e.g., "Denmark protest Copenhagen")
     * @param categories - Comma-separated categories (default: 'news')
     * @param language - Language code (default: 'all')
     * @param engines - Specific engines to use (optional)
     */
    async search(
        query: string,
        options: {
            categories?: string;
            language?: string;
            engines?: string[];
            timeRange?: 'day' | 'week' | 'month' | 'year';
        } = {}
    ): Promise<SearXNGResult[]> {
        const { categories = 'news', language = 'all', engines, timeRange = 'week' } = options;

        const params = new URLSearchParams({
            q: query,
            format: 'json',
            categories,
            language,
            time_range: timeRange
        });

        if (engines && engines.length > 0) {
            params.set('engines', engines.join(','));
        }

        const url = `${this.baseUrl}/search?${params.toString()}`;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                console.error(`[SearXNG] HTTP Error: ${response.status} ${response.statusText}`);
                return [];
            }

            const data: SearXNGSearchResponse = await response.json();
            console.log(`[SearXNG] Found ${data.results?.length || 0} results for "${query}"`);

            return data.results || [];
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                console.error(`[SearXNG] Request timed out after ${this.timeout}ms`);
            } else {
                console.error('[SearXNG] Request failed:', error);
            }
            return [];
        }
    }

    /**
     * Search specifically for Danish news
     */
    async searchDanishNews(query: string): Promise<SearXNGResult[]> {
        return this.search(query, {
            categories: 'news',
            language: 'da',
            timeRange: 'week'
        });
    }

    /**
     * Extract unique domains from search results
     */
    static extractDomains(results: SearXNGResult[]): string[] {
        const domains = new Set<string>();
        for (const result of results) {
            try {
                const hostname = new URL(result.url).hostname.replace('www.', '');
                domains.add(hostname);
            } catch {
                // Ignore invalid URLs
            }
        }
        return Array.from(domains);
    }

    /**
     * Convert SearXNG results to Article format for the verification pipeline
     */
    static toArticles(results: SearXNGResult[]): {
        url: string;
        title: string;
        publisher: string;
        publishedAt: string;
        language: string;
        apiSource: string;
    }[] {
        return results.map(result => {
            let publisher = 'Unknown';
            try {
                const hostname = new URL(result.url).hostname.replace('www.', '');
                // Capitalize first letter
                publisher = hostname.split('.')[0];
                publisher = publisher.charAt(0).toUpperCase() + publisher.slice(1);
            } catch {
                // Ignore
            }

            return {
                url: result.url,
                title: result.title,
                publisher,
                publishedAt: result.publishedDate || new Date().toISOString(),
                language: 'da', // Assume Danish for now
                apiSource: 'searxng'
            };
        });
    }
}
