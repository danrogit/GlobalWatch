
import { fetchAllFeeds } from '../src/lib/rss/fetcher.js';

// Re-implement basic fetch/parse for single feed to avoid full fetcher overhead
async function fetchFeed(url: string): Promise<any[]> {
    console.log(`Fetching ${url}...`);
    const res = await fetch(url);
    const xml = await res.text();
    const items = [];
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
    let match;
    while ((match = itemRegex.exec(xml)) !== null) {
        const item = match[1];
        const titleMatch = item.match(/<title[^>]*>(.*?)<\/title>/i);
        const descMatch = item.match(/<description[^>]*>(.*?)<\/description>/i);
        if (titleMatch) {
            items.push({
                title: titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/, '$1').trim(),
                description: descMatch ? descMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/, '$1').trim() : ''
            });
        }
    }
    return items;
}

const CATEGORY_PATTERNS = {
    'military_security': [
        /\b(armed clash|airstrike|missile launch|military operation|troop deploy|terror attack|cross-border incident|military escalation|de-escalation)\b/i,
        /\b(drone strike|bombing|shelling|artillery|navy|air force|army|special forces|commando|raid|offensive|invasion|occupation)\b/i,
        /\b(war|warfare|combat|battle|firefight|ambush|sniper|mortar|tank|warship|fighter jet|helicopter gunship)\b/i,
        /\b(casualt|fatali|killed in action|wounded|martyr|soldier|militant|insurgent|rebel|guerrilla)\b/i,
        /\b(ceasefire|armistice|peacekeep|demilitariz|buffer zone|no-fly zone|blockade|siege)\b/i,
        /\b(security force|defense minist|armed force|military base|joint exercise|live-fire|paramilitary|militia)\b/i,
    ],
    'diplomacy': [
        /\b(diplomatic expulsion|ambassador recall|embassy clos|diplomatic ties|diplomatic relations|summit|peace talk|mediation)\b/i,
        /\b(treaty|bilateral|multilateral|foreign minister|secretary of state|state visit|diplomatic mission)\b/i,
        /\b(nato|eu summit|g7|g20|un security council|asean|african union|arab league|sco)\b/i,
        /\b(recognize|derecognize|sovereignty|statehood|independence declaration)\b/i,
        /\b(foreign policy|international relation|strategic partnership|joint statement|memorandum of understanding|envoy|consulate)\b/i,
    ],
    'government_actions': [
        /\b(emergency law|national security law|war declaration|mobilization order|conscription)\b/i,
        /\b(defense spending|military budget|intelligence disclosure|classified leak|espionage)\b/i,
        /\b(executive order|presidential decree|emergency power|martial law declaration)\b/i,
        /\b(parliament vote|congressional action|legislative session|constitutional amendment)\b/i,
        /\b(cabinet reshuffle|policy shift|legislative reform|state security|homeland security|interior ministry)\b/i,
        /\b(senate|house of representatives|white house|kremlin|downing street|elysee|chancellery)\b/i,
        /\b(resolution|bill passage|veto|motion of no confidence|budget approval|ratification)\b/i,
    ],
    // Simplified for debug
};

async function checkDropping() {
    const url = 'https://www.dr.dk/nyheder/service/feeds/politik';
    const articles = await fetchFeed(url);

    console.log(`\nAnalyzing ${articles.length} articles from DR.dk...\n`);

    for (const article of articles) {
        const text = `${article.title} ${article.description}`;
        let matched = false;

        for (const [cat, patterns] of Object.entries(CATEGORY_PATTERNS)) {
            if (patterns.some(p => p.test(text))) {
                console.log(`✅ MATCH [${cat}]: ${article.title}`);
                matched = true;
                break;
            }
        }

        if (!matched) {
            console.log(`❌ DROP: ${article.title}`);
            // console.log(`   Text: ${text.substring(0, 50)}...`);
        }
    }
}

checkDropping();
