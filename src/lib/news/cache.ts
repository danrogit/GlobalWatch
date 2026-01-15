
import * as fs from 'fs';
import * as path from 'path';
import { Article } from './types';

interface CachedArticle extends Article {
    cachedAt: string;
}

interface CacheStore {
    articles: CachedArticle[];
    lastSweep: Record<string, string>; // provider -> timestamp
}

const CACHE_DIR = path.join(process.cwd(), 'data', 'cache');
const CACHE_FILE = path.join(CACHE_DIR, 'news_cache.json');

export class ArticleCache {
    private cache: CacheStore = {
        articles: [],
        lastSweep: {}
    };

    constructor() {
        this.load();
    }

    private load() {
        if (!fs.existsSync(CACHE_DIR)) {
            fs.mkdirSync(CACHE_DIR, { recursive: true });
        }

        if (fs.existsSync(CACHE_FILE)) {
            try {
                const data = fs.readFileSync(CACHE_FILE, 'utf-8');
                this.cache = JSON.parse(data);
                // Prune old articles (> 24 hours)? 
                // Let's prune on load to keep file size small
                this.prune();
            } catch (err) {
                console.error('[ArticleCache] Failed to load cache:', err);
            }
        }
    }

    private save() {
        try {
            if (!fs.existsSync(CACHE_DIR)) {
                fs.mkdirSync(CACHE_DIR, { recursive: true });
            }
            fs.writeFileSync(CACHE_FILE, JSON.stringify(this.cache, null, 2));
        } catch (err) {
            console.error('[ArticleCache] Failed to save cache:', err);
        }
    }

    private prune() {
        const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
        const originalCount = this.cache.articles.length;

        this.cache.articles = this.cache.articles.filter(a => {
            const cachedTime = new Date(a.cachedAt).getTime();
            return cachedTime > twentyFourHoursAgo;
        });

        if (this.cache.articles.length !== originalCount) {
            this.save(); // Save if we pruned anything
        }
    }

    public addArticles(articles: Article[], providerName: string) {
        const now = new Date().toISOString();
        let addedCount = 0;

        articles.forEach(article => {
            // Deduplicate by URL
            if (!this.cache.articles.find(a => a.url === article.url)) {
                this.cache.articles.push({
                    ...article,
                    cachedAt: now
                });
                addedCount++;
            }
        });

        this.cache.lastSweep[providerName] = now;
        if (addedCount > 0) {
            this.save();
            console.log(`[ArticleCache] Added ${addedCount} new articles from ${providerName}`);
        }
    }

    public search(criteria: {
        keywords?: string[],
        country?: string,
        timeWindowStart?: string,
        timeWindowEnd?: string
    }): Article[] {
        // Simple search logic
        return this.cache.articles.filter(article => {
            // 1. Time check (Approximate)
            if (criteria.timeWindowStart && new Date(article.publishedAt) < new Date(criteria.timeWindowStart)) return false;
            if (criteria.timeWindowEnd && new Date(article.publishedAt) > new Date(criteria.timeWindowEnd)) return false;

            // 2. Keyword check - REQUIRED match of at least one significant keyword if provided
            if (criteria.keywords && criteria.keywords.length > 0) {
                const text = (article.title + ' ' + (article.snippet || '')).toLowerCase();
                const hasMatch = criteria.keywords.some(kw => text.includes(kw.toLowerCase()));
                if (!hasMatch) return false;
            }

            // 3. Country check? - Hard because caching is generic.
            // We might just rely on keywords (country name) for now if the API doesn't return reliable country codes for every article.

            return true;
        });
    }

    public getLastSweepTime(providerName: string): number | null {
        const timestamp = this.cache.lastSweep[providerName];
        return timestamp ? new Date(timestamp).getTime() : null;
    }
}
