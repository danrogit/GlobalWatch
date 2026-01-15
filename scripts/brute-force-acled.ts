
const EMAILS = process.env.ACLED_EMAIL || 'hello@danro.dk';
const PASS = process.env.ACLED_PASSWORD || '7Z5p4Z7oiMmDX9jxKBL5ePBNKdqkJa';

const BASE_URL = 'https://acleddata.com/api/acled/read';

async function testEndpoint(name: string, params: Record<string, string> = {}, headers: Record<string, string> = {}) {
    console.log(`\n--- Testing ${name} ---`);
    const qs = new URLSearchParams({ limit: '1', ...params }).toString();
    const url = `${BASE_URL}?${qs}`;
    console.log(`URL: ${url}`);

    try {
        const resp = await fetch(url, { headers: { 'User-Agent': 'GlobalWatch/1.0', ...headers } });
        console.log(`Status: ${resp.status}`);
        const text = await resp.text();
        console.log(`Body: ${text.substring(0, 150)}`);
    } catch (e: any) {
        console.log(`Failed: ${e.message}`);
    }
}

async function main() {
    // 1. Try Email + Key (Password) in Query
    await testEndpoint('Query Auth (Email + Key=Pass)', { email: EMAILS, key: PASS });

    // 2. Try Email + Key (Password) in Query but "access_key"
    await testEndpoint('Query Auth (Email + access_key=Pass)', { email: EMAILS, access_key: PASS });

    // 3. Try Basic Auth
    const basic = Buffer.from(`${EMAILS}:${PASS}`).toString('base64');
    await testEndpoint('Basic Auth', {}, { 'Authorization': `Basic ${basic}` });
}

main();
