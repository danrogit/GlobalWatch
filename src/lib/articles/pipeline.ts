// Article Processing Pipeline
// Fetches articles, extracts snippets, and translates to Danish

import { extractArticle, ExtractedArticle } from './extractor';
import { extractSnippet, ArticleSnippet } from './snippets';
import { translateToDanish } from '../translate/danish';

export interface ProcessedSource {
    url: string;
    domain: string;
    snippet: string;           // Danish translated snippet
    originalSnippet: string;   // Original English
    publishedAt?: string;
}

/**
 * Process a single article URL into a Danish-translated source
 */
export async function processArticleUrl(url: string): Promise<ProcessedSource | null> {
    try {
        // 1. Extract article content
        const article = await extractArticle(url);
        if (!article.success) {
            console.log(`[Pipeline] Failed to extract: ${url}`);
            return null;
        }

        // 2. Extract factual snippet
        const snippetResult = extractSnippet(article);
        if (!snippetResult) {
            console.log(`[Pipeline] No snippet extracted: ${url}`);
            return null;
        }

        // 3. Translate to Danish
        const translation = await translateToDanish(snippetResult.original);

        return {
            url,
            domain: article.domain,
            snippet: translation.translated,
            originalSnippet: snippetResult.original,
            publishedAt: snippetResult.publishedAt,
        };
    } catch (error) {
        console.error(`[Pipeline] Error processing ${url}:`, error);
        return null;
    }
}

/**
 * Process multiple article URLs with rate limiting
 */
export async function processArticleUrls(
    urls: string[],
    maxArticles: number = 5,
    delayMs: number = 1000
): Promise<ProcessedSource[]> {
    const results: ProcessedSource[] = [];
    const urlsToProcess = urls.slice(0, maxArticles);

    console.log(`[Pipeline] Processing ${urlsToProcess.length} articles...`);

    for (const url of urlsToProcess) {
        const result = await processArticleUrl(url);
        if (result) {
            results.push(result);
        }

        // Rate limiting
        if (urlsToProcess.indexOf(url) < urlsToProcess.length - 1) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }

    console.log(`[Pipeline] Successfully processed ${results.length} articles`);
    return results;
}
