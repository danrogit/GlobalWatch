/**
 * Named Entity Recognition (NER) for Location Extraction
 * 
 * Extracts cities, regions, countries, and landmarks from article text
 * Uses compromise.js for JavaScript-based NER
 */

import nlp from 'compromise';

export interface LocationEntity {
    text: string; // e.g., "Washington"
    type: 'city' | 'region' | 'country' | 'landmark';
    position: number; // Character offset in text
    sentence: string; // Surrounding sentence for context
    inTitle: boolean; // Was it in the title?
    frequency: number; // How many times mentioned
}

/**
 * Extract location entities from text using NER
 */
export function extractLocationEntities(
    title: string,
    content: string
): LocationEntity[] {
    const entities: LocationEntity[] = [];
    const entityMap = new Map<string, LocationEntity>();

    // Process title (higher weight)
    const titleDoc = nlp(title);
    const titlePlaces = titleDoc.places().out('array');

    for (const place of titlePlaces) {
        const normalized = place.toLowerCase();
        if (!entityMap.has(normalized)) {
            entityMap.set(normalized, {
                text: place,
                type: classifyLocationType(place),
                position: title.indexOf(place),
                sentence: title,
                inTitle: true,
                frequency: 1,
            });
        } else {
            entityMap.get(normalized)!.frequency++;
            entityMap.get(normalized)!.inTitle = true;
        }
    }

    // Process content (first 2 paragraphs)
    const paragraphs = content.split('\n').filter(p => p.trim().length > 50).slice(0, 2);
    const contentText = paragraphs.join('\n');
    const contentDoc = nlp(contentText);

    // Extract places
    const places = contentDoc.places().out('array');

    for (const place of places) {
        const normalized = place.toLowerCase();
        const position = contentText.indexOf(place);

        // Get surrounding sentence for context
        const sentence = getSentenceContaining(contentText, position);

        if (!entityMap.has(normalized)) {
            entityMap.set(normalized, {
                text: place,
                type: classifyLocationType(place),
                position,
                sentence,
                inTitle: false,
                frequency: 1,
            });
        } else {
            entityMap.get(normalized)!.frequency++;
        }
    }

    return Array.from(entityMap.values());
}

/**
 * Classify location type based on known patterns
 */
function classifyLocationType(location: string): 'city' | 'region' | 'country' | 'landmark' {
    const lower = location.toLowerCase();

    // Landmarks
    const landmarks = ['white house', 'pentagon', 'kremlin', 'buckingham palace', 'elysee', 'capitol'];
    if (landmarks.some(l => lower.includes(l))) return 'landmark';

    // Countries (common patterns)
    const countries = ['united states', 'united kingdom', 'russia', 'china', 'france', 'germany', 'india', 'brazil'];
    if (countries.some(c => lower === c)) return 'country';

    // Regions (common patterns)
    const regions = ['middle east', 'gaza strip', 'west bank', 'cabo delgado', 'donbas', 'crimea'];
    if (regions.some(r => lower.includes(r))) return 'region';

    // Default to city
    return 'city';
}

/**
 * Get the sentence containing a specific position in text
 */
function getSentenceContaining(text: string, position: number): string {
    const doc = nlp(text);
    const sentences = doc.sentences().out('array');

    let charCount = 0;
    for (const sentence of sentences) {
        const sentenceEnd = charCount + sentence.length;
        if (position >= charCount && position <= sentenceEnd) {
            return sentence;
        }
        charCount = sentenceEnd + 1; // +1 for space/newline
    }

    return text.substring(Math.max(0, position - 50), Math.min(text.length, position + 50));
}

/**
 * Extract location entities with confidence scores
 */
export function extractLocationsWithConfidence(
    title: string,
    content: string
): Array<LocationEntity & { confidence: number }> {
    const entities = extractLocationEntities(title, content);

    return entities.map(entity => {
        // Base confidence by type
        let baseScore = 0.5;
        if (entity.type === 'city') baseScore = 0.9;
        else if (entity.type === 'landmark') baseScore = 0.95;
        else if (entity.type === 'region') baseScore = 0.7;
        else if (entity.type === 'country') baseScore = 0.5;

        // Position weight (title > first para > second para)
        let positionWeight = 0.6;
        if (entity.inTitle) positionWeight = 1.0;
        else if (entity.position < 500) positionWeight = 0.8;

        // Frequency weight
        const frequencyWeight = Math.min(1.0, 0.5 + (entity.frequency * 0.1));

        // Final confidence
        const confidence = baseScore * positionWeight * frequencyWeight;

        return {
            ...entity,
            confidence: Math.min(1.0, confidence),
        };
    });
}

/**
 * Get the most confident location from extracted entities
 */
export function getBestLocation(
    title: string,
    content: string
): (LocationEntity & { confidence: number }) | null {
    const locations = extractLocationsWithConfidence(title, content);

    if (locations.length === 0) return null;

    // Sort by confidence descending
    locations.sort((a, b) => b.confidence - a.confidence);

    return locations[0];
}
