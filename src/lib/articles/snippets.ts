// Rule-Based Snippet Extraction with Relevance Verification
// Extracts factual snippets and verifies content relevance

import { ExtractedArticle } from './extractor';

export interface ArticleSnippet {
    original: string;        // Original English snippet
    translated?: string;     // Danish translation (added later)
    sourceUrl: string;
    sourceName: string;
    publishedAt?: string;
    isRelevant: boolean;     // Whether content matches event context
}

// Keywords that often indicate factual statements
const FACTUAL_KEYWORDS = [
    'according to',
    'said',
    'reported',
    'confirmed',
    'announced',
    'stated',
    'declared',
    'killed',
    'injured',
    'arrested',
    'detained',
    'protesters',
    'police',
    'military',
    'government',
    'officials',
    'ministry',
];

// Maximum snippet length (characters)
const MAX_SNIPPET_LENGTH = 300;

// Maximum number of sentences per snippet
const MAX_SENTENCES = 2;

/**
 * Check if article content is relevant to the event context
 */
export function checkRelevance(
    content: string,
    country: string,
    eventType: string
): boolean {
    const lowerContent = content.toLowerCase();
    const lowerCountry = country.toLowerCase();

    // Country must be mentioned
    const countryMentioned = lowerContent.includes(lowerCountry) ||
        // Also check for country code variations
        COUNTRY_VARIATIONS[lowerCountry]?.some(v => lowerContent.includes(v.toLowerCase()));

    if (!countryMentioned) {
        return false;
    }

    // Check for event type relevance
    const eventKeywords = EVENT_TYPE_KEYWORDS[eventType.toLowerCase()] || [];
    const hasEventKeyword = eventKeywords.some(kw => lowerContent.includes(kw.toLowerCase()));

    return hasEventKeyword || countryMentioned;
}

// Country name variations for matching
const COUNTRY_VARIATIONS: Record<string, string[]> = {
    'china': ['chinese', 'beijing', 'shanghai', 'prc'],
    'russia': ['russian', 'moscow', 'kremlin'],
    'ukraine': ['ukrainian', 'kyiv', 'kiev'],
    'united states': ['american', 'usa', 'us', 'washington'],
    'israel': ['israeli', 'tel aviv', 'jerusalem'],
    'palestine': ['palestinian', 'gaza', 'west bank'],
    'iran': ['iranian', 'tehran'],
    'france': ['french', 'paris'],
    'germany': ['german', 'berlin'],
};

// Event type keywords for relevance checking
const EVENT_TYPE_KEYWORDS: Record<string, string[]> = {
    'military action': ['military', 'army', 'troops', 'soldiers', 'attack', 'strike', 'forces', 'defense'],
    'protests': ['protest', 'demonstration', 'rally', 'march', 'demonstrators', 'activists'],
    'armed conflict': ['conflict', 'fighting', 'battle', 'combat', 'war', 'clashes'],
    'coercion': ['arrest', 'detained', 'sanctions', 'pressure', 'threat'],
    'diplomatiske spændinger': ['diplomatic', 'tensions', 'relations', 'ambassador'],
};

/**
 * Extract factual snippet from article content with relevance check
 */
export function extractSnippet(
    article: ExtractedArticle,
    country?: string,
    eventType?: string
): ArticleSnippet | null {
    if (!article.success || !article.content) {
        return null;
    }

    // Split into sentences
    const sentences = splitIntoSentences(article.content);

    if (sentences.length === 0) {
        return null;
    }

    // Check content relevance if context provided
    const isRelevant = (!country || !eventType) ? true :
        checkRelevance(article.content, country, eventType);

    // Strategy 1: Find sentences with factual keywords
    const factualSentences = sentences.filter(sentence =>
        FACTUAL_KEYWORDS.some(keyword =>
            sentence.toLowerCase().includes(keyword.toLowerCase())
        )
    );

    let selectedSentences: string[];

    if (factualSentences.length > 0) {
        // Use first 1-2 factual sentences
        selectedSentences = factualSentences.slice(0, MAX_SENTENCES);
    } else {
        // Fallback: Use first 1-2 sentences (lead paragraph)
        selectedSentences = sentences.slice(0, MAX_SENTENCES);
    }

    // Combine and trim to max length
    let snippet = selectedSentences.join(' ').trim();

    if (snippet.length > MAX_SNIPPET_LENGTH) {
        snippet = snippet.substring(0, MAX_SNIPPET_LENGTH);
        const lastSpace = snippet.lastIndexOf(' ');
        if (lastSpace > MAX_SNIPPET_LENGTH * 0.7) {
            snippet = snippet.substring(0, lastSpace) + '...';
        }
    }

    if (snippet.length < 20) {
        return null;
    }

    return {
        original: snippet,
        sourceUrl: article.url,
        sourceName: formatSourceName(article.domain),
        publishedAt: article.publishedAt,
        isRelevant,
    };
}

/**
 * Split text into sentences
 */
function splitIntoSentences(text: string): string[] {
    const sentences = text.split(/(?<=[.!?])\s+/);
    return sentences
        .map(s => s.trim())
        .filter(s => s.length > 10);
}

/**
 * Format source domain into readable name
 */
function formatSourceName(domain: string): string {
    const name = domain
        .replace(/\.(com|org|net|co\.uk|io)$/i, '')
        .replace(/\./g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    const knownSources: Record<string, string> = {
        'reuters': 'Reuters',
        'apnews': 'AP News',
        'bbc': 'BBC',
        'aljazeera': 'Al Jazeera',
        'theguardian': 'The Guardian',
        'nytimes': 'The New York Times',
        'washingtonpost': 'Washington Post',
        'cnn': 'CNN',
        'france24': 'France 24',
        'dw': 'Deutsche Welle',
    };

    const lowerDomain = domain.toLowerCase();
    for (const [key, value] of Object.entries(knownSources)) {
        if (lowerDomain.includes(key)) {
            return value;
        }
    }

    return name;
}

/**
 * Extract snippets from multiple articles with relevance filtering
 */
export function extractSnippets(
    articles: ExtractedArticle[],
    country?: string,
    eventType?: string,
    onlyRelevant: boolean = true
): ArticleSnippet[] {
    return articles
        .map(a => extractSnippet(a, country, eventType))
        .filter((s): s is ArticleSnippet => s !== null && (!onlyRelevant || s.isRelevant));
}
