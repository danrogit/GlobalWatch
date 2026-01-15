/**
 * RSS Feed Fetcher
 * 
 * Fetches articles from RSS feeds listed in rssfeeds.yaml
 * Returns normalized articles with title, url, publishedAt, source
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

export interface RssArticle {
    title: string;
    url: string;
    publishedAt: string;
    source: string;        // Domain name (e.g., "dr.dk")
    feedUrl?: string;
    description?: string;
    language?: string;     // 'da' for Danish, 'en' for English, etc.
}

interface FeedConfig {
    feeds: Array<{ url: string }>;
}

// Simple XML parser for RSS feeds (no external dependency)
function parseRssFeed(xml: string, feedUrl: string): RssArticle[] {
    const articles: RssArticle[] = [];
    const source = extractDomain(feedUrl);

    // Match all <item> elements
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
        const itemXml = match[1];

        const title = extractXmlTag(itemXml, 'title');
        const link = extractXmlTag(itemXml, 'link') || extractXmlTag(itemXml, 'guid');
        const pubDate = extractXmlTag(itemXml, 'pubDate') || extractXmlTag(itemXml, 'dc:date');
        const description = extractXmlTag(itemXml, 'description');

        if (title && link) {
            articles.push({
                title: cleanHtml(title),
                url: link,
                publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
                source,
                feedUrl,
                description: description ? cleanHtml(description).substring(0, 300) : undefined,
                language: detectLanguage(feedUrl)
            });
        }
    }

    return articles;
}

function extractXmlTag(xml: string, tagName: string): string | null {
    // Handle CDATA
    const cdataRegex = new RegExp(`<${tagName}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tagName}>`, 'i');
    const cdataMatch = xml.match(cdataRegex);
    if (cdataMatch) return cdataMatch[1].trim();

    // Handle regular tags
    const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1].trim() : null;
}

function cleanHtml(text: string): string {
    return text
        .replace(/<[^>]+>/g, '') // Remove HTML tags
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .trim();
}

function extractDomain(url: string): string {
    try {
        const hostname = new URL(url).hostname.replace('www.', '').replace('feeds.', '');
        return hostname;
    } catch {
        return 'unknown';
    }
}

function detectLanguage(feedUrl: string): string {
    const danishDomains = ['dr.dk', 'tv2.dk', 'politiken.dk', 'berlingske.dk', 'jyllands-posten.dk',
        'ekstrabladet.dk', 'borsen.dk', 'finans.dk', 'altinget.dk', 'kristeligt-dagblad.dk'];

    const domain = extractDomain(feedUrl);
    if (danishDomains.some(d => domain.includes(d))) {
        return 'da';
    }
    return 'en';
}

/**
 * Load feed URLs from rss.xml (ALL 1,125+ feeds)
 */
export function loadFeedUrls(): string[] {
    const xmlPath = path.join(process.cwd(), 'data', 'rss', 'rss.xml');

    try {
        const xmlContent = fs.readFileSync(xmlPath, 'utf8');

        // Extract all URLs from the file (one per line or XML attributes)
        // Since rss.xml format can vary, let's extract http urls broadly
        const rawUrls = xmlContent.match(/https?:\/\/[^"\s<]+/g) || [];

        const urls = [...new Set(rawUrls)] // Unique URLs
            .filter(url =>
                !url.includes('google.com/search') &&
                !url.includes('example.com') &&
                url.length > 10
            );

        // Sort: DK domains first
        urls.sort((a, b) => {
            const isDkA = a.includes('.dk');
            const isDkB = b.includes('.dk');
            if (isDkA && !isDkB) return -1;
            if (!isDkA && isDkB) return 1;
            return 0;
        });

        console.log(`[RSS] Loaded ${urls.length} feed URLs from rss.xml (DK prioritized)`);
        return urls;
    } catch (error) {
        console.error('[RSS] Failed to load rss.xml:', error);
        return [];
    }
}

/**
 * Fetch a single RSS feed with timeout
 */
async function fetchFeed(feedUrl: string, timeoutMs = 15000): Promise<RssArticle[]> {
    // ... (keep existing implementation)
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch(feedUrl, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'GlobalWatch/1.0 (News Aggregator)',
                'Accept': 'application/rss+xml, application/xml, text/xml'
            }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            // console.warn(`[RSS] ${feedUrl}: HTTP ${response.status}`);
            return [];
        }

        const xml = await response.text();
        return parseRssFeed(xml, feedUrl);
    } catch (error) {
        // console.warn(`[RSS] ${feedUrl}: ${error}`);
        return [];
    }
}

/**
 * Fetch all RSS feeds with rate limiting
 */
export async function fetchAllFeeds(options: {
    maxConcurrent?: number;
    delayMs?: number;
    maxArticlesPerFeed?: number;
    onArticles?: (articles: RssArticle[]) => void;
} = {}): Promise<RssArticle[]> {
    const {
        maxConcurrent = 50,
        delayMs = 100,
        maxArticlesPerFeed = 50,
        onArticles
    } = options;

    const feedUrls = loadFeedUrls();
    console.log(`[RSS] Fetching ${feedUrls.length} feeds...`);

    const allArticles: RssArticle[] = [];
    const batches: string[][] = [];

    // Split into batches
    for (let i = 0; i < feedUrls.length; i += maxConcurrent) {
        batches.push(feedUrls.slice(i, i + maxConcurrent));
    }

    for (const batch of batches) {
        const results = await Promise.all(batch.map(url => fetchFeed(url)));

        for (const articles of results) {
            const sliced = articles.slice(0, maxArticlesPerFeed);
            allArticles.push(...sliced);
            if (onArticles) onArticles(sliced);
        }

        // Rate limiting delay between batches
        if (delayMs > 0) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }

    console.log(`[RSS] Fetched ${allArticles.length} articles from ${feedUrls.length} feeds`);

    // Deduplicate by URL
    const seen = new Set<string>();
    const unique = allArticles.filter(a => {
        if (seen.has(a.url)) return false;
        seen.add(a.url);
        return true;
    });

    // Sort by date (newest first)
    unique.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    return unique;
}

/**
 * Fetch only Danish feeds
 */
export async function fetchDanishFeeds(): Promise<RssArticle[]> {
    const allArticles = await fetchAllFeeds();
    return allArticles.filter(a => a.language === 'da');
}
