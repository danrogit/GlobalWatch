import { db } from './index';
import { RssArticle } from '../rss/fetcher';
import crypto from 'crypto';

const insertArticle = db.prepare(`
    INSERT OR IGNORE INTO rss_articles (
        id, title, description, url, source_name, source_url, published_at, 
        language, feed_url, tags, country_mentions, geopolitics_score, fetched_at
    ) VALUES (
        @id, @title, @description, @url, @source_name, @source_url, @published_at, 
        @language, @feed_url, @tags, @country_mentions, @geopolitics_score, @fetched_at
    )
`);

export function saveArticle(article: RssArticle, score: number, feedUrl: string) {
    const id = crypto.createHash('md5').update(article.url).digest('hex');

    try {
        insertArticle.run({
            id,
            title: article.title,
            description: article.description || '',
            url: article.url,
            source_name: article.source,
            source_url: new URL(article.url).hostname,
            published_at: article.publishedAt,
            language: article.language || 'en',
            feed_url: feedUrl,
            tags: JSON.stringify([]), // To be filled by analysis later
            country_mentions: JSON.stringify([]), // To be filled by extractor
            geopolitics_score: score,
            fetched_at: new Date().toISOString()
        });
    } catch (err) {
        console.error(`[DB] Failed to save article ${article.title}:`, err);
    }
}

export function getHighScoringArticles(threshold = 60) {
    return db.prepare('SELECT * FROM rss_articles WHERE geopolitics_score >= ? ORDER BY published_at DESC').all(threshold);
}
