
import { RssArticle } from '../src/lib/rss/fetcher.js';

// ============================================
// DUPLICATED FOR DEBUGGING
// ============================================

const EXCLUSION_PATTERNS = [
    /\b(murder|robbery|theft|burglary|assault|rape|kidnapping|drug bust|drug dealer|cartel(?!.*sanction)|gang violence)\b/i,
    /\b(car crash|plane crash|train accident|shipwreck|fire(?!.*attack)|earthquake|flood|hurricane|tornado|wildfire)\b/i,
    // Removing strict "celebrity" to avoid false positives on legitimate figures if not careful, but let's keep for now
    /\b(celebrity|movie star|actor|actress|singer|musician|concert|album|box office|grammy|oscar|emmy|red carpet|hollywood|netflix|streaming)\b/i,
    /\b(world cup|champions league|super bowl|nba|nfl|premier league|la liga|bundesliga|serie a|cricket|tennis|golf|f1|formula 1|racing|marathon|olympics(?!.*boycott))\b/i,
    /\b(stock market|shares|dividend|ipo|quarterly earnings|profit margin|startup|venture capital|cryptocurrency|bitcoin|ethereum|nft)\b/i,
    /\b(recipe|cooking|fashion|beauty|lifestyle|wellness|fitness|diet|weight loss|self-help|relationship|dating|wedding|baby|pregnancy)\b/i,
    /\b(opinion:|editorial:|op-ed|commentary:|analysis:|review:|letter to the editor)\b/i,
    /\b(local news|community event|neighborhood|town hall(?!.*protest)|city council(?!.*emergency)|school board|library|park opening)\b/i,
    /\b(climate change(?!.*conflict|.*war|.*dispute)|global warming|carbon footprint|renewable energy(?!.*sanction)|solar panel|wind farm)\b/i,
    /\b(iphone|android|app update|software release|gadget|review:|unboxing|tech tip|how to)\b/i,
    /\b(health tip|medical advice|disease(?!.*bioweapon)|vaccine(?!.*mandate|.*ban)|hospital(?!.*attack)|doctor|nurse|patient)\b/i,
];

const CATEGORY_PATTERNS = {
    'military_security': [
        /\b(armed clash|airstrike|missile launch|military operation|troop deploy|terror attack|cross-border incident|military escalation|de-escalation)\b/i,
        /\b(drone strike|bombing|shelling|artillery|navy|air force|army|special forces|commando|raid|offensive|invasion|occupation)\b/i,
        /\b(war|warfare|combat|battle|firefight|ambush|sniper|mortar|tank|warship|fighter jet|helicopter gunship)\b/i,
        /\b(casualt|fatali|killed in action|wounded|martyr|soldier|militant|insurgent|rebel|guerrilla)\b/i,
        /\b(ceasefire|armistice|peacekeep|demilitariz|buffer zone|no-fly zone|blockade|siege)\b/i,
    ],
    'diplomacy': [
        /\b(diplomatic expulsion|ambassador recall|embassy clos|diplomatic ties|diplomatic relations|summit|peace talk|mediation)\b/i,
        /\b(treaty|bilateral|multilateral|foreign minister|secretary of state|state visit|diplomatic mission)\b/i,
        /\b(nato|eu summit|g7|g20|un security council|asean|african union|arab league|sco)\b/i,
        /\b(recognize|derecognize|sovereignty|statehood|independence declaration)\b/i,
    ],
    'sanctions_trade': [
        /\b(sanction|embargo|asset freeze|trade ban|export control|import restriction|tariff war)\b/i,
        /\b(secondary sanction|currency restriction|financial penalty|blacklist|entity list)\b/i,
        /\b(energy embargo|oil ban|gas cutoff|swift ban|banking restriction)\b/i,
        /\b(trade war|economic warfare|economic coercion)\b/i,
    ],
    'elections_power': [
        /\b(national election|presidential election|parliamentary election|general election|referendum)\b/i,
        /\b(disputed election|election fraud|vote rigging|election violence|poll violence)\b/i,
        /\b(military coup|coup d'etat|regime change|power grab|constitutional crisis|state of emergency)\b/i,
        /\b(inauguration|swearing in|power transfer|transition of power|government formation)\b/i,
    ],
    'protests_unrest': [
        /\b(nationwide protest|mass protest|anti-government protest|pro-democracy protest)\b/i,
        /\b(violent crackdown|police brutality|martial law|internet shutdown|curfew|mass arrest)\b/i,
        /\b(riot police|tear gas|water cannon|rubber bullet|live ammunition|protester killed)\b/i,
        /\b(civil unrest|uprising|revolution|insurrection|rebellion)\b/i,
    ],
    'borders_territory': [
        /\b(border closure|territorial claim|annexation|territorial dispute|maritime dispute)\b/i,
        /\b(airspace violation|territorial water|exclusive economic zone|continental shelf)\b/i,
        /\b(buffer zone|demilitarized zone|green line|line of control|border clash)\b/i,
        /\b(separatist|independence movement|secession|autonomy|self-determination)\b/i,
    ],
    'government_actions': [
        /\b(emergency law|national security law|war declaration|mobilization order|conscription)\b/i,
        /\b(defense spending|military budget|intelligence disclosure|classified leak|espionage)\b/i,
        /\b(executive order|presidential decree|emergency power|martial law declaration)\b/i,
        /\b(parliament vote|congressional action|legislative session|constitutional amendment)\b/i,
    ],
    'info_warfare': [
        /\b(disinformation campaign|propaganda|state media|information warfare|psyop|influence operation)\b/i,
        /\b(internet blackout|media ban|journalist arrest|press freedom|censorship)\b/i,
        /\b(platform ban|tiktok ban|telegram ban|social media block|vpn crackdown)\b/i,
        /\b(fake news|deepfake|bot network|troll farm|foreign interference)\b/i,
    ],
};

const TEST_FEEDS = [
    'http://feeds.bbci.co.uk/news/world/rss.xml',
    'https://feeds.reuters.com/reuters/worldNews',
    'https://www.aljazeera.com/xml/rss/all.xml',
    'https://kyivindependent.com/rss/',
    'https://www.timesofisrael.com/feed/',
    'https://www.scmp.com/rss/91/feed',
    'http://feeds.washingtonpost.com/rss/world',
    'https://www.dw.com/rss/rss-en-all',
    'https://www.france24.com/en/rss',
    'https://www.theguardian.com/world/rss'
];

async function fetchSampleArticles() {
    console.log('📰 Fetching from targeted test feeds...');
    const articles: any[] = [];

    for (const url of TEST_FEEDS) {
        try {
            console.log(`Fetching ${url}...`);
            const res = await fetch(url);
            if (res.ok) {
                const xml = await res.text();
                // Extremely basic regex parsing just for this test
                const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
                let match;
                while ((match = itemRegex.exec(xml)) !== null) {
                    const item = match[1];
                    const titleMatch = item.match(/<title[^>]*>(.*?)<\/title>/i);
                    const descMatch = item.match(/<description[^>]*>(.*?)<\/description>/i);
                    const linkMatch = item.match(/<link[^>]*>(.*?)<\/link>/i);

                    if (titleMatch) {
                        const title = titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/, '$1').trim();
                        articles.push({
                            title: title,
                            description: descMatch ? descMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/, '$1').trim() : '',
                            url: linkMatch ? linkMatch[1] : url,
                            source: new URL(url).hostname
                        });
                    }
                }
            } else {
                console.log(`Failed ${url}: ${res.status}`);
            }
        } catch (e) {
            console.error(`Failed ${url}: ${e}`);
        }
    }
    return articles;
}

async function testFilter() {
    const articles = await fetchSampleArticles();
    console.log(`\n🔍 ANALYZING ${articles.length} SAMPLE ARTICLES:\n`);

    let accepted = 0;
    let rejectedExclusion = 0;
    let rejectedNoMatch = 0;

    for (const article of articles) {
        const text = `${article.title} ${article.description || ''}`;

        // Check Exclusions
        let excludedBy = null;
        for (const pattern of EXCLUSION_PATTERNS) {
            if (pattern.test(text)) {
                excludedBy = pattern.toString();
                break;
            }
        }

        if (excludedBy) {
            rejectedExclusion++;
            // Only log if it seems potentially relevant but got excluded
            if (/war|politic|government|minister|treaty|trump|biden|putin|zelensky/i.test(text)) {
                console.log(`❌ [EXCLUDED (Check?)] ${article.title.substring(0, 80)}...`);
                console.log(`   Reason: Matched ${excludedBy}\n`);
            } else {
                // console.log(`🗑️ [EXCLUDED (Noise)] ${article.title.substring(0, 50)}...`);
            }
            continue;
        }

        // Check Inclusions
        let category = null;
        for (const [cat, patterns] of Object.entries(CATEGORY_PATTERNS)) {
            if (patterns.some(p => p.test(text))) {
                category = cat;
                break;
            }
        }

        if (category) {
            accepted++;
            console.log(`✅ [ACCEPTED] ${article.title.substring(0, 80)}...`);
            console.log(`   Category: ${category}\n`);
        } else {
            rejectedNoMatch++;
            if (rejectedNoMatch <= 30) {
                console.log(`⚠️ [NO MATCH] ${article.title.substring(0, 80)}...`);
                console.log(`   Desc: ${(article.description || '').substring(0, 100)}...`);
                console.log(`   Reason: No category keywords matched\n`);
            }
        }
    }

    console.log('--- STATS ---');
    console.log(`Total: ${articles.length}`);
    console.log(`Accepted: ${accepted}`);
    console.log(`Rejected (Excluded): ${rejectedExclusion}`);
    console.log(`Rejected (No Match): ${rejectedNoMatch}`);
}

testFilter().catch(console.error);
