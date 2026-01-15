import { RssArticle } from './fetcher';
import { extractLocation, extractCountryFromUrl } from '../geo/location-extractor';
import { geocode, getCountryCoordinates } from '../geo/geocoder';
import { UnifiedEvent, EventCategory, CATEGORY_LABELS } from '../data/types';
import { translateToDanish } from '../translate/danish';

// Simple slug generator
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[æ]/g, 'ae')
        .replace(/[ø]/g, 'oe')
        .replace(/[å]/g, 'aa')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .substring(0, 80);
}

// Simple hash for deterministic slug suffix
function simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36).substring(0, 4);
}

// Translate country name to Danish
export function translateCountry(country: string): string {
    const COUNTRY_TRANSLATIONS: Record<string, string> = {
        'United States': 'USA', 'USA': 'USA',
        'United Kingdom': 'Storbritannien', 'UK': 'Storbritannien',
        'Germany': 'Tyskland', 'France': 'Frankrig', 'Spain': 'Spanien',
        'Italy': 'Italien', 'Russia': 'Rusland', 'China': 'Kina',
        'Japan': 'Japan', 'India': 'Indien', 'Australia': 'Australien',
        'Canada': 'Canada', 'Brazil': 'Brasilien', 'Mexico': 'Mexico',
        'South Korea': 'Sydkorea', 'North Korea': 'Nordkorea',
        'Iran': 'Iran', 'Iraq': 'Irak', 'Israel': 'Israel',
        'Palestine': 'Palæstina', 'Syria': 'Syrien', 'Turkey': 'Tyrkiet',
        'Egypt': 'Egypten', 'South Africa': 'Sydafrika', 'Nigeria': 'Nigeria',
        'Ukraine': 'Ukraine', 'Poland': 'Polen', 'Netherlands': 'Holland',
        'Belgium': 'Belgien', 'Sweden': 'Sverige', 'Norway': 'Norge',
        'Finland': 'Finland', 'Denmark': 'Danmark', 'Greenland': 'Grønland',
        'Unknown': 'Ukendt',
    };
    return COUNTRY_TRANSLATIONS[country] || country;
}

// ============================================
// STRICT GEOPOLITICAL FILTERING
// ============================================

// EXCLUSION KEYWORDS - If ANY match, article is REJECTED
const EXCLUSION_PATTERNS = [
    // Crime (unless terrorism - checked separately)
    /\b(murder|robbery|theft|burglary|assault|rape|kidnapping|drug bust|drug dealer|cartel(?!.*sanction)|gang violence)\b/i,
    // Accidents & Disasters (unless state-related)
    /\b(car crash|plane crash|train accident|shipwreck|fire(?!.*attack)|earthquake|flood|hurricane|tornado|wildfire)\b/i,
    // Celebrity & Entertainment
    /\b(celebrity|movie star|actor|actress|singer|musician|concert|album|box office|grammy|oscar|emmy|red carpet|hollywood|netflix|streaming)\b/i,
    // Sports (unless state boycott)
    /\b(world cup|champions league|super bowl|nba|nfl|premier league|la liga|bundesliga|serie a|cricket|tennis|golf|f1|formula 1|racing|marathon|olympics(?!.*boycott))\b/i,
    // Business noise
    /\b(stock market|shares|dividend|ipo|quarterly earnings|profit margin|startup|venture capital|cryptocurrency|bitcoin|ethereum|nft)\b/i,
    // Lifestyle & Human interest
    /\b(recipe|cooking|fashion|beauty|lifestyle|wellness|fitness|diet|weight loss|self-help|relationship|dating|wedding|baby|pregnancy)\b/i,
    // Opinion & Editorial
    /\b(opinion:|editorial:|op-ed|commentary:|analysis:|review:|letter to the editor)\b/i,
    // Local news markers
    /\b(local news|community event|neighborhood|town hall(?!.*protest)|city council(?!.*emergency)|school board|library|park opening)\b/i,
    // Climate (unless geopolitical)
    /\b(climate change(?!.*conflict|.*war|.*dispute)|global warming|carbon footprint|renewable energy(?!.*sanction)|solar panel|wind farm)\b/i,
    // Tech (unless state action)
    /\b(iphone|android|app update|software release|gadget|review:|unboxing|tech tip|how to)\b/i,
    // Health (unless state action)
    /\b(health tip|medical advice|disease(?!.*bioweapon)|vaccine(?!.*mandate|.*ban)|hospital(?!.*attack)|doctor|nurse|patient)\b/i,
];

// INCLUSION KEYWORDS - Article MUST match at least one category
const CATEGORY_PATTERNS: Record<EventCategory, RegExp[]> = {
    'military_security': [
        /\b(armed clash|airstrike|missile launch|military operation|troop deploy|terror attack|cross-border incident|military escalation|de-escalation)\b/i,
        /\b(drone strike|bombing|shelling|artillery|navy|air force|army|special forces|commando|raid|offensive|invasion|occupation)\b/i,
        /\b(war|warfare|combat|battle|firefight|ambush|sniper|mortar|tank|warship|fighter jet|helicopter gunship)\b/i,
        /\b(casualt|fatali|killed in action|wounded|martyr|soldier|militant|insurgent|rebel|guerrilla)\b/i,
        /\b(ceasefire|armistice|peacekeep|demilitariz|buffer zone|no-fly zone|blockade|siege)\b/i,
        // Broader terms
        /\b(security force|defense minist|armed force|military base|joint exercise|live-fire|paramilitary|militia)\b/i,
        // Danish Terms
        /\b(krig|kamp|angreb|militær|soldat|missil|bombe|våben|forsvar|terror|konflikt|besættelse|offensiv|luftangreb|hær|flåde|luftvåben)\b/i,
        /\b(våbenhvile|fredsbevarende|tropper|styrker|kampvogn|artilleri|drone|granat|skudveksling|baghold|milits|oprører)\b/i,
    ],
    'diplomacy': [
        /\b(diplomatic expulsion|ambassador recall|embassy clos|diplomatic ties|diplomatic relations|summit|peace talk|mediation)\b/i,
        /\b(treaty|bilateral|multilateral|foreign minister|secretary of state|state visit|diplomatic mission)\b/i,
        /\b(nato|eu summit|g7|g20|un security council|asean|african union|arab league|sco)\b/i,
        /\b(recognize|derecognize|sovereignty|statehood|independence declaration)\b/i,
        // Broader terms
        /\b(foreign policy|international relation|strategic partnership|joint statement|memorandum of understanding|envoy|consulate)\b/i,
        // Danish Terms
        /\b(diplomati|ambassadør|topmøde|fredsforhandling|traktat|aftale|udenrigsminister|statsbesøg|samarbejde|relationer|anerkendelse|suverænitet)\b/i,
        /\b(udenrigspolitik|fn|eu|nato|forhandling|mægling|partnerskab|erklæring|gesandt|konsulat|ambassade)\b/i,
    ],
    'sanctions_trade': [
        /\b(sanction|embargo|asset freeze|trade ban|export control|import restriction|tariff war)\b/i,
        /\b(secondary sanction|currency restriction|financial penalty|blacklist|entity list)\b/i,
        /\b(energy embargo|oil ban|gas cutoff|swift ban|banking restriction)\b/i,
        /\b(trade war|economic warfare|economic coercion)\b/i,
        // Broader terms
        /\b(trade agreement|customs duty|supply chain resilience|decoupling|divestment)\b/i,
        // Danish Terms
        /\b(sanktion|embargo|handelskrig|told|eksportkontrol|sortliste|økonomisk straf|indefrysning|formue|olie|gas|samhandel)\b/i,
        /\b(handelsaftale|afkobling|investering|bank|valuta|økonomi|finans|blokade|boykot)\b/i,
    ],
    'elections_power': [
        /\b(national election|presidential election|parliamentary election|general election|referendum)\b/i,
        /\b(disputed election|election fraud|vote rigging|election violence|poll violence)\b/i,
        /\b(military coup|coup d'etat|regime change|power grab|constitutional crisis|state of emergency)\b/i,
        /\b(inauguration|swearing in|power transfer|transition of power|government formation)\b/i,
        // Broader terms
        /\b(dissolve parliament|vote of no confidence|resignation of prime minister|impeachment|political crisis)\b/i,
        // Danish Terms
        /\b(valg|folketingsvalg|præsidentvalg|statskup|magtskifte|regering|demokrati|stemmer|afstemning|mistillid|krise|overgang)\b/i,
        /\b(indsættelse|forfatning|grundlov|mandat|kandidat|parti|koalition|opposition|parlament|folketing)\b/i,
    ],
    'protests_unrest': [
        /\b(nationwide protest|mass protest|anti-government protest|pro-democracy protest)\b/i,
        /\b(violent crackdown|police brutality|martial law|internet shutdown|curfew|mass arrest)\b/i,
        /\b(riot police|tear gas|water cannon|rubber bullet|live ammunition|protester killed)\b/i,
        /\b(civil unrest|uprising|revolution|insurrection|rebellion)\b/i,
        // Broader terms
        /\b(demonstrators|clashes with police|public disorder|strike action|road blockade)\b/i,
        // Danish Terms
        /\b(protest|demonstration|uroligheder|oprør|revolution|gadekamp|politi|anholdelse|tåregas|nedlukning|strejke|blokade)\b/i,
        /\b(aktivist|modstand|frihedskamp|civil ulydighed|massakre|drab|vold|konflikt|uro)\b/i,
    ],
    'borders_territory': [
        /\b(border closure|territorial claim|annexation|territorial dispute|maritime dispute)\b/i,
        /\b(airspace violation|territorial water|exclusive economic zone|continental shelf)\b/i,
        /\b(buffer zone|demilitarized zone|green line|line of control|border clash)\b/i,
        /\b(separatist|independence movement|secession|autonomy|self-determination)\b/i,
        // Danish Terms
        /\b(grænse|territorium|annektering|tvist|luftrum|farvand|zone|kontrol|uafhængighed|selvstændighed|autonomi|løsrivelse)\b/i,
        /\b(separatist|enklave|eksklave|kystvagt|grænsevagt|hegn|mur|overgang|lukning)\b/i,
    ],
    'government_actions': [
        /\b(emergency law|national security law|war declaration|mobilization order|conscription)\b/i,
        /\b(defense spending|military budget|intelligence disclosure|classified leak|espionage)\b/i,
        /\b(executive order|presidential decree|emergency power|martial law declaration)\b/i,
        /\b(parliament vote|congressional action|legislative session|constitutional amendment)\b/i,
        // Broader terms
        /\b(cabinet reshuffle|policy shift|legislative reform|state security|homeland security|interior ministry)\b/i,
        // Institutions & Acts - Catching "Senate kills resolution", "White House announces"
        /\b(senate|house of representatives|white house|kremlin|downing street|elysee|chancellery)\b/i,
        /\b(resolution|bill passage|veto|motion of no confidence|budget approval|ratification)\b/i,
        // Danish Terms
        /\b(lovforslag|vedtagelse|afstemning|finanslov|budget|reform|ministerium|sikkerhed|efterretning|spionage|overvågning)\b/i,
        /\b(hvide hus|kremlin|downing street|folketinget|regeringen|statsminister|udenrigsminister|forsvarsminister)\b/i,
        /\b(nødret|undtagelsestilstand|mobilisering|værnepligt|dekret|lovgivning|grundlovsændring)\b/i,
    ],
    'info_warfare': [
        /\b(disinformation campaign|propaganda|state media|information warfare|psyop|influence operation)\b/i,
        /\b(internet blackout|media ban|journalist arrest|press freedom|censorship)\b/i,
        /\b(platform ban|tiktok ban|telegram ban|social media block|vpn crackdown)\b/i,
        /\b(fake news|deepfake|bot network|troll farm|foreign interference)\b/i,
        // Danish Terms
        /\b(propaganda|misinformation|falske nyheder|censur|pressefrihed|journalist|medier|internet|nedlukning|blokering)\b/i,
        /\b(indflydelse|påvirkning|cyberkrig|hacker|bot|troldehær|statspresse|ytringsfrihed)\b/i,
    ],
};

/**
 * Check if article should be EXCLUDED (returns true if should skip)
 */
function shouldExclude(title: string, description?: string): boolean {
    const text = `${title} ${description || ''}`;
    return EXCLUSION_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * Detect geopolitical category - returns null if no match (article should be skipped)
 */
export function detectCategory(title: string, description?: string): EventCategory | null {
    const text = `${title} ${description || ''}`;

    // First check exclusions
    if (shouldExclude(title, description)) {
        return null;
    }

    // Check each category in priority order
    for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS) as [EventCategory, RegExp[]][]) {
        if (patterns.some(pattern => pattern.test(text))) {
            return category;
        }
    }

    // No geopolitical category matched - skip this article
    return null;
}

// Convert RSS article to UnifiedEvent
export async function articleToEvent(article: RssArticle, index: number): Promise<UnifiedEvent | null> {
    // First check if article is geopolitically relevant
    const category = detectCategory(article.title, article.description);
    if (!category) {
        return null; // Skip non-geopolitical content
    }

    const extracted = extractLocation(article.title, article.description);
    let lat: number;
    let lon: number;
    let country: string;

    if (extracted) {
        const coords = await geocode(extracted.name, extracted.type);
        if (coords) {
            lat = coords.lat;
            lon = coords.lon;
            country = extracted.type === 'country' ? extracted.name : 'Unknown';
        } else {
            return null;
        }
    } else {
        const urlCountry = extractCountryFromUrl(article.url);
        if (urlCountry) {
            const coords = getCountryCoordinates(urlCountry);
            if (coords) {
                lat = coords.lat;
                lon = coords.lon;
                country = urlCountry;
            } else {
                return null;
            }
        } else {
            return null;
        }
    }

    const categoryInfo = CATEGORY_LABELS[category];

    // Translate title to Danish
    let danishTitle = article.title;
    try {
        const translation = await translateToDanish(article.title);
        if (translation.success && translation.translated !== article.title) {
            danishTitle = translation.translated;
        }
    } catch (err) {
        // Keep original title if translation fails
    }

    // Generate deterministic slug based on article URL
    const baseSlug = slugify(danishTitle);
    const urlHash = simpleHash(article.url);
    const slug = `${baseSlug}-${urlHash}`;

    const event: UnifiedEvent = {
        id: `rss-${urlHash}-${index}`,
        layer: 'political',
        lat,
        lon,
        country: translateCountry(country),
        category,
        danishCategory: categoryInfo.danish,
        title: article.title,
        danishTitle,
        slug,
        severity: 'medium',
        source: article.source,
        sourceUrl: article.url,
        dotColor: 'orange',
        timestamp: article.publishedAt,
        addedAt: new Date().toISOString(),
        status: 'REPORTED',
        sources: [article.source],
        articles: [{
            title: article.title,
            url: article.url,
            publisher: article.source,
            publishedAt: article.publishedAt,
        }],
    };

    return event;
}
