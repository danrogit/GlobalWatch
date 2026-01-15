/**
 * Country Emoji Flags
 * Maps country names to their flag emoji
 */

export const COUNTRY_EMOJI: Record<string, string> = {
    // Scandinavia
    'Denmark': '🇩🇰',
    'Danmark': '🇩🇰',
    'Sweden': '🇸🇪',
    'Norge': '🇳🇴',
    'Norway': '🇳🇴',
    'Finland': '🇫🇮',
    'Iceland': '🇮🇸',

    // Major powers
    'USA': '🇺🇸',
    'United States': '🇺🇸',
    'UK': '🇬🇧',
    'United Kingdom': '🇬🇧',
    'Germany': '🇩🇪',
    'France': '🇫🇷',
    'Russia': '🇷🇺',
    'China': '🇨🇳',
    'Japan': '🇯🇵',
    'India': '🇮🇳',

    // Europe
    'Netherlands': '🇳🇱',
    'Belgium': '🇧🇪',
    'Austria': '🇦🇹',
    'Switzerland': '🇨🇭',
    'Poland': '🇵🇱',
    'Ukraine': '🇺🇦',
    'Spain': '🇪🇸',
    'Italy': '🇮🇹',
    'Portugal': '🇵🇹',
    'Greece': '🇬🇷',
    'Ireland': '🇮🇪',
    'Czech Republic': '🇨🇿',
    'Hungary': '🇭🇺',
    'Romania': '🇷🇴',
    'Turkey': '🇹🇷',

    // Middle East
    'Israel': '🇮🇱',
    'Palestine': '🇵🇸',
    'Iran': '🇮🇷',
    'Iraq': '🇮🇶',
    'Syria': '🇸🇾',
    'Saudi Arabia': '🇸🇦',
    'UAE': '🇦🇪',
    'Qatar': '🇶🇦',
    'Egypt': '🇪🇬',

    // Asia
    'South Korea': '🇰🇷',
    'North Korea': '🇰🇵',
    'Taiwan': '🇹🇼',
    'Hong Kong': '🇭🇰',
    'Thailand': '🇹🇭',
    'Vietnam': '🇻🇳',
    'Indonesia': '🇮🇩',
    'Malaysia': '🇲🇾',
    'Singapore': '🇸🇬',
    'Philippines': '🇵🇭',
    'Pakistan': '🇵🇰',

    // Americas
    'Canada': '🇨🇦',
    'Mexico': '🇲🇽',
    'Brazil': '🇧🇷',
    'Argentina': '🇦🇷',
    'Colombia': '🇨🇴',
    'Chile': '🇨🇱',
    'Venezuela': '🇻🇪',
    'Cuba': '🇨🇺',

    // Oceania
    'Australia': '🇦🇺',
    'New Zealand': '🇳🇿',

    // Africa
    'South Africa': '🇿🇦',
    'Nigeria': '🇳🇬',
    'Kenya': '🇰🇪',
    'Ethiopia': '🇪🇹',
    'Morocco': '🇲🇦',
    'Algeria': '🇩🇿',
    'Africa': '🌍',

    // Fallback
    'Ukendt': '🌐',
    'Unknown': '🌐',
    'Global': '🌐',
};

/**
 * Get country emoji flag
 */
export function getCountryEmoji(country: string): string {
    return COUNTRY_EMOJI[country] || '🌐';
}
