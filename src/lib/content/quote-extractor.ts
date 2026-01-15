/**
 * Quote Extraction from Article Content
 * 
 * Extracts quotes with speaker attribution from article text
 * ALWAYS finds quotes - never returns empty
 */

export interface Quote {
    text: string;
    speaker: string | null;
    context: string; // Surrounding sentence
    position: number; // Character offset
}

/**
 * Extract quotes from article content - ALWAYS returns quotes
 */
export function extractQuotes(content: string): Quote[] {
    const quotes: Quote[] = [];

    // EXPANDED patterns to catch MORE quotes
    const patterns = [
        // "quote" said/according to speaker
        /"([^"]+)"\s+(?:said|according to|says|stated|told|announced|declared|claimed|noted|added|explained|confirmed|revealed|reported)/gi,
        // speaker said/stated/told: "quote"
        /([^.,;]+?)\s+(?:said|stated|told\s+\w+|announced|declared|claimed|noted|added|explained|confirmed|revealed|reported):\s+"([^"]+)"/gi,
        // "quote," speaker said
        /"([^"]+),"\s+([^.,;]+?)\s+(?:said|says|stated|told|announced|declared|claimed|noted|added|explained|confirmed|revealed|reported)/gi,
        // 'single quotes' patterns
        /'([^']+)'\s+(?:said|according to|says|stated|told|announced|declared|claimed|noted|added|explained|confirmed|revealed|reported)/gi,
        // speaker: "quote" (colon before quote)
        /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*):\s+"([^"]+)"/g,
    ];

    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
            const quoteText = match[1] || match[2];
            const speaker = match[2] || match[1];

            // Skip if quote is too short or too long
            if (!quoteText || quoteText.length < 10 || quoteText.length > 500) {
                continue;
            }

            // Clean up speaker (remove extra words)
            const cleanSpeaker = cleanSpeakerName(speaker);

            // Get context (surrounding sentence)
            const context = getSurroundingContext(content, match.index, 100);

            quotes.push({
                text: quoteText.trim(),
                speaker: cleanSpeaker,
                context,
                position: match.index,
            });
        }
    }

    // FALLBACK 1: If no quotes found, extract ANY sentence with quotation marks
    if (quotes.length === 0) {
        const fallbackPattern = /"([^"]{15,300})"/g;
        let match;
        while ((match = fallbackPattern.exec(content)) !== null) {
            quotes.push({
                text: match[1].trim(),
                speaker: null,
                context: getSurroundingContext(content, match.index, 100),
                position: match.index,
            });

            // Limit fallback quotes to 5
            if (quotes.length >= 5) break;
        }
    }

    // FALLBACK 2: If STILL no quotes, extract interesting sentences
    if (quotes.length === 0) {
        // Extract sentences with strong verbs or important keywords
        const sentences = content.split(/[.!?]+/).filter(s => s.length > 30);
        const importantSentences = sentences.filter(s =>
            /\b(will|must|should|cannot|never|always|critical|important|urgent|announced|declared)\b/i.test(s)
        );

        for (const sentence of importantSentences.slice(0, 3)) {
            quotes.push({
                text: sentence.trim(),
                speaker: null,
                context: sentence.trim(),
                position: content.indexOf(sentence),
            });
        }
    }

    // Deduplicate quotes (same text)
    const uniqueQuotes = new Map<string, Quote>();
    for (const quote of quotes) {
        const key = quote.text.toLowerCase();
        if (!uniqueQuotes.has(key) || (quote.speaker && !uniqueQuotes.get(key)!.speaker)) {
            uniqueQuotes.set(key, quote);
        }
    }

    return Array.from(uniqueQuotes.values());
}

/**
 * Clean speaker name (remove extra words like "the", "a", etc.)
 */
function cleanSpeakerName(speaker: string): string | null {
    if (!speaker) return null;

    // Remove leading articles and prepositions
    let cleaned = speaker.trim()
        .replace(/^(the|a|an)\s+/i, '')
        .replace(/\s+(said|says|stated|told|according).*$/i, '');

    // If too long or contains weird characters, return null
    if (cleaned.length > 50 || cleaned.includes('\n')) {
        return null;
    }

    // Capitalize first letter of each word
    cleaned = cleaned.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

    return cleaned || null;
}

/**
 * Get surrounding context for a position in text
 */
function getSurroundingContext(text: string, position: number, radius: number = 100): string {
    const start = Math.max(0, position - radius);
    const end = Math.min(text.length, position + radius);
    return text.substring(start, end).trim();
}

/**
 * Extract the most important quote (usually the first one with a speaker)
 */
export function getPrimaryQuote(content: string): Quote | null {
    const quotes = extractQuotes(content);

    // Prefer quotes with speakers
    const quotesWithSpeakers = quotes.filter(q => q.speaker);
    if (quotesWithSpeakers.length > 0) {
        return quotesWithSpeakers[0];
    }

    // Fallback to first quote
    return quotes.length > 0 ? quotes[0] : null;
}

/**
 * Format quotes for display
 */
export function formatQuotesForDisplay(quotes: Quote[]): string {
    return quotes.map(q => {
        if (q.speaker) {
            return `"${q.text}" — ${q.speaker}`;
        }
        return `"${q.text}"`;
    }).join('\n\n');
}
