/**
 * LibreTranslate Client
 * 
 * Uses local LibreTranslate instance for Danish translation
 * API: http://localhost:5000
 */

const LIBRETRANSLATE_URL = process.env.LIBRETRANSLATE_URL || 'http://localhost:5000';

interface TranslateResponse {
    translatedText: string;
}

/**
 * Translate text to Danish using LibreTranslate
 */
export async function translateToDanish(text: string): Promise<string> {
    if (!text || text.trim().length === 0) {
        return text;
    }

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
            console.error('[LibreTranslate] Translation failed:', response.status);
            return text; // Return original on error
        }

        const data = await response.json() as TranslateResponse;
        return data.translatedText || text;
    } catch (error) {
        console.error('[LibreTranslate] Error:', error);
        return text; // Return original on error
    }
}

/**
 * Check if LibreTranslate is available
 */
export async function isLibreTranslateAvailable(): Promise<boolean> {
    try {
        const response = await fetch(`${LIBRETRANSLATE_URL}/languages`);
        return response.ok;
    } catch {
        return false;
    }
}

/**
 * Translate multiple texts in batch
 */
export async function translateBatch(texts: string[]): Promise<string[]> {
    const results: string[] = [];

    for (const text of texts) {
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
        const translated = await translateToDanish(text);
        results.push(translated);
    }

    return results;
}
