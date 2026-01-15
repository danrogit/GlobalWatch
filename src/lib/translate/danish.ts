// Danish Translation Module
// Uses MyMemory Translation API (free, no auth required)
// Fallback to LibreTranslate if LIBRETRANSLATE_URL is set

export interface TranslationResult {
    original: string;
    translated: string;
    success: boolean;
    error?: string;
}

// Configuration
const LIBRETRANSLATE_URL = process.env.LIBRETRANSLATE_URL || 'http://localhost:5000';
const MYMEMORY_API_URL = 'https://api.mymemory.translated.net/get';

// Simple in-memory cache for translations
const translationCache = new Map<string, string>();

/**
 * Translate text from English to Danish using MyMemory API (free)
 */
async function translateWithMyMemory(text: string): Promise<TranslationResult> {
    try {
        const params = new URLSearchParams({
            q: text,
            langpair: 'en|da',
        });

        const response = await fetch(`${MYMEMORY_API_URL}?${params}`);

        if (!response.ok) {
            throw new Error(`MyMemory API error: ${response.status}`);
        }

        const data = await response.json();

        if (data.responseStatus !== 200) {
            throw new Error(`MyMemory error: ${data.responseDetails || 'Unknown error'}`);
        }

        const translated = data.responseData?.translatedText || '';
        return {
            original: text,
            translated,
            success: true
        };
    } catch (error) {
        return {
            original: text,
            translated: text,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Translate text from English to Danish using LibreTranslate
 */
async function translateWithLibreTranslate(text: string): Promise<TranslationResult> {
    try {
        const response = await fetch(`${LIBRETRANSLATE_URL}/translate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: text,
                source: 'en',
                target: 'da',
                format: 'text',
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`LibreTranslate error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        const translated = data.translatedText || '';

        return {
            original: text,
            translated,
            success: true
        };
    } catch (error) {
        return {
            original: text,
            translated: text,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Translate text from English to Danish
 * Uses LibreTranslate if configured, otherwise MyMemory (free)
 */
export async function translateToDanish(text: string): Promise<TranslationResult> {
    // Check cache first
    const cached = translationCache.get(text);
    if (cached) {
        return {
            original: text,
            translated: cached,
            success: true
        };
    }

    let result: TranslationResult;

    if (LIBRETRANSLATE_URL) {
        // Use self-hosted LibreTranslate
        result = await translateWithLibreTranslate(text);
    } else {
        // Use free MyMemory API
        result = await translateWithMyMemory(text);
    }

    // Cache successful translations
    if (result.success) {
        translationCache.set(text, result.translated);
    }

    return result;
}

/**
 * Translate multiple texts with rate limiting
 */
export async function translateBatch(
    texts: string[],
    delayMs: number = 500
): Promise<TranslationResult[]> {
    const results: TranslationResult[] = [];

    for (const text of texts) {
        const result = await translateToDanish(text);
        results.push(result);

        // Rate limiting
        if (texts.indexOf(text) < texts.length - 1) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }

    return results;
}

/**
 * Translate common UI labels to Danish
 */
export const DANISH_UI_LABELS = {
    // Event page sections
    'Confidence': 'Tillid',
    'Confirmed': 'Bekræftet',
    'Reported / Developing': 'Rapporteret / Under udvikling',
    'Unverified Media Report': 'Ubekræftet medierapport',
    'Detection Signal': 'Detektionssignal',
    'What the media reports': 'Hvad medierne rapporterer',
    'Sources': 'Kilder',
    'Location': 'Sted',
    'First Detected': 'Først opdaget',
    'Data Sources': 'Datakilder',

    // Event types
    'Protests': 'Protester',
    'Military Action': 'Militær aktion',
    'Armed Conflict': 'Væbnet konflikt',
    'Coercion': 'Tvang',
    'Unconventional Violence': 'Ukonventionel vold',
    'Sanctions': 'Sanktioner',
    'Diplomatic Tensions': 'Diplomatiske spændinger',

    // Common phrases
    'reports': 'rapporter',
    'Media Mentions': 'Medieomtaler',
    'Articles': 'Artikler',
    'Click to read full article at source': 'Klik for at læse hele artiklen hos kilden',
    'Read original article': 'Læs original artikel',
    'translated': 'oversat',
    'This event is being reported by media outlets but has not been independently verified.':
        'Denne begivenhed rapporteres af medier, men er ikke uafhængigt verificeret.',
    'This is an unverified media report. Exercise caution when interpreting this information.':
        'Dette er en ubekræftet medierapport. Udvis forsigtighed ved fortolkning.',
    'No AI summaries. All claims are source-attributed.':
        'Ingen AI-resuméer. Alle påstande er kildeangivet.',
};

/**
 * Get Danish label for UI element
 */
export function getDanishLabel(englishLabel: string): string {
    return DANISH_UI_LABELS[englishLabel as keyof typeof DANISH_UI_LABELS] || englishLabel;
}

/**
 * Translate event type to Danish
 */
export function translateEventType(eventType: string): string {
    const translations: Record<string, string> = {
        'Protests': 'Protester',
        'Protest': 'Protest',
        'Military Action': 'Militær aktion',
        'Armed Conflict': 'Væbnet konflikt',
        'Coercion': 'Tvang',
        'Unconventional Violence': 'Ukonventionel vold',
        'Sanctions': 'Sanktioner',
        'Diplomatic Tensions': 'Diplomatiske spændinger',
        'Demonstrate': 'Demonstration',
        'Riot': 'Optøjer',
    };

    return translations[eventType] || eventType;
}
