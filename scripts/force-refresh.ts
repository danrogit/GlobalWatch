import 'dotenv/config';
import { updateUnifiedStore, getUnifiedEvents } from '../src/lib/data/store';

// Force refresh script - loads .env automatically via dotenv/config

async function main() {
    console.log('🔄 Forcing Store Update & Verification...');

    // This will trigger download of GDELT, filtering, AND the new top-5 verification
    try {
        await updateUnifiedStore();
    } catch (error) {
        console.error("FAILED TO UPDATE STORE:", error);
        process.exit(1);
    }

    const events = getUnifiedEvents();
    console.log(`\n✅ Store updated. Total Events: ${events.length}`);

    // Check if any got verified
    const verifiedEvents = events.filter(e => e.status && e.status !== 'UNVERIFIED');
    console.log(`✅ Verified/Reported Events: ${verifiedEvents.length}`);

    verifiedEvents.forEach(e => {
        console.log(`\n[${e.status}] ${e.title}`);
        console.log(`   Sources: ${e.sources?.join(', ')}`);
        console.log(`   Articles: ${e.articles?.length}`);
    });

    const unverified = events.filter(e => e.status === 'UNVERIFIED' || !e.status);
    console.log(`\n🟠 Unverified Signals: ${unverified.length}`);
}

main();
