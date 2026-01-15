/**
 * SearXNG Search Client
 * 
 * Fallback search when direct article fetching fails
 */

export interface SearXNGResult {
    title: string;
    url: string;
    content: string;
    publishedDate?: string;
}

/**
 * Search for article using SearXNG
 */
export async function searchArticle(articleTitle: string, originalUrl: string): Promise<SearXNGResult | null> {
    try {
        // Use SearXNG instance (configure your instance URL)
        const searxngUrl = process.env.SEARXNG_URL || 'https://searx.be';

        // Search for the article title
        const searchUrl = `${searxngUrl}/search?q=${encodeURIComponent(articleTitle)}&format=json&categories=news`;

        const response = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'GlobalWatch/1.0',
            },
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();

        // Find best matching result
        const results = data.results || [];

        // Prefer results from the same domain
        const domain = new URL(originalUrl).hostname;
        let bestMatch = results.find((r: any) => r.url?.includes(domain));

        // Fallback to first result
        if (!bestMatch && results.length > 0) {
            bestMatch = results[0];
        }

        if (!bestMatch) {
            return null;
        }

        return {
            title: bestMatch.title || articleTitle,
            url: bestMatch.url || originalUrl,
            content: bestMatch.content || '',
            publishedDate: bestMatch.publishedDate,
        };

    } catch (error) {
        console.error('[SearXNG] Search failed:', error);
        return null;
    }
}

/**
 * Get article content via SearXNG search
 */
export async function getArticleViaSearXNG(title: string, url: string): Promise<string | null> {
    const result = await searchArticle(title, url);

    if (!result) {
        return null;
    }

    // If we got a different URL, try fetching that
    if (result.url !== url) {
        console.log(`[SearXNG] Found alternative URL: ${result.url}`);
        // Could recursively try to fetch this URL
    }

    return result.content || null;
}
