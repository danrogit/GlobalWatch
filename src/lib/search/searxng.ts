/**
 * SearXNG Search Client
 * 
 * Provides fallback article content fetching via SearXNG when direct fetch fails
 */

const SEARXNG_URL = process.env.SEARXNG_URL || 'https://searx.be';

export interface SearXNGResult {
    title: string;
    content: string;
    url: string;
}

/**
 * Search for article content using SearXNG
 */
export async function searchArticle(query: string, originalUrl?: string): Promise<SearXNGResult | null> {
    try {
        const searchUrl = `${SEARXNG_URL}/search?q=${encodeURIComponent(query)}&format=json&engines=google,bing`;

        const response = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; GlobalWatch/1.0)',
            },
            signal: AbortSignal.timeout(10000), // 10s timeout
        });

        if (!response.ok) {
            console.error(`[SearXNG] Search failed: ${response.status}`);
            return null;
        }

        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            console.log('[SearXNG] No results found');
            return null;
        }

        // Get first result
        const firstResult = data.results[0];

        return {
            title: firstResult.title || query,
            content: firstResult.content || firstResult.title || '',
            url: firstResult.url || originalUrl || '',
        };

    } catch (error: any) {
        console.error('[SearXNG] Error:', error.message);
        return null;
    }
}

/**
 * Check if SearXNG is available
 */
export async function isSearXNGAvailable(): Promise<boolean> {
    try {
        const response = await fetch(`${SEARXNG_URL}/`, {
            signal: AbortSignal.timeout(3000),
        });
        return response.ok;
    } catch {
        return false;
    }
}
