// API endpoint for fetching and translating article snippets
// With strict content verification

import { NextRequest, NextResponse } from 'next/server';
import { extractArticle } from '@/lib/articles/extractor';
import { extractSnippet, checkRelevance } from '@/lib/articles/snippets';
import { translateToDanish } from '@/lib/translate/danish';
import { verifyArticleContent, verifySourceDomain, getCountryName } from '@/lib/verify';

export interface TranslatedSnippet {
    url: string;
    domain: string;
    original: string;
    danish: string;
    success: boolean;
    isRelevant: boolean;
}

const snippetCache = new Map<string, TranslatedSnippet>();

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const urlsParam = searchParams.get('urls');
    const countryCode = searchParams.get('country') || '';
    const eventType = searchParams.get('eventType') || '';

    if (!urlsParam) {
        return NextResponse.json({ error: 'Missing urls parameter' }, { status: 400 });
    }

    // Get full country name for matching
    const country = getCountryName(countryCode);

    const urls = urlsParam.split(',').slice(0, 8); // Try more URLs to find valid ones
    const results: TranslatedSnippet[] = [];
    let skippedEntertainment = 0;
    let skippedIrrelevant = 0;

    for (const url of urls) {
        // Stop if we have enough verified snippets
        if (results.length >= 3) break;

        // Check domain first (fast)
        if (!verifySourceDomain(url)) {
            console.log(`[Snippets] Skipping entertainment domain: ${url}`);
            skippedEntertainment++;
            continue;
        }

        const cacheKey = `${url}:${country}`;
        const cached = snippetCache.get(cacheKey);
        if (cached) {
            results.push(cached);
            continue;
        }

        try {
            const article = await extractArticle(url);
            if (!article.success) {
                continue;
            }

            // STRICT: Verify article content is not entertainment
            const contentCheck = verifyArticleContent(article.content);
            if (!contentCheck.isValid) {
                console.log(`[Snippets] Rejected (entertainment): ${url} - ${contentCheck.reason}`);
                skippedEntertainment++;
                continue;
            }

            // Check country relevance
            const isRelevant = checkRelevance(article.content, country, eventType);
            if (!isRelevant) {
                console.log(`[Snippets] Skipping (not about ${country}): ${url}`);
                skippedIrrelevant++;
                continue;
            }

            const snippet = extractSnippet(article, country, eventType);
            if (!snippet) {
                continue;
            }

            // Final content check on snippet
            const snippetCheck = verifyArticleContent(snippet.original);
            if (!snippetCheck.isValid) {
                console.log(`[Snippets] Rejected snippet (entertainment): ${url}`);
                skippedEntertainment++;
                continue;
            }

            // Translate to Danish
            const translation = await translateToDanish(snippet.original);

            const result: TranslatedSnippet = {
                url,
                domain: article.domain,
                original: snippet.original,
                danish: translation.translated,
                success: translation.success,
                isRelevant: true
            };

            snippetCache.set(cacheKey, result);
            results.push(result);

            await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
            console.error(`[Snippets API] Error: ${url}`, error);
        }
    }

    console.log(`[Snippets] Results: ${results.length} verified, ${skippedEntertainment} entertainment, ${skippedIrrelevant} irrelevant`);

    return NextResponse.json({
        snippets: results,
        total: urls.length,
        verified: results.length,
        skippedEntertainment,
        skippedIrrelevant
    });
}
