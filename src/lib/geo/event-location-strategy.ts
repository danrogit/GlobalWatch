/**
 * Event-Type Location Strategy
 * 
 * Applies event-type specific logic to determine best location
 * Military action → exact city, Sanctions → capitals, etc.
 */

import type { ResolvedLocation } from './location-resolver';

export type EventType =
    | 'military_action'
    | 'protest'
    | 'sanctions'
    | 'diplomatic_meeting'
    | 'government_statement'
    | 'cyber_attack'
    | 'election'
    | 'other';

export interface EventTypeLocationResult {
    primary: ResolvedLocation;
    secondary?: ResolvedLocation;
    strategy: string; // Description of strategy used
}

/**
 * Classify event type from title and content
 */
export function classifyEventType(title: string, content: string): EventType {
    const text = (title + ' ' + content).toLowerCase();

    // Military action
    if (/attack|strike|bombing|missile|military|troops|invasion|drone|airstrike/.test(text)) {
        return 'military_action';
    }

    // Protest
    if (/protest|demonstration|rally|march|riot/.test(text)) {
        return 'protest';
    }

    // Sanctions
    if (/sanction|embargo|trade ban|tariff|asset freeze/.test(text)) {
        return 'sanctions';
    }

    // Diplomatic meeting
    if (/summit|meeting|talks|conference|negotiations|bilateral|multilateral/.test(text)) {
        return 'diplomatic_meeting';
    }

    // Government statement
    if (/statement|announces|declares|says|told reporters|press conference/.test(text)) {
        return 'government_statement';
    }

    // Cyber attack
    if (/cyber|hack|breach|malware|ransomware|ddos/.test(text)) {
        return 'cyber_attack';
    }

    // Election
    if (/election|vote|ballot|campaign|referendum/.test(text)) {
        return 'election';
    }

    return 'other';
}

/**
 * Apply event-type specific location strategy
 */
export function applyEventTypeStrategy(
    locations: { primary: ResolvedLocation | null; secondary: ResolvedLocation | null },
    eventType: EventType,
    title: string,
    content: string
): EventTypeLocationResult | null {
    if (!locations.primary) return null;

    switch (eventType) {
        case 'military_action':
            // Use exact region/city - prefer most specific location
            return {
                primary: locations.primary,
                secondary: locations.secondary || undefined,
                strategy: 'Military action: using exact location from article',
            };

        case 'protest':
            // Prefer city center
            if (locations.primary.type === 'city') {
                return {
                    primary: locations.primary,
                    strategy: 'Protest: using city location',
                };
            }
            return {
                primary: locations.primary,
                strategy: 'Protest: using best available location',
            };

        case 'sanctions':
            // Primary: issuing country capital
            // Secondary: target country
            return {
                primary: locations.primary,
                secondary: locations.secondary || undefined,
                strategy: 'Sanctions: primary=issuing capital, secondary=target',
            };

        case 'diplomatic_meeting':
            // Use meeting location (usually mentioned explicitly)
            return {
                primary: locations.primary,
                strategy: 'Diplomatic meeting: using meeting location',
            };

        case 'government_statement':
            // Use speaker's capital
            return {
                primary: locations.primary,
                strategy: 'Government statement: using speaker capital',
            };

        case 'cyber_attack':
            // Country-level only (less specific)
            if (locations.primary.type === 'country') {
                return {
                    primary: locations.primary,
                    strategy: 'Cyber attack: country-level location',
                };
            }
            // If we have a city, use country instead
            return {
                primary: {
                    ...locations.primary,
                    confidence: locations.primary.confidence * 0.7,
                },
                strategy: 'Cyber attack: using country-level (reduced confidence)',
            };

        case 'election':
            // Use country or region
            return {
                primary: locations.primary,
                strategy: 'Election: using country/region location',
            };

        default:
            return {
                primary: locations.primary,
                secondary: locations.secondary || undefined,
                strategy: 'Default: using best available location',
            };
    }
}

/**
 * Get location strategy description for event type
 */
export function getEventTypeStrategyDescription(eventType: EventType): string {
    const descriptions: Record<EventType, string> = {
        military_action: 'Exact region/city from article',
        protest: 'City center',
        sanctions: 'Issuing capital (primary), target country (secondary)',
        diplomatic_meeting: 'Meeting location',
        government_statement: 'Speaker\'s capital',
        cyber_attack: 'Country-level only',
        election: 'Country or region',
        other: 'Best available location',
    };

    return descriptions[eventType];
}
