// Event Verification Module
// Strict filtering to remove false positives and noise from GDELT data

import { AggregatedEvent } from '../gdelt/types';

// Countries where armed conflict/military action is extremely unlikely
// These require MUCH higher thresholds or are filtered entirely
const LOW_RISK_COUNTRIES = new Set([
    'denmark', 'norway', 'sweden', 'finland', 'iceland',
    'netherlands', 'belgium', 'luxembourg', 'switzerland', 'austria',
    'ireland', 'portugal', 'spain', 'italy', 'greece',
    'canada', 'australia', 'new zealand', 'japan', 'south korea',
    'singapore', 'taiwan', 'czech republic', 'poland', 'germany',
    'france', 'united kingdom', 'estonia', 'latvia', 'lithuania',
]);

// Event types that require strict verification (high false positive rate)
const HIGH_VERIFICATION_EVENTS = new Set([
    'Armed Conflict',
    'Military Action',
    'Unconventional Violence',
]);

// Minimum thresholds for event display
const THRESHOLDS = {
    // For low-risk countries + high-verification events
    lowRiskConflict: {
        minSources: 10,
        minArticles: 15,
        minMentions: 50,
    },
    // For high-verification events in any country
    highVerification: {
        minSources: 5,
        minArticles: 8,
        minMentions: 20,
    },
    // For regular events
    regular: {
        minSources: 2,
        minArticles: 3,
        minMentions: 5,
    }
};

// Domains that should NOT be used for conflict/military news
const ENTERTAINMENT_DOMAINS = new Set([
    'somersetlive.co.uk',
    'express.co.uk',
    'dailymail.co.uk',
    'thesun.co.uk',
    'mirror.co.uk',
    'buzzfeed.com',
    'tmz.com',
    'eonline.com',
    'entertainment',
    'lifestyle',
    'gaming',
    'sports',
]);

// Keywords that indicate FALSE content (entertainment, not real events)
const FALSE_CONTENT_KEYWORDS = [
    'lego',
    'pokemon',
    'game',
    'movie',
    'film',
    'trailer',
    'celebrity',
    'star wars',
    'marvel',
    'video game',
    'playstation',
    'xbox',
    'nintendo',
    'fortnite',
    'minecraft',
    'streaming',
    'netflix',
    'disney',
];

/**
 * Check if an event should be displayed (passes verification)
 */
export function verifyEvent(event: AggregatedEvent): {
    isValid: boolean;
    reason?: string;
} {
    const countryLower = event.country.toLowerCase();
    const isLowRisk = LOW_RISK_COUNTRIES.has(countryLower);
    const isHighVerification = HIGH_VERIFICATION_EVENTS.has(event.eventType);

    // Get appropriate thresholds
    let thresholds = THRESHOLDS.regular;

    if (isLowRisk && isHighVerification) {
        thresholds = THRESHOLDS.lowRiskConflict;
    } else if (isHighVerification) {
        thresholds = THRESHOLDS.highVerification;
    }

    // Check thresholds
    if (event.gdelt.numSources < thresholds.minSources) {
        return {
            isValid: false,
            reason: `Insufficient sources: ${event.gdelt.numSources}/${thresholds.minSources}`
        };
    }

    if (event.gdelt.numArticles < thresholds.minArticles) {
        return {
            isValid: false,
            reason: `Insufficient articles: ${event.gdelt.numArticles}/${thresholds.minArticles}`
        };
    }

    if (event.gdelt.mediaVolume < thresholds.minMentions) {
        return {
            isValid: false,
            reason: `Insufficient coverage: ${event.gdelt.mediaVolume}/${thresholds.minMentions}`
        };
    }

    return { isValid: true };
}

/**
 * Check if article content is actually about the claimed event (not entertainment)
 */
export function verifyArticleContent(content: string): {
    isValid: boolean;
    reason?: string;
} {
    const lowerContent = content.toLowerCase();

    // Check for false content keywords
    for (const keyword of FALSE_CONTENT_KEYWORDS) {
        if (lowerContent.includes(keyword)) {
            return {
                isValid: false,
                reason: `Content contains entertainment keyword: ${keyword}`
            };
        }
    }

    return { isValid: true };
}

/**
 * Check if a source domain is valid for serious news
 */
export function verifySourceDomain(url: string): boolean {
    const lowerUrl = url.toLowerCase();

    for (const domain of ENTERTAINMENT_DOMAINS) {
        if (lowerUrl.includes(domain)) {
            return false;
        }
    }

    return true;
}

/**
 * Filter events list to only verified events
 */
export function filterVerifiedEvents(events: AggregatedEvent[]): AggregatedEvent[] {
    return events.filter(event => {
        const verification = verifyEvent(event);
        if (!verification.isValid) {
            console.log(`[Verify] Filtered: ${event.title} - ${verification.reason}`);
        }
        return verification.isValid;
    });
}

// Country code to full name mapping
export const COUNTRY_NAMES: Record<string, string> = {
    'AF': 'Afghanistan',
    'AL': 'Albania',
    'DZ': 'Algeria',
    'AD': 'Andorra',
    'AO': 'Angola',
    'AR': 'Argentina',
    'AM': 'Armenia',
    'AU': 'Australia',
    'AT': 'Austria',
    'AZ': 'Azerbaijan',
    'BD': 'Bangladesh',
    'BY': 'Belarus',
    'BE': 'Belgium',
    'BJ': 'Benin',
    'BO': 'Bolivia',
    'BA': 'Bosnia and Herzegovina',
    'BR': 'Brazil',
    'BG': 'Bulgaria',
    'BF': 'Burkina Faso',
    'BI': 'Burundi',
    'KH': 'Cambodia',
    'CM': 'Cameroon',
    'CA': 'Canada',
    'CF': 'Central African Republic',
    'TD': 'Chad',
    'CL': 'Chile',
    'CN': 'China',
    'CH': 'China', // Note: sometimes CH is used for China
    'CO': 'Colombia',
    'CD': 'DR Congo',
    'CG': 'Congo',
    'HR': 'Croatia',
    'CU': 'Cuba',
    'CY': 'Cyprus',
    'CZ': 'Czech Republic',
    'DA': 'Denmark', // DA is NOT a valid ISO code but GDELT uses it
    'DK': 'Denmark',
    'EG': 'Egypt',
    'SV': 'El Salvador',
    'ER': 'Eritrea',
    'EE': 'Estonia',
    'ET': 'Ethiopia',
    'FI': 'Finland',
    'FR': 'France',
    'DE': 'Germany',
    'GH': 'Ghana',
    'GR': 'Greece',
    'GT': 'Guatemala',
    'GN': 'Guinea',
    'HT': 'Haiti',
    'HN': 'Honduras',
    'HU': 'Hungary',
    'IS': 'Iceland',
    'IN': 'India',
    'ID': 'Indonesia',
    'IR': 'Iran',
    'IQ': 'Iraq',
    'IE': 'Ireland',
    'IL': 'Israel',
    'IT': 'Italy',
    'JP': 'Japan',
    'JO': 'Jordan',
    'KZ': 'Kazakhstan',
    'KE': 'Kenya',
    'KW': 'Kuwait',
    'KG': 'Kyrgyzstan',
    'LA': 'Laos',
    'LV': 'Latvia',
    'LB': 'Lebanon',
    'LY': 'Libya',
    'LT': 'Lithuania',
    'LU': 'Luxembourg',
    'MK': 'North Macedonia',
    'MG': 'Madagascar',
    'MY': 'Malaysia',
    'ML': 'Mali',
    'MT': 'Malta',
    'MX': 'Mexico',
    'MD': 'Moldova',
    'MN': 'Mongolia',
    'ME': 'Montenegro',
    'MA': 'Morocco',
    'MZ': 'Mozambique',
    'MM': 'Myanmar',
    'NA': 'Namibia',
    'NP': 'Nepal',
    'NL': 'Netherlands',
    'NZ': 'New Zealand',
    'NI': 'Nicaragua',
    'NE': 'Niger',
    'NG': 'Nigeria',
    'KP': 'North Korea',
    'NO': 'Norway',
    'OM': 'Oman',
    'PK': 'Pakistan',
    'PS': 'Palestine',
    'PA': 'Panama',
    'PG': 'Papua New Guinea',
    'PY': 'Paraguay',
    'PE': 'Peru',
    'PH': 'Philippines',
    'PL': 'Poland',
    'PT': 'Portugal',
    'QA': 'Qatar',
    'RO': 'Romania',
    'RU': 'Russia',
    'RW': 'Rwanda',
    'SA': 'Saudi Arabia',
    'SN': 'Senegal',
    'RS': 'Serbia',
    'SG': 'Singapore',
    'SK': 'Slovakia',
    'SI': 'Slovenia',
    'SO': 'Somalia',
    'ZA': 'South Africa',
    'KR': 'South Korea',
    'SS': 'South Sudan',
    'ES': 'Spain',
    'LK': 'Sri Lanka',
    'SD': 'Sudan',
    'SE': 'Sweden',
    'SY': 'Syria',
    'TW': 'Taiwan',
    'TJ': 'Tajikistan',
    'TZ': 'Tanzania',
    'TH': 'Thailand',
    'TN': 'Tunisia',
    'TR': 'Turkey',
    'TM': 'Turkmenistan',
    'UG': 'Uganda',
    'UA': 'Ukraine',
    'AE': 'United Arab Emirates',
    'GB': 'United Kingdom',
    'UK': 'United Kingdom',
    'US': 'United States',
    'UY': 'Uruguay',
    'UZ': 'Uzbekistan',
    'VE': 'Venezuela',
    'VN': 'Vietnam',
    'YE': 'Yemen',
    'ZM': 'Zambia',
    'ZW': 'Zimbabwe',
};

/**
 * Get full country name from code
 */
export function getCountryName(codeOrName: string | undefined | null): string {
    // Handle undefined/null
    if (!codeOrName) {
        return 'Unknown';
    }

    // If it's already a full name, return it
    if (codeOrName.length > 3) {
        return codeOrName;
    }

    // Look up the code
    const upper = codeOrName.toUpperCase();
    return COUNTRY_NAMES[upper] || codeOrName;
}
