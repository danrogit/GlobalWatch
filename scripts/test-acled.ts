import { fetchRecentAcledEvents } from '../src/lib/acled/fetcher';

async function main() {
    // const token = await import('../src/lib/acled/fetcher').then(m => m.getAccessToken ? m.getAccessToken() : null); // We can't easily import internal function if not exported.
    // Actually, fetcher exports fetchAcledEvents. I'll just copy the token logic or rely on the fetcher to use the env var URL.
    // It's easier to just modify the fetcher to try a list, or modify this script to do raw fetches.

    // Let's modify this script to do raw fetches using the credentials.

    // ... wait, I will just rewrite the whole file content below
    console.log('Testing ACLED Fetcher...');
    console.log('ACLED_EMAIL:', process.env.ACLED_EMAIL);
    console.log('ACLED_PASSWORD:', process.env.ACLED_PASSWORD ? '***' : 'MISSING');

    try {
        const events = await fetchRecentAcledEvents(10);
        console.log(`Fetched ${events.length} events.`);
        if (events.length > 0) {
            console.log('Sample event:', JSON.stringify(events[0], null, 2));
        } else {
            console.log('No events returned.');
        }
    } catch (error: any) {
        console.error('Test failed:', error);
    }
}

main();
