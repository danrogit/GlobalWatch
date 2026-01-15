/**
 * Article Content Fetcher
 * 
 * Downloads full article HTML and extracts clean article text and images
 * Removes ads, navigation, headers, footers using Readability
 */

// @ts-ignore
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

export interface ArticleContent {
    title: string;
    content: string; // Clean article text
    textContent: string; // Plain text without HTML
    excerpt: string;
    byline: string | null;
    length: number; // Character count
    siteName: string | null;
    imageUrl: string | null; // Main image URL
}

/**
 * Fetch and extract article content from URL
 */
export async function fetchArticleContent(url: string): Promise<ArticleContent | null> {
    try {
        // Fetch HTML
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            signal: AbortSignal.timeout(10000), // 10 second timeout
        });

        if (!response.ok) {
            console.error(`[Article Fetcher] HTTP ${response.status} for ${url}`);
            return null;
        }

        const html = await response.text();

        // Parse with JSDOM
        const dom = new JSDOM(html, { url });
        const document = dom.window.document;

        // Check for Open Graph image before Readability (often better quality)
        let mainImage =
            document.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
            document.querySelector('meta[name="twitter:image"]')?.getAttribute('content') ||
            null;

        // Use Readability to extract article
        const reader = new Readability(document);
        const article = reader.parse();

        if (!article) {
            console.error(`[Article Fetcher] Readability failed for ${url}`);
            return null;
        }

        return {
            title: article.title || '',
            content: article.content || '', // HTML content
            textContent: article.textContent || '', // Plain text
            excerpt: article.excerpt || '',
            byline: article.byline || null,
            length: article.length || 0,
            siteName: article.siteName || null,
            imageUrl: mainImage || null,
        };

    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.error(`[Article Fetcher] Timeout for ${url}`);
        } else {
            console.error(`[Article Fetcher] Error fetching ${url}:`, error.message);
        }
        return null;
    }
}

/**
 * Extract first N paragraphs from article content
 */
export function extractFirstParagraphs(textContent: string, count: number = 2): string {
    const paragraphs = textContent
        .split('\n')
        .map(p => p.trim())
        .filter(p => p.length > 50); // Filter out short lines

    return paragraphs.slice(0, count).join('\n\n');
}

/**
 * Check if article content is already fetched
 */
export function hasArticleContent(article: any): boolean {
    return !!(article.article_content && article.content_fetched_at);
}

/**
 * Batch fetch article content for multiple URLs
 * Includes rate limiting to avoid overwhelming servers
 */
export async function batchFetchArticles(
    urls: string[],
    delayMs: number = 500
): Promise<Map<string, ArticleContent | null>> {
    const results = new Map<string, ArticleContent | null>();

    for (const url of urls) {
        const content = await fetchArticleContent(url);
        results.set(url, content);

        // Rate limiting delay
        if (delayMs > 0) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }

    return results;
}
