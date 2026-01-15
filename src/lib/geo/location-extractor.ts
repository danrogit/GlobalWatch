/**
 * Location Extractor
 * 
 * Extracts location names (cities, countries) from article text
 * Uses regex patterns and keyword matching
 */

// Major Danish cities
const DANISH_CITIES = [
    'København', 'Copenhagen', 'Aarhus', 'Odense', 'Aalborg', 'Esbjerg',
    'Randers', 'Kolding', 'Horsens', 'Vejle', 'Roskilde', 'Herning',
    'Silkeborg', 'Næstved', 'Fredericia', 'Viborg', 'Køge', 'Holstebro',
    'Taastrup', 'Slagelse', 'Hillerød', 'Holbæk', 'Sønderborg', 'Hjørring',
    'Frederikshavn', 'Nørresundby', 'Ringsted', 'Haderslev', 'Middelfart',
    'Skanderborg', 'Frederikssund', 'Svendborg', 'Nyborg', 'Grenaa'
];

// Major world countries (English names)
const COUNTRIES = [
    'Denmark', 'Sweden', 'Norway', 'Finland', 'Germany', 'France', 'UK',
    'United Kingdom', 'United States', 'USA', 'Russia', 'China', 'Japan',
    'India', 'Brazil', 'Australia', 'Canada', 'Spain', 'Italy', 'Poland',
    'Ukraine', 'Israel', 'Palestine', 'Iran', 'Turkey', 'Egypt', 'South Africa',
    'Mexico', 'Argentina', 'Netherlands', 'Belgium', 'Austria', 'Switzerland',
    'Greece', 'Portugal', 'Czech Republic', 'Romania', 'Hungary', 'Ireland'
];

// Major world capitals and cities
const MAJOR_CITIES = [
    'Washington', 'New York', 'Los Angeles', 'London', 'Paris', 'Berlin',
    'Moscow', 'Beijing', 'Shanghai', 'Tokyo', 'Mumbai', 'Delhi', 'Sydney',
    'Melbourne', 'Toronto', 'Rome', 'Madrid', 'Barcelona', 'Amsterdam',
    'Brussels', 'Vienna', 'Warsaw', 'Prague', 'Budapest', 'Athens',
    'Stockholm', 'Oslo', 'Helsinki', 'Kyiv', 'Kiev', 'Tel Aviv', 'Jerusalem',
    'Tehran', 'Ankara', 'Istanbul', 'Cairo', 'Cape Town', 'Dubai', 'Singapore'
];

export interface ExtractedLocation {
    name: string;
    type: 'city' | 'country';
    confidence: number; // 0-1
}

/**
 * Extract location from article title and description
 */
export function extractLocation(title: string, description?: string): ExtractedLocation | null {
    const text = `${title} ${description || ''}`;

    // Pattern: "in [Location]" or "[Location] -" or "[Location]:"
    const patterns = [
        /\bin\s+([A-ZÆØÅ][a-zæøå]+(?:\s+[A-ZÆØÅ][a-zæøå]+)?)/g,
        /^([A-ZÆØÅ][a-zæøå]+(?:\s+[A-ZÆØÅ][a-zæøå]+)?)\s*[-:]/g,
        /\bfrom\s+([A-ZÆØÅ][a-zæøå]+(?:\s+[A-ZÆØÅ][a-zæøå]+)?)/gi,
        /\bnear\s+([A-ZÆØÅ][a-zæøå]+(?:\s+[A-ZÆØÅ][a-zæøå]+)?)/gi,
    ];

    // Check for Danish cities first (highest priority for this app)
    for (const city of DANISH_CITIES) {
        if (text.includes(city)) {
            return {
                name: city,
                type: 'city',
                confidence: 0.9
            };
        }
    }

    // Check for major world cities
    for (const city of MAJOR_CITIES) {
        if (text.includes(city)) {
            return {
                name: city,
                type: 'city',
                confidence: 0.8
            };
        }
    }

    // Try regex patterns
    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            const potentialLocation = match[1];

            // Check if it's a known country
            if (COUNTRIES.includes(potentialLocation)) {
                return {
                    name: potentialLocation,
                    type: 'country',
                    confidence: 0.85
                };
            }

            // Check if it's a known city
            if (MAJOR_CITIES.includes(potentialLocation) || DANISH_CITIES.includes(potentialLocation)) {
                return {
                    name: potentialLocation,
                    type: 'city',
                    confidence: 0.75
                };
            }
        }
    }

    // Check for country mentions
    for (const country of COUNTRIES) {
        if (text.includes(country)) {
            return {
                name: country,
                type: 'country',
                confidence: 0.7
            };
        }
    }

    return null;
}

/**
 * Extract country from feed URL based on domain
 */
export function extractCountryFromUrl(feedUrl: string): string | null {
    const lowerUrl = feedUrl.toLowerCase();

    // Domain to Country mappings (80+ domains)
    const DOMAIN_COUNTRIES: Record<string, string> = {
        // Denmark
        'dr.dk': 'Denmark', 'tv2.dk': 'Denmark', 'politiken.dk': 'Denmark',
        'berlingske.dk': 'Denmark', 'jyllands-posten.dk': 'Denmark', 'ekstrabladet.dk': 'Denmark',
        'borsen.dk': 'Denmark', 'finans.dk': 'Denmark', 'altinget.dk': 'Denmark',
        'fyens.dk': 'Denmark', 'nordjyske.dk': 'Denmark', 'jv.dk': 'Denmark',

        // USA
        'nytimes.com': 'USA', 'washingtonpost.com': 'USA', 'cnn.com': 'USA',
        'foxnews.com': 'USA', 'nbcnews.com': 'USA', 'cbsnews.com': 'USA',
        'abcnews.go.com': 'USA', 'usatoday.com': 'USA', 'wsj.com': 'USA',
        'bloomberg.com': 'USA', 'reuters.com': 'USA', 'apnews.com': 'USA',
        'politico.com': 'USA', 'thehill.com': 'USA', 'axios.com': 'USA',
        'npr.org': 'USA', 'pbs.org': 'USA', 'vox.com': 'USA', 'huffpost.com': 'USA',
        'newsweek.com': 'USA', 'time.com': 'USA', 'latimes.com': 'USA',
        'chicagotribune.com': 'USA', 'nypost.com': 'USA', 'dailywire.com': 'USA',

        // UK
        'bbc.co.uk': 'UK', 'bbc.com': 'UK', 'theguardian.com': 'UK',
        'telegraph.co.uk': 'UK', 'independent.co.uk': 'UK', 'dailymail.co.uk': 'UK',
        'mirror.co.uk': 'UK', 'express.co.uk': 'UK', 'thesun.co.uk': 'UK',
        'thetimes.co.uk': 'UK', 'ft.com': 'UK', 'sky.com': 'UK',

        // Germany
        'dw.com': 'Germany', 'spiegel.de': 'Germany', 'zeit.de': 'Germany',
        'faz.net': 'Germany', 'sueddeutsche.de': 'Germany', 'bild.de': 'Germany',

        // France  
        'lemonde.fr': 'France', 'france24.com': 'France', 'lefigaro.fr': 'France',
        'liberation.fr': 'France', 'rfi.fr': 'France',

        // Russia
        'tass.com': 'Russia', 'themoscowtimes.com': 'Russia', 'rt.com': 'Russia',

        // China
        'scmp.com': 'China', 'globaltimes.cn': 'China', 'chinadaily.com.cn': 'China',

        // India
        'timesofindia.indiatimes.com': 'India', 'hindustantimes.com': 'India',
        'thehindu.com': 'India', 'ndtv.com': 'India', 'indiatoday.in': 'India',

        // Middle East
        'aljazeera.com': 'Qatar', 'timesofisrael.com': 'Israel', 'haaretz.com': 'Israel',
        'arabnews.com': 'Saudi Arabia', 'gulfnews.com': 'UAE',

        // Australia
        'abc.net.au': 'Australia', 'smh.com.au': 'Australia', 'theaustralian.com.au': 'Australia',
        'news.com.au': 'Australia', '9news.com.au': 'Australia',

        // Japan
        'japantimes.co.jp': 'Japan', 'asahi.com': 'Japan', 'mainichi.jp': 'Japan',

        // Other Europe
        'svt.se': 'Sweden', 'aftenposten.no': 'Norway', 'yle.fi': 'Finland',
        'nos.nl': 'Netherlands', 'rtbf.be': 'Belgium', 'orf.at': 'Austria',
        'srf.ch': 'Switzerland', 'rte.ie': 'Ireland', 'tvp.pl': 'Poland',
        'pravda.com.ua': 'Ukraine', 'kyivindependent.com': 'Ukraine',
        'elpais.com': 'Spain', 'corriere.it': 'Italy', 'ekathimerini.com': 'Greece',

        // Americas
        'globo.com': 'Brazil', 'folha.uol.com.br': 'Brazil',
        'clarin.com': 'Argentina', 'eluniversal.com.mx': 'Mexico',
        'cbc.ca': 'Canada', 'globalnews.ca': 'Canada',

        // Africa
        'news24.com': 'South Africa', 'dailymaverick.co.za': 'South Africa',
        'allafrica.com': 'Africa',
    };

    // Check each domain
    for (const [domain, country] of Object.entries(DOMAIN_COUNTRIES)) {
        if (lowerUrl.includes(domain)) {
            return country;
        }
    }

    // Check TLD for additional country hints
    if (lowerUrl.match(/\.(dk|fo|gl)\//)) return 'Denmark';
    if (lowerUrl.match(/\.uk\//)) return 'UK';
    if (lowerUrl.match(/\.de\//)) return 'Germany';
    if (lowerUrl.match(/\.fr\//)) return 'France';
    if (lowerUrl.match(/\.it\//)) return 'Italy';
    if (lowerUrl.match(/\.es\//)) return 'Spain';
    if (lowerUrl.match(/\.nl\//)) return 'Netherlands';
    if (lowerUrl.match(/\.se\//)) return 'Sweden';
    if (lowerUrl.match(/\.no\//)) return 'Norway';
    if (lowerUrl.match(/\.fi\//)) return 'Finland';
    if (lowerUrl.match(/\.pl\//)) return 'Poland';
    if (lowerUrl.match(/\.ru\//)) return 'Russia';
    if (lowerUrl.match(/\.cn\//)) return 'China';
    if (lowerUrl.match(/\.jp\//)) return 'Japan';
    if (lowerUrl.match(/\.in\//)) return 'India';
    if (lowerUrl.match(/\.au\//)) return 'Australia';
    if (lowerUrl.match(/\.ca\//)) return 'Canada';
    if (lowerUrl.match(/\.br\//)) return 'Brazil';
    if (lowerUrl.match(/\.mx\//)) return 'Mexico';

    return null;
}

