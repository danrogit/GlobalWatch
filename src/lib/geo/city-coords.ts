/**
 * City Coordinates Database
 * 
 * Provides accurate lat/lon for cities mentioned in articles.
 * Used for precise event placement on maps.
 */

export interface CityCoords {
    lat: number;
    lon: number;
    country: string;
}

// Major world cities with accurate coordinates
export const CITY_COORDS: Record<string, CityCoords> = {
    // === DENMARK ===
    'copenhagen': { lat: 55.6761, lon: 12.5683, country: 'Denmark' },
    'københavn': { lat: 55.6761, lon: 12.5683, country: 'Denmark' },
    'aarhus': { lat: 56.1629, lon: 10.2039, country: 'Denmark' },
    'odense': { lat: 55.4038, lon: 10.4024, country: 'Denmark' },
    'aalborg': { lat: 57.0488, lon: 9.9217, country: 'Denmark' },
    'esbjerg': { lat: 55.4667, lon: 8.4500, country: 'Denmark' },
    'randers': { lat: 56.4607, lon: 10.0362, country: 'Denmark' },
    'kolding': { lat: 55.4904, lon: 9.4708, country: 'Denmark' },
    'horsens': { lat: 55.8607, lon: 9.8500, country: 'Denmark' },
    'vejle': { lat: 55.7093, lon: 9.5357, country: 'Denmark' },
    'roskilde': { lat: 55.6419, lon: 12.0878, country: 'Denmark' },
    'herning': { lat: 56.1394, lon: 8.9733, country: 'Denmark' },
    'silkeborg': { lat: 56.1697, lon: 9.5453, country: 'Denmark' },
    'fredericia': { lat: 55.5658, lon: 9.7526, country: 'Denmark' },
    'viborg': { lat: 56.4532, lon: 9.4020, country: 'Denmark' },
    'holstebro': { lat: 56.3600, lon: 8.6167, country: 'Denmark' },
    'slagelse': { lat: 55.4028, lon: 11.3544, country: 'Denmark' },
    'hillerød': { lat: 55.9333, lon: 12.3000, country: 'Denmark' },
    'sønderborg': { lat: 54.9092, lon: 9.7922, country: 'Denmark' },
    'hjørring': { lat: 57.4667, lon: 9.9833, country: 'Denmark' },
    'frederikshavn': { lat: 57.4333, lon: 10.5333, country: 'Denmark' },
    'ringsted': { lat: 55.4333, lon: 11.7833, country: 'Denmark' },
    'haderslev': { lat: 55.2531, lon: 9.4894, country: 'Denmark' },
    'svendborg': { lat: 55.0667, lon: 10.6167, country: 'Denmark' },
    'nyborg': { lat: 55.3128, lon: 10.7897, country: 'Denmark' },

    // === USA ===
    'washington': { lat: 38.9072, lon: -77.0369, country: 'USA' },
    'washington dc': { lat: 38.9072, lon: -77.0369, country: 'USA' },
    'washington d.c.': { lat: 38.9072, lon: -77.0369, country: 'USA' },
    'new york': { lat: 40.7128, lon: -74.0060, country: 'USA' },
    'new york city': { lat: 40.7128, lon: -74.0060, country: 'USA' },
    'nyc': { lat: 40.7128, lon: -74.0060, country: 'USA' },
    'los angeles': { lat: 34.0522, lon: -118.2437, country: 'USA' },
    'la': { lat: 34.0522, lon: -118.2437, country: 'USA' },
    'chicago': { lat: 41.8781, lon: -87.6298, country: 'USA' },
    'houston': { lat: 29.7604, lon: -95.3698, country: 'USA' },
    'phoenix': { lat: 33.4484, lon: -112.0740, country: 'USA' },
    'philadelphia': { lat: 39.9526, lon: -75.1652, country: 'USA' },
    'san antonio': { lat: 29.4241, lon: -98.4936, country: 'USA' },
    'san diego': { lat: 32.7157, lon: -117.1611, country: 'USA' },
    'dallas': { lat: 32.7767, lon: -96.7970, country: 'USA' },
    'san jose': { lat: 37.3382, lon: -121.8863, country: 'USA' },
    'austin': { lat: 30.2672, lon: -97.7431, country: 'USA' },
    'jacksonville': { lat: 30.3322, lon: -81.6557, country: 'USA' },
    'san francisco': { lat: 37.7749, lon: -122.4194, country: 'USA' },
    'seattle': { lat: 47.6062, lon: -122.3321, country: 'USA' },
    'denver': { lat: 39.7392, lon: -104.9903, country: 'USA' },
    'boston': { lat: 42.3601, lon: -71.0589, country: 'USA' },
    'atlanta': { lat: 33.7490, lon: -84.3880, country: 'USA' },
    'miami': { lat: 25.7617, lon: -80.1918, country: 'USA' },
    'detroit': { lat: 42.3314, lon: -83.0458, country: 'USA' },
    'las vegas': { lat: 36.1699, lon: -115.1398, country: 'USA' },
    'portland': { lat: 45.5152, lon: -122.6784, country: 'USA' },
    'baltimore': { lat: 39.2904, lon: -76.6122, country: 'USA' },
    'cleveland': { lat: 41.4993, lon: -81.6944, country: 'USA' },
    'pittsburgh': { lat: 40.4406, lon: -79.9959, country: 'USA' },
    'the pentagon': { lat: 38.8719, lon: -77.0563, country: 'USA' },
    'white house': { lat: 38.8977, lon: -77.0365, country: 'USA' },
    'capitol hill': { lat: 38.8899, lon: -77.0091, country: 'USA' },

    // === UK ===
    'london': { lat: 51.5074, lon: -0.1278, country: 'UK' },
    'manchester': { lat: 53.4808, lon: -2.2426, country: 'UK' },
    'birmingham': { lat: 52.4862, lon: -1.8904, country: 'UK' },
    'glasgow': { lat: 55.8642, lon: -4.2518, country: 'UK' },
    'liverpool': { lat: 53.4084, lon: -2.9916, country: 'UK' },
    'edinburgh': { lat: 55.9533, lon: -3.1883, country: 'UK' },
    'leeds': { lat: 53.8008, lon: -1.5491, country: 'UK' },
    'bristol': { lat: 51.4545, lon: -2.5879, country: 'UK' },
    'sheffield': { lat: 53.3811, lon: -1.4701, country: 'UK' },
    'newcastle': { lat: 54.9783, lon: -1.6178, country: 'UK' },
    'cardiff': { lat: 51.4816, lon: -3.1791, country: 'UK' },
    'belfast': { lat: 54.5973, lon: -5.9301, country: 'UK' },
    'westminster': { lat: 51.4975, lon: -0.1357, country: 'UK' },
    'downing street': { lat: 51.5033, lon: -0.1276, country: 'UK' },

    // === GERMANY ===
    'berlin': { lat: 52.5200, lon: 13.4050, country: 'Germany' },
    'munich': { lat: 48.1351, lon: 11.5820, country: 'Germany' },
    'münchen': { lat: 48.1351, lon: 11.5820, country: 'Germany' },
    'hamburg': { lat: 53.5511, lon: 9.9937, country: 'Germany' },
    'frankfurt': { lat: 50.1109, lon: 8.6821, country: 'Germany' },
    'cologne': { lat: 50.9375, lon: 6.9603, country: 'Germany' },
    'köln': { lat: 50.9375, lon: 6.9603, country: 'Germany' },
    'düsseldorf': { lat: 51.2277, lon: 6.7735, country: 'Germany' },
    'stuttgart': { lat: 48.7758, lon: 9.1829, country: 'Germany' },

    // === FRANCE ===
    'paris': { lat: 48.8566, lon: 2.3522, country: 'France' },
    'marseille': { lat: 43.2965, lon: 5.3698, country: 'France' },
    'lyon': { lat: 45.7640, lon: 4.8357, country: 'France' },
    'toulouse': { lat: 43.6047, lon: 1.4442, country: 'France' },
    'nice': { lat: 43.7102, lon: 7.2620, country: 'France' },
    'nantes': { lat: 47.2184, lon: -1.5536, country: 'France' },
    'strasbourg': { lat: 48.5734, lon: 7.7521, country: 'France' },
    'bordeaux': { lat: 44.8378, lon: -0.5792, country: 'France' },

    // === RUSSIA ===
    'moscow': { lat: 55.7558, lon: 37.6173, country: 'Russia' },
    'moskva': { lat: 55.7558, lon: 37.6173, country: 'Russia' },
    'st petersburg': { lat: 59.9343, lon: 30.3351, country: 'Russia' },
    'saint petersburg': { lat: 59.9343, lon: 30.3351, country: 'Russia' },
    'the kremlin': { lat: 55.7520, lon: 37.6175, country: 'Russia' },
    'kremlin': { lat: 55.7520, lon: 37.6175, country: 'Russia' },

    // === CHINA ===
    'beijing': { lat: 39.9042, lon: 116.4074, country: 'China' },
    'shanghai': { lat: 31.2304, lon: 121.4737, country: 'China' },
    'hong kong': { lat: 22.3193, lon: 114.1694, country: 'China' },
    'shenzhen': { lat: 22.5431, lon: 114.0579, country: 'China' },
    'guangzhou': { lat: 23.1291, lon: 113.2644, country: 'China' },
    'chengdu': { lat: 30.5728, lon: 104.0668, country: 'China' },
    'taipei': { lat: 25.0330, lon: 121.5654, country: 'Taiwan' },
    'tiananmen': { lat: 39.9054, lon: 116.3976, country: 'China' },

    // === JAPAN ===
    'tokyo': { lat: 35.6762, lon: 139.6503, country: 'Japan' },
    'osaka': { lat: 34.6937, lon: 135.5023, country: 'Japan' },
    'kyoto': { lat: 35.0116, lon: 135.7681, country: 'Japan' },
    'nagoya': { lat: 35.1815, lon: 136.9066, country: 'Japan' },
    'hiroshima': { lat: 34.3853, lon: 132.4553, country: 'Japan' },
    'fukushima': { lat: 37.7500, lon: 140.4667, country: 'Japan' },

    // === INDIA ===
    'delhi': { lat: 28.6139, lon: 77.2090, country: 'India' },
    'new delhi': { lat: 28.6139, lon: 77.2090, country: 'India' },
    'mumbai': { lat: 19.0760, lon: 72.8777, country: 'India' },
    'bombay': { lat: 19.0760, lon: 72.8777, country: 'India' },
    'bangalore': { lat: 12.9716, lon: 77.5946, country: 'India' },
    'chennai': { lat: 13.0827, lon: 80.2707, country: 'India' },
    'kolkata': { lat: 22.5726, lon: 88.3639, country: 'India' },
    'hyderabad': { lat: 17.3850, lon: 78.4867, country: 'India' },

    // === MIDDLE EAST ===
    'tel aviv': { lat: 32.0853, lon: 34.7818, country: 'Israel' },
    'jerusalem': { lat: 31.7683, lon: 35.2137, country: 'Israel' },
    'gaza': { lat: 31.5000, lon: 34.4667, country: 'Palestine' },
    'gaza strip': { lat: 31.3547, lon: 34.3088, country: 'Palestine' },
    'west bank': { lat: 31.9522, lon: 35.2332, country: 'Palestine' },
    'ramallah': { lat: 31.9038, lon: 35.2034, country: 'Palestine' },
    'tehran': { lat: 35.6892, lon: 51.3890, country: 'Iran' },
    'damascus': { lat: 33.5138, lon: 36.2765, country: 'Syria' },
    'aleppo': { lat: 36.2021, lon: 37.1343, country: 'Syria' },
    'beirut': { lat: 33.8938, lon: 35.5018, country: 'Lebanon' },
    'baghdad': { lat: 33.3152, lon: 44.3661, country: 'Iraq' },
    'riyadh': { lat: 24.7136, lon: 46.6753, country: 'Saudi Arabia' },
    'dubai': { lat: 25.2048, lon: 55.2708, country: 'UAE' },
    'doha': { lat: 25.2854, lon: 51.5310, country: 'Qatar' },
    'ankara': { lat: 39.9334, lon: 32.8597, country: 'Turkey' },
    'istanbul': { lat: 41.0082, lon: 28.9784, country: 'Turkey' },
    'cairo': { lat: 30.0444, lon: 31.2357, country: 'Egypt' },

    // === AUSTRALIA ===
    'sydney': { lat: -33.8688, lon: 151.2093, country: 'Australia' },
    'melbourne': { lat: -37.8136, lon: 144.9631, country: 'Australia' },
    'brisbane': { lat: -27.4698, lon: 153.0251, country: 'Australia' },
    'perth': { lat: -31.9505, lon: 115.8605, country: 'Australia' },
    'adelaide': { lat: -34.9285, lon: 138.6007, country: 'Australia' },
    'canberra': { lat: -35.2809, lon: 149.1300, country: 'Australia' },

    // === EUROPE ===
    'amsterdam': { lat: 52.3676, lon: 4.9041, country: 'Netherlands' },
    'brussels': { lat: 50.8503, lon: 4.3517, country: 'Belgium' },
    'vienna': { lat: 48.2082, lon: 16.3738, country: 'Austria' },
    'zurich': { lat: 47.3769, lon: 8.5417, country: 'Switzerland' },
    'geneva': { lat: 46.2044, lon: 6.1432, country: 'Switzerland' },
    'warsaw': { lat: 52.2297, lon: 21.0122, country: 'Poland' },
    'krakow': { lat: 50.0647, lon: 19.9450, country: 'Poland' },
    'kyiv': { lat: 50.4501, lon: 30.5234, country: 'Ukraine' },
    'kiev': { lat: 50.4501, lon: 30.5234, country: 'Ukraine' },
    'kharkiv': { lat: 49.9935, lon: 36.2304, country: 'Ukraine' },
    'odesa': { lat: 46.4825, lon: 30.7233, country: 'Ukraine' },
    'madrid': { lat: 40.4168, lon: -3.7038, country: 'Spain' },
    'barcelona': { lat: 41.3851, lon: 2.1734, country: 'Spain' },
    'rome': { lat: 41.9028, lon: 12.4964, country: 'Italy' },
    'milan': { lat: 45.4642, lon: 9.1900, country: 'Italy' },
    'vatican': { lat: 41.9029, lon: 12.4534, country: 'Vatican' },
    'athens': { lat: 37.9838, lon: 23.7275, country: 'Greece' },
    'lisbon': { lat: 38.7223, lon: -9.1393, country: 'Portugal' },
    'dublin': { lat: 53.3498, lon: -6.2603, country: 'Ireland' },
    'prague': { lat: 50.0755, lon: 14.4378, country: 'Czech Republic' },
    'budapest': { lat: 47.4979, lon: 19.0402, country: 'Hungary' },
    'bucharest': { lat: 44.4268, lon: 26.1025, country: 'Romania' },
    'stockholm': { lat: 59.3293, lon: 18.0686, country: 'Sweden' },
    'oslo': { lat: 59.9139, lon: 10.7522, country: 'Norway' },
    'helsinki': { lat: 60.1699, lon: 24.9384, country: 'Finland' },
    'reykjavik': { lat: 64.1466, lon: -21.9426, country: 'Iceland' },

    // === AMERICAS ===
    'toronto': { lat: 43.6532, lon: -79.3832, country: 'Canada' },
    'vancouver': { lat: 49.2827, lon: -123.1207, country: 'Canada' },
    'montreal': { lat: 45.5017, lon: -73.5673, country: 'Canada' },
    'ottawa': { lat: 45.4215, lon: -75.6972, country: 'Canada' },
    'mexico city': { lat: 19.4326, lon: -99.1332, country: 'Mexico' },
    'sao paulo': { lat: -23.5505, lon: -46.6333, country: 'Brazil' },
    'rio de janeiro': { lat: -22.9068, lon: -43.1729, country: 'Brazil' },
    'brasilia': { lat: -15.8267, lon: -47.9218, country: 'Brazil' },
    'buenos aires': { lat: -34.6037, lon: -58.3816, country: 'Argentina' },
    'santiago': { lat: -33.4489, lon: -70.6693, country: 'Chile' },
    'bogota': { lat: 4.7110, lon: -74.0721, country: 'Colombia' },
    'lima': { lat: -12.0464, lon: -77.0428, country: 'Peru' },
    'caracas': { lat: 10.4806, lon: -66.9036, country: 'Venezuela' },
    'havana': { lat: 23.1136, lon: -82.3666, country: 'Cuba' },

    // === AFRICA ===
    'cape town': { lat: -33.9249, lon: 18.4241, country: 'South Africa' },
    'johannesburg': { lat: -26.2041, lon: 28.0473, country: 'South Africa' },
    'pretoria': { lat: -25.7479, lon: 28.2293, country: 'South Africa' },
    'lagos': { lat: 6.5244, lon: 3.3792, country: 'Nigeria' },
    'nairobi': { lat: -1.2921, lon: 36.8219, country: 'Kenya' },
    'addis ababa': { lat: 9.0320, lon: 38.7620, country: 'Ethiopia' },
    'casablanca': { lat: 33.5731, lon: -7.5898, country: 'Morocco' },
    'algiers': { lat: 36.7538, lon: 3.0588, country: 'Algeria' },
    'tunis': { lat: 36.8065, lon: 10.1815, country: 'Tunisia' },
    'tripoli': { lat: 32.8872, lon: 13.1913, country: 'Libya' },
    'khartoum': { lat: 15.5007, lon: 32.5599, country: 'Sudan' },
    'kinshasa': { lat: -4.4419, lon: 15.2663, country: 'Democratic Republic of the Congo' },

    // === ASIA ===
    'singapore': { lat: 1.3521, lon: 103.8198, country: 'Singapore' },
    'kuala lumpur': { lat: 3.1390, lon: 101.6869, country: 'Malaysia' },
    'jakarta': { lat: -6.2088, lon: 106.8456, country: 'Indonesia' },
    'bangkok': { lat: 13.7563, lon: 100.5018, country: 'Thailand' },
    'hanoi': { lat: 21.0278, lon: 105.8342, country: 'Vietnam' },
    'ho chi minh city': { lat: 10.8231, lon: 106.6297, country: 'Vietnam' },
    'manila': { lat: 14.5995, lon: 120.9842, country: 'Philippines' },
    'islamabad': { lat: 33.6844, lon: 73.0479, country: 'Pakistan' },
    'karachi': { lat: 24.8607, lon: 67.0011, country: 'Pakistan' },
    'dhaka': { lat: 23.8103, lon: 90.4125, country: 'Bangladesh' },
    'kabul': { lat: 34.5553, lon: 69.2075, country: 'Afghanistan' },
    'pyongyang': { lat: 39.0392, lon: 125.7625, country: 'North Korea' },
    'seoul': { lat: 37.5665, lon: 126.9780, country: 'South Korea' },
};

/**
 * Extract city coordinates from text
 * Returns the first matching city found
 */
export function extractCityFromText(text: string): CityCoords | null {
    const lowerText = text.toLowerCase();

    // Sort by city name length (longest first) to match "new york city" before "new york"
    const sortedCities = Object.entries(CITY_COORDS)
        .sort((a, b) => b[0].length - a[0].length);

    for (const [cityName, coords] of sortedCities) {
        // Use word boundaries for better matching
        const pattern = new RegExp(`\\b${cityName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (pattern.test(lowerText)) {
            return coords;
        }
    }

    return null;
}

/**
 * Get coordinates for a city name
 */
export function getCityCoords(cityName: string): CityCoords | null {
    return CITY_COORDS[cityName.toLowerCase()] || null;
}
