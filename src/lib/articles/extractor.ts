// Article Extractor Module
// Fetches and extracts clean article content from URLs

import { extract } from '@extractus/article-extractor';

export interface ExtractedArticle {
    url: string;
    domain: string;
    title: string;
    content: string;
    publishedAt?: string;
    author?: string;
    description?: string;
    success: boolean;
    error?: string;
}

/**
 * Extract article content from a URL
 */
export async function extractArticle(url: string): Promise<ExtractedArticle> {
    try {
        // Extract domain from URL
        const domain = extractDomain(url);

        // Fetch and extract article
        const article = await extract(url);

        if (!article || !article.content) {
            return {
                url,
                domain,
                title: '',
                content: '',
                success: false,
                error: 'Could not extract article content'
            };
        }

        // Clean and return
        return {
            url,
            domain,
            title: article.title || '',
            content: cleanContent(article.content),
            publishedAt: article.published || undefined,
            author: article.author || undefined,
            description: article.description || undefined,
            success: true
        };
    } catch (error) {
        const domain = extractDomain(url);
        return {
            url,
            domain,
            title: '',
            content: '',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Extract domain name from URL
 */
function extractDomain(url: string): string {
    try {
        const hostname = new URL(url).hostname;
        return hostname.replace('www.', '');
    } catch {
        return 'unknown';
    }
}

/**
 * Clean article content (remove HTML, normalize whitespace)
 */
function cleanContent(html: string): string {
    // Remove HTML tags
    let text = html.replace(/<[^>]*>/g, ' ');

    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

    // Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();

    return text;
}

/**
 * Extract articles from multiple URLs with rate limiting
 */
export async function extractArticles(urls: string[], delayMs: number = 1000): Promise<ExtractedArticle[]> {
    const results: ExtractedArticle[] = [];

    for (const url of urls) {
        const article = await extractArticle(url);
        results.push(article);

        // Rate limiting - be respectful to source servers
        if (urls.indexOf(url) < urls.length - 1) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }

    return results;
}
