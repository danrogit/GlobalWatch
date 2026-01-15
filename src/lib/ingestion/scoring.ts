
import { RssArticle } from '../rss/fetcher';

// Entertainment/junk domains that should NEVER appear
const BLOCKED_DOMAINS = [
    'cheezburger.com', 'boredpanda.com', 'buzzfeed.com', 'distractify.com',
    'upworthy.com', '9gag.com', 'thechive.com', 'collegehumor.com',
    'cracked.com', 'funnyordie.com', 'theonion.com', 'babylonbee.com',
    'clickhole.com', 'reductress.com', 'reddit.com/r/funny', 'reddit.com/r/aww',
    'reddit.com/r/cats', 'reddit.com/r/dogs', 'imgur.com', 'memedroid.com',
    'failblog.org', 'icanhascheezburger.com', 'knowyourmeme.com',
    'ebaumsworld.com', 'funnyjunk.com', 'tumblr.com', 'pinterest.com',
    'tiktok.com', 'instagram.com', 'snapchat.com',
    // Entertainment news
    'tmz.com', 'eonline.com', 'people.com', 'usmagazine.com', 'justjared.com',
    'perezhilton.com', 'dlisted.com', 'celebitchy.com', 'popsugar.com',
    // Sports
    'espn.com', 'bleacherreport.com', 'sportsillustrated.com', 'cbssports.com',
    'nbcsports.com', 'foxsports.com', 'skysports.com', 'goal.com',
    // Gaming
    'ign.com', 'gamespot.com', 'kotaku.com', 'polygon.com', 'eurogamer.net',
    // Recipe/lifestyle
    'allrecipes.com', 'foodnetwork.com', 'delish.com', 'tasty.co',
];

// Keywords for scoring
const KEYWORDS = {
    gov: ['government', 'parliament', 'ministry', 'minister', 'president', 'prime minister', 'cabinet', 'senate', 'congress', 'dictator', 'regime', 'official', 'politician', 'policy', 'legislation', 'law', 'bill passed', 'supreme court', 'constitutional', 'regering', 'folketing', 'ministerium', 'minister', 'præsident', 'statsminister', 'lov', 'grundlov'],
    military: ['military', 'army', 'navy', 'air force', 'troops', 'soldiers', 'war', 'battle', 'missile', 'strike', 'attack', 'defense', 'armed forces', 'pentagon', 'nato', 'invasion', 'drone', 'airstrike', 'bombing', 'militær', 'hær', 'flåde', 'luftvåben', 'soldater', 'krig', 'kamp', 'missil', 'angreb', 'forsvar'],
    sanctions: ['sanctions', 'embargo', 'trade ban', 'tariff', 'asset freeze', 'economic war', 'trade war', 'export ban', 'import restrictions', 'sanktioner', 'handelsforbud', 'told', 'fastfrysning'],
    elections: ['election', 'vote', 'polls', 'campaign', 'candidate', 'ballot', 'referendum', 'democracy', 'elected', 'inauguration', 'valg', 'afstemning', 'kandidat', 'folkeafstemning'],
    borders: ['border', 'territory', 'sovereignty', 'annexation', 'dispute', 'zone', 'territorial', 'maritime', 'airspace', 'grænse', 'territorium', 'suverænitet', 'annektering', 'konflikt'],
    intlorgs: ['nato', 'un', 'eu', 'g7', 'g20', 'who', 'imf', 'world bank', 'asean', 'african union', 'arab league', 'opec', 'iaea', 'wto', 'fn', 'verdensbanken'],
    diplomacy: ['diplomat', 'embassy', 'ambassador', 'foreign minister', 'state department', 'summit', 'treaty', 'accord', 'bilateral', 'multilateral', 'negotiations', 'talks', 'ambassadør', 'udenrigsminister', 'traktat', 'forhandlinger'],
    crisis: ['crisis', 'emergency', 'disaster', 'humanitarian', 'refugee', 'migrant', 'famine', 'epidemic', 'pandemic', 'outbreak', 'krise', 'nødsituation', 'katastrofe', 'flygtninge'],

    // STRONG negative keywords - entertainment/lifestyle
    entertainment: ['cat', 'cats', 'dog', 'dogs', 'pet', 'pets', 'puppy', 'kitten', 'cute', 'adorable', 'fluffy', 'funny', 'hilarious', 'meme', 'memes', 'lol', 'viral', 'trending', 'celebrity', 'star', 'hollywood', 'movie', 'film', 'tv show', 'series', 'netflix', 'streaming', 'music', 'song', 'album', 'concert', 'tour', 'fashion', 'style', 'outfit', 'beauty', 'makeup', 'skincare', 'recipe', 'cooking', 'food', 'restaurant', 'diet', 'fitness', 'workout', 'yoga', 'meditation', 'horoscope', 'zodiac', 'astrology', 'dating', 'relationship', 'wedding', 'baby', 'parenting', 'game', 'gaming', 'esports', 'sport', 'football', 'soccer', 'basketball', 'baseball', 'hockey', 'tennis', 'golf', 'cricket', 'ashes', 'premier league', 'champions league', 'world cup', 'olympics', 'fodbold', 'kendt', 'film', 'musik', 'mode', 'livsstil', 'opskrift', 'spil', 'kat', 'hund', 'kæledyr'],
};

export function calculateGeopoliticsScore(article: RssArticle): number {
    // Check for blocked domains first
    const url = (article.url || '').toLowerCase();
    const feedUrl = ((article as any).feed_url || (article as any).feedUrl || '').toLowerCase();

    for (const blockedDomain of BLOCKED_DOMAINS) {
        if (url.includes(blockedDomain) || feedUrl.includes(blockedDomain)) {
            return -100; // Completely block
        }
    }

    let score = 0;
    const text = (article.title + ' ' + (article.description || '')).toLowerCase();

    // Check for entertainment content FIRST - strong negative
    if (hasAny(text, KEYWORDS.entertainment)) {
        score -= 80; // Heavy penalty for entertainment
    }

    // +30 mentions country + government
    if (hasAny(text, KEYWORDS.gov)) score += 30;

    // +25 mentions military / sanctions / elections
    if (hasAny(text, KEYWORDS.military)) score += 25;
    if (hasAny(text, KEYWORDS.sanctions)) score += 25;
    if (hasAny(text, KEYWORDS.elections)) score += 25;

    // +20 mentions borders / NATO / UN / EU
    if (hasAny(text, KEYWORDS.borders)) score += 20;
    if (hasAny(text, KEYWORDS.intlorgs)) score += 20;

    // +20 diplomacy / crisis
    if (hasAny(text, KEYWORDS.diplomacy)) score += 20;
    if (hasAny(text, KEYWORDS.crisis)) score += 20;

    // Return raw score (can be negative)
    return score;
}

function hasAny(text: string, words: string[]): boolean {
    return words.some(w => text.includes(w));
}

